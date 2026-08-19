import { Text, View } from '@tarojs/components'

// Stable health probe: keep this page unchanged. Vibe coding adds business
// pages separately and registers the real entry first in src/app.config.ts.
export default function Index() {
  return (
    <View className='flex min-h-screen items-center justify-center bg-background px-4 text-foreground' data-node-id="0d1ff8f4-9ba7-11f1-b43e-bea971cc7bac">
      <Text className='text-base font-medium' data-node-id="0d1ffa3e-9ba7-11f1-b43e-bea971cc7bac">Taro 小程序工程已就绪</Text>
    </View>
  )
}
