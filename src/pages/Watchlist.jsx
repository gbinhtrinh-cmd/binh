import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Activity, Zap, Newspaper, RefreshCw, ChevronRight, Bot, BookOpen, Loader2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useMarketData } from '../hooks/useMarketData'
import StockCard from '../components/StockCard'
import { callClaude } from '../lib/api'

// ─── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function fmt(n, d = 2) {
  return typeof n === 'number' ? n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—'
}

// ─── MacroTile — compact context card ────────────────────────────────────────

function MacroTile({ label, value, sub, subColor = '#52525b', source, loading }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#52525b' }}>{label}</p>
      <p className="font-serif font-light text-base leading-none" style={{ color: loading ? '#52525b' : '#f0ece3' }}>
        {value}
      </p>
      {sub && <p className="font-mono mt-1 text-[9px]" style={{ color: subColor }}>{sub}</p>}
      {source && (
        <p className="mt-1 text-[8px] uppercase tracking-widest" style={{ color: '#3a3730' }}>{source}</p>
      )}
    </div>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, subColor = '#7a7268', loading }) {
  if (loading) return (
    <div className="rounded-xl p-4 slide-up" style={{ background: '#161613', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="h-2 w-14 rounded animate-pulse mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-8 w-24 rounded animate-pulse mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="h-2 w-12 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
    </div>
  )
  return (
    <div className="rounded-xl p-4 slide-up" style={{ background: '#161613', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="eyebrow mb-2">{label}</p>
      <p className="font-serif font-light leading-none" style={{ fontSize: 28, color: '#f0ece3', letterSpacing: '-0.02em' }}>{value}</p>
      {sub && <p className="font-mono mt-2" style={{ fontSize: 10, color: subColor, letterSpacing: '0.06em' }}>{sub}</p>}
    </div>
  )
}

// ─── RelPerfChart ─────────────────────────────────────────────────────────────

const SYM_COLOR = {
  AAPL: '#60a5fa',
  NVDA: '#34d399',
  TSLA: '#f87171',
  BTC:  '#fb923c',
  SPY:  '#a78bfa',
}

function RelPerfChart({ watchlist, sparklines }) {
  const W = 400, H = 72

  const series = watchlist
    .map(({ symbol }) => {
      const pts = sparklines[symbol] ?? []
      if (pts.length < 2) return null
      const base = pts[0]
      if (!base) return null
      return { symbol, pts: pts.map(p => ((p / base) - 1) * 100) }
    })
    .filter(Boolean)

  if (series.length === 0) return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3 flex items-center justify-center" style={{ height: 130 }}>
      <p style={{ fontSize: 11, color: '#52525b' }}>Collecting price data…</p>
    </div>
  )

  const allVals  = series.flatMap(s => s.pts)
  let min = Math.min(...allVals)
  let max = Math.max(...allVals)
  const pad = Math.max(0.1, (max - min) * 0.15)
  min -= pad; max += pad
  const range = max - min || 0.01
  const maxLen = Math.max(...series.map(s => s.pts.length))

  function toPath(pts) {
    return pts.map((v, i) => {
      const x = maxLen > 1 ? (i / (maxLen - 1)) * W : W / 2
      const y = H - ((v - min) / range) * H
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(' ')
  }

  const zeroY = H - ((0 - min) / range) * H

  // Last value for each series (for inline label)
  const labels = series.map(s => ({
    symbol: s.symbol,
    val: s.pts[s.pts.length - 1],
    y: H - ((s.pts[s.pts.length - 1] - min) / range) * H,
  }))

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">Relative Performance</span>
        <div className="flex items-center gap-2.5">
          {series.map(s => (
            <div key={s.symbol} className="flex items-center gap-1">
              <div className="w-2 h-px" style={{ background: SYM_COLOR[s.symbol] ?? '#7a7268' }} />
              <span style={{ fontSize: 9, color: SYM_COLOR[s.symbol] ?? '#7a7268' }}>{s.symbol}</span>
            </div>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block', overflow: 'visible' }}>
        {/* Zero baseline */}
        {zeroY >= 0 && zeroY <= H && (
          <line
            x1="0" y1={zeroY.toFixed(1)} x2={W} y2={zeroY.toFixed(1)}
            stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="3 4"
          />
        )}
        {series.map(s => (
          <path
            key={s.symbol}
            d={toPath(s.pts)}
            fill="none"
            stroke={SYM_COLOR[s.symbol] ?? '#7a7268'}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.85}
          />
        ))}
        {/* End-point dots */}
        {labels.map(l => (
          <circle
            key={l.symbol}
            cx={W}
            cy={l.y.toFixed(1)}
            r="2"
            fill={SYM_COLOR[l.symbol] ?? '#7a7268'}
          />
        ))}
      </svg>

      <div className="flex justify-between mt-1" style={{ fontSize: 9, color: '#52525b' }}>
        <span>Session start</span>
        <div className="flex items-center gap-3">
          {labels.map(l => (
            <span key={l.symbol} className="font-mono" style={{ color: SYM_COLOR[l.symbol] ?? '#7a7268' }}>
              {l.val >= 0 ? '+' : ''}{l.val.toFixed(2)}%
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── AlertsBanner ─────────────────────────────────────────────────────────────

function AlertsBanner({ priceAlerts, prices, removePriceAlert }) {
  if (priceAlerts.length === 0) return null
  const fmtNum = (n) => n >= 1000 ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : n.toFixed(2)
  return (
    <div className="mb-4 rounded-xl px-4 py-2.5" style={{ background: 'rgba(184,149,106,0.07)', border: '1px solid rgba(184,149,106,0.18)' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <Bell size={11} style={{ color: '#b8956a' }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#b8956a' }}>
          Active Alerts ({priceAlerts.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {priceAlerts.map(alert => {
          const current = prices[alert.symbol]?.price
          const distance = current ? Math.abs(((alert.price - current) / current) * 100) : null
          return (
            <div
              key={alert.id}
              className="flex items-center gap-1.5 rounded px-2 py-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="font-mono text-[10px]" style={{ color: '#f0ece3' }}>{alert.symbol}</span>
              <span style={{ fontSize: 9, color: alert.direction === 'above' ? '#4ade80' : '#f87171', letterSpacing: '0.1em' }}>
                {alert.direction === 'above' ? '↑' : '↓'} ${fmtNum(alert.price)}
              </span>
              {distance !== null && (
                <span className="font-mono" style={{ fontSize: 8, color: '#52525b' }}>
                  {distance.toFixed(1)}% away
                </span>
              )}
              <button
                onClick={() => removePriceAlert(alert.id)}
                className="hover:text-red-400 transition-colors ml-0.5"
                style={{ color: '#52525b', fontSize: 10, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── NewsFeedPreview ──────────────────────────────────────────────────────────

const SENT_COLOR = { bullish: 'text-bull-text', bearish: 'text-bear-text', neutral: 'text-slate-500' }
const TICK_COLOR = {
  AAPL: 'bg-blue-900 text-blue-300',
  NVDA: 'bg-emerald-900 text-emerald-300',
  TSLA: 'bg-red-900 text-red-300',
  BTC:  'bg-orange-900 text-orange-300',
  SPY:  'bg-purple-900 text-purple-300',
}

function NewsFeedPreview({ news, seenUpTo }) {
  const recent = news.filter(n => Date.now() - n.time < 86400000).slice(0, 5)
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3 h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Newspaper size={12} className="text-accent-text" />
          <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">News</span>
        </div>
        <Link to="/news" className="text-[10px] text-accent-text flex items-center gap-0.5 hover:text-indigo-300">
          All <ChevronRight size={10} />
        </Link>
      </div>
      <div className="space-y-2.5">
        {recent.length === 0 && <p className="text-xs text-slate-500">No news in last 24h</p>}
        {recent.map(item => {
          const isNew = item.time > seenUpTo
          return (
            <div key={item.id} className="border-b border-surface-border pb-2 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${TICK_COLOR[item.ticker] ?? 'bg-slate-700 text-slate-300'}`}>
                  {item.ticker}
                </span>
                <div className="flex items-center gap-1">
                  {isNew && <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
                  <span className="text-[9px] text-slate-600">{timeAgo(item.time)}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-300 leading-snug line-clamp-2">{item.headline}</p>
              <span className={`text-[9px] font-bold ${SENT_COLOR[item.sentiment]}`}>
                {item.sentiment?.toUpperCase()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── AgentCard ────────────────────────────────────────────────────────────────

function AgentCard({ onAnalysis, onTradeIdea, analysisLoading, ideaLoading }) {
  const signalsLog = useStore(s => s.signalsLog)
  const recentLog = signalsLog.slice(0, 4)
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse-slow" />
        <Bot size={11} className="text-accent-text" />
        <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">Agent</span>
      </div>
      <div className="space-y-1.5 mb-2">
        {recentLog.map(entry => (
          <div key={entry.id} className="flex items-start gap-1">
            <span className={`text-[9px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${TICK_COLOR[entry.ticker] ?? 'bg-slate-700 text-slate-300'}`}>
              {entry.ticker}
            </span>
            <span className="text-[9px] text-slate-400 leading-snug line-clamp-1">{entry.type}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <button
          onClick={onAnalysis}
          disabled={analysisLoading}
          className="w-full btn-primary text-[10px] py-1.5 flex items-center justify-center gap-1 disabled:opacity-60"
        >
          {analysisLoading ? <Loader2 size={10} className="animate-spin" /> : <Activity size={10} />}
          Full Analysis
        </button>
        <button
          onClick={onTradeIdea}
          disabled={ideaLoading}
          className="w-full btn-ghost text-[10px] py-1.5 flex items-center justify-center gap-1 disabled:opacity-60"
        >
          {ideaLoading ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
          Trade Idea
        </button>
      </div>
    </div>
  )
}

// ─── MorningBriefPreview ──────────────────────────────────────────────────────

const BRIEF_TABS = ['Market', 'Signals', 'Risk']

function MorningBriefPreview({ onGenerate, briefLoading }) {
  const todayBrief = useStore(s => s.todayBrief)
  const [tab, setTab] = useState('Market')
  const isToday = todayBrief?.briefDate === new Date().toDateString()
  const sections = isToday ? todayBrief.sections : null
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <BookOpen size={11} className="text-accent-text" />
        <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">Brief</span>
        {isToday && <span className="text-[9px] text-bull-text">TODAY</span>}
      </div>
      {!sections ? (
        <div className="text-center py-2">
          <p className="text-[10px] text-slate-500 mb-2">No brief for today yet.</p>
          <button
            onClick={onGenerate}
            disabled={briefLoading}
            className="w-full btn-primary text-[10px] py-1.5 flex items-center justify-center gap-1 disabled:opacity-60"
          >
            {briefLoading ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
            Generate Brief
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-2 border-b border-surface-border pb-1.5">
            {BRIEF_TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-[10px] font-medium pb-0.5 transition-colors ${tab === t ? 'text-accent-text border-b border-accent' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-300 leading-snug line-clamp-4">
            {sections[tab.toLowerCase()] ?? '—'}
          </p>
          <p className="text-[9px] text-slate-600 mt-1.5">{timeAgo(todayBrief.generatedAt)}</p>
        </>
      )}
    </div>
  )
}

// ─── Result overlay ───────────────────────────────────────────────────────────

function ResultOverlay({ title, text, onClose }) {
  if (!text) return null
  return (
    <div className="fixed inset-0 z-50 bg-surface/90 backdrop-blur flex flex-col px-4 py-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-100">{title}</h2>
        <button onClick={onClose} className="text-slate-500 text-xs btn-ghost px-2 py-1">Close</button>
      </div>
      <div className="card flex-1">
        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  )
}

// ─── Watchlist page ───────────────────────────────────────────────────────────

export default function Watchlist() {
  useMarketData()

  const watchlist        = useStore(s => s.watchlist)
  const prices           = useStore(s => s.prices)
  const sparklines       = useStore(s => s.sparklines)
  const signals          = useStore(s => s.signals)
  const sentiment        = useStore(s => s.sentiment)
  const news             = useStore(s => s.news)
  const signalsLog       = useStore(s => s.signalsLog)
  const vix              = useStore(s => s.vix)
  const fearGreed        = useStore(s => s.fearGreed)
  const cryptoGlobal     = useStore(s => s.cryptoGlobal)
  const topCoins         = useStore(s => s.topCoins)
  const macroData        = useStore(s => s.macroData)
  const fredKey          = useStore(s => s.fredKey)
  const isLive           = useStore(s => s.isLive)
  const claudeKey        = useStore(s => s.claudeKey)
  const priceAlerts      = useStore(s => s.priceAlerts)
  const removePriceAlert = useStore(s => s.removePriceAlert)
  const saveMorningBrief = useStore(s => s.saveMorningBrief)
  const setTodayBrief    = useStore(s => s.setTodayBrief)

  // ── flash tracking ────────────────────────────────────────────────────────
  const prevPricesRef = useRef({})
  const [flashing, setFlashing] = useState({})
  const [updatedAt, setUpdatedAt] = useState(null)
  const [secsAgo, setSecsAgo] = useState(0)

  useEffect(() => {
    const changed = {}
    let anyChange = false
    watchlist.forEach(s => {
      const prev = prevPricesRef.current[s.symbol]
      const curr = prices[s.symbol]?.price
      if (curr !== undefined && prev !== curr) {
        anyChange = true
        if (prev && curr && prev !== curr) {
          changed[s.symbol] = curr > prev ? 'bull' : 'bear'
        }
      }
      prevPricesRef.current[s.symbol] = curr
    })
    if (anyChange) setUpdatedAt(Date.now())
    if (Object.keys(changed).length) {
      setFlashing(f => ({ ...f, ...changed }))
      setTimeout(() => setFlashing(f => {
        const next = { ...f }
        Object.keys(changed).forEach(k => delete next[k])
        return next
      }), 1100)
    }
  }, [prices])

  useEffect(() => {
    const t = setInterval(() => setSecsAgo(updatedAt ? Math.floor((Date.now() - updatedAt) / 1000) : 0), 1000)
    return () => clearInterval(t)
  }, [updatedAt])

  // ── metrics ───────────────────────────────────────────────────────────────
  const totalValue   = watchlist.reduce((sum, s) => sum + (prices[s.symbol]?.price ?? 0), 0)
  const totalChange  = watchlist.reduce((sum, s) => sum + (prices[s.symbol]?.change ?? 0), 0)
  const dailyUp      = totalChange >= 0
  const validPrices  = watchlist.filter(s => prices[s.symbol])
  const avgChangePct = validPrices.length > 0
    ? validPrices.reduce((sum, s) => sum + (prices[s.symbol]?.changePct ?? 0), 0) / validPrices.length
    : null

  const vixLabel = vix < 18 ? 'RISK ON' : vix < 25 ? 'CAUTION' : 'RISK OFF'
  const vixColor = vix < 18 ? '#4ade80' : vix < 25 ? '#fbbf24' : '#f87171'

  const sigCounts = { buy: 0, sell: 0, watch: 0 }
  Object.values(signals).forEach(sig => {
    if (['STRONG BUY', 'BUY WATCH'].includes(sig)) sigCounts.buy++
    else if (['AVOID', 'SHORT WATCH'].includes(sig)) sigCounts.sell++
    else sigCounts.watch++
  })
  const sigTotal    = Object.values(signals).length
  const today       = new Date().toDateString()
  const todayAlerts = signalsLog.filter(s => new Date(s.time).toDateString() === today).length

  // ── news read tracking ────────────────────────────────────────────────────
  const [seenUpTo] = useState(() => {
    const v = localStorage.getItem('news-seen-until')
    return v ? parseInt(v) : Date.now() - 86400000
  })
  useEffect(() => { localStorage.setItem('news-seen-until', String(Date.now())) }, [])

  // ── Claude calls ──────────────────────────────────────────────────────────
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisText,    setAnalysisText]    = useState('')
  const [ideaLoading,     setIdeaLoading]     = useState(false)
  const [ideaText,        setIdeaText]        = useState('')
  const [briefLoading,    setBriefLoading]    = useState(false)

  function needKey() {
    alert('Add your Claude API key in Settings → API Keys to enable AI generation.')
  }

  async function handleFullAnalysis() {
    if (!claudeKey) return needKey()
    setAnalysisLoading(true)
    setAnalysisText('')
    const rows = watchlist.map(s => {
      const p = prices[s.symbol]
      const sent = sentiment[s.symbol]
      return `${s.symbol}: $${p?.price?.toFixed(2) ?? '?'} (${p?.changePct >= 0 ? '+' : ''}${p?.changePct?.toFixed(2) ?? '?'}%) | Signal: ${signals[s.symbol] ?? '—'} | Sentiment: ${sent?.label ?? '—'} ${Math.round((sent?.bullishRatio ?? 0.5) * 100)}% bull`
    }).join('\n')
    const topNews = news.slice(0, 6).map(n => `[${n.ticker}] ${n.headline}`).join('\n')
    const fgStr = fearGreed ? `Fear & Greed: ${fearGreed.value} (${fearGreed.classification})` : ''
    const prompt = `You are a swing trading research assistant (research only, no trade execution advice).

WATCHLIST:
${rows}

VIX: ${vix.toFixed(1)} (${vixLabel})
${fgStr}

TOP NEWS:
${topNews}

Provide a clear market analysis in ~200 words: (1) overall market regime, (2) strongest and weakest positions, (3) key risk flags. Label every comment "Research flag only."`
    try {
      const text = await callClaude(prompt, claudeKey)
      setAnalysisText(text)
    } catch (e) {
      setAnalysisText(`Error: ${e.message}`)
    }
    setAnalysisLoading(false)
  }

  async function handleTradeIdea() {
    if (!claudeKey) return needKey()
    setIdeaLoading(true)
    setIdeaText('')
    const rows = watchlist.map(s => {
      const p = prices[s.symbol]
      const sent = sentiment[s.symbol]
      return `${s.symbol}: $${p?.price?.toFixed(2) ?? '?'} (${p?.changePct >= 0 ? '+' : ''}${p?.changePct?.toFixed(2) ?? '?'}%) | ${signals[s.symbol] ?? '—'} | ${sent?.label ?? '—'}`
    }).join('\n')
    const prompt = `Swing trading research assistant. Based on live data below, identify the single best research opportunity.

${rows}
VIX: ${vix.toFixed(1)}

Format your response EXACTLY as:
TICKER: [symbol]
SIGNAL: [BUY WATCH / HOLD / AVOID]
ENTRY ZONE: [price range]
TARGET: [price] ([+pct]% from mid-entry)
STOP LOSS: [price] ([-pct]% from entry low)
RISK/REWARD: [X : 1]
CONFIDENCE: [Low / Medium / High]
NEWS DRIVER: [1-2 sentences]
BIGGEST RISK: [1 sentence]

Research flag only — not a trade instruction.`
    try {
      const text = await callClaude(prompt, claudeKey)
      setIdeaText(text)
    } catch (e) {
      setIdeaText(`Error: ${e.message}`)
    }
    setIdeaLoading(false)
  }

  async function handleGenerateBrief() {
    if (!claudeKey) return needKey()
    setBriefLoading(true)
    const rows = watchlist.map(s => {
      const p = prices[s.symbol]
      const sent = sentiment[s.symbol]
      return `${s.symbol}: $${p?.price?.toFixed(2) ?? '?'} (${p?.changePct >= 0 ? '+' : ''}${p?.changePct?.toFixed(2) ?? '?'}%) | ${signals[s.symbol] ?? '—'} | ${sent?.label ?? '—'}`
    }).join('\n')
    const topNews = news.slice(0, 8).map(n => `[${n.ticker}] ${n.headline} (${n.impact}, ${n.sentiment})`).join('\n')
    const prompt = `Swing trading research assistant. Generate a morning brief as JSON only (no markdown):

DATA:
${rows}
VIX: ${vix.toFixed(1)} (${vixLabel})

NEWS:
${topNews}

Return exactly:
{"market":"2-3 sentences on VIX regime and macro","signals":"2-3 sentences on signal quality","risk":"2-3 sentences on key risk flags"}

Research only.`
    try {
      const text = await callClaude(prompt, claudeKey, 700)
      const m = text.match(/\{[\s\S]*?\}/)
      if (m) {
        const sections = JSON.parse(m[0])
        const brief = { sections, generatedAt: Date.now(), briefDate: new Date().toDateString() }
        setTodayBrief(brief)
        saveMorningBrief({ ...brief, content: text })
      }
    } catch (e) {
      console.error('Brief generation failed:', e)
    }
    setBriefLoading(false)
  }

  const updatedLabel = !updatedAt ? 'Loading…'
    : secsAgo < 60  ? `Updated ${secsAgo}s ago`
    : `Updated ${Math.floor(secsAgo / 60)}m ago`

  return (
    <>
      <ResultOverlay title="Full Analysis"      text={analysisText} onClose={() => setAnalysisText('')} />
      <ResultOverlay title="Today's Trade Idea" text={ideaText}     onClose={() => setIdeaText('')}     />

      <div>
        {/* ── Metrics row ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <MetricCard
            label="Watchlist Value"
            value={isLive ? `$${Math.round(totalValue).toLocaleString()}` : '—'}
            sub={isLive ? `${dailyUp ? '+' : ''}$${fmt(Math.abs(totalChange), 0)} today` : 'fetching…'}
            subColor={isLive ? (dailyUp ? '#4ade80' : '#f87171') : '#7a7268'}
            loading={!isLive}
          />
          <MetricCard
            label="Avg Daily Move"
            value={avgChangePct !== null ? `${avgChangePct >= 0 ? '+' : ''}${avgChangePct.toFixed(2)}%` : '—'}
            sub={avgChangePct !== null ? (avgChangePct >= 0 ? '↑ vs yesterday' : '↓ vs yesterday') : 'loading…'}
            subColor={avgChangePct !== null ? (avgChangePct >= 0 ? '#4ade80' : '#f87171') : '#7a7268'}
            loading={false}
          />
          <MetricCard
            label="VIX"
            value={<span style={{ color: vixColor }}>{vix.toFixed(1)}</span>}
            sub={vixLabel}
            subColor={vixColor}
            loading={false}
          />
          <MetricCard
            label="Fear & Greed"
            value={<span style={{ color: fearGreed?.color ?? '#7a7268' }}>{fearGreed?.value ?? '—'}</span>}
            sub={fearGreed?.classification ?? 'loading…'}
            subColor={fearGreed?.color ?? '#7a7268'}
            loading={!fearGreed}
          />
          <MetricCard
            label={`Signals (${sigTotal})`}
            value={todayAlerts > 0 ? `${todayAlerts} alert${todayAlerts > 1 ? 's' : ''}` : `${sigTotal} active`}
            sub={`${sigCounts.buy} buy · ${sigCounts.sell} sell · ${sigCounts.watch} hold`}
            subColor="#7a7268"
            loading={false}
          />
        </div>

        {/* ── Active price alerts banner ───────────────────────── */}
        <AlertsBanner
          priceAlerts={priceAlerts}
          prices={prices}
          removePriceAlert={removePriceAlert}
        />

        {/* ── Watchlist header ─────────────────────────────────── */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-100">Watchlist</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-bull animate-pulse-slow' : 'bg-slate-600 animate-spin'}`} />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
            <RefreshCw size={10} className={!isLive ? 'animate-spin' : ''} />
            <span>{updatedLabel}</span>
          </div>
        </div>

        {/* ── Stock cards ──────────────────────────────────────── */}
        <div className="mb-6 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4">
          {watchlist.map((stock, i) => (
            <StockCard
              key={stock.symbol}
              {...stock}
              flash={flashing[stock.symbol]}
              staggerIndex={i}
            />
          ))}
        </div>

        {/* ── Bottom section ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
          <NewsFeedPreview news={news} seenUpTo={seenUpTo} />
          <AgentCard
            onAnalysis={handleFullAnalysis}
            onTradeIdea={handleTradeIdea}
            analysisLoading={analysisLoading}
            ideaLoading={ideaLoading}
          />
          <MorningBriefPreview
            onGenerate={handleGenerateBrief}
            briefLoading={briefLoading}
          />
        </div>

        {/* ── Market Context strip (CoinGecko + FRED) ─────────── */}
        {(cryptoGlobal || macroData) && (
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#52525b' }}>Market Context</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {cryptoGlobal?.totalMarketCap != null && (
                <MacroTile
                  label="Crypto Mkt Cap"
                  value={`$${(cryptoGlobal.totalMarketCap / 1e12).toFixed(2)}T`}
                  sub={cryptoGlobal.marketCapChangePct24h != null
                    ? `${cryptoGlobal.marketCapChangePct24h >= 0 ? '+' : ''}${cryptoGlobal.marketCapChangePct24h.toFixed(1)}% 24h`
                    : null}
                  subColor={cryptoGlobal.marketCapChangePct24h >= 0 ? '#4ade80' : '#f87171'}
                  source="CoinGecko"
                />
              )}
              {cryptoGlobal?.btcDominance != null && (
                <MacroTile
                  label="BTC Dominance"
                  value={`${cryptoGlobal.btcDominance.toFixed(1)}%`}
                  sub="of total crypto mkt"
                  source="CoinGecko"
                />
              )}
              {cryptoGlobal?.totalVolume24h != null && (
                <MacroTile
                  label="Crypto Vol 24h"
                  value={`$${(cryptoGlobal.totalVolume24h / 1e9).toFixed(0)}B`}
                  sub="global trading volume"
                  source="CoinGecko"
                />
              )}
              {macroData?.fedRate != null && (
                <MacroTile
                  label="Fed Funds Rate"
                  value={`${macroData.fedRate.toFixed(2)}%`}
                  sub="federal reserve target"
                  source="FRED"
                />
              )}
              {macroData?.yield10y != null && (
                <MacroTile
                  label="10Y Yield"
                  value={`${macroData.yield10y.toFixed(2)}%`}
                  sub="US treasury"
                  source="FRED"
                />
              )}
              {macroData?.cpi != null && (
                <MacroTile
                  label="CPI"
                  value={macroData.cpi.toFixed(1)}
                  sub={`Unemployment ${macroData.unemployment != null ? macroData.unemployment.toFixed(1) + '%' : '—'}`}
                  source="FRED"
                />
              )}
              {!macroData && fredKey && (
                <MacroTile label="FRED" value="Loading…" sub="macro indicators" source="FRED" loading />
              )}
              {!macroData && !fredKey && (
                <div
                  className="col-span-2 sm:col-span-3 rounded-lg px-3 py-2 flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span className="text-[10px]" style={{ color: '#52525b' }}>
                    Add a free <span style={{ color: '#b8956a' }}>FRED API key</span> in Settings to unlock Fed Rate, 10Y Yield, CPI &amp; Unemployment data.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Top Coins (CoinGecko) ────────────────────────────── */}
        {topCoins.length > 0 && (
          <div className="mb-3 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">Top Crypto by Market Cap</span>
              <span className="text-[9px]" style={{ color: '#52525b' }}>via CoinGecko</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {topCoins.map(coin => {
                const up = (coin.changePct24h ?? 0) >= 0
                return (
                  <div key={coin.id} className="flex items-center px-4 py-2 gap-3">
                    <span className="font-mono text-[11px] w-6 text-center" style={{ color: '#52525b' }}>
                      {coin.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-mono font-bold text-xs" style={{ color: '#f0ece3' }}>{coin.symbol}</span>
                      <span className="text-[10px] ml-2" style={{ color: '#7a7268' }}>{coin.name}</span>
                    </div>
                    <span className="font-mono text-xs" style={{ color: '#f0ece3' }}>
                      ${coin.price >= 1000
                        ? coin.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
                        : coin.price >= 1
                          ? coin.price.toFixed(2)
                          : coin.price.toFixed(4)}
                    </span>
                    <span
                      className="font-mono text-[11px] w-16 text-right"
                      style={{ color: up ? '#4ade80' : '#f87171' }}
                    >
                      {up ? '+' : ''}{coin.changePct24h?.toFixed(2) ?? '—'}%
                    </span>
                    <span className="hidden lg:block font-mono text-[10px] w-24 text-right" style={{ color: '#52525b' }}>
                      ${(coin.marketCap / 1e9).toFixed(1)}B
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Relative Performance chart ───────────────────────── */}
        <div className="mb-3">
          <RelPerfChart watchlist={watchlist} sparklines={sparklines} />
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-4 pb-2">
          Research monitoring only · No trading features
        </p>
      </div>
    </>
  )
}
