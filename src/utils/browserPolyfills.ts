
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
      node: '16.0.0'
    },
    nextTick: (cb: Function) => setTimeout(cb, 0)
  };

  // Mock Buffer API with proper types
  class MockBuffer extends Uint8Array {
    static from(data: any, encoding?: string): MockBuffer {
      if (encoding === 'hex') {
        const hexStr = data.toString();
        const result = new MockBuffer(hexStr.length / 2);
        for (let i = 0; i < hexStr.length; i += 2) {
          result[i / 2] = parseInt(hexStr.substring(i, i + 2), 16);
        }
        return result;
      }
      return new MockBuffer(data);
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

  // @ts-ignore
  window.Buffer = MockBuffer;

  // Simple URL utilities
  // @ts-ignore
  window.url = {
    URL: URL,
    parse: (url: string) => new URL(url, window.location.origin),
    format: (urlObj: any) => urlObj.toString()
  };
}

export {};
