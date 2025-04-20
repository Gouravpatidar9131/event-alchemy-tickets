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

  // Implement a more compatible MockBuffer class
  class MockBuffer extends Uint8Array {
    // Implementing a constructor that matches Uint8Array
    constructor(
      length: number | ArrayBufferLike | ArrayLike<number> | Iterable<number> | MockBuffer
    ) {
      super(length as any);
    }

    // Helper method for handling hex strings specifically
    private static fromHexString(hexString: string): MockBuffer {
      const str = hexString.toString();
      const result = new MockBuffer(str.length / 2);
      for (let i = 0; i < str.length; i += 2) {
        result[i / 2] = parseInt(str.substring(i, i + 2), 16);
      }
      return result;
    }

    // Implement static from to match Uint8Array.from signatures
    static from(
      arrayLike: ArrayLike<number> | Iterable<number> | ArrayBufferLike, 
      mapfn?: (v: number, k: number) => number,
      thisArg?: any
    ): MockBuffer {
      // Handle string with encoding as a special case
      if (typeof arrayLike === 'string') {
        const arg = mapfn as unknown as string;
        if (arg === 'hex') {
          return this.fromHexString(arrayLike);
        }
        // If no encoding or different encoding, convert string to array of char codes
        const strArray = new Uint8Array(Array.from(arrayLike).map(c => c.charCodeAt(0)));
        return new MockBuffer(strArray);
      }

      // Otherwise handle like a regular Uint8Array
      return new MockBuffer(
        mapfn 
          ? Array.from(arrayLike as ArrayLike<number>, mapfn, thisArg)
          : Array.from(arrayLike as ArrayLike<number>)
      );
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
