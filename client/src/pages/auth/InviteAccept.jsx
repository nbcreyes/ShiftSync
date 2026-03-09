import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Clock, Eye, EyeOff } from 'lucide-react'
import { validateToken, acceptInvite } from '../../api/invite'
import { login } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const InviteAccept = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [invite, setInvite] = useState(null)
  const [error, setError] = useState(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const validate = async () => {
      try {
        const res = await validateToken(token)
        setInvite(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid invite link')
      } finally {
        setLoading(false)
      }
    }
    if (token) validate()
    else { setError('No invite token provided'); setLoading(false) }
  }, [token])

  const handleAccept = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await acceptInvite(token, password)
      const loginRes = await login({ email: invite.email, password })
      const { accessToken, user } = loginRes.data
      setAuth(user, accessToken)
      toast.success('Account created. Please set a new password.')
      navigate('/change-password')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept invite')
    } finally {
      setSubmitting(false)
    }
  }

  const Logo = () => (
    <div className="flex items-center justify-center gap-2.5 mb-8">
      <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-glow">
        <Clock size={18} className="text-white" />
      </div>
      <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">ShiftSync</span>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="text-center max-w-sm animate-fade-in">
          <Logo />
          <div className="card shadow-card p-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Invite unavailable</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
            <p className="text-xs text-slate-400 mt-2">Contact your admin for a new invite.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <Logo />

        <div className="card shadow-card p-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 tracking-tight">You've been invited</h2>
          <p className="text-sm text-slate-400 mb-5">
            Joining <span className="font-semibold text-slate-700 dark:text-slate-300">{invite?.workspaceName}</span> as{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{invite?.role}</span>.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 mb-5 text-sm">
            <p className="text-xs text-slate-400 mb-1">Invited as</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{invite?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{invite?.email}</p>
          </div>

          <form onSubmit={handleAccept} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Temporary password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-base pr-10"
                  placeholder="Enter the temporary password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Accepting...' : 'Accept invite'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default InviteAccept