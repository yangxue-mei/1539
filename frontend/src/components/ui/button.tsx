import type { ComponentProps, ReactNode } from 'react'
import { Button as TaroButton } from '@tarojs/components'
import { cn } from '../../lib/cn'

const variantClasses = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'border border-border bg-card text-card-foreground',
  ghost: 'bg-transparent text-foreground',
  danger: 'bg-destructive text-white',
} as const

const sizeClasses = {
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-6 text-base',
} as const

export interface ButtonProps
  extends Omit<ComponentProps<typeof TaroButton>, 'children' | 'size'> {
  children: ReactNode
  variant?: keyof typeof variantClasses
  size?: keyof typeof sizeClasses
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  hoverClass = 'opacity-80',
  ...props
}: ButtonProps) {
  return (
    <TaroButton
      className={cn(
        'm-0 flex items-center justify-center rounded-xl font-semibold leading-none after:border-0',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      hoverClass={hoverClass}
      {...props}
     data-node-id="0cf6dfb4-9ba7-11f1-b43e-bea971cc7bac">
      {children}
    </TaroButton>
  )
}
