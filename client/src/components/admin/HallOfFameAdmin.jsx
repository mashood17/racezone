import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import HallOfFame from '../display/HallOfFame'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function HallOfFameAdmin() {
  const { token } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = async () => {
    try {
      const res = await fetch(`${API}/races/hall-of-fame`)
      const data = await res.json()
      setRecords(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const handleDelete = async (id) => {
    if (id === 'reset') {
      if (!confirm('Reset entire Hall of Fame?')) return
      await fetch(`${API}/races/hall-of-fame`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
    } else {
      if (!confirm('Delete this record?')) return
      await fetch(`${API}/races/hall-of-fame/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
    }
    fetchRecords()
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-white animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400 uppercase tracking-widest font-bold">
        Hall of Fame Management
      </div>

      <HallOfFame
        records={records}
        isAdmin={true}
        onDelete={handleDelete}
      />

      <div className="bg-darkcard border border-darkborder rounded-xl p-4">
        <div className="text-xs text-gray-500 leading-relaxed">
          <div className="font-bold text-gray-400 mb-2">ℹ️ How it works</div>
          <p>Top 5 fastest laps from all races are automatically tracked.</p>
          <p className="mt-1">When a driver sets a faster lap than any existing record, it automatically appears here.</p>
          <p className="mt-1">You can delete individual records or reset the entire Hall of Fame.</p>
        </div>
      </div>

      <button
        onClick={fetchRecords}
        className="w-full py-2 border border-darkborder text-gray-400 hover:text-white rounded-lg text-sm transition-all"
      >
        🔄 Refresh
      </button>
    </div>
  )
}