import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
const buttonVariants = cva('inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50', {
    variants: {
        variant: {
            default: 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]',
            outline: 'border border-[#1e2d3d] bg-transparent hover:bg-[#1a2332] text-[#e2e8f0]',
            ghost: 'hover:bg-[#1a2332] text-[#64748b] hover:text-[#e2e8f0]',
            destructive: 'bg-red-600 text-white hover:bg-red-700',
        },
        size: {
            default: 'h-10 px-4 py-2',
            sm: 'h-8 rounded-md px-3 text-xs',
            lg: 'h-12 rounded-md px-8',
            icon: 'h-10 w-10',
        },
    },
    defaultVariants: { variant: 'default', size: 'default' },
});
const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => (_jsx("button", { className: cn(buttonVariants({ variant, size, className })), ref: ref, ...props })));
Button.displayName = 'Button';
export { Button, buttonVariants };
