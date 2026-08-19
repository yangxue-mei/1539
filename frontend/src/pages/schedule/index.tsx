import { useEffect, useState, useMemo, useCallback } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { AppShell } from '../../components/app-shell'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { EmptyState } from '../../components/ui/empty-state'
import { cn } from '../../lib/cn'
import { getLocalMember } from '../../lib/member'
import { WEEK_DAYS, getWeekDates, isToday } from '../../lib/week'
import type { Course, CourseWithRemaining } from '../../lib/types'
import {
  listCourses,
  listCoaches,
  computeCourseRemaining,
  createBooking,
  cancelBooking,
} from '../../services/supabase'
import './index.css'

const DIFFICULTY_STYLE: Record<string, string> = {
  初级: 'bg-emerald-100 text-emerald-700',
  中级: 'bg-amber-100 text-amber-700',
  高级: 'bg-rose-100 text-rose-700',
}

export default function Schedule() {
  const [courses, setCourses] = useState<Course[]>([])
  const [coachMap, setCoachMap] = useState<Record<string, string>>({})
  const [activeDay, setActiveDay] = useState(0)
  const [remainingMap, setRemainingMap] = useState<Record<string, CourseWithRemaining>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const member = getLocalMember()

  const week = useMemo(() => getWeekDates(), [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [courseRes, coachRes] = await Promise.all([listCourses(), listCoaches()])
    if (courseRes.error || !courseRes.data) {
      Taro.showToast({ title: courseRes.error || '加载失败', icon: 'none' })
      setLoading(false)
      return
    }
    const coaches = coachRes.data || []
    const map: Record<string, string> = {}
    coaches.forEach((c) => (map[c.id] = c.name))
    setCoachMap(map)
    const enriched = courseRes.data.map((c) => ({ ...c, coach_name: c.coach_id ? map[c.coach_id] : null }))
    setCourses(enriched)

    // 计算每节课剩余名额 + 是否已预约
    const remaining: Record<string, CourseWithRemaining> = {}
    await Promise.all(
      enriched.map(async (c) => {
        const r = await computeCourseRemaining(c, member.id)
        remaining[c.id] = r
        setRemainingMap({ ...remaining })
      }),
    )
    setLoading(false)
  }, [member.id])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useDidShow(() => {
    loadAll()
  })

  const dayCourses = useMemo(() => {
    const dayName = WEEK_DAYS[activeDay]
    return courses.filter((c) => c.day_of_week === dayName)
  }, [courses, activeDay])

  async function book(course: Course) {
    if (busy) return
    const r = remainingMap[course.id]
    if (r && r.remaining <= 0 && r.my_booking_status !== 'booked') {
      Taro.showToast({ title: '名额已满', icon: 'none' })
      return
    }
    setBusy(course.id)
    const res = await createBooking(course.id, member)
    if (res.error) {
      Taro.showToast({ title: res.error, icon: 'none' })
    } else {
      Taro.showToast({ title: '预约成功', icon: 'success' })
      const rem = await computeCourseRemaining(course, member.id)
      setRemainingMap((prev) => ({ ...prev, [course.id]: rem }))
    }
    setBusy(null)
  }

  async function cancel(course: Course) {
    if (busy) return
    setBusy(course.id)
    const res = await cancelBooking(course.id, member.id)
    if (res.error) {
      Taro.showToast({ title: res.error, icon: 'none' })
    } else {
      Taro.showToast({ title: '已取消', icon: 'success' })
      const rem = await computeCourseRemaining(course, member.id)
      setRemainingMap((prev) => ({ ...prev, [course.id]: rem }))
    }
    setBusy(null)
  }

  return (
    <AppShell
      eyebrow='会员端'
      title='本周课程表'
      description='一键预约 / 取消，开课前 2 小时不可取消'
      action={
        <Button size='md' variant='secondary' onClick={() => Taro.navigateBack()} className='min-h-9 px-3 text-xs' data-node-id="0d23fa9e-9ba7-11f1-b43e-bea971cc7bac">
          返回
        </Button>
      }
     data-node-id="0d2403b8-9ba7-11f1-b43e-bea971cc7bac">
      <ScrollView scrollX className='whitespace-nowrap week-tabs' enhanced showScrollbar={false} data-node-id="0d23f9b8-9ba7-11f1-b43e-bea971cc7bac">
        <View className='flex flex-row gap-2 px-1 pb-1' data-node-id="0d23f8be-9ba7-11f1-b43e-bea971cc7bac">
          {week.map((d, i) => {
            const active = i === activeDay
            const today = isToday(i)
            return (
              <View
                key={d.day}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl px-4 py-2 min-w-16',
                  active ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border border-border',
                )}
                onClick={() => setActiveDay(i)}
               data-node-id="0d240840-9ba7-11f1-b43e-bea971cc7bac">
                <Text className='text-xs' data-node-id="0d240494-9ba7-11f1-b43e-bea971cc7bac">{d.day}</Text>
                <Text className='mt-0.5 text-sm font-semibold' data-node-id="0d240750-9ba7-11f1-b43e-bea971cc7bac">{d.label}</Text>
                {today ? <Text className='text-[10px] opacity-80' data-node-id="0d240926-9ba7-11f1-b43e-bea971cc7bac">今天</Text> : null}
              </View>
            )
          })}
        </View>
      </ScrollView>

      {loading ? (
        <View className='flex flex-col items-center py-10' data-node-id="0d23fb7a-9ba7-11f1-b43e-bea971cc7bac">
          <Text className='text-sm text-muted-foreground' data-node-id="0d2402a0-9ba7-11f1-b43e-bea971cc7bac">加载中…</Text>
        </View>
      ) : dayCourses.length === 0 ? (
        <EmptyState title='本周这天暂无团课' description='看看其他日期或联系管理员'  data-node-id="0d23fc60-9ba7-11f1-b43e-bea971cc7bac"/>
      ) : (
        <View className='flex flex-col gap-3' data-node-id="0d23f364-9ba7-11f1-b43e-bea971cc7bac">
          {dayCourses.map((c) => {
            const r = remainingMap[c.id]
            const remaining = r?.remaining ?? c.max_capacity
            const mine = r?.my_booking_status ?? null
            const full = remaining <= 0 && mine !== 'booked'
            return (
              <Card key={c.id} className='flex flex-col gap-3 p-4' data-node-id="0d240584-9ba7-11f1-b43e-bea971cc7bac">
                <View className='flex flex-row items-start justify-between gap-3' data-node-id="0d23ff08-9ba7-11f1-b43e-bea971cc7bac">
                  <View className='flex flex-1 flex-col gap-1' data-node-id="0d23fd50-9ba7-11f1-b43e-bea971cc7bac">
                    <Text className='text-base font-semibold' data-node-id="0d23fe2c-9ba7-11f1-b43e-bea971cc7bac">{c.name}</Text>
                    <Text className='text-xs text-muted-foreground' data-node-id="0d23ffe4-9ba7-11f1-b43e-bea971cc7bac">
                      {c.start_time}–{c.end_time} · {c.location}
                    </Text>
                    <View className='mt-1 flex flex-row flex-wrap gap-2' data-node-id="0d23f6de-9ba7-11f1-b43e-bea971cc7bac">
                      <Badge data-node-id="0d240a0c-9ba7-11f1-b43e-bea971cc7bac">{c.coach_name || '待定教练'}</Badge>
                      <Badge className={DIFFICULTY_STYLE[c.difficulty] || ''} data-node-id="0d240bd8-9ba7-11f1-b43e-bea971cc7bac">{c.difficulty}</Badge>
                    </View>
                  </View>
                  <View className='flex flex-col items-end' data-node-id="0d2400ca-9ba7-11f1-b43e-bea971cc7bac">
                    <Text className={cn('text-2xl font-bold', full ? 'text-muted-foreground' : 'text-primary')} data-node-id="0d23f4d6-9ba7-11f1-b43e-bea971cc7bac">
                      {remaining}
                    </Text>
                    <Text className='text-[10px] text-muted-foreground' data-node-id="0d23f7c4-9ba7-11f1-b43e-bea971cc7bac">/ {c.max_capacity} 剩余</Text>
                  </View>
                </View>
                <View className='flex flex-row gap-2' data-node-id="0d2401ba-9ba7-11f1-b43e-bea971cc7bac">
                  {mine === 'booked' ? (
                    <Button
                      variant='danger'
                      size='md'
                      className='flex-1'
                      loading={busy === c.id}
                      onClick={() => cancel(c)}
                     data-node-id="0d240674-9ba7-11f1-b43e-bea971cc7bac">
                      取消预约
                    </Button>
                  ) : full ? (
                    <Button variant='secondary' size='md' className='flex-1' disabled data-node-id="0d240af2-9ba7-11f1-b43e-bea971cc7bac">
                      已满员
                    </Button>
                  ) : (
                    <Button
                      variant='primary'
                      size='md'
                      className='flex-1'
                      loading={busy === c.id}
                      onClick={() => book(c)}
                     data-node-id="0d23f5e4-9ba7-11f1-b43e-bea971cc7bac">
                      一键预约
                    </Button>
                  )}
                </View>
              </Card>
            )
          })}
        </View>
      )}
    </AppShell>
  )
}
