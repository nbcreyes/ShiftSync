import { useState, useEffect } from 'react'
import { User, Lock, Save, Bell } from 'lucide-react'
import { updateProfile, changePassword, getNotificationPrefs, updateNotificationPrefs } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import toast from 'react-hot-toast'

const PREF_CONFIG = [
  {
    key: 'emailOnLeaveReviewed',
    label: 'Leave request reviewed',
    description: 'When your leave request is approved or rejected',
  },
  {
    key: 'emailOnRemarkCreated',
    label: 'New remark on log',
    description: 'When an admin flags one of your time logs',
  },
  {
    key: 'emailOnRemarkReply',
    label: 'Remark thread reply',
    description: 'When someone replies in a remark thread',
  },
  {
    key: 'emailOnRemarkResolved',
    label: 'Remark resolved',
    description: 'When an admin resolves a remark on your log',
  },
  {
    key: 'emailOnManualLogReview',
    label: 'Manual log request reviewed',
    description: 'When your manual log request is approved or rejected',
  },
  {
    key: 'emailOnOvertime',
    label: 'Overtime alert',
    description: 'When you clock out after working more than 8 hours',
  },
]

const Toggle = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
      enabled ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-600'
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        enabled ? 'translate-x-4' : 'translate-x-1'
      }`}
    />
  </button>
)

const Profile = () => {
  const { user, setUser } = useAuthStore()

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [prefs, setPrefs] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await getNotificationPrefs()
        setPrefs(res.data)
      } catch {
        // non-critical
      }
    }
    fetchPrefs()
  }, [])

  const handleProfileSave = async () => {
    if (!profileForm.name.trim()) { toast.error('Name is required'); return }
    setSavingProfile(true)
    try {
      const res = await updateProfile({ name: profileForm.name, department: profileForm.department })
      setUser({ ...user, name: res.data.name, department: res.data.department })
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All password fields are required'); return
    }
    if (passwordForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match'); return }
    setSavingPassword(true)
    try {
      await changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      toast.success('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  const handlePrefToggle = (key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }

  const handlePrefsSave = async () => {
    setSavingPrefs(true)
    try {
      const res = await updateNotificationPrefs(prefs)
      setPrefs(res.data)
      toast.success('Notification preferences saved')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save preferences')
    } finally {
      setSavingPrefs(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Profile" />
        <div className="p-6 space-y-5 max-w-2xl mx-auto animate-fade-in">

          {/* Avatar + name header */}
          <div className="card shadow-soft p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-sm text-slate-400 mt-0.5">{user?.email}</p>
              <span className="inline-block mt-1.5 text-xs font-semibold capitalize bg-brand-50 dark:bg-brand-900/30 text-brand-500 px-2 py-0.5 rounded-lg">
                {user?.role}
              </span>
            </div>
          </div>

          {/* Profile info */}
          <div className="card shadow-soft p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <User size={14} className="text-brand-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Personal Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Your full name"
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
                <input type="email" value={user?.email} disabled className="input-base w-full opacity-50 cursor-not-allowed" />
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Department</label>
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  placeholder="e.g. Engineering, Marketing..."
                  className="input-base w-full"
                />
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button onClick={handleProfileSave} disabled={savingProfile} className="btn-primary flex items-center gap-2">
                <Save size={14} />
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Notification preferences */}
          <div className="card shadow-soft p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <Bell size={14} className="text-brand-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Email Notifications</h2>
                <p className="text-xs text-slate-400 mt-0.5">Choose which emails you receive from ShiftSync</p>
              </div>
            </div>

            {prefs === null ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {PREF_CONFIG.map(({ key, label, description }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                    </div>
                    <Toggle
                      enabled={prefs[key] ?? true}
                      onChange={(val) => handlePrefToggle(key, val)}
                    />
                  </div>
                ))}
              </div>
            )}

            {prefs !== null && (
              <div className="flex justify-end mt-5">
                <button onClick={handlePrefsSave} disabled={savingPrefs} className="btn-primary flex items-center gap-2">
                  <Save size={14} />
                  {savingPrefs ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            )}
          </div>

          {/* Change password */}
          <div className="card shadow-soft p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <Lock size={14} className="text-brand-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Change Password</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="input-base w-full"
                />
                <p className="text-xs text-slate-400 mt-1">Minimum 8 characters</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="input-base w-full"
                />
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button onClick={handlePasswordSave} disabled={savingPassword} className="btn-primary flex items-center gap-2">
                <Lock size={14} />
                {savingPassword ? 'Saving...' : 'Change Password'}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default Profile