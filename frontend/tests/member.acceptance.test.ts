import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock @tarojs/taro storage before importing lib
const store = new Map<string, unknown>()
vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync: (k: string) => store.get(k),
    setStorageSync: (k: string, v: unknown) => store.set(k, v),
    removeStorageSync: (k: string) => store.delete(k),
  },
  useDidShow: vi.fn(),
  useLaunch: vi.fn(),
  useRouter: vi.fn(() => ({ params: {} })),
  navigateTo: vi.fn(),
  navigateBack: vi.fn(),
  redirectTo: vi.fn(),
  showToast: vi.fn(),
  showModal: vi.fn(),
  request: vi.fn(),
}))

// Suppress the supabase.ts import inside member.ts via mock
vi.mock('../src/services/supabase', () => ({
  upsertMember: vi.fn().mockResolvedValue({ data: null, error: null, status: 200 }),
}))

import { getLocalMember, setLocalRole, updateLocalName, updateLocalPhone } from '../src/lib/member'

describe('member identity', () => {
  beforeEach(() => {
    store.clear()
  })

  it('creates a stable local member on first read', () => {
    const m1 = getLocalMember()
    expect(m1.id).toBeTruthy()
    expect(m1.id.length).toBe(36)
    expect(m1.role).toBe('member')
    expect(m1.name).toMatch(/^会员\d+$/)
    const m2 = getLocalMember()
    expect(m2.id).toBe(m1.id)
  })

  it('switches role and persists', () => {
    setLocalRole('admin')
    const m = getLocalMember()
    expect(m.role).toBe('admin')
  })

  it('updates name and phone', () => {
    updateLocalName('小明')
    updateLocalPhone('13800001111')
    const m = getLocalMember()
    expect(m.name).toBe('小明')
    expect(m.phone).toBe('13800001111')
  })
})
