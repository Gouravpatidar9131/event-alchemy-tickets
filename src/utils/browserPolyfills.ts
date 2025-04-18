
// Polyfill for Node.js global in browser environments
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.global = window;
  // @ts-ignore
  window.process = { env: {} };
  // @ts-ignore
  window.Buffer = window.Buffer || null;
  
  // Dynamically import buffer instead of using require
  import('buffer').then(({ Buffer }) => {
    // @ts-ignore
    window.Buffer = Buffer;
  });
}

export {}; // Make this a module
