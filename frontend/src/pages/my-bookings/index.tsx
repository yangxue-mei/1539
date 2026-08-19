import { useEffect, useState, useCallback } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { AppShell } from '../../components/app-shell'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { EmptyState } from '../../components/ui/empty-state'
import { getLocalMember } from '../../lib/member'
import { canCancelBefore2h } from '../../lib/week'
import {
  listBookingsByMember,
  listPrivateBookingsByMember,
  listCourses,
  listCoaches,
  cancelBooking,
} from '../../services/supabase'
import type { Course, Coach, Booking, PrivateBooking } from '../../lib/types'
import './index.css'

const STATUS_STYLE: Record<string, string> = {
  booked: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-muted text-muted-foreground',
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [privateBookings, setPrivateBookings] = useState<PrivateBooking[]>([])
  const [courseMap, setCourseMap] = useState<Record<string, Course>>({})
  const [coachMap, setCoachMap] = useState<Record<string, Coach>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const member = getLocalMember()

  const load = useCallback(async () => {
    setLoading(true)
    const [bRes, pRes, cRes, coRes] = await Promise.all([
      listBookingsByMember(member.id),
      listPrivateBookingsByMember(member.id),
      listCourses(),
      listCoaches(),
    ])
    const cMap: Record<string, Course> = {}
    ;(cRes.data || []).forEach((c) => (cMap[c.id] = c))
    setCourseMap(cMap)
    const coMap: Record<string, Coach> = {}
    ;(coRes.data || []).forEach((c) => (coMap[c.id] = c))
    setCoachMap(coMap)
    setBookings(bRes.data || [])
    setPrivateBookings(pRes.data || [])
    setLoading(false)
  }, [member.id])

  useEffect(() => {
    load()
  }, [load])

  useDidShow(() => {
    load()
  })

  async function cancel(b: Booking) {
    const course = courseMap[b.course_id]
    if (!course) return
    if (!canCancelBefore2h(course)) {
      Taro.showModal({
        title: '取消受限',
        content: '开课前 2 小时内不可免费取消，是否联系管理员？',
        showCancel: true,
      })
      return
    }
    setBusy(b.id)
    const r = await cancelBooking(b.course_id, b.member_id)
    setBusy(null)
    if (r.error) {
      Taro.showToast({ title: r.error, icon: 'none' })
      return
    }
    Taro.showToast({ title: '已取消', icon: 'success' })
    setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: 'cancelled' } : x)))
  }

  const activeGroup = bookings.filter((b) => b.status === 'booked')
  const historyGroup = bookings.filter((b) => b.status === 'cancelled')

  return (
    <AppShell
      eyebrow='会员端'
      title='我的预约'
      description='团课预约 / 私教预约记录'
      action={<View className='text-xs text-primary' onClick={() => Taro.navigateBack()}>返回</View>}
    >
      {loading ? (
        <View className='flex flex-col items-center py-10'>
          <Text className='text-sm text-muted-foreground'>加载中…</Text>
        </View>
      ) : (
        <View className='flex flex-col gap-5'>
          <View className='flex flex-col gap-2'>
            <Text className='text-sm font-semibold'>私教预约</Text>
            {privateBookings.length === 0 ? (
              <EmptyState title='暂无私教预约' description='去私教教练页看看吧' />
            ) : (
              <View className='flex flex-col gap-3'>
                {privateBookings.map((p) => {
                  const c = p.coach_id ? coachMap[p.coach_id] : null
                  return (
                    <Card key={p.id} className='flex flex-col gap-2 p-4'>
                      <View className='flex flex-row items-start justify-between gap-3'>
                        <View className='flex flex-1 flex-col gap-1'>
                          <Text className='text-base font-semibold'>{c?.name || '私教课'}</Text>
                          <Text className='text-xs text-muted-foreground'>
                            {c?.specialty || ''} · {p.slot}
                          </Text>
                          {p.note ? <Text className='text-xs text-muted-foreground'>备注：{p.note}</Text> : null}
                        </View>
                        <Badge className={STATUS_STYLE[p.status] || ''}>
                          {p.status === 'pending' ? '待确认' : p.status === 'confirmed' ? '已确认' : '已取消'}
                        </Badge>
                      </View>
                    </Card>
                  )
                })}
              </View>
            )}
          </View>

          <View className='flex flex-col gap-2'>
            <Text className='text-sm font-semibold'>进行中的团课预约</Text>
            {activeGroup.length === 0 ? (
              <EmptyState title='暂无进行中的团课' description='去课程表预约一节吧' />
            ) : (
              <View className='flex flex-col gap-3'>
                {activeGroup.map((b) => {
                  const c = courseMap[b.course_id]
                  if (!c) return null
                  const canCancel = canCancelBefore2h(c)
                  return (
                    <Card key={b.id} className='flex flex-col gap-2 p-4'>
                      <View className='flex flex-row items-start justify-between gap-3'>
                        <View className='flex flex-1 flex-col gap-1'>
                          <Text className='text-base font-semibold'>{c.name}</Text>
                          <Text className='text-xs text-muted-foreground'>
                            {c.day_of_week} {c.start_time}–{c.end_time} · {c.location}
                          </Text>
                          <View className='mt-1 flex flex-row gap-2'>
                            <Badge>{c.difficulty}</Badge>
                          </View>
                        </View>
                        <Badge className={STATUS_STYLE[b.status]}>已预约</Badge>
                      </View>
                      <Button
                        variant='danger'
                        size='md'
                        loading={busy === b.id}
                        disabled={!canCancel}
                        onClick={() => cancel(b)}
                      >
                        {canCancel ? '取消预约' : '开课前 2h 不可取消'}
                      </Button>
                    </Card>
                  )
                })}
              </View>
            )}
          </View>

          {historyGroup.length > 0 ? (
            <View className='flex flex-col gap-2'>
              <Text className='text-sm font-semibold'>已取消记录</Text>
              <View className='flex flex-col gap-3'>
                {historyGroup.map((b) => {
                  const c = courseMap[b.course_id]
                  return (
                    <Card key={b.id} className='flex flex-row items-center justify-between p-4 opacity-70'>
                      <View className='flex flex-col'>
                        <Text className='text-sm font-medium'>{c?.name || '已删除课程'}</Text>
                        {c ? <Text className='text-xs text-muted-foreground'>{c.day_of_week} {c.start_time}</Text> : null}
                      </View>
                      <Badge className={STATUS_STYLE[b.status]}>已取消</Badge>
                    </Card>
                  )
                })}
              </View>
            </View>
          ) : null}
        </View>
      )}
    </AppShell>
  )
}
