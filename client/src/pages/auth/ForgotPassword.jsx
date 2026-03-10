import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ArrowLeft } from 'lucide-react'
import { forgotPassword } from '../../api/auth'
import toast from 'react-hot-toast'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await forgotPassword({ email })
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

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
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Check your email</h2>
              <p className="text-sm text-slate-400 mb-6">
                If an account exists for <strong className="text-slate-600 dark:text-slate-300">{email}</strong>, a reset link has been sent. Check your inbox.
              </p>
              <Link to="/login" className="btn-primary w-full inline-block text-center">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 tracking-tight">Forgot password?</h2>
              <p className="text-sm text-slate-400 mb-6">Enter your email and we'll send you a reset link.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-base"
                    placeholder="you@company.com"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>

        {!sent && (
          <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mt-5 transition-colors">
            <ArrowLeft size={14} />
            Back to login
          </Link>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword