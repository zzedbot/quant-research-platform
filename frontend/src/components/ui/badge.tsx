import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/20 text-primary',
        secondary: 'bg-[#1e2d3d] text-[#e2e8f0]',
        success: 'bg-green-500/20 text-green-400',
        warning: 'bg-yellow-500/20 text-yellow-400',
        destructive: 'bg-red-500/20 text-red-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
