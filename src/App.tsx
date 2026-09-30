import { Navigate, Route, Routes } from 'react-router-dom'
import { TvBoard } from './pages/TvBoard'
import { Admin } from './pages/Admin'

// The rotating TV board (cycles Top 5 → Bottom 5/Focus 5 → Performance →
// Operations every 15s) lives at the root URL so the shop-floor link has no
// trailing path. /top5 is kept as an alias so any existing bookmarks/links
// still work, plus /admin. Anything else falls back to the board.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TvBoard />} />
      <Route path="/top5" element={<TvBoard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
