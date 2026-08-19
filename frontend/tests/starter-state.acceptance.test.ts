import { describe, expect, it } from 'vitest'
import { addSafeIntegers, parseSafeInteger } from '../src/lib/integer'

describe('replaceable starter state', () => {
  it('keeps persisted numeric values within the safe-integer invariant', () => {
    expect(parseSafeInteger('42')).toBe(42)
    expect(parseSafeInteger('invalid', 7)).toBe(7)
    expect(addSafeIntegers(40, 2)).toBe(42)
    expect(() => addSafeIntegers(Number.MAX_SAFE_INTEGER, 1)).toThrow(RangeError)
  })
})
