
// Polyfill for Node.js modules in browser environments
if (typeof window !== 'undefined') {
  // Make window.global available
  // @ts-ignore
  window.global = window;
  
  // Provide basic process object
  // @ts-ignore
  window.process = { 
    env: {},
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
  
  // Create proper Stream constructors using function constructors to avoid class prototype issues
  function ReadableConstructor() {}
  ReadableConstructor.prototype = {
    pipe: function() { return {} },
    on: function() { return this },
    once: function() { return this },
    read: function() { return null },
    push: function() { return true }
  };
  
  function WritableConstructor() {}
  WritableConstructor.prototype = {
    on: function() { return this },
    once: function() { return this },
    write: function() { return true },
    end: function() {}
  };
  
  function DuplexConstructor() {}
  // Set up prototype to inherit from Readable
  DuplexConstructor.prototype = Object.create(ReadableConstructor.prototype);
  // Copy Writable methods to Duplex prototype
  Object.assign(DuplexConstructor.prototype, WritableConstructor.prototype);
  
  function TransformConstructor() {}
  TransformConstructor.prototype = Object.create(DuplexConstructor.prototype);
  
  function PassThroughConstructor() {}
  PassThroughConstructor.prototype = Object.create(TransformConstructor.prototype);
  
  // Set up stream properly with constructor functions
  // @ts-ignore
  window.stream = {
    Readable: ReadableConstructor,
    Writable: WritableConstructor,
    Duplex: DuplexConstructor,
    Transform: TransformConstructor,
    PassThrough: PassThroughConstructor
  };
  
  // Ensure Buffer is available
  if (!window.Buffer) {
    // @ts-ignore
    window.Buffer = {
      from: function(data, encoding) {
        if (encoding === 'hex') {
          // Convert hex to Uint8Array
          const hexStr = data.toString();
          const result = new Uint8Array(hexStr.length / 2);
          for (let i = 0; i < hexStr.length; i += 2) {
            result[i / 2] = parseInt(hexStr.substring(i, i + 2), 16);
          }
          return result;
        }
        return new Uint8Array(data);
      },
      alloc: function(size) {
        return new Uint8Array(size);
      },
      isBuffer: function(obj) {
        return ArrayBuffer.isView(obj);
      }
    };
  }
  
  // Provide enhanced http polyfill with proper methods
  // @ts-ignore
  window.http = {
    STATUS_CODES: {
      200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content',
      400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found',
      409: 'Conflict', 500: 'Internal Server Error'
    },
    createServer: function() {
      return { listen: function() { return {} } };
    },
    request: function() {
      return {
        on: function() { return this },
        end: function() {}
      };
    }
  };
  
  // Enhanced url polyfill using the browser's URL
  // @ts-ignore
  window.url = {
    URL: URL,
    parse: function(url, parseQueryString) {
      try {
        const parsed = new URL(url, window.location.origin);
        // Add node.js url.parse compatible properties
        const result = {
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          port: parsed.port,
          pathname: parsed.pathname,
          search: parsed.search,
          hash: parsed.hash,
          href: parsed.href,
          query: {}
        };
        
        // Parse query string if requested
        if (parseQueryString) {
          result.query = Object.fromEntries(parsed.searchParams);
        } else {
          result.query = parsed.search.substring(1);
        }
        
        return result;
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
  
  // Mock fs functions that safely throw when used
  // @ts-ignore
  window.fs = {
    readFileSync: function() { throw new Error('fs.readFileSync is not supported in browser environment'); },
    writeFileSync: function() { throw new Error('fs.writeFileSync is not supported in browser environment'); },
    promises: {
      readFile: function() { return Promise.reject(new Error('fs.promises.readFile is not supported in browser environment')); },
      writeFile: function() { return Promise.reject(new Error('fs.promises.writeFile is not supported in browser environment')); }
    }
  };
  
  // Add basic path module polyfill
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
  
  // Add basic util polyfill
  // @ts-ignore
  window.util = {
    inherits: function(ctor, superCtor) {
      if (superCtor) {
        ctor.super_ = superCtor;
        Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
      }
    },
    deprecate: function(fn) {
      return fn;
    }
  };
}

export {}; // Make this a module
