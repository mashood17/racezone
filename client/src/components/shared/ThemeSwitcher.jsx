import { useRace } from '../../context/RaceContext'
import { themes } from '../../styles/themes'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useRace()

  const icons = {
    night: '🌙',
    f1blue: '🔵',
    classic: '🏁',
    neon: '⚡',
  }

  return (
    <div className="flex items-center gap-1">
      {Object.entries(themes).map(([key, t]) => (
        <button
          key={key}
          onClick={(e) => {
            e.stopPropagation()
            setTheme(key)
          }}
          title={t.name}
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1px',
            cursor: 'pointer',
            border: `2px solid ${theme === key ? t.accent : '#333'}`,
            backgroundColor: theme === key ? t.accent + '33' : 'transparent',
            color: theme === key ? t.accent : '#666',
            transition: 'all 0.2s',
            fontFamily: 'Rajdhani, sans-serif',
          }}
        >
          {icons[key]} {t.name}
        </button>
      ))}
    </div>
  )
}