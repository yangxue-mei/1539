import { createElement, PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { AppErrorBoundary } from './components/app-error-boundary'
import './app.css'

// Taro React app entry. `children` is the active page; keep app-level side
// effects (global state init, login bootstrap) inside useLaunch.
function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    // App launched. Put one-time initialization here.
  })

  return createElement(AppErrorBoundary, null, children)
}

export default App
