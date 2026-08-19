import type { ComponentProps, ReactNode } from 'react'
import { Text, View } from '@tarojs/components'
import { cn } from '../lib/cn'

export interface AppShellProps extends ComponentProps<typeof View> {
  children: ReactNode
  eyebrow?: string
  title?: string
  description?: string
  action?: ReactNode
}

/** Business-free page frame with safe-area spacing and the template scroll default. */
export function AppShell({
  children,
  eyebrow,
  title,
  description,
  action,
  className,
  ...props
}: AppShellProps) {
  return (
    <View
      className={cn(
        'min-h-screen bg-background px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-8 text-foreground',
        className,
      )}
      {...props}
    >
      <View className='mx-auto flex w-full max-w-xl flex-col gap-5'>
        {title ? (
          <View className='flex items-start justify-between gap-4'>
            <View className='flex flex-1 flex-col gap-1'>
              {eyebrow ? <Text className='text-sm font-medium text-primary'>{eyebrow}</Text> : null}
              <Text className='text-3xl font-bold'>{title}</Text>
              {description ? <Text className='text-base text-muted-foreground'>{description}</Text> : null}
            </View>
            {action}
          </View>
        ) : null}
        {children}
      </View>
    </View>
  )
}
