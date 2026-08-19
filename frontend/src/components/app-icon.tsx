import type { ComponentProps } from 'react'
import {
  Add,
  Check,
  Del,
  Edit,
  Home,
  List,
  Plus,
  Search,
  Setting,
  Success,
  User,
  Warning,
} from '@nutui/icons-react-taro'

export {
  Add,
  Check,
  Del,
  Edit,
  Home,
  List,
  Plus,
  Search,
  Setting,
  Success,
  User,
  Warning,
}

const icons = { Add, Check, Del, Edit, Home, List, Plus, Search, Setting, Success, User, Warning } as const

export type AppIconName = keyof typeof icons
export type AppIconProps = ComponentProps<typeof Add> & { name: AppIconName }

/** Common, verified NutUI icons for starter screens and reusable UI. */
export function AppIcon({ name, ...props }: AppIconProps) {
  const Icon = icons[name]
  return <Icon {...props}  data-node-id="0cf5ffd6-9ba7-11f1-b43e-bea971cc7bac"/>
}
