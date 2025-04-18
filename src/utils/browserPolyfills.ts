
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
  // Create prototype objects separately instead of using static properties
  const readablePrototype = {
    pipe: () => { return {} },
    on: () => { return {} },
    once: () => { return {} },
    read: () => { return null },
    push: () => { return true }
  };
  
  const writablePrototype = {
    on: () => { return {} },
    once: () => { return {} },
    write: () => { return true },
    end: () => {}
  };
  
  const duplexPrototype = {
    ...readablePrototype,
    ...writablePrototype
  };
  
  const transformPrototype = {
    ...duplexPrototype
  };
  
  // Stream classes
  class Readable {
    _readableState: Record<string, unknown>;
    constructor() {
      this._readableState = {};
      // Copy prototype methods to instance
      Object.assign(this, readablePrototype);
    }
  }
  
  class PassThrough {
    _transformState: Record<string, unknown>;
    constructor() {
      this._transformState = {};
      // Copy prototype methods to instance
      Object.assign(this, transformPrototype);
    }
  }
  
  class Writable {
    _writableState: Record<string, unknown>;
    constructor() {
      this._writableState = {};
      // Copy prototype methods to instance
      Object.assign(this, writablePrototype);
    }
  }
  
  class Duplex {
    _readableState: Record<string, unknown>;
    _writableState: Record<string, unknown>;
    constructor() {
      this._readableState = {};
      this._writableState = {};
      // Copy prototype methods to instance
      Object.assign(this, duplexPrototype);
    }
  }
  
  class Transform {
    _transformState: Record<string, unknown>;
    constructor() {
      this._transformState = {};
      // Copy prototype methods to instance
      Object.assign(this, transformPrototype);
    }
  }
  
  // Manually set prototypes for each class
  Object.setPrototypeOf(Readable.prototype, readablePrototype);
  Object.setPrototypeOf(PassThrough.prototype, transformPrototype);
  Object.setPrototypeOf(Writable.prototype, writablePrototype);
  Object.setPrototypeOf(Duplex.prototype, duplexPrototype);
  Object.setPrototypeOf(Transform.prototype, transformPrototype);
  
  // @ts-ignore
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
    }
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

  // Add additional missing polyfills for fs and other Node modules
  // @ts-ignore
  window.fs = {
    readFileSync: () => { throw new Error('fs.readFileSync is not supported in browser environment'); },
    writeFileSync: () => { throw new Error('fs.writeFileSync is not supported in browser environment'); }
  };

  // Add additional Node.js dependencies that Metaplex might need
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
