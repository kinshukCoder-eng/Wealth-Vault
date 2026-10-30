import '@testing-library/jest-dom';

// Mock window.matchMedia for JSDOM
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
});

// Mock IntersectionObserver for JSDOM
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock MutationObserver for JSDOM
global.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
};

// Mock scrollTo
window.scrollTo = () => {};
