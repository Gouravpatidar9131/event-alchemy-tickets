
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
  
  // Stream polyfills using regular objects and proper inheritance patterns
  const ReadableProto = {
    pipe: () => { return {} },
    on: () => { return {} },
    once: () => { return {} },
    read: () => { return null },
    push: () => { return true }
  };
  
  const WritableProto = {
    on: () => { return {} },
    once: () => { return {} },
    write: () => { return true },
    end: () => {}
  };
  
  const DuplexProto = {
    ...ReadableProto,
    ...WritableProto
  };
  
  const TransformProto = {
    ...DuplexProto
  };
  
  // Stream classes with constructor functions
  function Readable() {
    this._readableState = {};
  }
  Readable.prototype = ReadableProto;
  
  function Writable() {
    this._writableState = {};
  }
  Writable.prototype = WritableProto;
  
  function Duplex() {
    this._readableState = {};
    this._writableState = {};
  }
  Duplex.prototype = DuplexProto;
  
  function Transform() {
    this._transformState = {};
  }
  Transform.prototype = TransformProto;
  
  function PassThrough() {
    this._transformState = {};
  }
  PassThrough.prototype = TransformProto;
  
  // @ts-ignore - Assigning to stream
  window.stream = {
    Readable,
    PassThrough,
    Writable,
    Duplex,
    Transform
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
    })
  };

  // Enhanced url polyfill using the browser's URL
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
            getRandomValues: function(buffer: Uint8Array) {
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
    readFileSync: () => { throw new Error('fs.readFileSync is not supported in browser environment'); },
    writeFileSync: () => { throw new Error('fs.writeFileSync is not supported in browser environment'); },
    promises: {
      readFile: () => Promise.reject(new Error('fs.promises.readFile is not supported in browser environment')),
      writeFile: () => Promise.reject(new Error('fs.promises.writeFile is not supported in browser environment'))
    }
  };

  // Add path module polyfill
  // @ts-ignore
  window.path = {
    join: (...parts: string[]) => parts.join('/').replace(/\/+/g, '/'),
    resolve: (...parts: string[]) => parts.join('/').replace(/\/+/g, '/'),
    dirname: (path: string) => {
      const parts = path.split('/');
      parts.pop();
      return parts.join('/') || '.';
    }
  };
}

export {}; // Make this a module
