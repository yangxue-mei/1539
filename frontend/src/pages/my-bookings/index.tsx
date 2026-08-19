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
      action={<View className='text-xs text-primary' onClick={() => Taro.navigateBack()} data-node-id="0d2090ca-9ba7-11f1-b43e-bea971cc7bac">返回</View>}
     data-node-id="0d20a2ae-9ba7-11f1-b43e-bea971cc7bac">
      {loading ? (
        <View className='flex flex-col items-center py-10' data-node-id="0d20a394-9ba7-11f1-b43e-bea971cc7bac">
          <Text className='text-sm text-muted-foreground' data-node-id="0d20a768-9ba7-11f1-b43e-bea971cc7bac">加载中…</Text>
        </View>
      ) : (
        <View className='flex flex-col gap-5' data-node-id="0d208d5a-9ba7-11f1-b43e-bea971cc7bac">
          <View className='flex flex-col gap-2' data-node-id="0d2091ba-9ba7-11f1-b43e-bea971cc7bac">
            <Text className='text-sm font-semibold' data-node-id="0d20928c-9ba7-11f1-b43e-bea971cc7bac">私教预约</Text>
            {privateBookings.length === 0 ? (
              <EmptyState title='暂无私教预约' description='去私教教练页看看吧'  data-node-id="0d209372-9ba7-11f1-b43e-bea971cc7bac"/>
            ) : (
              <View className='flex flex-col gap-3' data-node-id="0d2086e8-9ba7-11f1-b43e-bea971cc7bac">
                {privateBookings.map((p) => {
                  const c = p.coach_id ? coachMap[p.coach_id] : null
                  return (
                    <Card key={p.id} className='flex flex-col gap-2 p-4' data-node-id="0d209458-9ba7-11f1-b43e-bea971cc7bac">
                      <View className='flex flex-row items-start justify-between gap-3' data-node-id="0d209700-9ba7-11f1-b43e-bea971cc7bac">
                        <View className='flex flex-1 flex-col gap-1' data-node-id="0d208922-9ba7-11f1-b43e-bea971cc7bac">
                          <Text className='text-base font-semibold' data-node-id="0d20a484-9ba7-11f1-b43e-bea971cc7bac">{c?.name || '私教课'}</Text>
                          <Text className='text-xs text-muted-foreground' data-node-id="0d20a862-9ba7-11f1-b43e-bea971cc7bac">
                            {c?.specialty || ''} · {p.slot}
                          </Text>
                          {p.note ? <Text className='text-xs text-muted-foreground' data-node-id="0d209534-9ba7-11f1-b43e-bea971cc7bac">备注：{p.note}</Text> : null}
                        </View>
                        <Badge className={STATUS_STYLE[p.status] || ''} data-node-id="0d208b66-9ba7-11f1-b43e-bea971cc7bac">
                          {p.status === 'pending' ? '待确认' : p.status === 'confirmed' ? '已确认' : '已取消'}
                        </Badge>
                      </View>
                    </Card>
                  )
                })}
              </View>
            )}
          </View>

          <View className='flex flex-col gap-2' data-node-id="0d2097e6-9ba7-11f1-b43e-bea971cc7bac">
            <Text className='text-sm font-semibold' data-node-id="0d208828-9ba7-11f1-b43e-bea971cc7bac">进行中的团课预约</Text>
            {activeGroup.length === 0 ? (
              <EmptyState title='暂无进行中的团课' description='去课程表预约一节吧'  data-node-id="0d209a8e-9ba7-11f1-b43e-bea971cc7bac"/>
            ) : (
              <View className='flex flex-col gap-3' data-node-id="0d208a76-9ba7-11f1-b43e-bea971cc7bac">
                {activeGroup.map((b) => {
                  const c = courseMap[b.course_id]
                  if (!c) return null
                  const canCancel = canCancelBefore2h(c)
                  return (
                    <Card key={b.id} className='flex flex-col gap-2 p-4' data-node-id="0d209b74-9ba7-11f1-b43e-bea971cc7bac">
                      <View className='flex flex-row items-start justify-between gap-3' data-node-id="0d20961a-9ba7-11f1-b43e-bea971cc7bac">
                        <View className='flex flex-1 flex-col gap-1' data-node-id="0d20a592-9ba7-11f1-b43e-bea971cc7bac">
                          <Text className='text-base font-semibold' data-node-id="0d209c50-9ba7-11f1-b43e-bea971cc7bac">{c.name}</Text>
                          <Text className='text-xs text-muted-foreground' data-node-id="0d20a0b0-9ba7-11f1-b43e-bea971cc7bac">
                            {c.day_of_week} {c.start_time}–{c.end_time} · {c.location}
                          </Text>
                          <View className='mt-1 flex flex-row gap-2' data-node-id="0d20a93e-9ba7-11f1-b43e-bea971cc7bac">
                            <Badge data-node-id="0d20aa24-9ba7-11f1-b43e-bea971cc7bac">{c.difficulty}</Badge>
                          </View>
                        </View>
                        <Badge className={STATUS_STYLE[b.status]} data-node-id="0d20ab0a-9ba7-11f1-b43e-bea971cc7bac">已预约</Badge>
                      </View>
                      <Button
                        variant='danger'
                        size='md'
                        loading={busy === b.id}
                        disabled={!canCancel}
                        onClick={() => cancel(b)}
                       data-node-id="0d2098cc-9ba7-11f1-b43e-bea971cc7bac">
                        {canCancel ? '取消预约' : '开课前 2h 不可取消'}
                      </Button>
                    </Card>
                  )
                })}
              </View>
            )}
          </View>

          {historyGroup.length > 0 ? (
            <View className='flex flex-col gap-2' data-node-id="0d209d2c-9ba7-11f1-b43e-bea971cc7bac">
              <Text className='text-sm font-semibold' data-node-id="0d208c56-9ba7-11f1-b43e-bea971cc7bac">已取消记录</Text>
              <View className='flex flex-col gap-3' data-node-id="0d2099b2-9ba7-11f1-b43e-bea971cc7bac">
                {historyGroup.map((b) => {
                  const c = courseMap[b.course_id]
                  return (
                    <Card key={b.id} className='flex flex-row items-center justify-between p-4 opacity-70' data-node-id="0d20a682-9ba7-11f1-b43e-bea971cc7bac">
                      <View className='flex flex-col' data-node-id="0d209e08-9ba7-11f1-b43e-bea971cc7bac">
                        <Text className='text-sm font-medium' data-node-id="0d209eee-9ba7-11f1-b43e-bea971cc7bac">{c?.name || '已删除课程'}</Text>
                        {c ? <Text className='text-xs text-muted-foreground' data-node-id="0d209fca-9ba7-11f1-b43e-bea971cc7bac">{c.day_of_week} {c.start_time}</Text> : null}
                      </View>
                      <Badge className={STATUS_STYLE[b.status]} data-node-id="0d20a1a0-9ba7-11f1-b43e-bea971cc7bac">已取消</Badge>
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
