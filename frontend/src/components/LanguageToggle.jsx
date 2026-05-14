import { useLanguage } from '../context/languageCore'

export default function LanguageToggle({ compact = false }) {
  const { language, setLanguage } = useLanguage()

  return (
    <div className={`inline-flex rounded-lg border border-gray-700 bg-gray-900 p-1 ${compact ? '' : 'shadow-sm'}`}>
      {['en', 'tr'].map(option => (
        <button
          key={option}
          type="button"
          onClick={() => setLanguage(option)}
          className={`min-w-10 rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition ${
            language === option
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
          aria-pressed={language === option}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
