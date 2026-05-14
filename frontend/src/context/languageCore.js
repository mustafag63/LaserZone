import React, { createContext } from 'react'

export const LanguageContext = createContext(null)

export function useLanguage() {
  const context = React.useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
