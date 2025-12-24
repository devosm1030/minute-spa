# AppState

A lightweight, flexible state management library for JavaScript applications with built-in persistence support using browser sessionStorage.

This module is a component of the Minute SPA framework (https://github.com/devosm1030/minute-spa), but is an standalone component that can be used independently of the framework.

Zero dependencies - use in your project via NPM, or simply clone the code right into your project for a truly vanilla experience that requires no packagers or bundlers!

## Table of Contents
- [AppState](#appstate)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
    - [Key Features](#key-features)
  - [Installation and Usage](#installation-and-usage)
    - [For NodeJS projects](#for-nodejs-projects)
      - [Installation](#installation)
      - [Usage](#usage)
    - [For Vanila projects](#for-vanila-projects)
      - [Installation](#installation-1)
      - [Usage](#usage-1)
  - [API Reference](#api-reference)
    - [Default state service: `appState`](#default-state-service-appstate)
    - [`appStateFor(stateId)`](#appstateforstateid)
    - [`appState.on(eventName, callback)`](#appstateoneventname-callback)
    - [`appState.off(eventName, callback?)`](#appstateoffeventname-callback)
    - [`appState.set(eventName, data, persist?)`](#appstateseteventname-data-persist)
    - [`appState.get(eventName)`](#appstategeteventname)
    - [`appState.delete(eventName, broadcast?)`](#appstatedeleteeventname-broadcast)
    - [`appState.reset()`](#appstatereset)
    - [Proxy Property Access](#proxy-property-access)
  - [Advanced Usage](#advanced-usage)
    - [Multiple State Instances](#multiple-state-instances)
    - [Persistence Patterns](#persistence-patterns)
    - [Cleanup and Memory Management](#cleanup-and-memory-management)
  - [Browser Compatibility](#browser-compatibility)
  - [License](#license)

## Overview

AppState provides a simple yet powerful way to manage application state with a publish-subscribe pattern. It supports multiple isolated state instances, automatic persistence to sessionStorage, and proxy-based direct property access.

### Key Features

- **Event-based state management** - Subscribe to state changes with callback functions
- **Automatic persistence** - Optional sessionStorage integration when used in browser environment for tab-lifetime persistence
- **Multiple state instances** - Create isolated state contexts with unique identifiers
- **Proxy support** - Access state directly as object properties or through methods
- **Browser and Node.js compatible** - Gracefully handles environments without `window` object

## Installation and Usage

### For NodeJS projects

#### Installation

In your project directory, install the dependency on the command line:
```bash
npm install --save @minute-spa/appstate
```

#### Usage

Import the package in your code:
```javascript
import { appState } from '@minute-spa/appstate'
```

### For Vanila projects

#### Installation

Clone https://github.com/devosm1030/minute-spa/blob/main/packages/AppState/index.js into your project and rename as appropriate.

#### Usage

From an ES module, import the package in your code:
```javascript
import { appState } from '<path/to/your/file>'
```

## API Reference

### Default state service: `appState`

The default `appState` instance that can be used globally in your application.

```javascript
import { appState } from '@minute-spa/appstate';
```

---

### `appStateFor(stateId)`

Creates or retrieves an isolated AppState instance with a unique identifier.  When you want to create multiple app state services within your application.

**Parameters:**
- `stateId` (string, required) - Unique identifier for the state instance

**Returns:** AppState instance (proxied)

**Throws:** Error if `stateId` is not provided

**Example:**

```javascript
import { appStateFor } from '@minute-spa/appstate';

const authState = appStateFor('auth');
const uiState = appStateFor('ui');

// These states are completely isolated
authState.set('token', 'abc123');
uiState.set('sidebarOpen', true);

console.log(authState.get('token')); // 'abc123'
console.log(uiState.get('token')); // undefined
```

---

### `appState.on(eventName, callback)`

Subscribe to state changes for a specific event.

**Parameters:**
- `eventName` (string, required) - Name of the event to subscribe to
- `callback` (function, required) - Function called when state changes. Receives the new state value as argument.

**Returns:** `undefined`

**Throws:** Error if `eventName` is not a string

**Behavior:**
- If state already exists for the event, callback is immediately called with current value
- Multiple callbacks can subscribe to the same event
- Callbacks are executed in the order they were registered
- Callbacks are executed on EVERY request to update the event, regardless of whether or not the event or it's contents have changed.

**Example:**

```javascript
// Subscribe to user changes
appState.on('user', (userData) => {
  console.log('User changed:', userData);
});

// Subscribe multiple callbacks to same event
appState.on('user', (userData) => {
  updateUI(userData);
});

appState.on('user', (userData) => {
  logAnalytics('user_changed', userData);
});

// Set user - all callbacks will be triggered
appState.set('user', { id: 1, name: 'Alice' });
```

**Immediate callback execution:**

```javascript
// Set state first
appState.set('config', { theme: 'dark' });

// Subscribe later - callback is immediately called with current value
appState.on('config', (config) => {
  console.log('Current config:', config); // Logs immediately
});
```

---

### `appState.off(eventName, callback?)`

Unsubscribe from state changes.

**Parameters:**
- `eventName` (string, required) - Name of the event to unsubscribe from
- `callback` (function, optional) - Specific callback to remove. If omitted, all callbacks for the event are removed.

**Returns:** `undefined`

**Throws:** Error if `eventName` is not a string

**Example:**

```javascript
const userHandler = (user) => {
  console.log('User:', user);
};

// Subscribe
appState.on('user', userHandler);

// Unsubscribe specific callback
appState.off('user', userHandler);

// Or remove all subscribers for an event
appState.on('user', handler1);
appState.on('user', handler2);
appState.off('user'); // Removes both handler1 and handler2
```

---

### `appState.set(eventName, data, persist?)`

Set or update state and notify subscribers.

**Parameters:**
- `eventName` (string, required) - Name of the event/state key
- `data` (any, required) - Value to store (must be JSON-serializable if persisting)
- `persist` (boolean, optional, default: `false`) - Whether to persist to sessionStorage

**Returns:** The `data` value that was set, or `undefined` if parameters are invalid

**Throws:** Error if `eventName` is not a string

**Example:**

```javascript
// Basic usage
appState.set('count', 42);

// With persistence (survives page refresh within same tab)
appState.set('userPreferences', { theme: 'dark', language: 'en' }, true);

// Complex data structures
appState.set('todos', [
  { id: 1, text: 'Learn AppState', done: true },
  { id: 2, text: 'Build app', done: false }
]);

// Chainable pattern (returns the data)
const savedUser = appState.set('user', { name: 'Bob' });
console.log(savedUser); // { name: 'Bob' }
```

**Persistence behavior:**

```javascript
// First time setting with persist
appState.set('token', 'secret123', true);

// Refresh page - state is restored from sessionStorage

// Update persisted state (automatically stays persisted)
appState.set('token', 'newSecret456'); // Still persisted!

// To stop persisting, you must delete and re-set without persist flag
appState.delete('token');
appState.set('token', 'nonPersisted');
```

---

### `appState.get(eventName)`

Retrieve current state value.

**Parameters:**
- `eventName` (string, required) - Name of the event/state key

**Returns:** The stored value, or `undefined` if not found

**Throws:** Error if `eventName` is not a string

**Example:**

```javascript
appState.set('config', { apiUrl: 'https://api.example.com' });

const config = appState.get('config');
console.log(config.apiUrl); // 'https://api.example.com'

// Non-existent keys return undefined
const missing = appState.get('nonExistent'); // undefined
```

---

### `appState.delete(eventName, broadcast?)`

Remove state and optionally notify subscribers.

**Parameters:**
- `eventName` (string, required) - Name of the event/state key to delete
- `broadcast` (boolean, optional, default: `false`) - Whether to notify subscribers with `undefined`

**Returns:** `undefined`

**Example:**

```javascript
appState.set('temp', 'temporary data');
console.log(appState.get('temp')); // 'temporary data'

// Delete without notifying subscribers
appState.delete('temp');
console.log(appState.get('temp')); // undefined

// Delete with notification
appState.on('user', (user) => {
  console.log('User is now:', user);
});

appState.set('user', { name: 'Charlie' }); // Logs: "User is now: { name: 'Charlie' }"
appState.delete('user', true); // Logs: "User is now: undefined"
```

---

### `appState.reset()`

Clear all state and subscribers, returning to initial state.

**Parameters:** None

**Returns:** `undefined`

**Example:**

```javascript
appState.set('key1', 'value1');
appState.set('key2', 'value2', true); // persisted
appState.on('key1', () => {});

appState.reset();

// All state cleared
console.log(appState.get('key1')); // undefined
console.log(appState.get('key2')); // undefined (even persisted data is removed)

// All subscribers removed
// Subscribers will not be called
```

---

### Proxy Property Access

AppState instances support direct property access through JavaScript Proxy.

**Example:**

```javascript
// Setting values
appState.userName = 'Alice';
appState.isLoggedIn = true;
appState.settings = { theme: 'dark' };

appState.on('userName', userName => {
  console.log(userName); // 'Alice'
})

// Getting values
console.log(appState.userName); // 'Alice'
console.log(appState.isLoggedIn); // true

// Equivalent to:
appState.set('userName', 'Alice');
appState.get('userName');

// Note: Proxy access does NOT support persistence flag
// Use explicit set() method for persistence
appState.set('userName', 'Alice', true); // Persisted
```

---

## Advanced Usage

### Multiple State Instances

Create isolated state contexts for different parts of your application:

```javascript
import { appStateFor } from '@minute-spa/appstate';

const authState = appStateFor('auth');
const cartState = appStateFor('cart');
const notificationState = appStateFor('notifications');

// Each instance is completely independent
authState.set('token', 'jwt-token-here', true);
cartState.set('items', [], true);
notificationState.set('unread', 0);
```

### Persistence Patterns

```javascript
// User preferences that survive page refresh
appState.set('preferences', {
  theme: 'dark',
  language: 'en',
  notifications: true
}, true);

// Session-only data (not persisted)
appState.set('tempFormData', { field1: 'value' });
```

### Cleanup and Memory Management

```javascript
const handler = (data) => console.log(data);

// Subscribe
appState.on('event', handler);

// Clean up when component unmounts
function cleanup() {
  appState.off('event', handler);
}

// Or reset everything (useful for testing)
afterEach(() => {
  appState.reset();
});
```
---

## Browser Compatibility

AppState works in all modern browsers and Node.js environments:

- **Browser:** Requires sessionStorage support (IE 8+, all modern browsers)
- **Node.js:** Works without browser-specific features (persistence disabled)

---

## License

MIT License - See notice in index.js comments.
