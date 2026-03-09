import { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'

const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const periods = ['am', 'pm']

const to24hr = (h, m, period) => {
  let hour = parseInt(h)
  if (period === 'am' && hour === 12) hour = 0
  if (period === 'pm' && hour !== 12) hour += 12
  return `${String(hour).padStart(2, '0')}:${m}`
}

const from24hr = (value) => {
  if (!value) return { h: '09', m: '00', period: 'am' }
  const [hStr, mStr] = value.split(':')
  let hour = parseInt(hStr)
  const period = hour >= 12 ? 'pm' : 'am'
  if (hour === 0) hour = 12
  else if (hour > 12) hour -= 12
  return { h: String(hour).padStart(2, '0'), m: mStr, period }
}

const Column = ({ items, selected, onSelect }) => {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const activeEl = el.querySelector('[data-active="true"]')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [selected])

  return (
    <div
      ref={ref}
      className="flex flex-col gap-0.5 max-h-52 overflow-y-auto px-1.5 py-2 scrollbar-hide"
    >
      {items.map((item) => {
        const isActive = selected === item
        return (
          <button
            key={item}
            type="button"
            data-active={isActive}
            onClick={() => onSelect(item)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 text-center shrink-0 ${
              isActive
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}

export default function TimePicker({ value, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(() => from24hr(value))
  const ref = useRef(null)

  useEffect(() => {
    setSelected(from24hr(value))
  }, [value])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const update = (key, val) => {
    const next = { ...selected, [key]: val }
    setSelected(next)
    onChange(to24hr(next.h, next.m, next.period))
  }

  const displayValue = `${selected.h}:${selected.m} ${selected.period}`

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-base flex items-center gap-2.5 cursor-pointer w-full"
      >
        <Clock size={13} className="text-slate-400 shrink-0" />
        <span className="text-sm text-slate-900 dark:text-slate-100 flex-1 text-left">
          {displayValue}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-card animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/60">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Select time
            </p>
          </div>

          <div className="flex divide-x divide-slate-100 dark:divide-slate-700/60 p-1">
            {/* Hours */}
            <Column
              items={hours}
              selected={selected.h}
              onSelect={(val) => update('h', val)}
            />

            {/* Minutes */}
            <Column
              items={minutes}
              selected={selected.m}
              onSelect={(val) => update('m', val)}
            />

            {/* AM/PM */}
            <div className="flex flex-col gap-0.5 px-1.5 py-2 justify-start">
              {periods.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => update('period', p)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 text-center ${
                    selected.period === p
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}