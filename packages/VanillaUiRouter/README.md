# Vanilla UI Router

A lightweight, client-side router for single-page applications (SPAs) that handles navigation, route registration, authentication, and lifecycle management. This is a standalone component of the minute-spa browser SPA application framework (work in progress).

Zero dependencies - use in your project via NPM, or simply clone the code right into your project for a truly vanilla experience that requires no packagers or bundlers!

## Table of Contents

- [Overview](#overview)
- [Installation and Usage](#installation-and-usage)
- [Constructor](#constructor)
- [Public Methods](#public-methods)
- [Route Configuration](#route-configuration)
- [Authentication & Authorization](#authentication--authorization)
- [Navigation Listeners](#navigation-listeners)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Complete Examples](#complete-examples)

## Overview

The `VanillaUiRouter` class provides a simple yet powerful routing solution for vanilla JavaScript applications. It manages:

- **Route Registration**: Define paths and associated HTML content
- **Navigation**: Handle programmatic and browser-based navigation
- **Authentication**: Optionally implements custom authorization logic
- **Lifecycle Hooks**: Execute callbacks when pages are rendered or unmounted
- **History Management**: Integrates with the browser's History API
- **Navigation Listeners**: Subscribe to route changes

## Installation and Usage

### For NodeJS projects

#### Installation

In your project directory, install the dependency on the command line:
```bash
npm install --save @minute-spa/vanilla-ui-router
```

#### Usage

Import the package in your code:
```javascript
import { VanillaUiRouter } from '@minute-spa/vanilla-ui-router'
```

### For Vanila projects

#### Installation

Clone packages/VanillaUiRouter/index.js from https://github.com/devosm1030/minute-spa into your project and rename as appropriate.

#### Usage

From an ES module, import the package in your code:
```javascript
import { VanillaUiRouter } from '<path/to/your/file>'
```

## Constructor

### `new VanillaUiRouter(rootElem, pages = [])`

Creates a new VanillaUiRouter instance.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rootElem` | `HTMLElement` or `string` | Yes | The DOM element or selector where pages will be mounted |
| `pages` | `Array<{path: string, page: Object}>` | No | Optional array of page configurations to register during initialization |

#### Returns

A new `VanillaUiRouter` instance.

#### Throws

- `Error` - If `rootElem` is not provided

#### Example

```javascript
const rootElem = document.getElementById('app')
const homeElem = document.createElement('div')
homeElem.innerHTML = '<h1>Home</h1>'
const aboutElem = document.createElement('div')
aboutElem.innerHTML = '<h1>About</h1>'

const pages = [
  { path: '/home', page: { domElem: homeElem } },
  { path: '/about', page: { domElem: aboutElem } }
]
const router = new VanillaUiRouter(rootElem, pages)
```

## Public Methods

### `registerRoute(path, pageConfig)`

Registers a new route with the router.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | The URL path (e.g., '/home', '/about') |
| `pageConfig` | `Object` | Yes | Configuration object for the page |
| `pageConfig.domElem` | `HTMLElement` or `function` | Yes | DOM element to render, or a function that returns a DOM element |
| `pageConfig.onRendered` | `function(element)` | No | Callback executed after page is rendered |
| `pageConfig.onUnmount` | `function(element)` | No | Callback executed before page is removed |

#### Returns

The `VanillaUiRouter` instance (for method chaining).

#### Throws

- `Error` - If `path` or `domElem` is missing

#### Example

```javascript
const profileElem = document.createElement('div')
profileElem.id = 'profile'
profileElem.innerHTML = '<h1>User Profile</h1>'

router.registerRoute('/profile', {
  domElem: profileElem,
  onRendered: (element) => {
    console.log('Profile page rendered:', element)
    // Initialize event listeners, load data, etc.
  },
  onUnmount: (element) => {
    console.log('Profile page unmounting:', element)
    // Cleanup event listeners, cancel requests, etc.
  }
})

// Or use a function that returns an element if you want to 
// be able to change pages dynamically between navigations.
router.registerRoute('/dashboard', {
  domElem: () => {
    const elem = document.createElement('div')
    elem.innerHTML = '<h1>Dashboard</h1>'
    return elem
  }
})
```

### `initialNav()`

Performs the initial navigation based on the current browser URL. Should be called after all routes are registered to render the appropriate page.

#### Returns

The `VanillaUiRouter` instance (for method chaining).

#### Example

```javascript
const homeElem = document.createElement('h1')
homeElem.textContent = 'Home'
const aboutElem = document.createElement('h1')
aboutElem.textContent = 'About'

const router = new VanillaUiRouter(document.getElementById('app'))
  .registerRoute('/home', { domElem: homeElem })
  .registerRoute('/about', { domElem: aboutElem })
  .initialNav() // Renders the page matching current URL
```

### `navigateTo(path)`

Programmatically navigates to a specified path. Updates the browser URL and renders the corresponding page.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | The path to navigate to |

#### Returns

`undefined`

#### Behavior

- If the path is invalid and no auth callback is registered, navigation is ignored
- Updates `window.history` using `pushState`
- Triggers authentication check if configured
- Renders the new page
- Executes all registered navigation listeners

#### Example

```javascript
// Navigate to a different page
router.navigateTo('/about')

// Navigate from within an event handler
document.getElementById('homeBtn').addEventListener('click', () => {
  router.navigateTo('/home')
})
```

### `onPathAuth(callback)`

Optionally registers an authentication/authorization callback that is invoked before rendering any page. If your app does not require authentication/authorization, skip this registration, and all registered pages will be allowed to be navigated to/rendered.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callback` | `function(path, helpers)` | Yes | Authentication callback function |

The callback receives:
- `path` (string): The path being navigated to
- `helpers` (object): Helper functions for handling auth results
  - `helpers.redirectTo(path)`: Redirect to a different path
  - `helpers.renderDomElem(element)`: Render a custom DOM element instead

#### Callback Return Values

- `true` - Allow navigation to the requested path
- `false` - Block navigation (should call `redirectTo` or `renderDomElem`)

#### Returns

The `VanillaUiRouter` instance (for method chaining).

#### Throws

- `Error` - If `redirectTo` is called with an invalid path

#### Example

```javascript
router.onPathAuth((path, { redirectTo, renderDomElem }) => {
  // Check if user is authenticated
  if (!isUserLoggedIn() && path !== '/login') {
    // Redirect to login page
    return redirectTo('/login')
  }

  // Check if user has permission for this path
  if (path === '/admin' && !isUserAdmin()) {
    // Render unauthorized message in /admin path without changing path in browser
    const unauthorizedElem = document.createElement('h1')
    unauthorizedElem.textContent = 'Unauthorized'
    return renderDomElem(unauthorizedElem)
  }

  // Allow navigation
  return true
})
```

### `registerNavListener(callback)`

Registers a callback to be executed whenever navigation occurs.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callback` | `function(path)` | Yes | Callback invoked on navigation |

The callback receives:
- `path` (string): The path that was navigated to

#### Returns

The `VanillaUiRouter` instance (for method chaining).

#### Behavior

- If a current path exists when registering, the callback is immediately invoked with that path
- The callback is invoked after every successful navigation

#### Example

```javascript
// Update active nav item
router.registerNavListener((path) => {
  navbar.activelink(path)
})
```

### `reauthenticate()`

Re-runs the authentication check for the current path. Useful when authentication state changes (e.g., user logs in or out). N/A if you choose not to register an auth callback for your app.

#### Returns

`undefined`

#### Example

```javascript
// After user logs in
async function login(username, password) {
  const success = await authService.login(username, password)
  if (success) {
    // Re-check authentication for current page
    router.reauthenticate()
  }
}

// After user logs out
function logout() {
  authService.logout()
  router.reauthenticate() // Will redirect to login if needed
}
```

### `isValidPath(path)`

Checks if a given path has been registered with the router.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | The path to check |

#### Returns

`boolean` - `true` if the path is registered, `false` otherwise

#### Example

```javascript
if (router.isValidPath('/profile')) {
  router.navigateTo('/profile')
} else {
  console.log('Profile page not found')
}
```

## Route Configuration

### Page Configuration Object

When registering routes, you provide a page configuration object:

```javascript
{
  domElem: HTMLElement | function,  // Required: DOM element or function returning DOM element
  onRendered: function(element),    // Optional: Called after render
  onUnmount: function(element)      // Optional: Called before unmount
}
```

### DOM Element

The `domElem` property can be:

1. **HTML Element**:
   ```javascript
   const pageElement = document.createElement('div')
   pageElement.innerHTML = '<h1>Welcome</h1>'
   { domElem: pageElement }
   ```

2. **Function returning HTML Element**:
   ```javascript
   { 
     domElem: () => {
       const elem = document.createElement('div')
       elem.innerHTML = '<h1>Welcome</h1>'
       return elem
     }
   }
   ```

Be sure to sanitize any untrusted content that could be used to build your DOM elements! For a NodeJS project, DomPurify (https://www.npmjs.com/package/dompurify) is a convenient tool for doing this.

## Authentication & Authorization

Authentication and Authorization only occurs if you have registered an auth callback via **onPathAuth**.
### Authentication Flow

1. User attempts to navigate to a path
2. Router calls the `onPathAuth` callback (if registered)
3. Callback decides to:
   - Allow navigation (return `true`)
   - Redirect to another path (call `redirectTo()` and return `false`)
   - Render custom DOM element (call `renderDomElem()` and return `false`)

### Example: Protected Routes

```javascript
const publicRoutes = ['/home', '/about', '/login']

router.onPathAuth((path, { redirectTo }) => {
  // Allow public routes
  if (publicRoutes.includes(path)) {
    return true
  }

  // Check authentication for protected routes
  const token = localStorage.getItem('authToken')
  if (!token) {
    // Store the intended destination
    sessionStorage.setItem('redirectAfterLogin', path)
    return redirectTo('/login')
  }

  return true
})
```

### Example: Role-Based Access

```javascript
const adminRoutes = ['/admin', '/users', '/settings']

router.onPathAuth((path, { redirectTo, renderDomElem }) => {
  const user = getCurrentUser()

  if (!user && path !== '/login') {
    return redirectTo('/login')
  }

  if (adminRoutes.includes(path) && !user.isAdmin) {
    const deniedElem = document.createElement('div')
    deniedElem.innerHTML = '<h1>Access Denied</h1><p>Admin access required.</p>'
    return renderDomElem(deniedElem)
  }

  return true
})
```

## Navigation Listeners

Navigation listeners are invoked after every successful navigation, making them perfect for:

- Updating UI elements (navigation bars, breadcrumbs)
- Analytics tracking
- Logging
- Side effects based on current route

### Multiple Listeners

You can register multiple navigation listeners:

```javascript
// Update page title
router.registerNavListener((path) => {
  const titles = {
    '/home': 'Home',
    '/about': 'About Us',
    '/contact': 'Contact'
  }
  document.title = titles[path] || 'My App'
})

// Update navigation state
router.registerNavListener((path) => {
  updateActiveNavItem(path)
})

// Track page views
router.registerNavListener((path) => {
  gtag('config', 'GA_MEASUREMENT_ID', {
    page_path: path
  })
})
```

## Lifecycle Hooks

### `onRendered` Hook

Called immediately after a page is rendered and added to the DOM.

**Use cases:**
- Initialize event listeners
- Load data
- Start animations
- Focus elements
- Initialize third-party libraries

```javascript
const dashboardElem = document.createElement('div')
dashboardElem.id = 'dashboard'
dashboardElem.innerHTML = '...' // dashboard HTML

router.registerRoute('/dashboard', {
  domElem: dashboardElem,
  onRendered: (element) => {
    // Initialize chart library
    const chartCanvas = element.querySelector('#chart')
    initializeChart(chartCanvas)

    // Load data
    fetchDashboardData().then(data => {
      updateDashboard(element, data)
    })

    // Add event listeners
    element.querySelector('#refresh-btn').addEventListener('click', refreshData)
  }
})
```

### `onUnmount` Hook

Called just before a page is removed from the DOM.

**Use cases:**
- Remove event listeners
- Cancel pending requests
- Clear timers/intervals
- Cleanup third-party libraries
- Save state

```javascript
let refreshInterval

const feedElem = document.createElement('div')
feedElem.id = 'feed'
feedElem.innerHTML = '...' // feed HTML

router.registerRoute('/live-feed', {
  domElem: feedElem,
  onRendered: (element) => {
    // Start auto-refresh
    refreshInterval = setInterval(() => {
      updateFeed(element)
    }, 5000)
  },
  onUnmount: (element) => {
    // Stop auto-refresh
    clearInterval(refreshInterval)
    
    // Cancel any pending requests
    abortController.abort()
    
    console.log('Feed page cleaned up')
  }
})
```

## Complete Examples

### Basic Setup

```javascript
import { VanillaUiRouter } from '@minute-spa/vanilla-ui-router'

// Create router
const router = new VanillaUiRouter(document.getElementById('app'))

// Create page elements
const homeElem = document.createElement('div')
homeElem.innerHTML = '<h1>Home Page</h1><p>Welcome!</p>'

const aboutElem = document.createElement('div')
aboutElem.innerHTML = '<h1>About Us</h1><p>Learn more about our company.</p>'

const contactElem = document.createElement('div')
contactElem.innerHTML = '<h1>Contact</h1><form>...</form>'

// Register routes
router
  .registerRoute('/home', { domElem: homeElem })
  .registerRoute('/about', { domElem: aboutElem })
  .registerRoute('/contact', { domElem: contactElem })

// Start router
router.initialNav()
```

### Full-Featured Application

```javascript
import { VanillaUiRouter } from '@minute-spa/vanilla-ui-router'
import { homePage } from './pages/home.js'
import { profilePage } from './pages/profile.js'
import { loginPage } from './pages/login.js'

// Initialize router with pages
const pages = [
  { path: '/home', page: homePage },
  { path: '/profile', page: profilePage },
  { path: '/login', page: loginPage }
]

const router = new VanillaUiRouter(document.getElementById('app'), pages)

// Add authentication
router.onPathAuth((path, { redirectTo }) => {
  const isAuthenticated = checkAuthStatus()
  
  if (!isAuthenticated && path !== '/login') {
    sessionStorage.setItem('returnTo', path)
    return redirectTo('/login')
  }
  
  if (isAuthenticated && path === '/login') {
    const returnTo = sessionStorage.getItem('returnTo') || '/home'
    sessionStorage.removeItem('returnTo')
    return redirectTo(returnTo)
  }
  
  return true
})

// Track navigation
router.registerNavListener((path) => {
  console.log('Navigated to:', path)
  updateBreadcrumbs(path)
})

// Initialize
router.initialNav()
```

## License

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