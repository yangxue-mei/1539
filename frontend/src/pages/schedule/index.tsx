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
        <Button size='md' variant='secondary' onClick={() => Taro.navigateBack()} className='min-h-9 px-3 text-xs'>
          返回
        </Button>
      }
    >
      <ScrollView scrollX className='whitespace-nowrap week-tabs' enhanced showScrollbar={false}>
        <View className='flex flex-row gap-2 px-1 pb-1'>
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
              >
                <Text className='text-xs'>{d.day}</Text>
                <Text className='mt-0.5 text-sm font-semibold'>{d.label}</Text>
                {today ? <Text className='text-[10px] opacity-80'>今天</Text> : null}
              </View>
            )
          })}
        </View>
      </ScrollView>

      {loading ? (
        <View className='flex flex-col items-center py-10'>
          <Text className='text-sm text-muted-foreground'>加载中…</Text>
        </View>
      ) : dayCourses.length === 0 ? (
        <EmptyState title='本周这天暂无团课' description='看看其他日期或联系管理员' />
      ) : (
        <View className='flex flex-col gap-3'>
          {dayCourses.map((c) => {
            const r = remainingMap[c.id]
            const remaining = r?.remaining ?? c.max_capacity
            const mine = r?.my_booking_status ?? null
            const full = remaining <= 0 && mine !== 'booked'
            return (
              <Card key={c.id} className='flex flex-col gap-3 p-4'>
                <View className='flex flex-row items-start justify-between gap-3'>
                  <View className='flex flex-1 flex-col gap-1'>
                    <Text className='text-base font-semibold'>{c.name}</Text>
                    <Text className='text-xs text-muted-foreground'>
                      {c.start_time}–{c.end_time} · {c.location}
                    </Text>
                    <View className='mt-1 flex flex-row flex-wrap gap-2'>
                      <Badge>{c.coach_name || '待定教练'}</Badge>
                      <Badge className={DIFFICULTY_STYLE[c.difficulty] || ''}>{c.difficulty}</Badge>
                    </View>
                  </View>
                  <View className='flex flex-col items-end'>
                    <Text className={cn('text-2xl font-bold', full ? 'text-muted-foreground' : 'text-primary')}>
                      {remaining}
                    </Text>
                    <Text className='text-[10px] text-muted-foreground'>/ {c.max_capacity} 剩余</Text>
                  </View>
                </View>
                <View className='flex flex-row gap-2'>
                  {mine === 'booked' ? (
                    <Button
                      variant='danger'
                      size='md'
                      className='flex-1'
                      loading={busy === c.id}
                      onClick={() => cancel(c)}
                    >
                      取消预约
                    </Button>
                  ) : full ? (
                    <Button variant='secondary' size='md' className='flex-1' disabled>
                      已满员
                    </Button>
                  ) : (
                    <Button
                      variant='primary'
                      size='md'
                      className='flex-1'
                      loading={busy === c.id}
                      onClick={() => book(c)}
                    >
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
