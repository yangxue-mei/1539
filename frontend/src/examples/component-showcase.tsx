import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import { Add } from '@nutui/icons-react-taro'
import { AppIcon } from '../components/app-icon'
import { AppShell } from '../components/app-shell'
import { Badge, Button, Card, EmptyState, SectionHeader } from '../components/ui'
import { readStorage, writeStorage } from '../lib/storage'

/** Read-only usage reference. This module is intentionally not a registered page. */
export function ComponentShowcase() {
  const [isReady, setIsReady] = useState(() => readStorage('showcase-ready', false))

  const setReady = (ready: boolean) => {
    writeStorage('showcase-ready', ready)
    setIsReady(ready)
  }

  return (
    <AppShell
      eyebrow='Component showcase'
      title='Taro 跨端组件示例'
      description='按需查看组件与状态用法；正常 vibe coding 不编辑此文件。'
      action={<Add size='22' color='currentColor'  data-node-id="0cf7f0ca-9ba7-11f1-b43e-bea971cc7bac"/>}
     data-node-id="0cf7edd2-9ba7-11f1-b43e-bea971cc7bac">
      <View className='flex items-center gap-2 text-primary' data-node-id="0cf7eefe-9ba7-11f1-b43e-bea971cc7bac">
        <AppIcon name={isReady ? 'Success' : 'Warning'} size='20' color='currentColor'  data-node-id="0cf7efee-9ba7-11f1-b43e-bea971cc7bac"/>
        <Badge data-node-id="0cf7f4da-9ba7-11f1-b43e-bea971cc7bac">{isReady ? 'success' : 'loading'}</Badge>
      </View>
      <Card data-node-id="0cf7f5b6-9ba7-11f1-b43e-bea971cc7bac">
        <SectionHeader title='状态示例' description='展示 Card、Badge、Storage 与按钮层级。'  data-node-id="0cf7f1ba-9ba7-11f1-b43e-bea971cc7bac"/>
        <View className='mt-5 flex flex-col gap-3' data-node-id="0cf7f6b0-9ba7-11f1-b43e-bea971cc7bac">
          <Text className='text-sm text-muted-foreground' data-node-id="0cf7f2a0-9ba7-11f1-b43e-bea971cc7bac">示例只用于按需读取。</Text>
          <Button size='lg' onClick={() => setReady(true)} data-node-id="0cf7f782-9ba7-11f1-b43e-bea971cc7bac">设置完成</Button>
          <Button variant='secondary' onClick={() => setReady(false)} data-node-id="0cf7f85e-9ba7-11f1-b43e-bea971cc7bac">重置状态</Button>
        </View>
      </Card>
      <EmptyState
        title='空状态示例'
        description='业务页面可复用同一结构表达 empty 与 error。'
        action={<Button variant='ghost' onClick={() => setReady(false)} data-node-id="0cf7f3fe-9ba7-11f1-b43e-bea971cc7bac">重新加载</Button>}
       data-node-id="0cf7f9ee-9ba7-11f1-b43e-bea971cc7bac"/>
    </AppShell>
  )
}
