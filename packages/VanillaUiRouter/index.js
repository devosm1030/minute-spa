/*
MIT License

Copyright (c) 2025 Mike DeVos

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
  VanillaUiRouter is a simple client-side router for vanilla JavaScript SPA applications.
*/

class VanillaUiRouter {
  constructor (rootElem, pages = []) {
    if (!rootElem) throw new Error('Router requires a root element to mount to.')
    Object.assign(this, { rootElem, routes: {}, pageElem: null, pathAuthCb: null, currPath: null, onUnmount: null, navListeners: [] })
    window.onpopstate = () => this.handleNav()
    pages.forEach(({ path, page }) => { this.registerRoute(path, page) })
  }

  registerRoute (path, { domElem = null, onRendered = null, onUnmount = null } = {}) {
    if (!path || !domElem) throw new Error('Router.registerRoute requires path and an object that includes an html dom element.')
    this.routes[path] = { domElem, onRendered, onUnmount }
    return this
  }

  registerNavListener (cb) {
    // these callbacks will get called whenever we nav to a new path
    this.navListeners.push(cb)
    if (this.currPath) cb(this.currPath)
    return this
  }

  initialNav () {
    this.handleNav()
    return this
  }

  navigateTo (path) {
    if (!this.isValidPath(path) && !this.pathAuthCb) return
    window.history.pushState({}, '', path)
    this.handleNav()
  }

  onPathAuth (callback) {
    // registration of callback called on navigation to determine if path is authorized
    this.pathAuthCb = callback
    return this
  }

  isValidPath (path) {
    return !!this.routes[path]
  }

  pathAuthorized (path) {
    if (!this.pathAuthCb) return true
    return this.pathAuthCb(path, {
      redirectTo: path => {
        if (!this.isValidPath(path)) throw new Error(`Router.pathAuthorized redirectTo path must be valid: ${path}`)
        this.navigateTo(path)
        return false
      },
      renderDomElem: elem => { this.renderDomElem(elem); return false },
    })
  }

  reauthenticate () {
    this.handleNav()
  }

  renderDomElem (domElem) {
    if (this.pageElem) {
      if (this.onUnmount) {
        this.onUnmount(this.pageElem)
        this.onUnmount = null
      }
      this.pageElem.remove()
    }
    this.pageElem = (typeof domElem === 'function') ? domElem() : domElem
    this.rootElem.appendChild(this.pageElem)
  }

  handleNav () {
    if (Object.keys(this.routes).length === 0) throw new Error('Router requires at least one registered path')
    const { pathname: path } = new URL(window.location.href)
    const pathIsValid = this.isValidPath(path)
    if (!pathIsValid && !this.pathAuthCb) return this.navigateTo(Object.keys(this.routes)[0])
    if (!this.pathAuthorized(path)) return // false means pathAuthCb must have redirected or rendered html, so don't proceed
    this.renderDomElem(this.routes[path].domElem)
    if (this.routes[path].onRendered) this.routes[path].onRendered(this.pageElem)
    this.onUnmount = this.routes[path].onUnmount || null
    this.currPath = path
    this.navListeners.forEach(cb => cb(path))
  }
}

export { VanillaUiRouter }
