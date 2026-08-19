import Taro from '@tarojs/taro'

const RUNTIME_LOG_KEY = 'runtime-error-log'
const MAX_ENTRIES = 20

export interface RuntimeErrorEntry {
  occurredAt: string
  details: string
}

export function appendRuntimeError(details: string): void {
  const previous = Taro.getStorageSync<RuntimeErrorEntry[]>(RUNTIME_LOG_KEY)
  const entries = Array.isArray(previous) ? previous : []
  Taro.setStorageSync(
    RUNTIME_LOG_KEY,
    [...entries, { occurredAt: new Date().toISOString(), details }].slice(-MAX_ENTRIES),
  )
}

export function readRuntimeErrors(): RuntimeErrorEntry[] {
  const entries = Taro.getStorageSync<RuntimeErrorEntry[]>(RUNTIME_LOG_KEY)
  return Array.isArray(entries) ? entries : []
}
