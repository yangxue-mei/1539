import { Text, View } from '@tarojs/components'

// Stable health probe: keep this page unchanged. Vibe coding adds business
// pages separately and registers the real entry first in src/app.config.ts.
export default function Index() {
  return (
    <View className='flex min-h-screen items-center justify-center bg-background px-4 text-foreground'>
      <Text className='text-base font-medium'>Taro 小程序工程已就绪</Text>
    </View>
  )
}
