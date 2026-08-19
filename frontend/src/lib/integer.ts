export function parseSafeInteger(value: string | number, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isSafeInteger(parsed) ? parsed : fallback
}

export function addSafeIntegers(left: number, right: number): number {
  const result = left + right
  if (!Number.isSafeInteger(result)) {
    throw new RangeError('Integer result exceeds the JavaScript safe range')
  }
  return result
}
