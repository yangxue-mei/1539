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
        <View className='flex flex-col items-end gap-1'>
          <Badge>#{member.id.slice(0, 6)}</Badge>
          <Text className='text-xs text-muted-foreground'>{member.role === 'admin' ? '管理端' : '会员端'}</Text>
        </View>
      }
    >
      <Card className='bg-primary text-primary-foreground border-0'>
        <View className='flex flex-col gap-2'>
          <Text className='text-sm opacity-90'>欢迎，{member.name}</Text>
          <Text className='text-xl font-bold'>本周还有 10+ 节精彩团课等你来约</Text>
          <View className='mt-3 flex flex-row gap-2'>
            <Button variant='secondary' size='md' onClick={enterMember}>
              查看课程表
            </Button>
          </View>
        </View>
      </Card>

      <View className='grid grid-cols-2 gap-3'>
        <View
          className='flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 active:opacity-80'
          onClick={enterMember}
        >
          <View className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl'>
            🏋️
          </View>
          <Text className='text-base font-semibold'>会员端</Text>
          <Text className='text-xs text-muted-foreground'>团课预约 · 私教预约 · 我的预约</Text>
        </View>
        <View
          className='flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 active:opacity-80'
          onClick={enterAdmin}
        >
          <View className='flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-primary-foreground text-2xl'>
            📋
          </View>
          <Text className='text-base font-semibold'>管理端</Text>
          <Text className='text-xs text-muted-foreground'>发布课程 · 报名名单 · 名额管理</Text>
        </View>
      </View>

      <Card>
        <View className='flex flex-col gap-3'>
          <Text className='text-base font-semibold'>个人资料</Text>
          <View className='flex flex-row items-center justify-between'>
            <Text className='text-sm text-muted-foreground'>昵称</Text>
            {editing ? (
              <View className='flex flex-row gap-2'>
                <Input
                  className='rounded border border-border px-2 py-1 text-sm bg-card'
                  value={nameInput}
                  onInput={(e) => setNameInput(e.detail.value)}
                  style={{ width: '160rpx' }}
                />
                <Button size='md' onClick={saveName} className='min-h-9 px-3 text-xs'>
                  保存
                </Button>
              </View>
            ) : (
              <View className='flex flex-row items-center gap-2' onClick={() => setEditing(true)}>
                <Text className='text-sm font-medium'>{member.name}</Text>
                <Text className='text-xs text-primary'>修改</Text>
              </View>
            )}
          </View>
          <View className='flex flex-row items-center justify-between'>
            <Text className='text-sm text-muted-foreground'>身份</Text>
            <View className='flex flex-row gap-2'>
              <Button
                size='md'
                variant={member.role === 'member' ? 'primary' : 'secondary'}
                className='min-h-9 px-3 text-xs'
                onClick={() => switchRole('member')}
              >
                会员
              </Button>
              <Button
                size='md'
                variant={member.role === 'admin' ? 'primary' : 'secondary'}
                className='min-h-9 px-3 text-xs'
                onClick={() => switchRole('admin')}
              >
                管理员
              </Button>
            </View>
          </View>
        </View>
      </Card>

      <View className='flex flex-col gap-2 px-1'>
        <Text className='text-sm font-semibold'>快捷入口</Text>
        <View className='flex flex-row flex-wrap gap-2'>
          <Button size='md' variant='secondary' onClick={() => Taro.navigateTo({ url: '/pages/schedule/index' })}>
            本周课程表
          </Button>
          <Button size='md' variant='secondary' onClick={() => Taro.navigateTo({ url: '/pages/coaches/index' })}>
            私教教练
          </Button>
          <Button size='md' variant='secondary' onClick={() => Taro.navigateTo({ url: '/pages/my-bookings/index' })}>
            我的预约
          </Button>
        </View>
      </View>
    </AppShell>
  )
}
