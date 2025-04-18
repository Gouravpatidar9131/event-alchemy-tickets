
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
  
  // Enhanced stream polyfill with more complete implementation
  // @ts-ignore
  window.stream = {
    Readable: class Readable {
      _readableState: Record<string, unknown>;
      // Adding missing prototype property
      static get prototype() {
        return {
          pipe: () => { return {} },
          on: () => { return {} },
          once: () => { return {} },
          read: () => { return null },
          push: () => { return true }
        };
      }
      constructor() {
        this._readableState = {};
      }
      pipe() { return this; }
      on() { return this; }
      once() { return this; }
      read() { return null; }
      push() { return true; }
    },
    PassThrough: class PassThrough {
      _transformState: Record<string, unknown>;
      // Adding missing prototype property
      static get prototype() {
        return {
          pipe: () => { return {} },
          on: () => { return {} },
          once: () => { return {} },
          write: () => { return true },
          end: () => {},
          read: () => { return null }
        };
      }
      constructor() {
        this._transformState = {};
      }
      pipe() { return this; }
      on() { return this; }
      once() { return this; }
      write() { return true; }
      end() {}
      read() { return null; }
    },
    Writable: class Writable {
      _writableState: Record<string, unknown>;
      // Adding missing prototype property
      static get prototype() {
        return {
          on: () => { return {} },
          once: () => { return {} },
          write: () => { return true },
          end: () => {}
        };
      }
      constructor() {
        this._writableState = {};
      }
      on() { return this; }
      once() { return this; }
      write() { return true; }
      end() {}
    },
    Duplex: class Duplex {
      _readableState: Record<string, unknown>;
      _writableState: Record<string, unknown>;
      // Adding missing prototype property
      static get prototype() {
        return {
          pipe: () => { return {} },
          on: () => { return {} },
          once: () => { return {} },
          write: () => { return true },
          end: () => {},
          read: () => { return null },
          push: () => { return true }
        };
      }
      constructor() {
        this._readableState = {};
        this._writableState = {};
      }
      pipe() { return this; }
      on() { return this; }
      once() { return this; }
      write() { return true; }
      end() {}
      read() { return null; }
      push() { return true; }
    },
    Transform: class Transform {
      _transformState: Record<string, unknown>;
      // Adding missing prototype property
      static get prototype() {
        return {
          pipe: () => { return {} },
          on: () => { return {} },
          once: () => { return {} },
          write: () => { return true },
          end: () => {},
          read: () => { return null },
          push: () => { return true }
        };
      }
      constructor() {
        this._transformState = {};
      }
      pipe() { return this; }
      on() { return this; }
      once() { return this; }
      write() { return true; }
      end() {}
      read() { return null; }
      push() { return true; }
    }
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
    createServer: () => ({
      listen: () => ({})
    }),
    // Add missing prototype property
    prototype: {}
  };

  // Enhanced url polyfill
  // @ts-ignore
  window.url = {
    URL: URL,
    parse: (url: string) => {
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
    format: (urlObj: any) => {
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
    },
    // Add missing prototype property
    prototype: {}
  };
  
  // FIX: Don't try to directly set window.crypto as it's a read-only property
  // Instead, extend it if needed with additional methods that might be required
  if (window.crypto) {
    // Only add the getRandomValues method if it doesn't exist
    if (!window.crypto.getRandomValues) {
      // @ts-ignore - Extend the existing crypto object instead of replacing it
      window.crypto.getRandomValues = function(buffer: Uint8Array) {
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] = Math.floor(Math.random() * 256);
        }
        return buffer;
      };
    }
  }

  // Add additional missing prototypes for fs and other Node modules
  // that Metaplex might be trying to access
  // @ts-ignore
  window.fs = {
    prototype: {},
    // Add basic fs functions if needed
    readFileSync: () => { throw new Error('fs.readFileSync is not supported in browser environment'); },
    writeFileSync: () => { throw new Error('fs.writeFileSync is not supported in browser environment'); }
  };

  // Add additional Node.js dependencies that Metaplex might need
  // @ts-ignore
  window.path = {
    prototype: {},
    join: (...parts) => parts.join('/').replace(/\/+/g, '/'),
    resolve: (...parts) => parts.join('/').replace(/\/+/g, '/'),
    dirname: (path) => {
      const parts = path.split('/');
      parts.pop();
      return parts.join('/') || '.';
    }
  };
}

export {}; // Make this a module
