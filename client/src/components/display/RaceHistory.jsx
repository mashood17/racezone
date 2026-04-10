export default function RaceHistory({ races }) {
  if (!races || races.length === 0) {
    return (
      <div className="bg-darkcard border border-darkborder rounded-xl p-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Recent Races</div>
        <div className="text-gray-600 text-sm">No races yet</div>
      </div>
    )
  }

  return (
    <div className="bg-darkcard border border-darkborder rounded-xl p-4">
      <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Recent Races</div>
      <div className="space-y-2">
        {races.slice(0, 5).map((race, idx) => (
          <div key={race.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{race.venue_name || 'RaceZone Arena'}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              race.status === 'completed' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'
            }`}>
              {race.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}