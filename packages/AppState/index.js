/*
  AppState logic that allows setting/udpated/deleting/subscribing to application state details.
*/

class EventStorage {
  constructor (stateId = '') {
    // use window.sessionStorage to persist state events for life of browser tab
    // if window does not exist, ignore sessionstorage logic (running in node)
    Object.assign(this, { eventPrefix: stateId ? `${stateId}.` : '', events: {} })
    try { this.window = window } catch (e) {}
  }

  sessionEventKey (eventName) {
    return `${this.eventPrefix}${eventName}`
  }

  set (eventName, data = undefined, persist = false) {
    if (!eventName || data === undefined) return undefined
    if (!(typeof eventName === 'string' || eventName instanceof String)) throw new Error('EventStorage.set eventname must be string.')
    this.events[eventName] = data
    if ((persist && this.window) || this.isPersisted(eventName)) {
      this.window.sessionStorage.setItem(this.sessionEventKey(eventName), JSON.stringify(data))
    }
    return data
  }

  isPersisted (eventName) {
    return !!this.window?.sessionStorage?.getItem?.(this.sessionEventKey(eventName))
  }

  get (eventName) {
    if (!eventName) return undefined
    if (!(typeof eventName === 'string' || eventName instanceof String)) throw new Error('EventStorage.get eventname must be string.')
    if (this.events[eventName] !== undefined) return this.events[eventName]
    if (this.isPersisted(eventName)) return JSON.parse(this.window.sessionStorage.getItem(this.sessionEventKey(eventName)))
    return undefined
  }

  delete (eventName) {
    if (!eventName) return
    if (!(typeof eventName === 'string' || eventName instanceof String)) throw new Error('EventStorage.delete eventname must be string.')
    if (this.get(eventName) !== undefined) {
      this.window?.sessionStorage?.removeItem?.(this.sessionEventKey(eventName))
      delete this.events[eventName]
    }
  }
}

class AppState {
  constructor (stateId) {
    this.stateId = stateId
    this.init()
  }

  init () {
    this.subscribers = {}
    this.eventStorage = new EventStorage(this.stateId)
  }

  reset () {
    Object.keys(this.eventStorage.events).forEach(eventName => {
      this.eventStorage.delete(eventName) // delete's persisted storage too
    })
    this.init()
  }

  on (eventName, cb) {
    if (!eventName || !cb) return
    if (!(typeof eventName === 'string' || eventName instanceof String)) throw new Error('AppState.on eventname must be string.')
    this.subscribers[eventName] = this.subscribers?.[eventName] || []
    this.subscribers[eventName].push(cb)
    const lastPub = this.eventStorage.get(eventName)
    if (lastPub !== undefined) cb(lastPub)
  }

  off (eventName, cb = null) {
    if (!eventName) return
    if (!(typeof eventName === 'string' || eventName instanceof String)) throw new Error('AppState.off eventname must be string.')
    if (!cb) { // remove all subscribers for event
      delete this.subscribers[eventName]
      return
    }
    this.subscribers[eventName] = this.subscribers[eventName].filter(subCb => subCb !== cb)
    if (this.subscribers[eventName].length === 0) delete this.subscribers[eventName]
  }

  set (eventName, data = undefined, persist = false) {
    if (!eventName || data === undefined) return undefined
    if (!(typeof eventName === 'string' || eventName instanceof String)) throw new Error('AppState.set eventname must be string.')
    this.eventStorage.set(eventName, data, persist)
    const cbList = this.subscribers?.[eventName] || []
    cbList.forEach(cb => cb(data))
    return data
  }

  get (eventName) {
    return this.eventStorage.get(eventName)
  }

  delete (eventName, broadcast = false) {
    if (!eventName) return
    const cbList = this.subscribers?.[eventName] || []
    if (broadcast) cbList.forEach(cb => cb(undefined))
    this.eventStorage.delete(eventName)
  }
}

const appStates = {}
const appStateFor = stateId => {
  if (!stateId) throw new Error('AppState - missing required stateid parameter.')
  appStates[stateId] = appStates[stateId] || new Proxy(new AppState(stateId), proxyHandler)
  return appStates[stateId]
}

const proxyHandler = {
  // create getter/setter for events saved to state object
  get (target, prop) {
    if (['init', 'reset', 'on', 'off', 'get', 'set', 'delete', 'eventStorage', 'subscribers'].includes(prop)) return Reflect.get(...arguments)
    return target.get(prop)
  },
  set (target, prop, value) {
    if (['init', 'reset', 'on', 'off', 'get', 'set', 'delete', 'eventStorage', 'subscribers'].includes(prop)) return Reflect.set(...arguments)
    return target.set(prop, value)
  }
}

const appState = appStateFor('main')

export { appState, appStateFor, AppState, EventStorage }
