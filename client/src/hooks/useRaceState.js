import { useState, useEffect, useRef } from 'react'
import { RACE_STATUS } from '../utils/constants'

export const useRaceState = (initialStatus = RACE_STATUS.WAITING) => {
  const [status, setStatus] = useState(initialStatus)
  const [countdown, setCountdown] = useState(3)
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  const startCountdown = (onComplete) => {
    setStatus(RACE_STATUS.COUNTDOWN)
    setCountdown(3)
    let count = 3
    const interval = setInterval(() => {
      count -= 1
      setCountdown(count)
      if (count <= 0) {
        clearInterval(interval)
        setStatus(RACE_STATUS.ACTIVE)
        setIsRunning(true)
        startTimeRef.current = Date.now()
        onComplete && onComplete()
      }
    }, 1000)
  }

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    startTimeRef.current = Date.now() - elapsed * 1000
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    setIsRunning(true)
  }

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRunning(false)
  }

  const resetTimer = () => {
    stopTimer()
    setElapsed(0)
    setCountdown(3)
    setStatus(RACE_STATUS.WAITING)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return {
    status, setStatus,
    countdown, setCountdown,
    elapsed, setElapsed,
    isRunning,
    startCountdown, startTimer, stopTimer, resetTimer,
  }
}