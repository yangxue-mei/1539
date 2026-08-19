export const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const

export type WeekDay = (typeof WEEK_DAYS)[number]

/** 计算本周（周一为起点）的 7 天日期，返回与 WEEK_DAYS 对齐的 { day, date, label }。 */
export function getWeekDates(base: Date = new Date()): { day: WeekDay; date: string; label: string }[] {
  const dayIdx = base.getDay() // 0=周日, 1=周一...
  const offsetToMon = dayIdx === 0 ? -6 : 1 - dayIdx
  const monday = new Date(base)
  monday.setDate(base.getDate() + offsetToMon)
  return WEEK_DAYS.map((day, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const month = d.getMonth() + 1
    const date = d.getDate()
    return {
      day,
      date: `${d.getFullYear()}-${pad(month)}-${pad(date)}`,
      label: `${month}/${date}`,
    }
  })
}

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

export function isToday(weekIdx: number, base: Date = new Date()): boolean {
  const dayIdx = base.getDay()
  const weekIdxToday = dayIdx === 0 ? 6 : dayIdx - 1
  return weekIdx === weekIdxToday
}

/** 当前时间是否在某课程开课前 2 小时之前。开课前 2 小时之内或开课后不可取消。 */
export function canCancelBefore2h(course: { day_of_week: string; start_time: string }, base: Date = new Date()): boolean {
  const now = base
  const [h, m] = course.start_time.split(':').map((x) => parseInt(x, 10))
  // 简化：以本周对应日期 + start_time 构造 courseStart
  const dayIdx = now.getDay()
  const todayIdx = dayIdx === 0 ? 6 : dayIdx - 1
  const targetIdx = WEEK_DAYS.indexOf(course.day_of_week as WeekDay)
  const diff = targetIdx - todayIdx
  const courseStart = new Date(now)
  courseStart.setDate(now.getDate() + diff)
  courseStart.setHours(h, m, 0, 0)
  // 必须严格早于开课前 2 小时；≤2h 不可取消
  return now.getTime() + 2 * 3600 * 1000 < courseStart.getTime()
}
