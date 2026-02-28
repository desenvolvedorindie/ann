import { useState, useEffect } from 'react';
import { focusClasses } from './constants';

export const NumberInput = ({ value, onChange, label, focusColor = "blue" }: { value: number, onChange: (val: number) => void, label: string, focusColor?: string }) => {
    const [strValue, setStrValue] = useState(value.toString());

    useEffect(() => {
        // Only update local string if it differs numerically to avoid overriding trailing dots or minus signs
        const parsed = parseFloat(strValue);
        if (isNaN(parsed) || parsed !== value) {
            setStrValue(value.toString());
        }
    }, [value, strValue]);

    const borderFocusClass = focusClasses[focusColor] || focusClasses['blue'];

    return (
        <div className="flex flex-col gap-1 mt-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                {focusColor === 'amber' ? <span className="text-amber-400 font-bold">{label}</span> :
                    focusColor === 'indigo' ? <span className="text-indigo-400 font-bold">{label}</span> : label}
            </label>
            <input
                type="text"
                value={strValue}
                onChange={(e) => {
                    const val = e.target.value;
                    // Allow only empty, a single minus sign, or a valid float format
                    if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) {
                        setStrValue(val);
                        const parsed = parseFloat(val);
                        if (!isNaN(parsed)) {
                            onChange(parsed);
                        } else if (val === '' || val === '-') {
                            onChange(0); // Default to 0 in the domain when empty or just a minus
                        }
                    }
                }}
                className={`px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:outline-none ${borderFocusClass} transition-colors w-full`}
            />
        </div>
    );
};

// Use native number input for fields like Width/Height where stepper UI is desired
export const NativeNumberInput = ({ value, onChange, label, focusColor = "pink", min = 1, max = 100, step }: { value: number, onChange: (val: number) => void, label: string, focusColor?: string, min?: number, max?: number, step?: number }) => {
    const borderFocusClass = focusClasses[focusColor] || focusClasses['pink'];

    return (
        <div className="flex flex-col gap-1 mt-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{label}</label>
            <input
                type="number"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => {
                    const parsed = step ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
                    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
                        onChange(parsed);
                    } else if (!isNaN(parsed) && max === undefined && min === undefined) {
                        onChange(parsed);
                    } else if (!isNaN(parsed) && max === undefined && parsed >= min) {
                        onChange(parsed);
                    } else if (!isNaN(parsed) && min === undefined && parsed <= max) {
                        onChange(parsed);
                    }
                }}
                className={`px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:outline-none ${borderFocusClass} transition-colors w-full`}
            />
        </div>
    );
};
