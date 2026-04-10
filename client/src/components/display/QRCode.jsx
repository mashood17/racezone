import { QRCodeSVG } from 'qrcode.react'

export default function QRCode({ url }) {
  const bookingUrl = url || import.meta.env.VITE_BOOKING_URL || 'https://racezone.in'

  return (
    <div className="bg-darkcard border border-darkborder rounded-xl p-4 text-center">
      <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Book Your Race</div>
      <div className="flex justify-center">
        <div className="bg-white p-2 rounded-lg">
          <QRCodeSVG value={bookingUrl} size={80} />
        </div>
      </div>
      <div className="text-xs text-gray-600 mt-2 break-all">{bookingUrl}</div>
    </div>
  )
}