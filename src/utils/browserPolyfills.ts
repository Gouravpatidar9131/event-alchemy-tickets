
// Polyfill for Node.js global and other required globals in browser environments
if (typeof window !== 'undefined') {
  // Make window.global available
  // @ts-ignore
  window.global = window;
  
  // Provide basic process object
  // @ts-ignore
  window.process = { 
    env: {},
    browser: true,
    version: '',
    versions: {},
    nextTick: (cb: Function) => setTimeout(cb, 0)
  };
  
  // Setup Buffer 
  // @ts-ignore
  window.Buffer = window.Buffer || null;
  
  // Provide basic util module exports that might be needed
  // @ts-ignore
  window.util = {
    inherits: function(ctor: any, superCtor: any) {
      if (superCtor) {
        ctor.super_ = superCtor;
        Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
      }
    },
    deprecate: function(fn: Function) {
      return fn;
    }
  };
  
  // Dynamically import buffer instead of using require
  import('buffer').then(({ Buffer }) => {
    // @ts-ignore
    window.Buffer = Buffer;
  });
  
  // Polyfill stream if needed (this is a minimal stub)
  // @ts-ignore
  window.stream = {
    Readable: class Readable {},
    PassThrough: class PassThrough {}
  };
}

export {}; // Make this a module
