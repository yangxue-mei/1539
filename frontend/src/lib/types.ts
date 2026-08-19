// 业务领域类型

export type MemberRole = 'member' | 'admin'

export interface Member {
  id: string
  name: string
  phone?: string | null
  role: MemberRole
  created_at?: string
}

export interface Coach {
  id: string
  name: string
  specialty: string
  bio?: string | null
  available_slots: CoachSlot[]
  avatar?: string | null
  created_at?: string
}

export interface CoachSlot {
  day: string
  time: string
}

export interface Course {
  id: string
  name: string
  coach_id: string | null
  coach_name?: string | null
  day_of_week: string
  start_time: string
  end_time: string
  location: string
  max_capacity: number
  difficulty: string
  created_at?: string
}

export interface CourseWithRemaining extends Course {
  remaining: number
  booked_count: number
  my_booking_status: 'booked' | 'cancelled' | null
}

export interface Booking {
  id: string
  course_id: string
  member_id: string
  member_name: string
  status: 'booked' | 'cancelled'
  created_at: string
  course?: Course
}

export interface PrivateBooking {
  id: string
  coach_id: string
  member_id: string
  member_name: string
  slot: string
  note?: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  coach?: Coach
}
