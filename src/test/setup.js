import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString() },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock fetch to prevent real API calls during tests (avoids CI timeouts)
const originalFetch = globalThis.fetch
globalThis.fetch = vi.fn(async (url, opts) => {
  const urlStr = typeof url === 'string' ? url : url?.url || ''
  // Block Workers AI and external API calls
  if (urlStr.includes('/api/analyze') || urlStr.includes('api.openai.com') || urlStr.includes('workers.dev')) {
    throw new Error('fetch blocked in test environment')
  }
  // Allow other fetches (if any)
  return originalFetch?.(url, opts) ?? Promise.reject(new Error('no fetch'))
})
