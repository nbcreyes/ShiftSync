import { useState } from 'react'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import InviteForm from '../../components/admin/InviteForm'
import PendingInvites from '../../components/admin/PendingInvites'

const InviteManagement = () => {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Invites" />
        <div className="p-6 space-y-5 max-w-3xl mx-auto animate-fade-in">
          <InviteForm onSuccess={() => setRefreshKey((k) => k + 1)} />
          <PendingInvites refresh={refreshKey} />
        </div>
      </main>
    </div>
  )
}

export default InviteManagement