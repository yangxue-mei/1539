import Taro from '@tarojs/taro'
import { readStorage, writeStorage } from './storage'
import { upsertMember } from '../services/supabase'
import type { Member, MemberRole } from './types'

const MEMBER_KEY = 'gym_member'

function uuid(): string {
  // 简单 UUID v4 生成，Taro 多端兼容
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** 获取或创建本地 member（含 member_id、role）。 */
export function getLocalMember(): Member {
  let m = readStorage<Member | null>(MEMBER_KEY, null)
  if (!m) {
    m = {
      id: uuid(),
      name: '会员' + Math.floor(Math.random() * 9000 + 1000),
      role: 'member',
    }
    writeStorage(MEMBER_KEY, m)
  }
  return m
}

export function setLocalRole(role: MemberRole): Member {
  const m = getLocalMember()
  const updated = { ...m, role }
  writeStorage(MEMBER_KEY, updated)
  return updated
}

export function updateLocalName(name: string): Member {
  const m = getLocalMember()
  const updated = { ...m, name }
  writeStorage(MEMBER_KEY, updated)
  return updated
}

export function updateLocalPhone(phone: string): Member {
  const m = getLocalMember()
  const updated = { ...m, phone }
  writeStorage(MEMBER_KEY, updated)
  return updated
}

export function clearLocalMember(): void {
  Taro.removeStorageSync(MEMBER_KEY)
}

/** 异步将本地 member 同步到 Supabase（fire-and-forget，不阻塞 UI）。 */
export function upsertMemberLocal(m: Member): void {
  upsertMember(m)
    .then((r) => {
      if (r.error) {
        // 静默失败：本地身份仍可用，下次进入再试
      }
    })
    .catch(() => {})
}
