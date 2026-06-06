import * as React from 'react'
import { cn } from '../../lib/utils'

const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <div className="w-full overflow-auto"><table className={cn('w-full caption-bottom text-sm', className)} {...props} /></div>
)
const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={cn('[&_tr]:border-b', className)} {...props} />
)
const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
)
const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={cn('border-b border-[#1e2d3d] transition-colors hover:bg-[#1a2332]', className)} {...props} />
)
const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th className={cn('h-10 px-4 text-left align-middle text-xs font-medium text-[#64748b] uppercase tracking-wider', className)} {...props} />
)
const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn('px-4 py-3 text-sm', className)} {...props} />
)

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
