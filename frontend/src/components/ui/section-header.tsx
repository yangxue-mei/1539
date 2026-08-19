import type { ComponentProps, ReactNode } from 'react'
import { Text, View } from '@tarojs/components'
import { cn } from '../../lib/cn'

export interface SectionHeaderProps extends ComponentProps<typeof View> {
  title: string
  description?: string
  action?: ReactNode
}

export function SectionHeader({
  title,
  description,
  action,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <View className={cn('flex items-start justify-between gap-4', className)} {...props} data-node-id="0cf7a750-9ba7-11f1-b43e-bea971cc7bac">
      <View className='flex flex-1 flex-col' data-node-id="0cf7aa3e-9ba7-11f1-b43e-bea971cc7bac">
        <Text className='text-lg font-semibold text-foreground' data-node-id="0cf7a872-9ba7-11f1-b43e-bea971cc7bac">{title}</Text>
        {description ? (
          <Text className='mt-1 text-sm text-muted-foreground' data-node-id="0cf7a958-9ba7-11f1-b43e-bea971cc7bac">{description}</Text>
        ) : null}
      </View>
      {action}
    </View>
  )
}
