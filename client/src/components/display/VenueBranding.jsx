export default function VenueBranding({ venueName, venueLogoUrl }) {
  if (!venueName && !venueLogoUrl) {
    return (
      <div className="bg-darkcard border border-darkborder rounded-xl p-4 text-center">
        <div className="text-xs text-gray-600 uppercase tracking-widest">Venue Partner</div>
        <div className="text-gray-700 text-xs mt-1">Your Logo Here</div>
      </div>
    )
  }

  return (
    <div className="bg-darkcard border border-yellow-500/30 rounded-xl p-4 text-center">
      <div className="text-xs text-yellow-500/70 uppercase tracking-widest mb-2">Venue Partner</div>
      {venueLogoUrl ? (
        <img src={venueLogoUrl} alt={venueName} className="h-10 object-contain mx-auto" />
      ) : (
        <div className="text-white font-bold text-lg">{venueName}</div>
      )}
    </div>
  )
}