import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../../lib/utils';
const Card = ({ className, ...props }) => (_jsx("div", { className: cn('rounded-xl border border-[#1e2d3d] bg-[#111827] text-[#e2e8f0] shadow-sm', className), ...props }));
const CardHeader = ({ className, ...props }) => (_jsx("div", { className: cn('flex flex-col space-y-1.5 p-6 pb-3', className), ...props }));
const CardTitle = ({ className, ...props }) => (_jsx("h3", { className: cn('text-base font-semibold leading-none tracking-tight', className), ...props }));
const CardContent = ({ className, ...props }) => (_jsx("div", { className: cn('p-6 pt-0', className), ...props }));
export { Card, CardHeader, CardTitle, CardContent };
