import * as React from 'react'
import { cn } from '../../lib/utils'

const Dialog: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }> = ({ open, onOpenChange, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-lg rounded-xl border border-[#1e2d3d] bg-[#111827] p-6 shadow-lg">
        {children}
      </div>
    </div>
  )
}
const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('mb-4', className)} {...props} />
)
const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={cn('text-lg font-semibold text-[#e2e8f0]', className)} {...props} />
)
const DialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('space-y-4', className)} {...props} />
)
const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex justify-end gap-2 pt-2', className)} {...props} />
)

export { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter }
