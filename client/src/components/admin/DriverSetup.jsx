import { useState } from 'react'
import { AVATARS, COLORS } from '../../utils/constants'

export default function DriverSetup({ onDriversReady, raceId, token }) {
  const [drivers, setDrivers] = useState([
    { name: '', avatar: '🏎️', car_number: '1', color: '#e10600' },
    { name: '', avatar: '🚗', car_number: '2', color: '#0067ff' },
  ])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const updateDriver = (index, field, value) => {
    setDrivers(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d))
  }

  const addDriver = () => {
    if (drivers.length >= 8) return
    setDrivers(prev => [...prev, {
      name: '',
      avatar: AVATARS[prev.length % AVATARS.length],
      car_number: String(prev.length + 1),
      color: COLORS[prev.length % COLORS.length].value,
    }])
  }

  const removeDriver = (index) => {
    if (drivers.length <= 2) return
    setDrivers(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    const valid = drivers.filter(d => d.name.trim())
    if (valid.length < 2) return alert('Add at least 2 driver names')
    setSaving(true)
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
      const createdDrivers = []

      for (const driver of valid) {
        const res = await fetch(`${API}/drivers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(driver),
        })
        const data = await res.json()
        createdDrivers.push(data)
      }

      // Add each driver to the race
      for (const driver of createdDrivers) {
        await fetch(`${API}/races/${raceId}/drivers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ driver_id: driver.id }),
        })
      }

      setSaved(true)
      onDriversReady(createdDrivers)
    } catch (err) {
      alert('Error saving drivers: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white font-race tracking-wider">
          DRIVER SETUP
        </h2>
        <button
          onClick={addDriver}
          disabled={drivers.length >= 8}
          className="text-sm bg-darkborder hover:bg-gray-700 text-white px-3 py-1 rounded"
        >
          + Add Driver
        </button>
      </div>

      <div className="space-y-3">
        {drivers.map((driver, index) => (
          <div key={index} className="bg-darkbg border border-darkborder rounded-lg p-3 space-y-2">
            {/* Name + Car Number */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Driver ${index + 1} name`}
                value={driver.name}
                onChange={e => updateDriver(index, 'name', e.target.value)}
                className="flex-1 bg-darkcard border border-darkborder text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-f1red"
              />
              <input
                type="text"
                placeholder="#"
                value={driver.car_number}
                onChange={e => updateDriver(index, 'car_number', e.target.value)}
                maxLength={3}
                className="w-16 bg-darkcard border border-darkborder text-white px-3 py-2 rounded text-sm text-center focus:outline-none focus:border-f1red"
              />
            </div>

            {/* Avatar picker */}
            <div className="flex gap-1 flex-wrap">
              {AVATARS.map(av => (
                <button
                  key={av}
                  onClick={() => updateDriver(index, 'avatar', av)}
                  className={`text-xl p-1 rounded ${driver.avatar === av ? 'bg-f1red' : 'bg-darkcard hover:bg-darkborder'}`}
                >
                  {av}
                </button>
              ))}
            </div>

            {/* Color picker */}
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-400">Color:</span>
              <div className="flex gap-1 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => updateDriver(index, 'color', c.value)}
                    title={c.name}
                    style={{ backgroundColor: c.value }}
                    className={`w-6 h-6 rounded-full border-2 ${driver.color === c.value ? 'border-white' : 'border-transparent'}`}
                  />
                ))}
              </div>
              {drivers.length > 2 && (
                <button
                  onClick={() => removeDriver(index)}
                  className="ml-auto text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || saved}
        className={`w-full py-3 rounded-lg font-bold font-race tracking-widest text-lg transition-all ${
          saved
            ? 'bg-green-600 text-white cursor-default'
            : 'bg-f1red hover:bg-red-700 text-white'
        }`}
      >
        {saved ? '✅ DRIVERS SAVED' : saving ? 'SAVING...' : 'SAVE DRIVERS'}
      </button>
    </div>
  )
}