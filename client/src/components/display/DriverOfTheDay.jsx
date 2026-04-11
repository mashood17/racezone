import { useState, useEffect } from 'react'

export default function DriverOfTheDay({ entries, raceStatus }) {
  const [votes, setVotes] = useState({})
  const [voted, setVoted] = useState(false)
  const [winner, setWinner] = useState(null)
  const [showResult, setShowResult] = useState(false)

  // Reset votes when new race entries come in
  useEffect(() => {
    if (entries.length > 0) {
      const initial = {}
      entries.forEach(e => { initial[e.id] = 0 })
      setVotes(initial)
      setVoted(false)
      setWinner(null)
      setShowResult(false)
    }
  }, [entries.length])

  const handleVote = (entryId) => {
    if (voted) return
    setVotes(prev => ({ ...prev, [entryId]: (prev[entryId] || 0) + 1 }))
    setVoted(true)
  }

  const handleReveal = () => {
    const maxVotes = Math.max(...Object.values(votes))
    const winnerId = Object.keys(votes).find(id => votes[id] === maxVotes)
    const winnerEntry = entries.find(e => String(e.id) === String(winnerId))
    setWinner(winnerEntry)
    setShowResult(true)
  }

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0)

  if (!entries || entries.length === 0) return null

  // Show winner
  if (showResult && winner) {
    return (
      <div className="bg-darkcard border border-yellow-500/50 rounded-xl p-4 text-center">
        <div className="text-yellow-400 text-xs tracking-widest font-bold mb-3">
          ⭐ DRIVER OF THE DAY
        </div>
        <div className="text-5xl mb-2">{winner.avatar}</div>
        <div
          className="text-2xl font-black font-race"
          style={{ color: winner.color }}
        >
          {winner.name}
        </div>
        <div className="text-gray-500 text-xs mt-1">
          {votes[winner.id]} of {totalVotes} votes
        </div>
        <div className="mt-3 text-yellow-400 text-2xl animate-pulse">⭐</div>
      </div>
    )
  }

  return (
    <div className="bg-darkcard border border-darkborder rounded-xl p-4">
      <div className="text-gray-300 text-xs tracking-widest font-bold mb-3">
        ⭐ DRIVER OF THE DAY
      </div>

      {!voted ? (
        <>
          <p className="text-gray-500 text-xs mb-3">
            Who was the best driver today?
          </p>
          <div className="space-y-2">
            {entries.map(entry => (
              <button
                key={entry.id}
                onClick={() => handleVote(entry.id)}
                className="w-full flex items-center gap-3 p-2 rounded-lg border border-darkborder hover:border-gray-500 transition-all text-left"
                style={{ backgroundColor: entry.color + '11' }}
              >
                <span className="text-xl">{entry.avatar}</span>
                <span
                  className="font-bold text-sm"
                  style={{ color: entry.color }}
                >
                  {entry.name}
                </span>
                <span className="ml-auto text-gray-600 text-xs">
                  #{entry.car_number}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-green-400 text-xs mb-3">✅ Vote recorded!</p>
          <div className="space-y-2">
            {entries.map(entry => {
              const pct = totalVotes > 0
                ? Math.round(((votes[entry.id] || 0) / totalVotes) * 100)
                : 0
              return (
                <div key={entry.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: entry.color }}>{entry.name}</span>
                    <span className="text-gray-400">{votes[entry.id] || 0} votes</span>
                  </div>
                  <div className="h-1.5 bg-darkborder rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: entry.color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {totalVotes >= 2 && (
            <button
              onClick={handleReveal}
              className="w-full mt-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg transition-all"
            >
              🏆 REVEAL WINNER
            </button>
          )}
        </>
      )}
    </div>
  )
}