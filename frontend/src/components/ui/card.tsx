import * as React from 'react'
import { cn } from '../../lib/utils'

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('rounded-xl border border-[#1e2d3d] bg-[#111827] text-[#e2e8f0] shadow-sm', className)} {...props} />
)
const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6 pb-3', className)} {...props} />
)
const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn('text-base font-semibold leading-none tracking-tight', className)} {...props} />
)
const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('p-6 pt-0', className)} {...props} />
)

export { Card, CardHeader, CardTitle, CardContent }
