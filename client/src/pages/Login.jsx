import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      login(data.token, { username: data.username, role: data.role })
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-darkbg flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-f1red text-5xl mb-3">⚡</div>
          <h1 className="text-4xl font-black text-white font-race tracking-widest">RACEZONE</h1>
          <p className="text-gray-500 mt-2 tracking-wider">ADMIN CONTROL PANEL</p>
        </div>

        {/* Card */}
        <div className="bg-darkcard border border-darkborder rounded-2xl p-8">
          <h2 className="text-white font-bold text-xl mb-6 font-race tracking-wider">SIGN IN</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              ❌ {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs tracking-widest block mb-2">USERNAME</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin(e)}
                placeholder="admin"
                className="w-full bg-darkbg border border-darkborder text-white px-4 py-3 rounded-lg focus:outline-none focus:border-f1red transition-colors"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs tracking-widest block mb-2">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin(e)}
                placeholder="••••••••"
                className="w-full bg-darkbg border border-darkborder text-white px-4 py-3 rounded-lg focus:outline-none focus:border-f1red transition-colors"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-4 bg-f1red hover:bg-red-700 disabled:opacity-50 text-white font-black font-race text-xl tracking-widest rounded-lg transition-all mt-2"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN →'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-darkborder">
            <p className="text-gray-600 text-xs text-center">
              Default: <span className="text-gray-400">admin</span> / <span className="text-gray-400">racezone2024</span>
            </p>
            <p className="text-gray-700 text-xs text-center mt-1">
              Change these in server/.env before going live
            </p>
          </div>
        </div>

        {/* Link to display */}
        <div className="text-center mt-6">
          <a href="/" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
            ← Back to Display Screen
          </a>
        </div>
      </div>
    </div>
  )
}