import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../../lib/utils';
const Table = ({ className, ...props }) => (_jsx("div", { className: "w-full overflow-auto", children: _jsx("table", { className: cn('w-full caption-bottom text-sm', className), ...props }) }));
const TableHeader = ({ className, ...props }) => (_jsx("thead", { className: cn('[&_tr]:border-b', className), ...props }));
const TableBody = ({ className, ...props }) => (_jsx("tbody", { className: cn('[&_tr:last-child]:border-0', className), ...props }));
const TableRow = ({ className, ...props }) => (_jsx("tr", { className: cn('border-b border-[#1e2d3d] transition-colors hover:bg-[#1a2332]', className), ...props }));
const TableHead = ({ className, ...props }) => (_jsx("th", { className: cn('h-10 px-4 text-left align-middle text-xs font-medium text-[#64748b] uppercase tracking-wider', className), ...props }));
const TableCell = ({ className, ...props }) => (_jsx("td", { className: cn('px-4 py-3 text-sm', className), ...props }));
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
