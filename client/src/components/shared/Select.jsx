import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

const Select = ({ options = [], value, onChange, placeholder = 'Select...', className = '' }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-base flex items-center justify-between gap-2 cursor-pointer"
      >
        <span className={selected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-card overflow-hidden animate-slide-up">
          <div className="max-h-52 overflow-y-auto py-1.5">
            {options.length === 0 && (
              <div className="px-3.5 py-2.5 text-sm text-slate-400">No options available</div>
            )}
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <span className={value === opt.value
                  ? 'text-brand-600 dark:text-brand-400 font-medium'
                  : 'text-slate-700 dark:text-slate-200'
                }>
                  {opt.label}
                </span>
                {value === opt.value && (
                  <Check size={14} className="text-brand-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Select