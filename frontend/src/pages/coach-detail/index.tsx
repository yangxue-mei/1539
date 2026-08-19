import { useEffect, useState, useCallback } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { View, Text, Textarea } from '@tarojs/components'
import { AppShell } from '../../components/app-shell'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { EmptyState } from '../../components/ui/empty-state'
import { cn } from '../../lib/cn'
import { getLocalMember } from '../../lib/member'
import { getCoach, createPrivateBooking } from '../../services/supabase'
import type { Coach } from '../../lib/types'
import './index.css'

export default function CoachDetail() {
  const router = useRouter()
  const id = router.params.id
  const [coach, setCoach] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const r = await getCoach(id)
    if (r.error || !r.data) {
      Taro.showToast({ title: r.error || '教练不存在', icon: 'none' })
      setLoading(false)
      return
    }
    setCoach(r.data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useDidShow(() => {
    load()
  })

  async function submit() {
    if (!coach || !selectedSlot) {
      Taro.showToast({ title: '请选择可约时段', icon: 'none' })
      return
    }
    const member = getLocalMember()
    setSubmitting(true)
    const res = await createPrivateBooking(coach.id, selectedSlot, member, note.trim() || undefined)
    setSubmitting(false)
    if (res.error) {
      Taro.showToast({ title: res.error, icon: 'none' })
      return
    }
    Taro.showToast({ title: '已提交，待教练确认', icon: 'success' })
    setSelectedSlot(null)
    setNote('')
    setTimeout(() => Taro.redirectTo({ url: '/pages/my-bookings/index' }), 500)
  }

  if (loading) {
    return (
      <AppShell eyebrow='会员端' title='教练详情' data-node-id="0d1e3640-9ba7-11f1-b43e-bea971cc7bac">
        <View className='flex flex-col items-center py-10' data-node-id="0d1e33b6-9ba7-11f1-b43e-bea971cc7bac">
          <Text className='text-sm text-muted-foreground' data-node-id="0d1e2cea-9ba7-11f1-b43e-bea971cc7bac">加载中…</Text>
        </View>
      </AppShell>
    )
  }

  if (!coach) {
    return (
      <AppShell eyebrow='会员端' title='教练详情' data-node-id="0d1e3712-9ba7-11f1-b43e-bea971cc7bac">
        <EmptyState title='教练不存在'  data-node-id="0d1e3b5e-9ba7-11f1-b43e-bea971cc7bac"/>
      </AppShell>
    )
  }

  return (
    <AppShell
      eyebrow='会员端'
      title={coach.name}
      description={coach.specialty}
      action={<View className='text-xs text-primary' onClick={() => Taro.navigateBack()} data-node-id="0d1e2dd0-9ba7-11f1-b43e-bea971cc7bac">返回</View>}
     data-node-id="0d1e380c-9ba7-11f1-b43e-bea971cc7bac">
      <Card className='flex flex-row items-start gap-4 p-5' data-node-id="0d1e2eac-9ba7-11f1-b43e-bea971cc7bac">
        <View className='flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-4xl' data-node-id="0d1e38de-9ba7-11f1-b43e-bea971cc7bac">
          {coach.avatar || '🏋️'}
        </View>
        <View className='flex flex-1 flex-col gap-1' data-node-id="0d1e3c44-9ba7-11f1-b43e-bea971cc7bac">
          <Text className='text-lg font-bold' data-node-id="0d1e2f88-9ba7-11f1-b43e-bea971cc7bac">{coach.name}</Text>
          <Text className='text-xs text-muted-foreground' data-node-id="0d1e312c-9ba7-11f1-b43e-bea971cc7bac">{coach.specialty}</Text>
          <View className='mt-2 flex flex-row flex-wrap gap-2' data-node-id="0d1e28bc-9ba7-11f1-b43e-bea971cc7bac">
            <Badge data-node-id="0d1e3df2-9ba7-11f1-b43e-bea971cc7bac">1v1 私教</Badge>
            <Badge data-node-id="0d1e4342-9ba7-11f1-b43e-bea971cc7bac">专业认证</Badge>
          </View>
        </View>
      </Card>

      {coach.bio ? (
        <Card data-node-id="0d1e39b0-9ba7-11f1-b43e-bea971cc7bac">
          <View className='flex flex-col gap-2' data-node-id="0d1e2c18-9ba7-11f1-b43e-bea971cc7bac">
            <Text className='text-base font-semibold' data-node-id="0d1e266e-9ba7-11f1-b43e-bea971cc7bac">教练简介</Text>
            <Text className='text-sm text-muted-foreground leading-relaxed' data-node-id="0d1e298e-9ba7-11f1-b43e-bea971cc7bac">{coach.bio}</Text>
          </View>
        </Card>
      ) : null}

      <Card data-node-id="0d1e2a74-9ba7-11f1-b43e-bea971cc7bac">
        <View className='flex flex-col gap-3' data-node-id="0d1e3492-9ba7-11f1-b43e-bea971cc7bac">
          <Text className='text-base font-semibold' data-node-id="0d1e3ec4-9ba7-11f1-b43e-bea971cc7bac">可约时段</Text>
          {coach.available_slots.length === 0 ? (
            <EmptyState title='暂无可约时段'  data-node-id="0d1e3f96-9ba7-11f1-b43e-bea971cc7bac"/>
          ) : (
            <View className='grid grid-cols-2 gap-2' data-node-id="0d1e40c2-9ba7-11f1-b43e-bea971cc7bac">
              {coach.available_slots.map((s, i) => {
                const key = `${s.day} ${s.time}`
                const active = selectedSlot === key
                return (
                  <View
                    key={i}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-xl border px-3 py-3',
                      active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground',
                    )}
                    onClick={() => setSelectedSlot(key)}
                   data-node-id="0d1e27d6-9ba7-11f1-b43e-bea971cc7bac">
                    <Text className='text-xs' data-node-id="0d1e419e-9ba7-11f1-b43e-bea971cc7bac">{s.day}</Text>
                    <Text className='mt-1 text-sm font-semibold' data-node-id="0d1e440a-9ba7-11f1-b43e-bea971cc7bac">{s.time}</Text>
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </Card>

      <Card data-node-id="0d1e3a82-9ba7-11f1-b43e-bea971cc7bac">
        <View className='flex flex-col gap-3' data-node-id="0d1e356e-9ba7-11f1-b43e-bea971cc7bac">
          <Text className='text-base font-semibold' data-node-id="0d1e4270-9ba7-11f1-b43e-bea971cc7bac">备注（选填）</Text>
          <Textarea
            className='rounded-xl border border-border bg-card p-3 text-sm min-h-20'
            placeholder='如：训练目标 / 身体状况 / 特殊需求'
            value={note}
            onInput={(e) => setNote(e.detail.value)}
            maxlength={200}
           data-node-id="0d1e44f0-9ba7-11f1-b43e-bea971cc7bac"/>
        </View>
      </Card>

      <View className='flex flex-row gap-2' data-node-id="0d1e3d20-9ba7-11f1-b43e-bea971cc7bac">
        <Button variant='secondary' className='flex-1' onClick={() => Taro.navigateBack()} data-node-id="0d1e305a-9ba7-11f1-b43e-bea971cc7bac">
          取消
        </Button>
        <Button variant='primary' className='flex-1' loading={submitting} onClick={submit} data-node-id="0d1e3208-9ba7-11f1-b43e-bea971cc7bac">
          提交私教预约
        </Button>
      </View>

      <View className='px-1' data-node-id="0d1e32e4-9ba7-11f1-b43e-bea971cc7bac">
        <Text className='text-xs text-muted-foreground' data-node-id="0d1e2b46-9ba7-11f1-b43e-bea971cc7bac">
          提交后将进入「待教练确认」状态，教练可在管理端确认或拒绝。
        </Text>
      </View>
    </AppShell>
  )
}
