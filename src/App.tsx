import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ControlPage } from './pages/ControlPage'
import { DriverPage } from './pages/DriverPage'
import { FaultsPage } from './pages/FaultsPage'
import { MonitorPage } from './pages/MonitorPage'
import { SystemPage } from './pages/SystemPage'
import { TwinPage } from './pages/TwinPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<MonitorPage />} />
          <Route path="faults" element={<FaultsPage />} />
          <Route path="control" element={<ControlPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="twin" element={<TwinPage />} />
          <Route path="driver" element={<DriverPage />} />
          <Route path="system" element={<SystemPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
