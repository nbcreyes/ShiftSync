import { useState } from 'react'
import { sendInvite } from '../../api/invite'
import useAuthStore from '../../store/authStore'
import Select from '../shared/Select'
import toast from 'react-hot-toast'

const InviteForm = ({ onSuccess }) => {
  const user = useAuthStore((s) => s.user)
  const [form, setForm] = useState({ name: '', email: '', role: 'employee', department: '', tempPassword: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await sendInvite(form)
      toast.success(`Invite sent to ${form.email}`)
      setForm({ name: '', email: '', role: 'employee', department: '', tempPassword: '' })
      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card shadow-soft p-6">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">Send Invite</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Full name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-base" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="input-base" placeholder="jane@company.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Role</label>
            <Select
              options={[
                { value: 'employee', label: 'Employee' },
                ...(user?.role === 'owner' ? [{ value: 'admin', label: 'Admin' }] : []),
              ]}
              value={form.role}
              onChange={(val) => setForm({ ...form, role: val })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Department</label>
            <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input-base" placeholder="Engineering" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Temporary password</label>
            <input type="text" value={form.tempPassword} onChange={(e) => setForm({ ...form, tempPassword: e.target.value })} required className="input-base" placeholder="Share this with the invitee" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? 'Sending...' : 'Send Invite'}
        </button>
      </form>
    </div>
  )
}

export default InviteForm