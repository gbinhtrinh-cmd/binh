import { useState } from 'react'
import {
  Plus, X, ChevronUp, ChevronDown, ArrowRight,
  Globe, Key, Bot, LogOut, Bookmark, ListTodo,
} from 'lucide-react'
import { useStore } from '../store/useStore'

// ─── Type styling ─────────────────────────────────────────────────────────────

const TYPE_META = {
  stock:  { label: 'Stock',  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  etf:    { label: 'ETF',    color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  crypto: { label: 'Crypto', color: '#fb923c', bg: 'rgba(251,146,60,0.1)'  },
}

function TypeBadge({ type }) {
  const m = TYPE_META[type] ?? TYPE_META.stock
  return (
    <span
      className="text-[9px] font-bold rounded px-1.5 py-0.5 uppercase tracking-wide"
      style={{ color: m.color, background: m.bg }}
    >
      {m.label}
    </span>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, accent }) {
  return (
    <div
      className="rounded-xl mb-4 overflow-hidden"
      style={{ background: '#161613', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
      >
        <Icon size={14} style={{ color: accent ?? '#b8956a' }} />
        <h2 className="font-bold text-xs uppercase tracking-widest text-slate-300">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ─── Type selector control ────────────────────────────────────────────────────

function TypeSelector({ value, onChange }) {
  return (
    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      {Object.entries(TYPE_META).map(([k, m]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className="flex-1 text-[10px] py-1.5 font-bold uppercase tracking-wide transition-all"
          style={value === k
            ? { background: m.bg, color: m.color, borderRight: '1px solid rgba(255,255,255,0.06)' }
            : { background: 'transparent', color: '#52525b', borderRight: '1px solid rgba(255,255,255,0.06)' }
          }
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

// ─── Input ───────────────────────────────────────────────────────────────────

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`rounded-lg px-3 py-2 text-xs font-mono outline-none transition-colors ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#f0ece3',
        ...props.style,
      }}
    />
  )
}

// ─── Settings ────────────────────────────────────────────────────────────────

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris',
  'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney', 'UTC',
]

export default function Settings() {
  const {
    watchlist, setWatchlist,
    timezone, setTimezone,
    finnhubKey, setFinnhubKey,
    claudeKey, setClaudeKey,
    fredKey, setFredKey,
    ideaList, addIdea, removeIdea, promoteIdea,
    logout,
  } = useStore()

  // Add-stock form state
  const [sym,     setSym]     = useState('')
  const [name,    setName]    = useState('')
  const [type,    setType]    = useState('stock')
  const [addMsg,  setAddMsg]  = useState(null)

  function flash(msg, color = '#4ade80') {
    setAddMsg({ msg, color })
    setTimeout(() => setAddMsg(null), 2200)
  }

  function handleAddToWatchlist() {
    const symbol = sym.trim().toUpperCase()
    if (!symbol) return
    if (watchlist.some(s => s.symbol === symbol)) { flash('Already in watchlist', '#fbbf24'); return }
    setWatchlist([...watchlist, { symbol, name: name.trim() || symbol, type }])
    setSym(''); setName('')
    flash(`${symbol} added to watchlist`)
  }

  function handleSaveIdea() {
    const symbol = sym.trim().toUpperCase()
    if (!symbol) return
    if (ideaList.some(i => i.symbol === symbol)) { flash('Already saved as idea', '#fbbf24'); return }
    if (watchlist.some(s => s.symbol === symbol)) { flash('Already in active watchlist', '#fbbf24'); return }
    addIdea({ symbol, name: name.trim() || symbol, type })
    setSym(''); setName('')
    flash(`${symbol} saved as idea`, '#b8956a')
  }

  function moveUp(i) {
    if (i === 0) return
    const list = [...watchlist];
    [list[i - 1], list[i]] = [list[i], list[i - 1]]
    setWatchlist(list)
  }

  function moveDown(i) {
    if (i === watchlist.length - 1) return
    const list = [...watchlist];
    [list[i], list[i + 1]] = [list[i + 1], list[i]]
    setWatchlist(list)
  }

  const onEnter = (e) => { if (e.key === 'Enter') handleAddToWatchlist() }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-bold text-slate-100">Settings</h1>
        <p className="text-xs text-slate-600 mt-0.5">Owner access · All changes save automatically</p>
      </div>

      {/* ── Watchlist Builder ─────────────────────────────── */}
      <Section title="Watchlist" icon={ListTodo}>

        {/* Current watchlist */}
        <div className="space-y-1.5 mb-5">
          {watchlist.map((s, i) => (
            <div
              key={s.symbol}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 group"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <TypeBadge type={s.type} />

              <div className="flex-1 min-w-0">
                <span className="font-mono font-bold text-sm" style={{ color: '#f0ece3' }}>{s.symbol}</span>
                <span className="text-xs ml-2" style={{ color: '#7a7268' }}>{s.name}</span>
              </div>

              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors"
                >
                  <ChevronUp size={11} />
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === watchlist.length - 1}
                  className="text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors"
                >
                  <ChevronDown size={11} />
                </button>
              </div>

              <button
                onClick={() => setWatchlist(watchlist.filter(w => w.symbol !== s.symbol))}
                className="text-slate-700 hover:text-red-400 transition-colors p-0.5 opacity-0 group-hover:opacity-100"
              >
                <X size={13} />
              </button>
            </div>
          ))}

          {watchlist.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-3">No stocks in watchlist</p>
          )}
        </div>

        {/* Add stock form */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: '#7a7268' }}>Add a stock</p>

          <TypeSelector value={type} onChange={setType} />

          <div className="flex gap-2 mt-3">
            <Input
              className="w-28"
              placeholder="SYMBOL"
              value={sym}
              onChange={e => setSym(e.target.value.toUpperCase())}
              maxLength={8}
              onKeyDown={onEnter}
            />
            <Input
              className="flex-1"
              placeholder="Company name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={onEnter}
            />
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAddToWatchlist}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all"
              style={{ background: '#b8956a20', color: '#b8956a', border: '1px solid #b8956a50' }}
            >
              <Plus size={13} />
              Add to Watchlist
            </button>
            <button
              onClick={handleSaveIdea}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#7a7268', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Bookmark size={13} />
              Save as Idea
            </button>
          </div>

          {addMsg && (
            <p
              className="text-[11px] text-center mt-2.5 font-mono"
              style={{ color: addMsg.color }}
            >
              {addMsg.msg}
            </p>
          )}
        </div>
      </Section>

      {/* ── Watchlist Ideas ───────────────────────────────── */}
      <Section title="Watchlist Ideas" icon={Bookmark} accent="#7a7268">
        {ideaList.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-xs text-slate-500">No saved ideas yet.</p>
            <p className="text-[10px] mt-1" style={{ color: '#52525b' }}>
              Use "Save as Idea" above to queue stocks you're researching.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ideaList.map(s => (
              <div
                key={s.symbol}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 group"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <TypeBadge type={s.type} />

                <div className="flex-1 min-w-0">
                  <span className="font-mono font-bold text-sm" style={{ color: '#c4bfb5' }}>{s.symbol}</span>
                  <span className="text-xs ml-2" style={{ color: '#52525b' }}>{s.name}</span>
                </div>

                <button
                  onClick={() => promoteIdea(s.symbol)}
                  className="flex items-center gap-1 text-[10px] font-bold rounded px-2 py-1 transition-all opacity-0 group-hover:opacity-100"
                  style={{ color: '#b8956a', background: '#b8956a15', border: '1px solid #b8956a40' }}
                  title="Move to active watchlist"
                >
                  <ArrowRight size={11} />
                  Add
                </button>

                <button
                  onClick={() => removeIdea(s.symbol)}
                  className="text-slate-700 hover:text-red-400 transition-colors p-0.5 opacity-0 group-hover:opacity-100"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Timezone ──────────────────────────────────────── */}
      <Section title="Timezone" icon={Globe} accent="#7a7268">
        <select
          className="w-full rounded-lg px-3 py-2 text-xs outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0ece3' }}
          value={timezone}
          onChange={e => setTimezone(e.target.value)}
        >
          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>
        <p className="text-[10px] mt-2" style={{ color: '#52525b' }}>Used for timestamps and market hours detection</p>
      </Section>

      {/* ── API Keys ──────────────────────────────────────── */}
      <Section title="API Keys" icon={Key} accent="#7a7268">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: '#52525b' }}>
              Finnhub API Key
            </label>
            <Input
              className="w-full"
              type="password"
              value={finnhubKey}
              onChange={e => setFinnhubKey(e.target.value)}
              placeholder="Enter Finnhub key…"
            />
            <p className="text-[9px] mt-1" style={{ color: '#3a3730' }}>
              Free at finnhub.io — quotes, news, fundamentals, earnings
            </p>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: '#52525b' }}>
              FRED API Key
              <span className="ml-2 normal-case" style={{ color: '#3a3730' }}>(optional — macro indicators)</span>
            </label>
            <Input
              className="w-full"
              type="password"
              value={fredKey}
              onChange={e => setFredKey(e.target.value)}
              placeholder="Enter FRED key…"
            />
            <p className="text-[9px] mt-1" style={{ color: '#3a3730' }}>
              Free at fred.stlouisfed.org — Fed Rate, 10Y Yield, CPI, Unemployment
            </p>
          </div>
        </div>
        <p className="text-[10px] mt-3" style={{ color: '#52525b' }}>All keys stored locally on your device only.</p>
      </Section>

      {/* ── Claude AI ─────────────────────────────────────── */}
      <Section title="AI Analysis (Claude)" icon={Bot} accent="#7a7268">
        <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: '#52525b' }}>
          Claude API Key
        </label>
        <Input
          className="w-full"
          type="password"
          value={claudeKey}
          onChange={e => setClaudeKey(e.target.value)}
          placeholder="sk-ant-…"
        />
        <p className="text-[10px] mt-2" style={{ color: '#52525b' }}>
          Enables Full Analysis, Trade Idea, and morning briefs. Sent directly to api.anthropic.com.
        </p>
      </Section>

      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 mb-2 text-sm transition-colors"
        style={{ color: '#52525b', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <LogOut size={14} />
        Sign out
      </button>

      <p className="text-center text-[10px] pb-4" style={{ color: '#3a3730' }}>
        Research use only · No trading features
      </p>
    </div>
  )
}
