import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { sanitizePersonName } from '../../lib/api';

export type SafeSelectOption = {
  value: string;
  label: string;
};

type SafeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SafeSelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  /** Accessible name for the control */
  label?: string;
  /** Sanitize option labels (strips autofill password tokens). Use for people/company names. */
  sanitizeLabels?: boolean;
};

/**
 * Custom select that never uses a native <select>.
 * Chrome/password managers inject credentials into native selects;
 * this component only uses buttons and is safe for session chrome and modals.
 */
export const SafeSelect: React.FC<SafeSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecionar…',
  className,
  buttonClassName,
  disabled = false,
  label,
  sanitizeLabels = false,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const cleaned = options.map((opt) => ({
    value: String(opt.value),
    label: sanitizeLabels ? sanitizePersonName(opt.label, String(opt.label || placeholder)) : String(opt.label),
  }));

  const selected = cleaned.find((o) => o.value === String(value));
  const display = selected?.label || placeholder;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label || placeholder}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-xl border text-xs font-medium min-h-[44px] transition-colors',
          'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100',
          'hover:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          buttonClassName
        )}
      >
        <span className={cn('truncate', !selected && 'text-slate-400')}>{display}</span>
        <ChevronDown className={cn('w-4 h-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label || placeholder}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121215] shadow-2xl py-1"
        >
          {cleaned.map((opt) => {
            const isActive = opt.value === String(value);
            return (
              <li key={opt.value || '__empty'} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-medium min-h-[40px]',
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
