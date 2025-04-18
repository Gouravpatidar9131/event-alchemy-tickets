
// Polyfill for Node.js global in browser environments
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.global = window;
  // @ts-ignore
  window.process = { env: {} };
  // @ts-ignore
  window.Buffer = window.Buffer || require('buffer').Buffer;
}

export {}; // Make this a module
