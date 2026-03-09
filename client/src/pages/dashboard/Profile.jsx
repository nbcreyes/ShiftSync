import { useState } from 'react'
import { User, Lock, Save } from 'lucide-react'
import { updateProfile, changePassword } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import toast from 'react-hot-toast'

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
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const handleProfileSave = async () => {
    if (!profileForm.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSavingProfile(true)
    try {
      const res = await updateProfile({
        name: profileForm.name,
        department: profileForm.department,
      })
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
      toast.error('All password fields are required')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSavingPassword(false)
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
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Personal Information
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Your full name"
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="input-base w-full opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Department
                </label>
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
              <button
                onClick={handleProfileSave}
                disabled={savingProfile}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={14} />
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Change password */}
          <div className="card shadow-soft p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <Lock size={14} className="text-brand-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Change Password
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  New Password
                </label>
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
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Confirm New Password
                </label>
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
              <button
                onClick={handlePasswordSave}
                disabled={savingPassword}
                className="btn-primary flex items-center gap-2"
              >
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