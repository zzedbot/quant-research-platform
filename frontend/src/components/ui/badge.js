import { jsx as _jsx } from "react/jsx-runtime";
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors', {
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
});
function Badge({ className, variant, ...props }) {
    return _jsx("span", { className: cn(badgeVariants({ variant }), className), ...props });
}
export { Badge, badgeVariants };
