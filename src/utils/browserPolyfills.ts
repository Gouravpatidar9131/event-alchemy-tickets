
// Polyfill for Node.js global and other required globals in browser environments
if (typeof window !== 'undefined') {
  // Make window.global available
  // @ts-ignore
  window.global = window;
  
  // Provide basic process object with proper versions type
  // @ts-ignore
  window.process = { 
    env: {},
    // Remove browser property to fix TS error
    version: '1.0.0',
    versions: {
      node: '16.0.0',
      v8: '9.0.0',
      http_parser: '2.9.0',
      ares: '1.17.0',
      uv: '1.42.0',
      zlib: '1.2.11',
      modules: '93',
      openssl: '1.1.1k'
    },
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
  
  // Stream polyfills using constructor functions instead of classes
  // This avoids the 'Classes may not have a static property named prototype' error
  function Readable() {}
  Readable.prototype = {
    pipe: function() { return {} },
    on: function() { return this },
    once: function() { return this },
    read: function() { return null },
    push: function() { return true }
  };
  
  function Writable() {}
  Writable.prototype = {
    on: function() { return this },
    once: function() { return this },
    write: function() { return true },
    end: function() {}
  };
  
  function Duplex() {}
  Duplex.prototype = Object.create(Readable.prototype);
  Object.assign(Duplex.prototype, Writable.prototype);
  
  function Transform() {}
  Transform.prototype = Object.create(Duplex.prototype);
  
  function PassThrough() {}
  PassThrough.prototype = Object.create(Transform.prototype);
  
  // @ts-ignore - Assigning to stream
  window.stream = {
    Readable: Readable,
    Writable: Writable,
    Duplex: Duplex,
    Transform: Transform,
    PassThrough: PassThrough
  };

  // Enhanced http polyfill
  // @ts-ignore
  window.http = {
    STATUS_CODES: {
      200: 'OK',
      201: 'Created',
      202: 'Accepted',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      500: 'Internal Server Error'
    },
    createServer: function() {
      return {
        listen: function() { return {} }
      };
    }
  };

  // Enhanced url polyfill using the browser's URL
  // @ts-ignore
  window.url = {
    URL: URL,
    parse: function(url) {
      try {
        const parsed = new URL(url, window.location.origin);
        // Add node.js url.parse compatible properties
        return {
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          port: parsed.port,
          pathname: parsed.pathname,
          search: parsed.search,
          hash: parsed.hash,
          href: parsed.href,
          query: Object.fromEntries(parsed.searchParams)
        };
      } catch (e) {
        console.error('Error parsing URL:', e);
        return {};
      }
    },
    format: function(urlObj) {
      if (typeof urlObj === 'string') return urlObj;
      if (urlObj instanceof URL) return urlObj.toString();
      
      try {
        // Handle node.js style url objects
        if (typeof urlObj === 'object') {
          const protocol = urlObj.protocol || 'http:';
          const hostname = urlObj.hostname || urlObj.host || 'localhost';
          const port = urlObj.port ? `:${urlObj.port}` : '';
          const pathname = urlObj.pathname || '/';
          const search = urlObj.search || '';
          const hash = urlObj.hash || '';
          
          return `${protocol}//${hostname}${port}${pathname}${search}${hash}`;
        }
        return String(urlObj);
      } catch (e) {
        console.error('Error formatting URL:', e);
        return '';
      }
    }
  };
  
  // Safely extend crypto if it exists
  if (window.crypto) {
    // Only add the getRandomValues method if it doesn't exist
    if (!window.crypto.getRandomValues) {
      // @ts-ignore - Extend the existing crypto object
      const originalCrypto = window.crypto;
      Object.defineProperty(window, 'crypto', {
        configurable: true,
        enumerable: true,
        get: function() {
          return {
            ...originalCrypto,
            getRandomValues: function(buffer) {
              for (let i = 0; i < buffer.length; i++) {
                buffer[i] = Math.floor(Math.random() * 256);
              }
              return buffer;
            }
          };
        }
      });
    }
  }

  // Add missing fs polyfill that safely throws when used
  // @ts-ignore
  window.fs = {
    readFileSync: function() { throw new Error('fs.readFileSync is not supported in browser environment'); },
    writeFileSync: function() { throw new Error('fs.writeFileSync is not supported in browser environment'); },
    promises: {
      readFile: function() { return Promise.reject(new Error('fs.promises.readFile is not supported in browser environment')); },
      writeFile: function() { return Promise.reject(new Error('fs.promises.writeFile is not supported in browser environment')); }
    }
  };

  // Add path module polyfill
  // @ts-ignore
  window.path = {
    join: function() {
      return Array.from(arguments).join('/').replace(/\/+/g, '/');
    },
    resolve: function() {
      return Array.from(arguments).join('/').replace(/\/+/g, '/');
    },
    dirname: function(path) {
      const parts = path.split('/');
      parts.pop();
      return parts.join('/') || '.';
    }
  };
}

export {}; // Make this a module
