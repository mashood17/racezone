import { createContext, useContext, useState, useCallback } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const RaceContext = createContext(null)

export const RaceProvider = ({ children }) => {
  const [activeRace, setActiveRace] = useState(null)
  const [entries, setEntries] = useState([])
  const [raceStatus, setRaceStatus] = useState('waiting')
  const [hallOfFame, setHallOfFame] = useState([])
  const [raceHistory, setRaceHistory] = useState([])
  const [theme, setTheme] = useState('night')

  const fetchActiveRace = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/races/active`)
      if (data) {
        setActiveRace(data)
        setRaceStatus(data.status)
        const detail = await axios.get(`${API}/races/${data.id}`)
        setEntries(detail.data.entries || [])
      }
    } catch (err) {
      console.error('fetchActiveRace error:', err)
    }
  }, [])

  const fetchHallOfFame = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/races/hall-of-fame`)
      setHallOfFame(data)
    } catch (err) {
      console.error('fetchHallOfFame error:', err)
    }
  }, [])

  const fetchRaceHistory = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/races`)
      setRaceHistory(data.slice(0, 5))
    } catch (err) {
      console.error('fetchRaceHistory error:', err)
    }
  }, [])

  const updateEntries = useCallback((newEntries) => {
    setEntries(newEntries)
  }, [])

  return (
    <RaceContext.Provider value={{
      activeRace, setActiveRace,
      entries, setEntries, updateEntries,
      raceStatus, setRaceStatus,
      hallOfFame, fetchHallOfFame,
      raceHistory, fetchRaceHistory,
      theme, setTheme,
      fetchActiveRace,
    }}>
      {children}
    </RaceContext.Provider>
  )
}

export const useRace = () => {
  const ctx = useContext(RaceContext)
  if (!ctx) throw new Error('useRace must be used within RaceProvider')
  return ctx
}