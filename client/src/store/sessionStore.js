import { create } from 'zustand'

const useSessionStore = create((set, get) => ({
  todayLog: null,
  breaks: [],
  openBreak: null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // fallback to browser tz

  setTodaySession: (log, breaks, openBreak) => set({ todayLog: log, breaks, openBreak }),
  setTodayLog: (log) => set({ todayLog: log }),
  setOpenBreak: (openBreak) => set({ openBreak }),
  setTimezone: (timezone) => set({ timezone }),
  clearSession: () => set({ todayLog: null, breaks: [], openBreak: null }),
}))

export default useSessionStore