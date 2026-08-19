import type { ComponentProps, ReactNode } from 'react'
import { View } from '@tarojs/components'
import { cn } from '../../lib/cn'

export interface EmptyStateProps extends ComponentProps<typeof View> {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <View
      className={cn('flex flex-col items-center rounded-xl bg-muted px-5 py-8 text-center', className)}
      {...props}
    >
      <View className='text-base font-semibold text-foreground'>{title}</View>
      {description ? (
        <View className='mt-2 text-sm text-muted-foreground'>{description}</View>
      ) : null}
      {action ? <View className='mt-5'>{action}</View> : null}
    </View>
  )
}
