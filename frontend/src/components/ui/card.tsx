import type { ComponentProps, ReactNode } from 'react'
import { View } from '@tarojs/components'
import { cn } from '../../lib/cn'

export interface CardProps extends ComponentProps<typeof View> {
  children: ReactNode
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <View
      className={cn('rounded-2xl border border-border bg-card p-5 text-card-foreground', className)}
      {...props}
    >
      {children}
    </View>
  )
}
