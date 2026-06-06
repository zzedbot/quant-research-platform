import * as React from 'react'
import { cn } from '../../lib/utils'

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({ value: '', onValueChange: () => {} })

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

const Tabs: React.FC<TabsProps> = ({ defaultValue, value, onValueChange, children, className }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '')
  const isControlled = value !== undefined
  const currentValue = isControlled ? value! : internalValue
  const handleValueChange = (v: string) => {
    if (!isControlled) setInternalValue(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('inline-flex h-10 items-center rounded-lg bg-[#111827] p-1', className)}>{children}</div>
)

const TabsTrigger: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({
  value, children, className
}) => {
  const ctx = React.useContext(TabsContext)
  const isActive = ctx.value === value
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all',
        isActive ? 'bg-primary text-white shadow-sm' : 'text-[#64748b] hover:text-[#e2e8f0]',
        className
      )}
      onClick={() => ctx.onValueChange(value)}
    >
      {children}
    </button>
  )
}

const TabsContent: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({
  value, children, className
}) => {
  const ctx = React.useContext(TabsContext)
  if (ctx.value !== value) return null
  return <div className={className}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
