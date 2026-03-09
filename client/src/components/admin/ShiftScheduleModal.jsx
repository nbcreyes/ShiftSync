import { useState, useEffect } from 'react'
import { X, Clock, Trash2 } from 'lucide-react'
import { getSchedule, setSchedule, deleteSchedule } from '../../api/shift'
import Select from '../shared/Select'
import TimePicker from '../shared/TimePicker'
import toast from 'react-hot-toast'

const DAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
]

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Sao_Paulo', 'Europe/London',
  'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow', 'Africa/Cairo',
  'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Dhaka',
  'Asia/Bangkok', 'Asia/Singapore', 'Asia/Manila', 'Asia/Shanghai',
  'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney', 'Pacific/Auckland',
  'Pacific/Honolulu',
]

const ShiftScheduleModal = ({ user, onClose, onSaved }) => {
  const [form, setForm] = useState({
    startTime: '09:00',
    endTime: '18:00',
    workDays: [1, 2, 3, 4, 5],
    lateTolerance: 5,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hasExisting, setHasExisting] = useState(false)

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await getSchedule(user._id)
        if (res.data) {
          setForm({
            startTime: res.data.startTime,
            endTime: res.data.endTime,
            workDays: res.data.workDays,
            lateTolerance: res.data.lateTolerance,
            timezone: res.data.timezone,
          })
          setHasExisting(true)
        }
      } catch {
        // 404 = no schedule yet, that's fine
      } finally {
        setLoading(false)
      }
    }
    fetchExisting()
  }, [user._id])

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter((d) => d !== day)
        : [...prev.workDays, day].sort((a, b) => a - b),
    }))
  }

  const handleSave = async () => {
    if (form.workDays.length === 0) {
      toast.error('Select at least one work day')
      return
    }
    if (!form.startTime || !form.endTime) {
      toast.error('Start and end time are required')
      return
    }
    if (form.startTime >= form.endTime) {
      toast.error('End time must be after start time')
      return
    }

    setSaving(true)
    try {
      await setSchedule(user._id, form)
      toast.success(`Schedule ${hasExisting ? 'updated' : 'set'} for ${user.name}`)
      if (onSaved) onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save schedule')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteSchedule(user._id)
      toast.success(`Schedule removed for ${user.name}`)
      if (onSaved) onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove schedule')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 shadow-card animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
              <Clock size={15} className="text-brand-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Shift Schedule
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{user.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Work days */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                Work Days
              </label>
              <div className="flex gap-1.5">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                      form.workDays.includes(day.value)
                        ? 'bg-brand-500 text-white shadow-soft'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start / End time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Start Time
                </label>
                <TimePicker
                  value={form.startTime}
                  onChange={(val) => setForm({ ...form, startTime: val })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  End Time
                </label>
                <TimePicker
                  value={form.endTime}
                  onChange={(val) => setForm({ ...form, endTime: val })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Late tolerance */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Late Tolerance (minutes)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={form.lateTolerance}
                onChange={(e) => setForm({ ...form, lateTolerance: Number(e.target.value) })}
                className="input-base w-full"
              />
              <p className="text-xs text-slate-400 mt-1">
                Employee is marked late only if they clock in more than {form.lateTolerance} minute{form.lateTolerance !== 1 ? 's' : ''} after their start time.
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Timezone
              </label>
              <Select
                options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
                value={form.timezone}
                onChange={(val) => setForm({ ...form, timezone: val })}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {!loading && (
          <div className="flex gap-2.5 mt-5">
            {hasExisting && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 shrink-0"
                title="Remove schedule"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? 'Saving...' : hasExisting ? 'Update Schedule' : 'Set Schedule'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShiftScheduleModal