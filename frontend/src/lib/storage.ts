import Taro from '@tarojs/taro'

export function readStorage<T>(key: string, fallback: T): T {
  const stored = Taro.getStorageSync<T | undefined>(key)
  return stored === undefined || stored === null ? fallback : stored
}

export function writeStorage<T>(key: string, value: T): void {
  Taro.setStorageSync(key, value)
}

export function removeStorage(key: string): void {
  Taro.removeStorageSync(key)
}
