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
    <View className={cn('flex items-start justify-between gap-4', className)} {...props}>
      <View className='flex flex-1 flex-col'>
        <Text className='text-lg font-semibold text-foreground'>{title}</Text>
        {description ? (
          <Text className='mt-1 text-sm text-muted-foreground'>{description}</Text>
        ) : null}
      </View>
      {action}
    </View>
  )
}
