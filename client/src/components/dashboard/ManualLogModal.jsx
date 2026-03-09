import { useState } from 'react'
import { X, ClipboardList } from 'lucide-react'
import { submitManualLog } from '../../api/manualLog'
import DatePicker from '../shared/DatePicker'
import TimePicker from '../shared/TimePicker'
import toast from 'react-hot-toast'

const ManualLogModal = ({ onClose, onSubmitted }) => {
  const [form, setForm] = useState({
    date: '',
    timeIn: '09:00',
    timeOut: '18:00',
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!form.date || !form.timeIn || !form.timeOut || !form.reason.trim()) {
      toast.error('All fields are required')
      return
    }

    const timeInISO = new Date(`${form.date}T${form.timeIn}:00`).toISOString()
    const timeOutISO = new Date(`${form.date}T${form.timeOut}:00`).toISOString()

    if (new Date(timeOutISO) <= new Date(timeInISO)) {
      toast.error('Time out must be after time in')
      return
    }

    setSubmitting(true)
    try {
      await submitManualLog({
        date: form.date,
        timeIn: timeInISO,
        timeOut: timeOutISO,
        reason: form.reason,
      })
      toast.success('Manual log request submitted')
      if (onSubmitted) onSubmitted()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 shadow-card animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
              <ClipboardList size={15} className="text-brand-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Request Manual Log
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Submit a missed clock-in for admin approval
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Date
            </label>
            <DatePicker
              value={form.date}
              onChange={(val) => setForm({ ...form, date: val })}
              maxDate={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Time In
              </label>
              <TimePicker
                value={form.timeIn}
                onChange={(val) => setForm({ ...form, timeIn: val })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Time Out
              </label>
              <TimePicker
                value={form.timeOut}
                onChange={(val) => setForm({ ...form, timeOut: val })}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Reason
            </label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={3}
              placeholder="Explain why you missed clocking in..."
              className="input-base resize-none w-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex-1"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ManualLogModal