describe('AppState.js unit tests', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetAllMocks()
    vi.clearAllMocks()
  })

  afterAll(() => {
    window.sessionStorage.clear()
    vi.resetModules()
  })

  describe('EventStorage', () => {
    it('handles different types of data as expected when persist is false', async () => {
      expect.assertions(29)
      const { EventStorage } = await import('@minute-spa/appstate')
      const eventStorage = new EventStorage()
      expect(eventStorage.set()).toBe(undefined) // no eventname - do nothing
      expect(Object.keys(eventStorage.events).length).toBe(0)
      expect(eventStorage.set('key1')).toBe(undefined) // no data supplied - do nothing
      expect(Object.keys(eventStorage.events).length).toBe(0)
      expect(() => eventStorage.set({ a: 1 }, 'mockvalue')).toThrow('EventStorage.set eventname must be string.')
      const v1 = null
      const v2 = 'abc'
      const v3 = { a: 111 }
      const v4 = 111
      const v5 = false
      const v6 = true
      const v7 = 0
      const v8 = ''
      expect(eventStorage.set('key1', v1)).toEqual(v1)
      expect(eventStorage.get('key1')).toEqual(v1)
      expect(eventStorage.set('key2', v2)).toEqual(v2)
      expect(eventStorage.get('key2')).toEqual(v2)
      expect(eventStorage.set('key3', v3)).toEqual(v3)
      expect(eventStorage.get('key3')).toEqual(v3)
      expect(eventStorage.set('key', v4)).toEqual(v4)
      expect(eventStorage.get('key')).toEqual(v4)
      expect(eventStorage.set('key', v5)).toEqual(v5)
      expect(eventStorage.get('key')).toEqual(v5)
      expect(eventStorage.set('key', v6)).toEqual(v6)
      expect(eventStorage.get('key')).toEqual(v6)
      expect(eventStorage.set('key', v7)).toEqual(v7)
      expect(eventStorage.get('key')).toEqual(v7)
      expect(eventStorage.set('key', v8)).toEqual(v8)
      expect(eventStorage.get('key')).toEqual(v8)
      expect(eventStorage.get('keyz')).toBe(undefined)
      expect(window.sessionStorage.length).toBe(0)
      expect(Object.keys(eventStorage.events).length).toBe(4)
      eventStorage.delete('badkey')
      expect(Object.keys(eventStorage.events).length).toBe(4)
      eventStorage.delete('key')
      expect(eventStorage.get('key')).toBe(undefined)
      expect(Object.keys(eventStorage.events).length).toBe(3)
      eventStorage.delete()
      expect(Object.keys(eventStorage.events).length).toBe(3)
      expect(eventStorage.get('key3')).toEqual(v3)
    })
    it('handles different types of data as expected when persist is true', async () => {
      expect.assertions(26)
      const { EventStorage } = await import('@minute-spa/appstate')
      const eventStorage = new EventStorage()
      const v1 = null
      const v2 = 'abc'
      const v3 = { a: 111 }
      const v4 = 111
      const v5 = false
      const v6 = true
      const v7 = 0
      const v8 = ''
      expect(eventStorage.set('key1', v1, true)).toEqual(v1)
      expect(eventStorage.set('key2', v2, true)).toEqual(v2)
      expect(eventStorage.set('key3', v3, true)).toEqual(v3)
      expect(eventStorage.set('key4', v4, true)).toEqual(v4)
      expect(eventStorage.set('key5', v5, true)).toEqual(v5)
      expect(eventStorage.set('key6', v6, true)).toEqual(v6)
      expect(eventStorage.set('key7', v7, true)).toEqual(v7)
      expect(eventStorage.set('key8', v8, true)).toEqual(v8)
      const es2 = new EventStorage()
      expect(es2.get('key1')).toEqual(v1)
      expect(es2.get('key2')).toEqual(v2)
      expect(es2.get('key3')).toEqual(v3)
      expect(es2.get('key4')).toEqual(v4)
      expect(es2.get('key5')).toEqual(v5)
      expect(es2.get('key6')).toEqual(v6)
      expect(es2.get('key7')).toEqual(v7)
      expect(es2.get('key8')).toEqual(v8)
      expect(es2.get('keyz')).toBe(undefined)
      expect(window.sessionStorage.length).toBe(8)
      expect(Object.keys(eventStorage.events).length).toBe(8)
      expect(Object.keys(es2.events).length).toBe(0)
      es2.delete('badkey')
      expect(window.sessionStorage.length).toBe(8)
      es2.delete('key7')
      expect(es2.get('key7')).toBe(undefined)
      expect(window.sessionStorage.length).toBe(7)
      expect(es2.get('key3')).toEqual(v3)
      eventStorage.set('key3', 'key3v2') // set w/o perist flag goes to ss if previously persisted
      expect(new EventStorage().get('key3')).toEqual('key3v2')
      expect(window.sessionStorage.length).toBe(7)
    })

    it('persists data to different stateids properly in session storage', async () => {
      expect.assertions(7)
      const { EventStorage } = await import('@minute-spa/appstate')
      const es1a = new EventStorage('state1')
      const es2a = new EventStorage('state2')
      es1a.set('k1', 'es1 value', true)
      es2a.set('k1', 'es2 value', true)
      expect(es1a.get('k1')).toEqual('es1 value')
      expect(es2a.get('k1')).toEqual('es2 value')
      const es1b = new EventStorage('state1')
      const es2b = new EventStorage('state2')
      expect(es1b.get('k1')).toEqual('es1 value')
      expect(es2b.get('k1')).toEqual('es2 value')
      es1b.delete('k1')
      expect(es1a.get('k1')).toEqual('es1 value')
      expect(es1b.get('k1')).toBe(undefined)
      expect(es2b.get('k1')).toEqual('es2 value')
    })
  })

  describe('AppState', () => {
    describe('constructor', () => {
      it('initialize the state correctly', async () => {
        expect.assertions(4)
        const { AppState, appStateFor } = await import('@minute-spa/appstate')
        const as1 = new AppState()
        expect(as1.subscribers).toEqual({})
        expect(as1.eventStorage.events).toEqual({})
        const as2 = appStateFor('id2')
        expect(appStateFor('id2')).toBe(as2)
        expect(() => appStateFor()).toThrow('AppState - missing required stateid parameter.')
      })
    })
    describe('set get and delete without subscribers', () => {
      it('works as expected', async () => {
        expect.assertions(15)
        const { appStateFor: newAs } = await import('@minute-spa/appstate')
        const appState = newAs('id1')
        expect(appState.eventStorage.eventPrefix).toEqual('id1.')
        expect(appState.get()).toBe(undefined)
        expect(appState.delete()).toBe(undefined)
        expect(appState.get('dummy')).toBe(undefined)
        expect(appState.delete('dummy')).toBe(undefined)
        expect(() => appState.get({ a: 1 })).toThrow('EventStorage.get eventname must be string.')
        expect(() => appState.delete({ a: 1 })).toThrow('EventStorage.delete eventname must be string.')
        expect(appState.set()).toBe(undefined)
        expect(appState.set('somekey')).toBe(undefined)
        expect(() => appState.set({ a: 1 }, 'somedata')).toThrow('AppState.set eventname must be string.')
        expect(Object.keys(appState.eventStorage.events).length).toBe(0)
        expect(appState.set('key1', 'val1')).toEqual('val1')
        expect(appState.get('key1')).toEqual('val1')
        expect(Object.keys(appState.eventStorage.events).length).toBe(1)
        expect(window.sessionStorage.length).toBe(0)
      })
    })

    describe('set get proxies and delete with subscribers', () => {
      it('works as expected', async () => {
        expect.assertions(6)
        const { appStateFor: newAs } = await import('@minute-spa/appstate')
        const appState = newAs('id1')
        let key1val
        appState.on('key1', val => { key1val = val })
        appState.key1 = 'value1'
        expect(appState.key1).toEqual('value1')
        expect(key1val).toEqual('value1')
        appState.delete('key1')
        expect(key1val).toEqual('value1')
        appState.key1 = 'value2'
        expect(key1val).toEqual('value2')
        appState.delete('key1', true)
        expect(key1val).toBe(undefined)
        appState.subscribers = {}
        expect(appState.subscribers).toEqual({})
      })
    })

    describe('on', () => {
      it('does nothing when missing required parameters', async () => {
        expect.assertions(2)
        const { appStateFor: newAs } = await import('@minute-spa/appstate')
        const appState = newAs('id1')
        appState.on()
        appState.on('key1')
        expect(() => appState.on({ a: 1 }, 'mockcb')).toThrow('AppState.on eventname must be string.')
        expect(appState.subscribers).toEqual({})
      })
      it('adds to subscribers successfully when no existing published values for the key', async () => {
        expect.assertions(1)
        const { appStateFor: newAs } = await import('@minute-spa/appstate')
        const appState = newAs('id1')
        appState.on('key1', 'mockcb')
        appState.on('key1', 'mockcb2')
        appState.on('key2', 'mockcb3')
        expect(appState.subscribers).toEqual({ key1: ['mockcb', 'mockcb2'], key2: ['mockcb3'] })
      })
      it('adds to subscribers successfully and executes cb if event already published', async () => {
        expect.assertions(2)
        const { appStateFor: newAs } = await import('@minute-spa/appstate')
        const appState = newAs('id1')
        appState.set('key1', 'value1')
        let key1val
        appState.on('key1', val => { key1val = val })
        expect(key1val).toEqual('value1')
        appState.reset()
        expect(appState.subscribers).toEqual({})
      })
    })
  })

  describe('off', () => {
    it('does nothing when missing required parameters', async () => {
      expect.assertions(2)
      const { appStateFor: newAs } = await import('@minute-spa/appstate')
      const appState = newAs('id1')
      let cb1Count = 0
      const cb1 = () => { cb1Count++ }
      appState.on('key1', cb1)
      appState.off()
      expect(() => appState.off({ a: 1 }, 'mockcb')).toThrow('AppState.off eventname must be string.')
      appState.set('key1', 'value1')
      expect(cb1Count).toBe(1)
    })
    it('removes from subscribers successfully', async () => {
      expect.assertions(3)
      const { appStateFor: newAs } = await import('@minute-spa/appstate')
      const appState = newAs('id1')
      const cbCounts = { cb1a: 0, cb1b: 0, cb2: 0 }
      const cb1a = () => { cbCounts.cb1a++ }
      const cb1b = () => { cbCounts.cb1b++ }
      const cb2 = () => { cbCounts.cb2++ }
      appState.on('key1', cb1a)
      appState.on('key1', cb1b)
      appState.on('key2', cb2)
      appState.off('key1', cb1a)
      appState.set('key1', 'value1')
      appState.set('key2', 'value2')
      expect(cbCounts).toEqual({ cb1a: 0, cb1b: 1, cb2: 1 })
      appState.off('key1') // remove all for key1
      appState.set('key1', 'value3')
      appState.set('key2', 'value4')
      expect(cbCounts).toEqual({ cb1a: 0, cb1b: 1, cb2: 2 })
      appState.off('key2', cb2) // clean up
      appState.set('key2', 'value5')
      expect(cbCounts).toEqual({ cb1a: 0, cb1b: 1, cb2: 2 })
    })
  })
})
