import { useEffect, useState, useCallback } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components'
import { AppShell } from '../../components/app-shell'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { EmptyState } from '../../components/ui/empty-state'
import { cn } from '../../lib/cn'
import { getLocalMember } from '../../lib/member'
import { WEEK_DAYS } from '../../lib/week'
import {
  listCourses,
  listCoaches,
  createCourse,
  createCoach,
  listBookingsByCourse,
} from '../../services/supabase'
import type { Course, Coach, Booking } from '../../lib/types'
import './index.css'

const TABS = [
  { key: 'publish', label: '发布课程' },
  { key: 'courses', label: '课程名额' },
  { key: 'roster', label: '报名名单' },
  { key: 'coach', label: '教练管理' },
] as const

const DIFFICULTY = ['初级', '中级', '高级']

export default function Admin() {
  const member = getLocalMember()
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('publish')

  const [courses, setCourses] = useState<Course[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  // 发布表单
  const [form, setForm] = useState({
    name: '',
    coach_id: '',
    day_of_week: '周一',
    start_time: '09:00',
    end_time: '10:00',
    location: '团课房 A',
    max_capacity: '20',
    difficulty: '初级',
  })

  // 教练表单
  const [coachForm, setCoachForm] = useState({
    name: '',
    specialty: '',
    bio: '',
    slots: '周一 10:00-11:00, 周三 20:00-21:00',
    avatar: '🏋️',
  })

  // 报名名单
  const [rosterCourseId, setRosterCourseId] = useState<string>('')
  const [roster, setRoster] = useState<Booking[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const [cRes, coRes] = await Promise.all([listCourses(), listCoaches()])
    const cMap: Record<string, string> = {}
    ;(coRes.data || []).forEach((c) => (cMap[c.id] = c.name))
    setCourses((cRes.data || []).map((c) => ({ ...c, coach_name: c.coach_id ? cMap[c.coach_id] : null })))
    setCoaches(coRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useDidShow(() => {
    load()
  })

  async function publish() {
    if (!form.name.trim() || !form.start_time || !form.end_time) {
      Taro.showToast({ title: '请填写完整', icon: 'none' })
      return
    }
    setBusy(true)
    const res = await createCourse({
      name: form.name.trim(),
      coach_id: form.coach_id || null,
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location.trim(),
      max_capacity: Math.max(1, parseInt(form.max_capacity || '20', 10)),
      difficulty: form.difficulty,
    })
    setBusy(false)
    if (res.error) {
      Taro.showToast({ title: res.error, icon: 'none' })
      return
    }
    Taro.showToast({ title: '已发布', icon: 'success' })
    setForm({ ...form, name: '' })
    load()
    setTab('courses')
  }

  async function publishCoach() {
    if (!coachForm.name.trim() || !coachForm.specialty.trim()) {
      Taro.showToast({ title: '请填写教练名和擅长方向', icon: 'none' })
      return
    }
    const slots = coachForm.slots
      .split(/[,，\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        // 解析 "周一 10:00-11:00" → { day, time }
        const m = s.match(/^(周[一二三四五六日])\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/)
        if (m) return { day: m[1], time: `${m[2]}-${m[3]}` }
        return { day: s, time: '' }
      })
      .filter((s) => s.day)
    setBusy(true)
    const res = await createCoach({
      name: coachForm.name.trim(),
      specialty: coachForm.specialty.trim(),
      bio: coachForm.bio.trim() || null,
      available_slots: slots,
      avatar: coachForm.avatar || '🏋️',
    })
    setBusy(false)
    if (res.error) {
      Taro.showToast({ title: res.error, icon: 'none' })
      return
    }
    Taro.showToast({ title: '教练已添加', icon: 'success' })
    setCoachForm({ name: '', specialty: '', bio: '', slots: '', avatar: '🏋️' })
    load()
  }

  async function loadRoster(courseId: string) {
    setRosterCourseId(courseId)
    if (!courseId) {
      setRoster([])
      return
    }
    const r = await listBookingsByCourse(courseId)
    setRoster(r.data || [])
  }

  // 非 admin 也允许查看但提示
  if (member.role !== 'admin') {
    return (
      <AppShell eyebrow='管理端' title='权限不足' data-node-id="0d1ceca4-9ba7-11f1-b43e-bea971cc7bac">
        <EmptyState
          title='仅管理员可访问'
          description='请在首页切换为管理员身份后重试'
          action={
            <Button onClick={() => Taro.navigateBack()} variant='primary' data-node-id="0d1d65f8-9ba7-11f1-b43e-bea971cc7bac">
              返回首页
            </Button>
          }
         data-node-id="0d1ce0ce-9ba7-11f1-b43e-bea971cc7bac"/>
      </AppShell>
    )
  }

  return (
    <AppShell
      eyebrow='管理端'
      title='健身房管理'
      description='发布课程 · 设置名额 · 查看报名名单'
      action={<View className='text-xs text-primary' onClick={() => Taro.navigateBack()} data-node-id="0d1d7bf6-9ba7-11f1-b43e-bea971cc7bac">返回</View>}
     data-node-id="0d1cd57a-9ba7-11f1-b43e-bea971cc7bac">
      <ScrollView scrollX className='whitespace-nowrap admin-tabs' enhanced showScrollbar={false} data-node-id="0d1d73a4-9ba7-11f1-b43e-bea971cc7bac">
        <View className='flex flex-row gap-2 px-1 pb-1' data-node-id="0d1d0b08-9ba7-11f1-b43e-bea971cc7bac">
          {TABS.map((t) => {
            const active = tab === t.key
            return (
              <View
                key={t.key}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm',
                  active ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border border-border',
                )}
                onClick={() => setTab(t.key)}
               data-node-id="0d1d063a-9ba7-11f1-b43e-bea971cc7bac">
                {t.label}
              </View>
            )
          })}
        </View>
      </ScrollView>

      {loading ? (
        <View className='flex flex-col items-center py-10' data-node-id="0d1ce524-9ba7-11f1-b43e-bea971cc7bac">
          <Text className='text-sm text-muted-foreground' data-node-id="0d1d757a-9ba7-11f1-b43e-bea971cc7bac">加载中…</Text>
        </View>
      ) : tab === 'publish' ? (
        <Card data-node-id="0d1d014e-9ba7-11f1-b43e-bea971cc7bac">
          <View className='flex flex-col gap-3' data-node-id="0d1d045a-9ba7-11f1-b43e-bea971cc7bac">
            <Text className='text-base font-semibold' data-node-id="0d1ced8a-9ba7-11f1-b43e-bea971cc7bac">发布团课</Text>
            <Field label='课程名称' data-node-id="0d1cf03c-9ba7-11f1-b43e-bea971cc7bac">
              <Input
                className='rounded-xl border border-border bg-card px-3 py-2 text-sm'
                placeholder='如：晨间燃脂 HIIT'
                value={form.name}
                onInput={(e) => setForm({ ...form, name: e.detail.value })}
               data-node-id="0d1cf302-9ba7-11f1-b43e-bea971cc7bac"/>
            </Field>
            <Field label='授课教练' data-node-id="0d1cdb10-9ba7-11f1-b43e-bea971cc7bac">
              <View className='flex flex-row flex-wrap gap-2' data-node-id="0d1d0bee-9ba7-11f1-b43e-bea971cc7bac">
                {coaches.length === 0 ? (
                  <Text className='text-xs text-muted-foreground' data-node-id="0d1cde9e-9ba7-11f1-b43e-bea971cc7bac">尚未添加教练，可留空</Text>
                ) : (
                  coaches.map((c) => {
                    const active = form.coach_id === c.id
                    return (
                      <View
                        key={c.id}
                        className={cn('rounded-xl border px-3 py-1 text-xs', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}
                        onClick={() => setForm({ ...form, coach_id: active ? '' : c.id })}
                       data-node-id="0d1d0a22-9ba7-11f1-b43e-bea971cc7bac">
                        {c.name}
                      </View>
                    )
                  })
                )}
              </View>
            </Field>
            <Field label='星期' data-node-id="0d1d6e18-9ba7-11f1-b43e-bea971cc7bac">
              <View className='flex flex-row flex-wrap gap-2' data-node-id="0d1d0054-9ba7-11f1-b43e-bea971cc7bac">
                {WEEK_DAYS.map((d) => {
                  const active = form.day_of_week === d
                  return (
                    <View
                      key={d}
                      className={cn('rounded-xl border px-3 py-1 text-xs', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}
                      onClick={() => setForm({ ...form, day_of_week: d })}
                     data-node-id="0d1d7494-9ba7-11f1-b43e-bea971cc7bac">
                      {d}
                    </View>
                  )
                })}
              </View>
            </Field>
            <View className='flex flex-row gap-3' data-node-id="0d1d71ce-9ba7-11f1-b43e-bea971cc7bac">
              <Field label='开始时间' flex data-node-id="0d1d0766-9ba7-11f1-b43e-bea971cc7bac">
                <Input
                  className='rounded-xl border border-border bg-card px-3 py-2 text-sm'
                  placeholder='07:00'
                  value={form.start_time}
                  onInput={(e) => setForm({ ...form, start_time: e.detail.value })}
                 data-node-id="0d1d7868-9ba7-11f1-b43e-bea971cc7bac"/>
              </Field>
              <Field label='结束时间' flex data-node-id="0d1d093c-9ba7-11f1-b43e-bea971cc7bac">
                <Input
                  className='rounded-xl border border-border bg-card px-3 py-2 text-sm'
                  placeholder='08:00'
                  value={form.end_time}
                  onInput={(e) => setForm({ ...form, end_time: e.detail.value })}
                 data-node-id="0d1d6b66-9ba7-11f1-b43e-bea971cc7bac"/>
              </Field>
            </View>
            <Field label='地点 / 教室' data-node-id="0d1cfcd0-9ba7-11f1-b43e-bea971cc7bac">
              <Input
                className='rounded-xl border border-border bg-card px-3 py-2 text-sm'
                placeholder='如：团课房 A'
                value={form.location}
                onInput={(e) => setForm({ ...form, location: e.detail.value })}
               data-node-id="0d1d7d18-9ba7-11f1-b43e-bea971cc7bac"/>
            </Field>
            <View className='flex flex-row gap-3' data-node-id="0d1cfe92-9ba7-11f1-b43e-bea971cc7bac">
              <Field label='最大名额' flex data-node-id="0d1cee70-9ba7-11f1-b43e-bea971cc7bac">
                <Input
                  type='number'
                  className='rounded-xl border border-border bg-card px-3 py-2 text-sm'
                  value={form.max_capacity}
                  onInput={(e) => setForm({ ...form, max_capacity: e.detail.value })}
                 data-node-id="0d1cff6e-9ba7-11f1-b43e-bea971cc7bac"/>
              </Field>
              <Field label='难度' flex data-node-id="0d1cf12c-9ba7-11f1-b43e-bea971cc7bac">
                <View className='flex flex-row gap-2' data-node-id="0d1cf3de-9ba7-11f1-b43e-bea971cc7bac">
                  {DIFFICULTY.map((d) => {
                    const active = form.difficulty === d
                    return (
                      <View
                        key={d}
                        className={cn('rounded-xl border px-3 py-1 text-xs', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}
                        onClick={() => setForm({ ...form, difficulty: d })}
                       data-node-id="0d1cfb0e-9ba7-11f1-b43e-bea971cc7bac">
                        {d}
                      </View>
                    )
                  })}
                </View>
              </Field>
            </View>
            <Button variant='primary' loading={busy} onClick={publish} data-node-id="0d1cf69a-9ba7-11f1-b43e-bea971cc7bac">
              发布课程
            </Button>
          </View>
        </Card>
      ) : tab === 'courses' ? (
        courses.length === 0 ? (
          <EmptyState title='暂无课程' description='去「发布课程」添加一节吧'  data-node-id="0d1d66e8-9ba7-11f1-b43e-bea971cc7bac"/>
        ) : (
          <View className='flex flex-col gap-3' data-node-id="0d1d6f12-9ba7-11f1-b43e-bea971cc7bac">
            {courses.map((c) => (
              <Card key={c.id} className='flex flex-col gap-2 p-4' data-node-id="0d1cef60-9ba7-11f1-b43e-bea971cc7bac">
                <View className='flex flex-row items-start justify-between gap-3' data-node-id="0d1d7e08-9ba7-11f1-b43e-bea971cc7bac">
                  <View className='flex flex-1 flex-col gap-1' data-node-id="0d1cd926-9ba7-11f1-b43e-bea971cc7bac">
                    <Text className='text-base font-semibold' data-node-id="0d1d67c4-9ba7-11f1-b43e-bea971cc7bac">{c.name}</Text>
                    <Text className='text-xs text-muted-foreground' data-node-id="0d1d6c4c-9ba7-11f1-b43e-bea971cc7bac">
                      {c.day_of_week} {c.start_time}–{c.end_time} · {c.location}
                    </Text>
                    <View className='mt-1 flex flex-row gap-2' data-node-id="0d1d7958-9ba7-11f1-b43e-bea971cc7bac">
                      <Badge data-node-id="0d1d6ff8-9ba7-11f1-b43e-bea971cc7bac">{c.coach_name || '待定'}</Badge>
                      <Badge data-node-id="0d1d72aa-9ba7-11f1-b43e-bea971cc7bac">{c.difficulty}</Badge>
                      <Badge data-node-id="0d1d6d32-9ba7-11f1-b43e-bea971cc7bac">名额 {c.max_capacity}</Badge>
                    </View>
                  </View>
                  <View className='flex flex-col items-end' data-node-id="0d1cdbf6-9ba7-11f1-b43e-bea971cc7bac">
                    <Button
                      size='md'
                      variant='secondary'
                      className='min-h-9 px-3 text-xs'
                      onClick={() => {
                        setTab('roster')
                        loadRoster(c.id)
                      }}
                     data-node-id="0d1cdcdc-9ba7-11f1-b43e-bea971cc7bac">
                      查看名单
                    </Button>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )
      ) : tab === 'roster' ? (
        <View className='flex flex-col gap-3' data-node-id="0d1d767e-9ba7-11f1-b43e-bea971cc7bac">
          <Card data-node-id="0d1d68b4-9ba7-11f1-b43e-bea971cc7bac">
            <View className='flex flex-col gap-2' data-node-id="0d1ce740-9ba7-11f1-b43e-bea971cc7bac">
              <Text className='text-sm font-semibold' data-node-id="0d1cfbea-9ba7-11f1-b43e-bea971cc7bac">选择课程</Text>
              {courses.length === 0 ? (
                <Text className='text-xs text-muted-foreground' data-node-id="0d1d63fa-9ba7-11f1-b43e-bea971cc7bac">暂无课程</Text>
              ) : (
                <View className='flex flex-row flex-wrap gap-2' data-node-id="0d1d6508-9ba7-11f1-b43e-bea971cc7bac">
                  {courses.map((c) => {
                    const active = rosterCourseId === c.id
                    return (
                      <View
                        key={c.id}
                        className={cn('rounded-xl border px-3 py-1 text-xs', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}
                        onClick={() => loadRoster(c.id)}
                       data-node-id="0d1d69a4-9ba7-11f1-b43e-bea971cc7bac">
                        {c.name} · {c.day_of_week}
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          </Card>
          {!rosterCourseId ? (
            <EmptyState title='请先选择课程' description='点击上方课程查看报名名单'  data-node-id="0d1d7b10-9ba7-11f1-b43e-bea971cc7bac"/>
          ) : roster.length === 0 ? (
            <EmptyState title='暂无报名' description='该课程还没有人预约'  data-node-id="0d1ce1aa-9ba7-11f1-b43e-bea971cc7bac"/>
          ) : (
            <View className='flex flex-col gap-2' data-node-id="0d1d70e8-9ba7-11f1-b43e-bea971cc7bac">
              <View className='flex flex-row items-center justify-between px-1' data-node-id="0d1d0856-9ba7-11f1-b43e-bea971cc7bac">
                <Text className='text-sm font-semibold' data-node-id="0d1ce362-9ba7-11f1-b43e-bea971cc7bac">共 {roster.length} 条记录</Text>
                <Text className='text-xs text-muted-foreground' data-node-id="0d1ce81c-9ba7-11f1-b43e-bea971cc7bac">
                  已预约：{roster.filter((b) => b.status === 'booked').length}
                </Text>
              </View>
              {roster.map((b) => (
                <Card key={b.id} className='flex flex-row items-center justify-between p-3' data-node-id="0d1cda16-9ba7-11f1-b43e-bea971cc7bac">
                  <View className='flex flex-col' data-node-id="0d1d7778-9ba7-11f1-b43e-bea971cc7bac">
                    <Text className='text-sm font-medium' data-node-id="0d1ce43e-9ba7-11f1-b43e-bea971cc7bac">{b.member_name}</Text>
                    <Text className='text-[10px] text-muted-foreground' data-node-id="0d1ce8f8-9ba7-11f1-b43e-bea971cc7bac">
                      {new Date(b.created_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                  <Badge className={b.status === 'booked' ? 'bg-emerald-100 text-emerald-700' : ''} data-node-id="0d1d7a34-9ba7-11f1-b43e-bea971cc7bac">
                    {b.status === 'booked' ? '已预约' : '已取消'}
                  </Badge>
                </Card>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View className='flex flex-col gap-3' data-node-id="0d1d025c-9ba7-11f1-b43e-bea971cc7bac">
          <Card data-node-id="0d1cf4d8-9ba7-11f1-b43e-bea971cc7bac">
            <View className='flex flex-col gap-3' data-node-id="0d1cebbe-9ba7-11f1-b43e-bea971cc7bac">
              <Text className='text-base font-semibold' data-node-id="0d1cf5b4-9ba7-11f1-b43e-bea971cc7bac">添加教练</Text>
              <Field label='姓名' data-node-id="0d1cf780-9ba7-11f1-b43e-bea971cc7bac">
                <Input
                  className='rounded-xl border border-border bg-card px-3 py-2 text-sm'
                  placeholder='如：陈教练'
                  value={coachForm.name}
                  onInput={(e) => setCoachForm({ ...coachForm, name: e.detail.value })}
                 data-node-id="0d1cfdac-9ba7-11f1-b43e-bea971cc7bac"/>
              </Field>
              <Field label='擅长方向' data-node-id="0d1d6a80-9ba7-11f1-b43e-bea971cc7bac">
                <Input
                  className='rounded-xl border border-border bg-card px-3 py-2 text-sm'
                  placeholder='如：力量训练 / 增肌减脂'
                  value={coachForm.specialty}
                  onInput={(e) => setCoachForm({ ...coachForm, specialty: e.detail.value })}
                 data-node-id="0d1cf212-9ba7-11f1-b43e-bea971cc7bac"/>
              </Field>
              <Field label='简介' data-node-id="0d1ce290-9ba7-11f1-b43e-bea971cc7bac">
                <Textarea
                  className='rounded-xl border border-border bg-card p-3 text-sm min-h-20'
                  placeholder='认证、经验、风格等'
                  value={coachForm.bio}
                  onInput={(e) => setCoachForm({ ...coachForm, bio: e.detail.value })}
                  maxlength={300}
                 data-node-id="0d1d054a-9ba7-11f1-b43e-bea971cc7bac"/>
              </Field>
              <Field label='可约时段（每行 "周一 10:00-11:00"）' data-node-id="0d1ce9de-9ba7-11f1-b43e-bea971cc7bac">
                <Textarea
                  className='rounded-xl border border-border bg-card p-3 text-sm min-h-24'
                  placeholder='周一 10:00-11:00, 周三 20:00-21:00'
                  value={coachForm.slots}
                  onInput={(e) => setCoachForm({ ...coachForm, slots: e.detail.value })}
                 data-node-id="0d1cf85c-9ba7-11f1-b43e-bea971cc7bac"/>
              </Field>
              <Button variant='primary' loading={busy} onClick={publishCoach} data-node-id="0d1cddc2-9ba7-11f1-b43e-bea971cc7bac">
                添加教练
              </Button>
            </View>
          </Card>
          <View className='flex flex-col gap-2' data-node-id="0d1cf956-9ba7-11f1-b43e-bea971cc7bac">
            <Text className='text-sm font-semibold' data-node-id="0d1cdf84-9ba7-11f1-b43e-bea971cc7bac">现有教练（{coaches.length}）</Text>
            {coaches.map((c) => (
              <Card key={c.id} className='flex flex-row items-center gap-3 p-3' data-node-id="0d1d034c-9ba7-11f1-b43e-bea971cc7bac">
                <View className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl' data-node-id="0d1ce614-9ba7-11f1-b43e-bea971cc7bac">
                  {c.avatar || '🏋️'}
                </View>
                <View className='flex flex-1 flex-col' data-node-id="0d1ceaba-9ba7-11f1-b43e-bea971cc7bac">
                  <Text className='text-sm font-medium' data-node-id="0d1cd732-9ba7-11f1-b43e-bea971cc7bac">{c.name}</Text>
                  <Text className='text-xs text-muted-foreground' data-node-id="0d1cd82c-9ba7-11f1-b43e-bea971cc7bac">{c.specialty}</Text>
                </View>
                <Badge data-node-id="0d1cfa32-9ba7-11f1-b43e-bea971cc7bac">{c.available_slots.length} 时段</Badge>
              </Card>
            ))}
          </View>
        </View>
      )}
    </AppShell>
  )
}

function Field({
  label,
  children,
  flex,
}: {
  label: string
  children: React.ReactNode
  flex?: boolean
}) {
  return (
    <View className={cn('flex flex-col gap-1', flex && 'flex-1')} data-node-id="0d1d824a-9ba7-11f1-b43e-bea971cc7bac">
      <Text className='text-xs text-muted-foreground' data-node-id="0d1d836c-9ba7-11f1-b43e-bea971cc7bac">{label}</Text>
      {children}
    </View>
  )
}
