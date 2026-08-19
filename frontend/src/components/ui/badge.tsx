import type { ComponentProps, ReactNode } from 'react'
import { Text } from '@tarojs/components'
import { cn } from '../../lib/cn'

export interface BadgeProps extends ComponentProps<typeof Text> {
  children: ReactNode
}

export function Badge({ children, className, ...props }: BadgeProps) {
  return (
    <Text
      className={cn('inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground', className)}
      {...props}
    >
      {children}
    </Text>
  )
}
