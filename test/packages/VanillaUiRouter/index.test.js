describe('VanillaUiRouter.js unit tests', () => {
  beforeEach(async () => {
    vi.resetModules()
    document.body.innerHTML = ''
    window.onpopstate = null
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetAllMocks()
    vi.clearAllMocks()
    document.body.innerHTML = ''
    window.onpopstate = null
    window.history.replaceState({}, '', '/')
  })

  afterAll(() => {
    vi.resetModules()
  })

  test('Router initializes as expected with valid params and renders pages properly with no auth callback', async () => {
    expect.assertions(12)
    const Router = (await import('@minute-spa/vanilla-ui-router')).VanillaUiRouter
    const rootElem = document.createElement('div')
    const page1Rendered = vi.fn()
    const page1Unmounted = vi.fn()
    const page1Elem = document.createElement('h1')
    page1Elem.textContent = 'Page 1'
    const page2Elem = document.createElement('h1')
    page2Elem.textContent = 'Page 2'
    const pages = [
      { path: '/page1', page: { domElem: page1Elem, onRendered: page1Rendered, onUnmount: page1Unmounted } },
      { path: '/page2', page: { domElem: () => page2Elem } }
    ]
    const router = new Router(rootElem, pages)
    expect(() => router.registerRoute('/badroute')).toThrow('Router.registerRoute requires path and an object that includes an html dom element.')
    const navHistory = []
    router.registerNavListener((path) => { navHistory.push(path) })
    router.initialNav()
    expect(rootElem.innerHTML).toBe('<h1>Page 1</h1>')
    const renderedPage1Elem = rootElem.querySelector('h1')
    expect(page1Rendered).toHaveBeenCalledTimes(1)
    expect(page1Rendered).toHaveBeenCalledWith(renderedPage1Elem)
    expect(page1Unmounted).not.toHaveBeenCalled()
    expect(navHistory).toEqual(['/page1'])
    router.navigateTo('/badpage') // invalid page, should do nothing
    expect(rootElem.innerHTML).toBe('<h1>Page 1</h1>')
    expect(navHistory).toEqual(['/page1'])
    router.navigateTo('/page2')
    expect(rootElem.innerHTML).toBe('<h1>Page 2</h1>')
    expect(page1Unmounted).toHaveBeenCalledTimes(1)
    expect(page1Unmounted).toHaveBeenCalledWith(renderedPage1Elem)
    expect(page1Rendered).toHaveBeenCalledTimes(1)
  })

  test('throws error if no rootElem provided', async () => {
    expect.assertions(1)
    const Router = (await import('@minute-spa/vanilla-ui-router')).VanillaUiRouter
    try {
      // eslint-disable-next-line no-new
      new Router()
    } catch (e) {
      expect(e.message).toBe('Router requires a root element to mount to.')
    }
  })

  test('handleNav throws error if no registered paths', async () => {
    expect.assertions(1)
    const Router = (await import('@minute-spa/vanilla-ui-router')).VanillaUiRouter
    const router = new Router(document.body)
    expect(() => router.handleNav()).toThrow('Router requires at least one registered path')
  })

  test('window.onpopstate triggers handleNav when browser back/forward is used', async () => {
    expect.assertions(5)
    const Router = (await import('@minute-spa/vanilla-ui-router')).VanillaUiRouter
    const rootElem = document.createElement('div')
    const page1Elem = document.createElement('h1')
    page1Elem.textContent = 'Page 1'
    const page2Elem = document.createElement('h1')
    page2Elem.textContent = 'Page 2'
    const pages = [
      { path: '/page1', page: { domElem: page1Elem } },
      { path: '/page2', page: { domElem: page2Elem } }
    ]
    const router = new Router(rootElem, pages)
    const navHistory = []
    router.initialNav()
    router.registerNavListener((path) => { navHistory.push(path) })
    expect(rootElem.innerHTML).toBe('<h1>Page 1</h1>')
    router.navigateTo('/page2')
    expect(rootElem.innerHTML).toBe('<h1>Page 2</h1>')
    // Simulate browser back button by changing URL and triggering popstate
    window.history.pushState({}, '', '/page1')
    window.onpopstate()
    expect(rootElem.innerHTML).toBe('<h1>Page 1</h1>')
    expect(window.location.pathname).toBe('/page1')
    expect(navHistory).toEqual(['/page1', '/page2', '/page1'])
  })

  test('pathAuthorized calls auth callback and handles redirects properly', async () => {
    expect.assertions(5)
    const Router = (await import('@minute-spa/vanilla-ui-router')).VanillaUiRouter
    const rootElem = document.createElement('div')
    const page1Elem = document.createElement('h1')
    page1Elem.textContent = 'Page 1'
    const page2Elem = document.createElement('h1')
    page2Elem.textContent = 'Page 2'
    const pages = [
      { path: '/page1', page: { domElem: page1Elem } },
      { path: '/page2', page: { domElem: page2Elem } }
    ]
    const router = new Router(rootElem, pages)
    let redirectPath = '/page1'
    let path2Authorized = true
    const authCallback = vi.fn((path, { redirectTo, renderDomElem }) => {
      if (path === '/page2') return path2Authorized ? true : redirectTo(redirectPath)
      if (path === '/page3') {
        const page3Elem = document.createElement('h1')
        page3Elem.textContent = 'Page 3 override'
        return renderDomElem(page3Elem)
      }
      return true
    })
    router.onPathAuth(authCallback)
    window.history.pushState({}, '', '/page1')
    router.initialNav()
    expect(rootElem.innerHTML).toBe('<h1>Page 1</h1>')
    router.navigateTo('/page2')
    expect(rootElem.innerHTML).toBe('<h1>Page 2</h1>')
    path2Authorized = false
    router.reauthenticate()
    expect(rootElem.innerHTML).toBe('<h1>Page 1</h1>') // should redirect back to page1
    redirectPath = '/badpath'
    expect(() => router.navigateTo('/page2')).toThrow('Router.pathAuthorized redirectTo path must be valid: /badpath')
    router.navigateTo('/page3')
    expect(rootElem.innerHTML).toBe('<h1>Page 3 override</h1>')
  })
})
