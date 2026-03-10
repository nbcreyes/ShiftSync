import { create } from 'zustand'
import { getPendingCounts } from '../api/pending'

const usePendingStore = create((set) => ({
  pendingLeave: 0,
  pendingManualLogs: 0,
  totalPending: 0,

  fetchPendingCounts: async () => {
    try {
      const res = await getPendingCounts()
      const { pendingLeave, pendingManualLogs } = res.data
      set({
        pendingLeave,
        pendingManualLogs,
        totalPending: pendingLeave + pendingManualLogs,
      })
    } catch (err) {
      console.error('[pendingStore] fetch failed:', err.message)
    }
  },

  clearPending: () => set({ pendingLeave: 0, pendingManualLogs: 0, totalPending: 0 }),
}))

export default usePendingStore