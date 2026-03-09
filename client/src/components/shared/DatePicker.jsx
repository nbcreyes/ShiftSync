import { useState, useRef, useEffect } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

const toLocalISO = (year, month, day) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const DatePicker = ({ value, onChange, placeholder = 'Pick a date', className = '', maxDate = null }) => {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => value ? new Date(value + 'T00:00:00') : new Date())
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (value) setViewDate(new Date(value + 'T00:00:00'))
  }, [value])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const isDisabled = (day) => {
    if (!maxDate) return false
    return toLocalISO(year, month, day) > maxDate
  }

  const selectDay = (day) => {
    if (isDisabled(day)) return
    const iso = toLocalISO(year, month, day)
    onChange(iso)
    setOpen(false)
  }

  const isSelected = (day) => {
    if (!value) return false
    return toLocalISO(year, month, day) === value
  }

  const isToday = (day) => {
    const t = new Date()
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day
  }

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
    : null

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-base flex items-center gap-2 cursor-pointer w-full"
      >
        <CalendarDays size={15} className="text-slate-400 shrink-0" />
        <span className={`flex-1 text-left text-sm ${displayValue ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
          {displayValue || placeholder}
        </span>
        {value && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 cursor-pointer transition-colors"
          >
            <X size={13} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-card p-4 w-72 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1.5">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day ? (
                  <button
                    onClick={() => selectDay(day)}
                    disabled={isDisabled(day)}
                    className={`w-8 h-8 rounded-xl text-sm font-medium transition-all duration-100
                      ${isDisabled(day)
                        ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        : isSelected(day)
                        ? 'bg-brand-500 text-white shadow-soft'
                        : isToday(day)
                        ? 'border-2 border-brand-500 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    {day}
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => { onChange(''); setOpen(false) }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => {
                const t = new Date()
                const todayISO = toLocalISO(t.getFullYear(), t.getMonth(), t.getDate())
                if (!maxDate || todayISO <= maxDate) {
                  selectDay(t.getDate())
                  setViewDate(t)
                }
              }}
              className="text-xs text-brand-500 hover:text-brand-600 font-semibold transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker