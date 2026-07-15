import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import Layout from './components/Layout'
import PasswordGate from './components/PasswordGate'
import Watchlist from './pages/Watchlist'
import NewsFeed from './pages/NewsFeed'
import SignalTracker from './pages/SignalTracker'
import MorningBriefs from './pages/MorningBriefs'
import Settings from './pages/Settings'

function OwnerOnly({ children }) {
  const isOwner = useStore(s => s.isOwner)
  if (!isOwner) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const isAuthenticated = useStore(s => s.isAuthenticated)

  if (!isAuthenticated) return <PasswordGate />

  return (
    <Layout>
      <Routes>
        <Route path="/"         element={<Watchlist />} />
        <Route path="/news"     element={<NewsFeed />} />
        <Route path="/signals"  element={<SignalTracker />} />
        <Route path="/briefs"   element={<MorningBriefs />} />
        <Route path="/settings" element={<OwnerOnly><Settings /></OwnerOnly>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
