import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../../lib/utils';
const Dialog = ({ open, onOpenChange, children }) => {
    if (!open)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [_jsx("div", { className: "fixed inset-0 bg-black/60", onClick: () => onOpenChange(false) }), _jsx("div", { className: "relative z-50 w-full max-w-lg rounded-xl border border-[#1e2d3d] bg-[#111827] p-6 shadow-lg", children: children })] }));
};
const DialogHeader = ({ className, ...props }) => (_jsx("div", { className: cn('mb-4', className), ...props }));
const DialogTitle = ({ className, ...props }) => (_jsx("h2", { className: cn('text-lg font-semibold text-[#e2e8f0]', className), ...props }));
const DialogContent = ({ className, ...props }) => (_jsx("div", { className: cn('space-y-4', className), ...props }));
const DialogFooter = ({ className, ...props }) => (_jsx("div", { className: cn('flex justify-end gap-2 pt-2', className), ...props }));
export { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter };
