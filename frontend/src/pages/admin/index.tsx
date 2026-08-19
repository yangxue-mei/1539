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
      <AppShell eyebrow='管理端' title='权限不足'>
        <EmptyState
          title='仅管理员可访问'
          description='请在首页切换为管理员身份后重试'
          action={
            <Button onClick={() => Taro.navigateBack()} variant='primary'>
              返回首页
            </Button>
          }
        />
      </AppShell>
    )
  }

  return (
    <AppShell
      eyebrow='管理端'
      title='健身房管理'
      description='发布课程 · 设置名额 · 查看报名名单'
      action={<View className='text-xs text-primary' onClick={() => Taro.navigateBack()}>返回</View>}
    >
      <ScrollView scrollX className='whitespace-nowrap admin-tabs' enhanced showScrollbar={false}>
        <View className='flex flex-row gap-2 px-1 pb-1'>
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
              >
                {t.label}
              </View>
            )
          })}
        </View>
      </ScrollView>

      {loading ? (
        <View className='flex flex-col items-center py-10'>
          <Text className='text-sm text-muted-foreground'>加载中…</Text>
        </View>
      ) : tab === 'publish' ? (
        <Card>
          <View className='flex flex-col gap-3'>
            <Text className='text-base font-semibold'>发布团课</Text>
            <Field label='课程名称'>
              <Input
                className='rounded-xl border border-border bg-card px-3 py-2 text-sm'
                placeholder='如：晨间燃脂 HIIT'
                value={form.name}
                onInput={(e) => setForm({ ...form, name: e.detail.value })}
              />
            </Field>
            <Field label='授课教练'>
              <View className='flex flex-row flex-wrap gap-2'>
                {coaches.length === 0 ? (
                  <Text className='text-xs text-muted-foreground'>尚未添加教练，可留空</Text>
                ) : (
                  coaches.map((c) => {
                    const active = form.coach_id === c.id
                    return (
                      <View
                        key={c.id}
                        className={cn('rounded-xl border px-3 py-1 text-xs', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}
                        onClick={() => setForm({ ...form, coach_id: active ? '' : c.id })}
                      >
                        {c.name}
                      </View>
                    )
                  })
                )}
              </View>
            </Field>
            <Field label='星期'>
              <View className='flex flex-row flex-wrap gap-2'>
                {WEEK_DAYS.map((d) => {
                  const active = form.day_of_week === d
                  return (
                    <View
                      key={d}
                      className={cn('rounded-xl border px-3 py-1 text-xs', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}
                      onClick={() => setForm({ ...form, day_of_week: d })}
                    >
                      {d}
                    </View>
                  )
                })}
              </View>
            </Field>
            <View className='flex flex-row gap-3'>
              <Field label='开始时间' flex>
                <Input
                  className='rounded-xl border border-border bg-card px-3 py-2 text-sm'
                  placeholder='07:00'
                  value={form.start_time}
                  onInput={(e) => setForm({ ...form, start_time: e.detail.value })}
                />
              </Field>
              <Field label='结束时间' flex>
                <Input
                  className='rounded-xl border border-border bg-card px-3 py-2 text-sm'
                  placeholder='08:00'
                  value={form.end_time}
                  onInput={(e) => setForm({ ...form, end_time: e.detail.value })}
                />
              </Field>
            </View>
            <Field label='地点 / 教室'>
              <Input
                className='rounded-xl border border-border bg-card px-3 py-2 text-sm'
                placeholder='如：团课房 A'
                value={form.location}
                onInput={(e) => setForm({ ...form, location: e.detail.value })}
              />
            </Field>
            <View className='flex flex-row gap-3'>
              <Field label='最大名额' flex>
                <Input
                  type='number'
                  className='rounded-xl border border-border bg-card px-3 py-2 text-sm'
                  value={form.max_capacity}
                  onInput={(e) => setForm({ ...form, max_capacity: e.detail.value })}
                />
              </Field>
              <Field label='难度' flex>
                <View className='flex flex-row gap-2'>
                  {DIFFICULTY.map((d) => {
                    const active = form.difficulty === d
                    return (
                      <View
                        key={d}
                        className={cn('rounded-xl border px-3 py-1 text-xs', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}
                        onClick={() => setForm({ ...form, difficulty: d })}
                      >
                        {d}
                      </View>
                    )
                  })}
                </View>
              </Field>
            </View>
            <Button variant='primary' loading={busy} onClick={publish}>
              发布课程
            </Button>
          </View>
        </Card>
      ) : tab === 'courses' ? (
        courses.length === 0 ? (
          <EmptyState title='暂无课程' description='去「发布课程」添加一节吧' />
        ) : (
          <View className='flex flex-col gap-3'>
            {courses.map((c) => (
              <Card key={c.id} className='flex flex-col gap-2 p-4'>
                <View className='flex flex-row items-start justify-between gap-3'>
                  <View className='flex flex-1 flex-col gap-1'>
                    <Text className='text-base font-semibold'>{c.name}</Text>
                    <Text className='text-xs text-muted-foreground'>
                      {c.day_of_week} {c.start_time}–{c.end_time} · {c.location}
                    </Text>
                    <View className='mt-1 flex flex-row gap-2'>
                      <Badge>{c.coach_name || '待定'}</Badge>
                      <Badge>{c.difficulty}</Badge>
                      <Badge>名额 {c.max_capacity}</Badge>
                    </View>
                  </View>
                  <View className='flex flex-col items-end'>
                    <Button
                      size='md'
                      variant='secondary'
                      className='min-h-9 px-3 text-xs'
                      onClick={() => {
                        setTab('roster')
                        loadRoster(c.id)
                      }}
                    >
                      查看名单
                    </Button>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )
      ) : tab === 'roster' ? (
        <View className='flex flex-col gap-3'>
          <Card>
            <View className='flex flex-col gap-2'>
              <Text className='text-sm font-semibold'>选择课程</Text>
              {courses.length === 0 ? (
                <Text className='text-xs text-muted-foreground'>暂无课程</Text>
              ) : (
                <View className='flex flex-row flex-wrap gap-2'>
                  {courses.map((c) => {
                    const active = rosterCourseId === c.id
                    return (
                      <View
                        key={c.id}
                        className={cn('rounded-xl border px-3 py-1 text-xs', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}
                        onClick={() => loadRoster(c.id)}
                      >
                        {c.name} · {c.day_of_week}
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          </Card>
          {!rosterCourseId ? (
            <EmptyState title='请先选择课程' description='点击上方课程查看报名名单' />
          ) : roster.length === 0 ? (
            <EmptyState title='暂无报名' description='该课程还没有人预约' />
          ) : (
            <View className='flex flex-col gap-2'>
              <View className='flex flex-row items-center justify-between px-1'>
                <Text className='text-sm font-semibold'>共 {roster.length} 条记录</Text>
                <Text className='text-xs text-muted-foreground'>
                  已预约：{roster.filter((b) => b.status === 'booked').length}
                </Text>
              </View>
              {roster.map((b) => (
                <Card key={b.id} className='flex flex-row items-center justify-between p-3'>
                  <View className='flex flex-col'>
                    <Text className='text-sm font-medium'>{b.member_name}</Text>
                    <Text className='text-[10px] text-muted-foreground'>
                      {new Date(b.created_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                  <Badge className={b.status === 'booked' ? 'bg-emerald-100 text-emerald-700' : ''}>
                    {b.status === 'booked' ? '已预约' : '已取消'}
                  </Badge>
                </Card>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View className='flex flex-col gap-3'>
          <Card>
            <View className='flex flex-col gap-3'>
              <Text className='text-base font-semibold'>添加教练</Text>
              <Field label='姓名'>
                <Input
                  className='rounded-xl border border-border bg-card px-3 py-2 text-sm'
                  placeholder='如：陈教练'
                  value={coachForm.name}
                  onInput={(e) => setCoachForm({ ...coachForm, name: e.detail.value })}
                />
              </Field>
              <Field label='擅长方向'>
                <Input
                  className='rounded-xl border border-border bg-card px-3 py-2 text-sm'
                  placeholder='如：力量训练 / 增肌减脂'
                  value={coachForm.specialty}
                  onInput={(e) => setCoachForm({ ...coachForm, specialty: e.detail.value })}
                />
              </Field>
              <Field label='简介'>
                <Textarea
                  className='rounded-xl border border-border bg-card p-3 text-sm min-h-20'
                  placeholder='认证、经验、风格等'
                  value={coachForm.bio}
                  onInput={(e) => setCoachForm({ ...coachForm, bio: e.detail.value })}
                  maxlength={300}
                />
              </Field>
              <Field label='可约时段（每行 "周一 10:00-11:00"）'>
                <Textarea
                  className='rounded-xl border border-border bg-card p-3 text-sm min-h-24'
                  placeholder='周一 10:00-11:00, 周三 20:00-21:00'
                  value={coachForm.slots}
                  onInput={(e) => setCoachForm({ ...coachForm, slots: e.detail.value })}
                />
              </Field>
              <Button variant='primary' loading={busy} onClick={publishCoach}>
                添加教练
              </Button>
            </View>
          </Card>
          <View className='flex flex-col gap-2'>
            <Text className='text-sm font-semibold'>现有教练（{coaches.length}）</Text>
            {coaches.map((c) => (
              <Card key={c.id} className='flex flex-row items-center gap-3 p-3'>
                <View className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl'>
                  {c.avatar || '🏋️'}
                </View>
                <View className='flex flex-1 flex-col'>
                  <Text className='text-sm font-medium'>{c.name}</Text>
                  <Text className='text-xs text-muted-foreground'>{c.specialty}</Text>
                </View>
                <Badge>{c.available_slots.length} 时段</Badge>
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
    <View className={cn('flex flex-col gap-1', flex && 'flex-1')}>
      <Text className='text-xs text-muted-foreground'>{label}</Text>
      {children}
    </View>
  )
}
