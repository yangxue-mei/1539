import Taro from '@tarojs/taro'
import type {
  Booking,
  Coach,
  Course,
  CourseWithRemaining,
  Member,
  PrivateBooking,
} from '../lib/types'

// SUPABASE_URL / SUPABASE_ANON_KEY 由 frontend_start.sh 从 supabase/functions/.env
// 桥接到 TARO_APP_SUPABASE_*，再经 config defineConstants 注入到全局常量。
const BASE_URL = (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '') as string
const ANON_KEY = (typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : '') as string

const REST = `${BASE_URL}/rest/v1`

function headers(): Record<string, string> {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
  }
}

export interface RequestResult<T> {
  data: T | null
  error: string | null
  status: number
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  opts: { query?: Record<string, string | number>; body?: unknown } = {},
): Promise<RequestResult<T>> {
  let url = `${REST}${path}`
  if (opts.query) {
    const q = Object.entries(opts.query)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    if (q) url += `?${q}`
  }
  try {
    const res = await Taro.request<T>({
      url,
      method,
      header: headers(),
      data: opts.body as any,
    })
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return { data: res.data, error: null, status: res.statusCode }
    }
    return { data: null, error: parseError(res.data), status: res.statusCode }
  } catch (e: any) {
    return { data: null, error: e?.message || '网络异常', status: 0 }
  }
}

function parseError(d: any): string {
  if (typeof d === 'string') return d
  if (d?.message) return String(d.message)
  if (d?.error_description) return String(d.error_description)
  try {
    return JSON.stringify(d)
  } catch {
    return '请求失败'
  }
}

// ============================ Members ============================

export async function upsertMember(m: Member): Promise<RequestResult<Member>> {
  // 先尝试 UPDATE，若不存在再 INSERT，避免依赖 Prefer header
  const patch = await request<Member>('PATCH', `/members?id=eq.${m.id}`, {
    body: { name: m.name, phone: m.phone ?? null, role: m.role },
  })
  if (patch.data) return patch
  return request<Member>('POST', '/members', {
    body: {
      id: m.id,
      name: m.name,
      phone: m.phone ?? null,
      role: m.role,
    },
  })
}

// ============================ Coaches ============================

export async function listCoaches(): Promise<RequestResult<Coach[]>> {
  return request<Coach[]>('GET', '/coaches', {
    query: { order: 'created_at.asc' },
  })
}

export async function getCoach(id: string): Promise<RequestResult<Coach | null>> {
  const r = await request<Coach[]>('GET', '/coaches', { query: { id: `eq.${id}` } })
  if (r.error || !r.data) return { data: null, error: r.error, status: r.status }
  return { data: r.data[0] ?? null, error: null, status: r.status }
}

// ============================ Courses ============================

export async function listCourses(): Promise<RequestResult<Course[]>> {
  return request<Course[]>('GET', '/courses', {
    query: { order: 'start_time.asc' },
  })
}

// ============================ Bookings ============================

export async function listBookingsByMember(memberId: string): Promise<RequestResult<Booking[]>> {
  return request<Booking[]>('GET', '/bookings', {
    query: {
      member_id: `eq.${memberId}`,
      order: 'created_at.desc',
    },
  })
}

export async function listBookingsByCourse(courseId: string): Promise<RequestResult<Booking[]>> {
  return request<Booking[]>('GET', '/bookings', {
    query: {
      course_id: `eq.${courseId}`,
      order: 'created_at.asc',
    },
  })
}

/** 计算某课程的剩余名额 + 是否已被该 member 预约。 */
export async function computeCourseRemaining(
  course: Course,
  memberId: string,
): Promise<CourseWithRemaining> {
  const r = await listBookingsByCourse(course.id)
  let bookedCount = 0
  let myStatus: 'booked' | 'cancelled' | null = null
  if (r.data) {
    for (const b of r.data) {
      if (b.status === 'booked') bookedCount++
      if (b.member_id === memberId) myStatus = b.status
    }
  }
  return {
    ...course,
    booked_count: bookedCount,
    remaining: Math.max(0, course.max_capacity - bookedCount),
    my_booking_status: myStatus,
  }
}

export async function createBooking(
  courseId: string,
  member: Member,
): Promise<RequestResult<Booking>> {
  // 确保本地 member 已同步（FK 约束）
  await upsertMember(member)
  // upsert：同 member+course 唯一约束；若已存在 cancelled，转回 booked
  const r = await request<Booking>('POST', '/bookings', {
    body: {
      course_id: courseId,
      member_id: member.id,
      member_name: member.name,
      status: 'booked',
    },
  })
  if (r.error) {
    // 命中 unique 约束 → 走 PATCH 回到 booked
    const r2 = await request<Booking>('PATCH', `/bookings?course_id=eq.${courseId}&member_id=eq.${member.id}`, {
      body: { status: 'booked' },
    })
    return r2
  }
  return r
}

export async function cancelBooking(courseId: string, memberId: string): Promise<RequestResult<Booking>> {
  return request<Booking>('PATCH', `/bookings?course_id=eq.${courseId}&member_id=eq.${memberId}`, {
    body: { status: 'cancelled' },
  })
}

// ============================ Private bookings ============================

export async function listPrivateBookingsByMember(memberId: string): Promise<RequestResult<PrivateBooking[]>> {
  return request<PrivateBooking[]>('GET', '/private_bookings', {
    query: {
      member_id: `eq.${memberId}`,
      order: 'created_at.desc',
    },
  })
}

export async function listPrivateBookingsByCoach(coachId: string): Promise<RequestResult<PrivateBooking[]>> {
  return request<PrivateBooking[]>('GET', '/private_bookings', {
    query: {
      coach_id: `eq.${coachId}`,
      order: 'created_at.desc',
    },
  })
}

export async function createPrivateBooking(
  coachId: string,
  slot: string,
  member: Member,
  note?: string,
): Promise<RequestResult<PrivateBooking>> {
  // 确保本地 member 已同步（FK 约束）
  await upsertMember(member)
  return request<PrivateBooking>('POST', '/private_bookings', {
    body: {
      coach_id: coachId,
      member_id: member.id,
      member_name: member.name,
      slot,
      note: note ?? null,
      status: 'pending',
    },
  })
}

// ============================ Admin ============================

export async function createCourse(course: Omit<Course, 'id' | 'created_at'>): Promise<RequestResult<Course>> {
  return request<Course>('POST', '/courses', { body: course })
}

export async function createCoach(coach: Omit<Coach, 'id' | 'created_at'>): Promise<RequestResult<Coach>> {
  return request<Coach>('POST', '/coaches', { body: coach })
}
