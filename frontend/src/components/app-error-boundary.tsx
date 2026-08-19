import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Component, ErrorInfo, PropsWithChildren } from 'react'
import { appendRuntimeError } from '../lib/runtime-log'

interface ErrorState {
  error: Error | null
  details: string
}

export class AppErrorBoundary extends Component<PropsWithChildren, ErrorState> {
  state: ErrorState = { error: null, details: '' }

  static getDerivedStateFromError(error: Error): ErrorState {
    return { error, details: error.stack ?? error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const details = `${error.stack ?? error.message}\n${info.componentStack ?? ''}`.trim()
    appendRuntimeError(details)
    this.setState({ details })
  }

  copyDetails = () => {
    Taro.setClipboardData({ data: this.state.details })
  }

  reset = () => {
    this.setState({ error: null, details: '' })
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    return (
      <View className='flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-foreground'>
        <Text className='text-xl font-semibold'>页面暂时无法显示</Text>
        <Text className='text-center text-sm text-muted-foreground'>
          错误已保存在本地，可记录并复制错误信息后重试。
        </Text>
        <View className='flex w-full max-w-sm flex-col gap-3'>
          <Button className='w-full bg-primary text-primary-foreground' onClick={this.reset}>
            重新加载页面
          </Button>
          <Button className='w-full' onClick={this.copyDetails}>
            记录并复制错误
          </Button>
        </View>
      </View>
    )
  }
}
