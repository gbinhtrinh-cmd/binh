import { useStore } from '../store/useStore'
import { Bell, LogOut } from 'lucide-react'

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-surface-border'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

async function requestNotifications() {
  if (!('Notification' in window)) { alert('Notifications not supported in this browser.'); return }
  const permission = await Notification.requestPermission()
  if (permission === 'granted') {
    new Notification('TradingDesk Alerts Active', {
      body: 'You will now receive watchlist alerts.',
      icon: '/icons/icon-192.svg'
    })
  }
}

export default function ViewerPrefs() {
  const { watchlist, viewerAlerts, setViewerAlert, logout } = useStore()

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-100">My Alert Preferences</h1>
        <p className="text-xs text-slate-500 mt-0.5">Choose which stocks you want notifications for. Your choices are saved locally.</p>
      </div>

      {/* Notification permission */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} className="text-accent-text" />
          <span className="text-sm font-bold text-slate-200">Push Notifications</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Enable browser notifications to receive price and news alerts for your selected stocks.
        </p>
        <button onClick={requestNotifications} className="btn-ghost w-full flex items-center justify-center gap-2 text-sm">
          <Bell size={14} />
          Enable Notifications
        </button>
      </div>

      {/* Per-stock toggles */}
      <div className="card mb-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Notify me about</p>
        <div className="space-y-3">
          {watchlist.map(stock => (
            <div key={stock.symbol} className="flex items-center justify-between">
              <div>
                <span className="font-bold font-mono text-sm text-slate-100">{stock.symbol}</span>
                <span className="text-xs text-slate-500 ml-2">{stock.name}</span>
              </div>
              <Toggle
                checked={viewerAlerts[stock.symbol] ?? true}
                onChange={v => setViewerAlert(stock.symbol, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Read-only notice */}
      <div className="card mb-4 bg-surface-border/30">
        <p className="text-xs text-slate-500 leading-relaxed">
          You are viewing in <strong className="text-slate-300">read-only mode</strong>.
          You can see live prices, news, signals, morning briefs, and sentiment data.
          Watchlist and dashboard settings are managed by the owner.
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="btn-ghost w-full flex items-center justify-center gap-2 text-sm text-slate-400"
      >
        <LogOut size={14} />
        Sign out
      </button>
    </div>
  )
}
