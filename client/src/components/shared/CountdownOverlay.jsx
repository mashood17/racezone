import { useEffect, useState } from 'react'

export default function CountdownOverlay({ onComplete }) {
  const [count, setCount] = useState(3)
  const [phase, setPhase] = useState('counting') // counting | go

  useEffect(() => {
    let current = 3
    const interval = setInterval(() => {
      current -= 1
      if (current <= 0) {
        clearInterval(interval)
        setPhase('go')
        setTimeout(() => onComplete && onComplete(), 1000)
      } else {
        setCount(current)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {phase === 'counting' ? (
        <div key={count} className="countdown-number text-center">
          <div className="text-[200px] font-bold leading-none text-f1red drop-shadow-[0_0_60px_rgba(225,6,0,0.8)]">
            {count}
          </div>
          <div className="text-2xl text-gray-400 tracking-[0.5em] mt-4">GET READY</div>
        </div>
      ) : (
        <div className="countdown-number text-center">
          <div className="text-[150px] font-bold leading-none text-f1gold drop-shadow-[0_0_60px_rgba(255,215,0,0.9)] tracking-widest">
            GO!
          </div>
        </div>
      )}
    </div>
  )
}