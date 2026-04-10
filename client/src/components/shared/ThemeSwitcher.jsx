import { useRace } from '../../context/RaceContext'
import { themes } from '../../styles/themes'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useRace()

  return (
    <div className="flex gap-2">
      {Object.entries(themes).map(([key, t]) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
            theme === key
              ? 'border-f1red bg-f1red text-white'
              : 'border-gray-600 text-gray-400 hover:border-gray-400'
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>
  )
}