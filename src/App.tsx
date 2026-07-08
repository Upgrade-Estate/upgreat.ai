import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import EnergyLoopPage from './pages/EnergyLoopPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/energy-loop" element={<EnergyLoopPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
