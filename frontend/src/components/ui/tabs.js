import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '../../lib/utils';
const TabsContext = React.createContext({ value: '', onValueChange: () => { } });
const Tabs = ({ defaultValue, value, onValueChange, children, className }) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || '');
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    const handleValueChange = (v) => {
        if (!isControlled)
            setInternalValue(v);
        onValueChange?.(v);
    };
    return (_jsx(TabsContext.Provider, { value: { value: currentValue, onValueChange: handleValueChange }, children: _jsx("div", { className: className, children: children }) }));
};
const TabsList = ({ children, className }) => (_jsx("div", { className: cn('inline-flex h-10 items-center rounded-lg bg-[#111827] p-1', className), children: children }));
const TabsTrigger = ({ value, children, className }) => {
    const ctx = React.useContext(TabsContext);
    const isActive = ctx.value === value;
    return (_jsx("button", { className: cn('inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all', isActive ? 'bg-primary text-white shadow-sm' : 'text-[#64748b] hover:text-[#e2e8f0]', className), onClick: () => ctx.onValueChange(value), children: children }));
};
const TabsContent = ({ value, children, className }) => {
    const ctx = React.useContext(TabsContext);
    if (ctx.value !== value)
        return null;
    return _jsx("div", { className: className, children: children });
};
export { Tabs, TabsList, TabsTrigger, TabsContent };
