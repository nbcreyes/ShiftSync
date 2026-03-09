import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Eye, EyeOff } from 'lucide-react'
import { changePassword } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const ChangePassword = () => {
  const navigate = useNavigate()
  const { user, setAuth, accessToken } = useAuthStore()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    if (form.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      setAuth({ ...user, mustChangePassword: false }, accessToken)
      toast.success('Password changed')
      if (user?.role === 'superuser') navigate('/superuser')
      else if (user?.role === 'employee') navigate('/dashboard')
      else navigate('/admin')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: 'currentPassword', label: 'Current password', showKey: 'current' },
    { name: 'newPassword',     label: 'New password',     showKey: 'new' },
    { name: 'confirmPassword', label: 'Confirm new password', showKey: 'confirm' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm animate-fade-in">

        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-glow">
            <Clock size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">ShiftSync</span>
        </div>

        <div className="card shadow-card p-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 tracking-tight">Change your password</h2>
          {user?.mustChangePassword && (
            <p className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-2 mb-4 mt-2">
              You must set a new password before continuing.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {fields.map(({ name, label, showKey }) => (
              <div key={name}>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
                <div className="relative">
                  <input
                    type={show[showKey] ? 'text' : 'password'}
                    name={name}
                    value={form[name]}
                    onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                    required
                    className="input-base pr-10"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShow({ ...show, [showKey]: !show[showKey] })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Saving...' : 'Change password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword