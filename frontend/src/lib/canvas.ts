import Taro from '@tarojs/taro'

export interface CanvasMetrics {
  cssWidth: number
  cssHeight: number
  pixelWidth: number
  pixelHeight: number
  pixelRatio: number
}

export function getCanvasMetrics(cssWidth: number, cssHeight: number): CanvasMetrics {
  const system = Taro.getSystemInfoSync()
  const pixelRatio = Math.max(1, system.pixelRatio || 1)
  return {
    cssWidth,
    cssHeight,
    pixelWidth: Math.round(cssWidth * pixelRatio),
    pixelHeight: Math.round(cssHeight * pixelRatio),
    pixelRatio,
  }
}

export function getViewportWidth(): number {
  return Taro.getSystemInfoSync().windowWidth
}
