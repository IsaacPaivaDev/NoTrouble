import { createContext, useState, useContext, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  // Recupera preferencia salva; default = escuro
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('notrouble_theme')
    return saved !== null ? saved === 'dark' : true
  })

  useEffect(() => {
    const root = document.documentElement

    // Persiste a escolha
    localStorage.setItem('notrouble_theme', isDarkMode ? 'dark' : 'light')

    // Diz pro browser renderizar elementos nativos (select, date, scrollbar) no tema certo
    root.style.colorScheme = isDarkMode ? 'dark' : 'light'

    // Adiciona/remove classe 'dark' no <html> pra Tailwind dark: funcionar
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  const toggleTheme = () => setIsDarkMode(prev => !prev)

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)