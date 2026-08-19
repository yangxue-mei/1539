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
     data-node-id="0cf746ca-9ba7-11f1-b43e-bea971cc7bac">
      <View className='text-base font-semibold text-foreground' data-node-id="0cf749b8-9ba7-11f1-b43e-bea971cc7bac">{title}</View>
      {description ? (
        <View className='mt-2 text-sm text-muted-foreground' data-node-id="0cf747f6-9ba7-11f1-b43e-bea971cc7bac">{description}</View>
      ) : null}
      {action ? <View className='mt-5' data-node-id="0cf748dc-9ba7-11f1-b43e-bea971cc7bac">{action}</View> : null}
    </View>
  )
}
