import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

const applyTheme = (dark) => {
  const html = document.documentElement
  html.classList.remove('dark')
  if (dark) {
    html.classList.add('dark')
    html.style.colorScheme = 'dark'
  } else {
    html.style.colorScheme = 'light'
  }
  localStorage.setItem('theme', dark ? 'dark' : 'light')
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  const toggleTheme = () => {
    const next = !isDark
    applyTheme(next)
    setIsDark(next)
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
