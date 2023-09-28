import { webcrypto } from "crypto";

import { toEmit, toEmitValue, toEqualBuffer } from "./spec";

Object.defineProperty(window, "crypto", {
  value: webcrypto,
});

// Add custom matchers

expect.extend({
  toEqualBuffer: toEqualBuffer,
  toEmit: toEmit,
  toEmitValue: toEmitValue,
});

export interface CustomMatchers<R = unknown> {
  toEqualBuffer(expected: Uint8Array | ArrayBuffer): R;
  toEmit(timeoutMs?: number): R;
  toEmitValue(
    expected: unknown,
    comparer?: (a: unknown, b: unknown) => boolean,
    timeoutMs?: number
  ): R;
}
