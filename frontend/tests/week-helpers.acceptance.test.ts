import { describe, expect, it } from 'vitest'
import { WEEK_DAYS, getWeekDates, isToday, canCancelBefore2h } from '../src/lib/week'

describe('week helpers', () => {
  it('returns 7 days starting from Monday', () => {
    const w = getWeekDates(new Date('2026-08-19')) // 2026-08-19 是周三
    expect(w.length).toBe(7)
    expect(w[0].day).toBe('周一')
    expect(w[6].day).toBe('周日')
    expect(w.map((d) => d.day)).toEqual([...WEEK_DAYS])
  })

  it('identifies today index correctly', () => {
    const wed = new Date('2026-08-19') // 周三
    expect(isToday(2, wed)).toBe(true)
    expect(isToday(0, wed)).toBe(false)
  })

  it('allows cancellation more than 2h before course start', () => {
    const course = { day_of_week: '周三', start_time: '20:00' }
    // 周三 10:00 → 距离课程 10 小时，可取消
    expect(canCancelBefore2h(course, new Date('2026-08-19T10:00:00'))).toBe(true)
  })

  it('blocks cancellation within 2h before course start', () => {
    const course = { day_of_week: '周三', start_time: '12:00' }
    // 周三 10:00 → 距离课程 2 小时整，应该不可取消（≤2h 不可取消）
    expect(canCancelBefore2h(course, new Date('2026-08-19T10:00:00'))).toBe(false)
  })

  it('blocks cancellation when course has already started', () => {
    const course = { day_of_week: '周三', start_time: '10:00' }
    // 周三 11:00 → 课程已开始
    expect(canCancelBefore2h(course, new Date('2026-08-19T11:00:00'))).toBe(false)
  })
})

describe('week date label format', () => {
  it('produces mm/dd label', () => {
    const w = getWeekDates(new Date('2026-08-19'))
    expect(w[2].label).toBe('8/19')
    expect(w[2].date).toBe('2026-08-19')
  })
})
