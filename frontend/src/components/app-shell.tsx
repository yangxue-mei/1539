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
     data-node-id="0cf64d88-9ba7-11f1-b43e-bea971cc7bac">
      <View className='mx-auto flex w-full max-w-xl flex-col gap-5' data-node-id="0cf65256-9ba7-11f1-b43e-bea971cc7bac">
        {title ? (
          <View className='flex items-start justify-between gap-4' data-node-id="0cf64fb8-9ba7-11f1-b43e-bea971cc7bac">
            <View className='flex flex-1 flex-col gap-1' data-node-id="0cf64ec8-9ba7-11f1-b43e-bea971cc7bac">
              {eyebrow ? <Text className='text-sm font-medium text-primary' data-node-id="0cf65094-9ba7-11f1-b43e-bea971cc7bac">{eyebrow}</Text> : null}
              <Text className='text-3xl font-bold' data-node-id="0cf65328-9ba7-11f1-b43e-bea971cc7bac">{title}</Text>
              {description ? <Text className='text-base text-muted-foreground' data-node-id="0cf6517a-9ba7-11f1-b43e-bea971cc7bac">{description}</Text> : null}
            </View>
            {action}
          </View>
        ) : null}
        {children}
      </View>
    </View>
  )
}
