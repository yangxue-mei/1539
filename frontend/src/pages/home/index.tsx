import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'
import { AppShell } from '../../components/app-shell'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { getLocalMember, setLocalRole, updateLocalName, upsertMemberLocal } from '../../lib/member'
import type { MemberRole } from '../../lib/types'
import './index.css'

export default function Home() {
  const [member, setMember] = useState(() => getLocalMember())
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(member.name)

  useDidShow(() => {
    setMember(getLocalMember())
  })

  function enterMember() {
    setLocalRole('member')
    const m = getLocalMember()
    setMember(m)
    upsertMemberLocal(m)
    Taro.navigateTo({ url: '/pages/schedule/index' })
  }

  function enterAdmin() {
    setLocalRole('admin')
    const m = getLocalMember()
    setMember(m)
    upsertMemberLocal(m)
    Taro.navigateTo({ url: '/pages/admin/index' })
  }

  function saveName() {
    const updated = updateLocalName(nameInput.trim() || member.name)
    setMember(updated)
    upsertMemberLocal(updated)
    setEditing(false)
  }

  function switchRole(role: MemberRole) {
    const updated = setLocalRole(role)
    setMember(updated)
    upsertMemberLocal(updated)
  }

  return (
    <AppShell
      eyebrow='健身房约课'
      title='体动健身房'
      description='团课预约 · 私教定制 · 一键管理'
      action={
        <View className='flex flex-col items-end gap-1' data-node-id="0d1f62d6-9ba7-11f1-b43e-bea971cc7bac">
          <Badge data-node-id="0d1f6c9a-9ba7-11f1-b43e-bea971cc7bac">#{member.id.slice(0, 6)}</Badge>
          <Text className='text-xs text-muted-foreground' data-node-id="0d1f71ae-9ba7-11f1-b43e-bea971cc7bac">{member.role === 'admin' ? '管理端' : '会员端'}</Text>
        </View>
      }
     data-node-id="0d1f61fa-9ba7-11f1-b43e-bea971cc7bac">
      <Card className='bg-primary text-primary-foreground border-0' data-node-id="0d1f63bc-9ba7-11f1-b43e-bea971cc7bac">
        <View className='flex flex-col gap-2' data-node-id="0d1f8374-9ba7-11f1-b43e-bea971cc7bac">
          <Text className='text-sm opacity-90' data-node-id="0d1f6d6c-9ba7-11f1-b43e-bea971cc7bac">欢迎，{member.name}</Text>
          <Text className='text-xl font-bold' data-node-id="0d1f7280-9ba7-11f1-b43e-bea971cc7bac">本周还有 10+ 节精彩团课等你来约</Text>
          <View className='mt-3 flex flex-row gap-2' data-node-id="0d1f735c-9ba7-11f1-b43e-bea971cc7bac">
            <Button variant='secondary' size='md' onClick={enterMember} data-node-id="0d1f7a96-9ba7-11f1-b43e-bea971cc7bac">
              查看课程表
            </Button>
          </View>
        </View>
      </Card>

      <View className='grid grid-cols-2 gap-3' data-node-id="0d1f6862-9ba7-11f1-b43e-bea971cc7bac">
        <View
          className='flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 active:opacity-80'
          onClick={enterMember}
         data-node-id="0d1f6e48-9ba7-11f1-b43e-bea971cc7bac">
          <View className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl' data-node-id="0d1f7b7c-9ba7-11f1-b43e-bea971cc7bac">
            🏋️
          </View>
          <Text className='text-base font-semibold' data-node-id="0d1f7f28-9ba7-11f1-b43e-bea971cc7bac">会员端</Text>
          <Text className='text-xs text-muted-foreground' data-node-id="0d1f6006-9ba7-11f1-b43e-bea971cc7bac">团课预约 · 私教预约 · 我的预约</Text>
        </View>
        <View
          className='flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 active:opacity-80'
          onClick={enterAdmin}
         data-node-id="0d1f7442-9ba7-11f1-b43e-bea971cc7bac">
          <View className='flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-primary-foreground text-2xl' data-node-id="0d1f64d4-9ba7-11f1-b43e-bea971cc7bac">
            📋
          </View>
          <Text className='text-base font-semibold' data-node-id="0d1f6934-9ba7-11f1-b43e-bea971cc7bac">管理端</Text>
          <Text className='text-xs text-muted-foreground' data-node-id="0d1f8004-9ba7-11f1-b43e-bea971cc7bac">发布课程 · 报名名单 · 名额管理</Text>
        </View>
      </View>

      <Card data-node-id="0d1f7528-9ba7-11f1-b43e-bea971cc7bac">
        <View className='flex flex-col gap-3' data-node-id="0d1f7622-9ba7-11f1-b43e-bea971cc7bac">
          <Text className='text-base font-semibold' data-node-id="0d1f6f24-9ba7-11f1-b43e-bea971cc7bac">个人资料</Text>
          <View className='flex flex-row items-center justify-between' data-node-id="0d1f7708-9ba7-11f1-b43e-bea971cc7bac">
            <Text className='text-sm text-muted-foreground' data-node-id="0d1f7c6c-9ba7-11f1-b43e-bea971cc7bac">昵称</Text>
            {editing ? (
              <View className='flex flex-row gap-2' data-node-id="0d1f7000-9ba7-11f1-b43e-bea971cc7bac">
                <Input
                  className='rounded border border-border px-2 py-1 text-sm bg-card'
                  value={nameInput}
                  onInput={(e) => setNameInput(e.detail.value)}
                  style={{ width: '160rpx' }}
                 data-node-id="0d1f7d52-9ba7-11f1-b43e-bea971cc7bac"/>
                <Button size='md' onClick={saveName} className='min-h-9 px-3 text-xs' data-node-id="0d1f80e0-9ba7-11f1-b43e-bea971cc7bac">
                  保存
                </Button>
              </View>
            ) : (
              <View className='flex flex-row items-center gap-2' onClick={() => setEditing(true)} data-node-id="0d1f65ba-9ba7-11f1-b43e-bea971cc7bac">
                <Text className='text-sm font-medium' data-node-id="0d1f70dc-9ba7-11f1-b43e-bea971cc7bac">{member.name}</Text>
                <Text className='text-xs text-primary' data-node-id="0d1f77ee-9ba7-11f1-b43e-bea971cc7bac">修改</Text>
              </View>
            )}
          </View>
          <View className='flex flex-row items-center justify-between' data-node-id="0d1f81bc-9ba7-11f1-b43e-bea971cc7bac">
            <Text className='text-sm text-muted-foreground' data-node-id="0d1f5ebc-9ba7-11f1-b43e-bea971cc7bac">身份</Text>
            <View className='flex flex-row gap-2' data-node-id="0d1f60f6-9ba7-11f1-b43e-bea971cc7bac">
              <Button
                size='md'
                variant={member.role === 'member' ? 'primary' : 'secondary'}
                className='min-h-9 px-3 text-xs'
                onClick={() => switchRole('member')}
               data-node-id="0d1f6696-9ba7-11f1-b43e-bea971cc7bac">
                会员
              </Button>
              <Button
                size='md'
                variant={member.role === 'admin' ? 'primary' : 'secondary'}
                className='min-h-9 px-3 text-xs'
                onClick={() => switchRole('admin')}
               data-node-id="0d1f6a10-9ba7-11f1-b43e-bea971cc7bac">
                管理员
              </Button>
            </View>
          </View>
        </View>
      </Card>

      <View className='flex flex-col gap-2 px-1' data-node-id="0d1f79a6-9ba7-11f1-b43e-bea971cc7bac">
        <Text className='text-sm font-semibold' data-node-id="0d1f7e24-9ba7-11f1-b43e-bea971cc7bac">快捷入口</Text>
        <View className='flex flex-row flex-wrap gap-2' data-node-id="0d1f8298-9ba7-11f1-b43e-bea971cc7bac">
          <Button size='md' variant='secondary' onClick={() => Taro.navigateTo({ url: '/pages/schedule/index' })} data-node-id="0d1f677c-9ba7-11f1-b43e-bea971cc7bac">
            本周课程表
          </Button>
          <Button size='md' variant='secondary' onClick={() => Taro.navigateTo({ url: '/pages/coaches/index' })} data-node-id="0d1f6aec-9ba7-11f1-b43e-bea971cc7bac">
            私教教练
          </Button>
          <Button size='md' variant='secondary' onClick={() => Taro.navigateTo({ url: '/pages/my-bookings/index' })} data-node-id="0d1f6bc8-9ba7-11f1-b43e-bea971cc7bac">
            我的预约
          </Button>
        </View>
      </View>
    </AppShell>
  )
}
