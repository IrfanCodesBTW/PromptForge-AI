import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Settings } from './pages/Settings'
import { History } from './pages/History'
import { Templates } from './pages/Templates'
import { Sidebar } from './components/layout/Sidebar'
import { Titlebar } from './components/layout/Titlebar'
import { ToastContainer } from './components/ui/Toast'

function App(): JSX.Element {
  return (
    <HashRouter>
      <div className="flex flex-col h-screen bg-bg overflow-hidden">
        <Titlebar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-xl">
            <Routes>
              <Route path="/" element={<Navigate to="/settings" replace />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/history" element={<History />} />
              <Route path="/templates" element={<Templates />} />
            </Routes>
          </main>
        </div>
        <ToastContainer />
      </div>
    </HashRouter>
  )
}

export default App
