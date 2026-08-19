import { useEffect, useState, useCallback } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { AppShell } from '../../components/app-shell'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { EmptyState } from '../../components/ui/empty-state'
import { listCoaches } from '../../services/supabase'
import type { Coach } from '../../lib/types'
import './index.css'

export default function Coaches() {
  const [list, setList] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await listCoaches()
    if (r.error || !r.data) {
      Taro.showToast({ title: r.error || '加载失败', icon: 'none' })
      setLoading(false)
      return
    }
    setList(r.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useDidShow(() => {
    load()
  })

  function openDetail(c: Coach) {
    Taro.navigateTo({ url: `/pages/coach-detail/index?id=${c.id}` })
  }

  return (
    <AppShell
      eyebrow='会员端'
      title='私教教练'
      description='查看教练擅长方向与可约时段，预约 1v1 私教课'
      action={
        <View className='text-xs text-primary' onClick={() => Taro.navigateBack()} data-node-id="0d1eccfe-9ba7-11f1-b43e-bea971cc7bac">
          返回
        </View>
      }
     data-node-id="0d1ecbb4-9ba7-11f1-b43e-bea971cc7bac">
      {loading ? (
        <View className='flex flex-col items-center py-10' data-node-id="0d1ecec0-9ba7-11f1-b43e-bea971cc7bac">
          <Text className='text-sm text-muted-foreground' data-node-id="0d1ed30c-9ba7-11f1-b43e-bea971cc7bac">加载中…</Text>
        </View>
      ) : list.length === 0 ? (
        <EmptyState title='暂无教练' description='请等待管理员添加'  data-node-id="0d1ecde4-9ba7-11f1-b43e-bea971cc7bac"/>
      ) : (
        <View className='flex flex-col gap-3' data-node-id="0d1ecf9c-9ba7-11f1-b43e-bea971cc7bac">
          {list.map((c) => (
            <Card key={c.id} className='flex flex-row items-start gap-4 p-4 active:opacity-80' onClick={() => openDetail(c)} data-node-id="0d1ed082-9ba7-11f1-b43e-bea971cc7bac">
              <View className='flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-3xl' data-node-id="0d1ed15e-9ba7-11f1-b43e-bea971cc7bac">
                {c.avatar || '🏋️'}
              </View>
              <View className='flex flex-1 flex-col gap-1' data-node-id="0d1ed3e8-9ba7-11f1-b43e-bea971cc7bac">
                <Text className='text-base font-semibold' data-node-id="0d1ed23a-9ba7-11f1-b43e-bea971cc7bac">{c.name}</Text>
                <Text className='text-xs text-muted-foreground' data-node-id="0d1ed4c4-9ba7-11f1-b43e-bea971cc7bac">{c.specialty}</Text>
                <View className='mt-1 flex flex-row flex-wrap gap-2' data-node-id="0d1ed596-9ba7-11f1-b43e-bea971cc7bac">
                  {c.available_slots.slice(0, 2).map((s, i) => (
                    <Badge key={i} data-node-id="0d1ed668-9ba7-11f1-b43e-bea971cc7bac">{s.day} {s.time}</Badge>
                  ))}
                  {c.available_slots.length > 2 ? <Badge data-node-id="0d1ed8de-9ba7-11f1-b43e-bea971cc7bac">+{c.available_slots.length - 2} 时段</Badge> : null}
                </View>
              </View>
              <View className='flex items-center' data-node-id="0d1ed73a-9ba7-11f1-b43e-bea971cc7bac">
                <Text className='text-xs text-primary' data-node-id="0d1ed80c-9ba7-11f1-b43e-bea971cc7bac">查看</Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </AppShell>
  )
}
