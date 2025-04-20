
// Polyfill for Node.js modules in browser environments
if (typeof window !== 'undefined') {
  // Make window.global available
  // @ts-ignore
  window.global = window;
  
  // Provide basic process object with required OpenSSL version
  // @ts-ignore
  window.process = { 
    env: {},
    version: '1.0.0',
    versions: {
      node: '16.0.0',
      http_parser: '0.0.0',
      v8: '0.0.0',
      ares: '0.0.0',
      uv: '0.0.0',
      zlib: '0.0.0',
      modules: '0.0.0',
      openssl: '1.1.1', // Add OpenSSL version
    },
    nextTick: (cb: Function) => setTimeout(cb, 0)
  };

  // Mock Buffer API with proper TypeScript typings
  class MockBuffer extends Uint8Array {
    // Modified to match Uint8Array's static from method signature more closely
    static from(arrayLike: ArrayLike<number> | string, mapfnOrEncoding?: ((v: number, k: number) => number) | string): MockBuffer {
      if (typeof arrayLike === 'string' && typeof mapfnOrEncoding === 'string' && mapfnOrEncoding === 'hex') {
        // Handle hex strings
        const hexStr = arrayLike.toString();
        const result = new MockBuffer(hexStr.length / 2);
        for (let i = 0; i < hexStr.length; i += 2) {
          result[i / 2] = parseInt(hexStr.substring(i, i + 2), 16);
        }
        return result;
      }
      // Default case, delegate to Uint8Array.from
      return new MockBuffer(Array.from(arrayLike as ArrayLike<number>));
    }

    static alloc(size: number): MockBuffer {
      return new MockBuffer(size);
    }

    static isBuffer(obj: any): obj is MockBuffer {
      return obj instanceof MockBuffer;
    }

    write(): number { return 0; }
    toJSON(): { type: 'Buffer'; data: number[] } { 
      return { type: 'Buffer', data: Array.from(this) };
    }
    equals(): boolean { return false; }
    compare(): number { return 0; }
  }

  // @ts-ignore - Bypass TypeScript type checking for Buffer assignment
  window.Buffer = MockBuffer;

  // Add missing Node.js modules
  // @ts-ignore
  window.stream = { Readable: class {}, Writable: class {}, Transform: class {} };
  
  // @ts-ignore
  window.http = { createServer: () => ({}) };
  
  // @ts-ignore
  window.fs = { 
    readFileSync: () => new Uint8Array(0),
    writeFileSync: () => {},
    existsSync: () => false,
    mkdir: (path: string, cb: Function) => cb(null),
    mkdirSync: () => {}
  };

  // Simple URL utilities
  // @ts-ignore
  window.url = {
    URL: URL,
    parse: (url: string) => new URL(url, window.location.origin),
    format: (urlObj: any) => urlObj.toString()
  };
}

export {};
