import { create } from 'zustand'

// Apply theme to DOM immediately on load (before React renders)
const storedTheme = localStorage.getItem('theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const isDarkInitial = storedTheme ? storedTheme === 'dark' : prefersDark

if (isDarkInitial) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

const useThemeStore = create((set) => ({
  isDark: isDarkInitial,
  toggleTheme: () =>
    set((state) => {
      const next = !state.isDark
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      return { isDark: next }
    }),
}))

export default useThemeStore