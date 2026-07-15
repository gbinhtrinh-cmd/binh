import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { formatDate } from '../lib/api'
import { BookOpen, Search, ChevronDown, ChevronUp } from 'lucide-react'

// Seed a demo brief so the archive isn't empty on first launch
const DEMO_BRIEF = {
  id: 'demo-2026-07-02',
  date: Date.now() - 86400000,
  title: 'Morning Brief — July 2, 2026',
  vix: 21.4,
  regime: 'CAUTION',
  tradeIdea: { ticker: 'BTC', signal: 'BUY', entry: '$60,000 — $62,000', target: '$70,000', stopLoss: '$56,500', rr: '1.5:1', confidence: 'Medium', newsDriver: 'Weak ADP jobs data cooled Fed rate hike fears; Metaplanet added $170M in fresh institutional buying.', sentiment: 'Neutral', biggestRisk: "Friday's June jobs report could print hot, reviving rate hike fears." },
  signals: { AAPL: 'BUY WATCH', NVDA: 'HOLD', TSLA: 'AVOID', BTC: 'BUY WATCH', SPY: 'HOLD' },
  riskWarning: "Tesla proved that even an 18% delivery beat couldn't hold a rally at stretched valuations — the same sell-the-news trap is lurking for any overvalued tech name this week.",
  body: `**STEP 1 — MARKET HEALTH**
VIX: ~20–22 est. | Regime: 🟡 CAUTION

Key events:
- ADP: 98K private jobs (well below 130K est.) — Bearish macro / Dovish Fed signal
- Manufacturing PMI: 53.9 (down from 55.1) — Mild bearish
- Fed Chair Warsh: Inflation "still too high" but July hike odds cooled
- Tesla Q2 Deliveries: 480,126 vehicles — 18% beat; TSLA -7.5% sell-the-news

**STEP 2 — OVERNIGHT NEWS**

AAPL — Apple negotiating Pentagon-blacklisted Chinese chip suppliers (HIGH, Bearish)
TSLA — Q2 delivery beat 480K vs 406K consensus; stock -7.5% (HIGH, Neutral)
BTC  — Bounced off 21-month low to $61K on weak jobs data (HIGH, Bullish)
NVDA — Burry discloses short position as AI bubble bet (HIGH, Bearish)
SPY  — BofA warns of Q3 three-wave correction (HIGH, Bearish)

**STEP 5 — SIGNAL SUMMARY**

AAPL: BUY WATCH — Strong +4.84% breakout day; China chip sourcing is a binary geopolitical risk
NVDA: HOLD — Burry short is noise; Rubin architecture is real catalyst; no entry below $200
TSLA: AVOID — Sell-the-news on delivery beat; BYD competition; California incentive exclusion
BTC:  BUY WATCH — Bounced from $57K with macro tailwind; needs close above $63K to confirm
SPY:  HOLD — Tech rotation drag + BofA Q3 warning cap upside`,
}

function BriefCard({ brief, expanded, onToggle }) {
  const regimeColor = brief.regime === 'RISK ON' ? 'text-bull-text' : brief.regime === 'RISK OFF' ? 'text-bear-text' : 'text-caution-text'
  return (
    <div className="card mb-3 animate-fade-in">
      <button className="w-full flex items-center justify-between" onClick={onToggle}>
        <div className="text-left">
          <p className="font-bold text-sm text-slate-100">{brief.title}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-slate-500">{formatDate(brief.date)}</span>
            <span className={`text-xs font-bold ${regimeColor}`}>{brief.regime}</span>
            <span className="text-xs text-slate-500">VIX {brief.vix}</span>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-surface-border pt-4">
          {/* Trade idea */}
          {brief.tradeIdea && (
            <div className="bg-surface rounded-lg p-3 border border-surface-border">
              <p className="text-xs font-bold text-accent-text mb-2 uppercase tracking-wide">Trade Idea of the Day</p>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                {[
                  ['Ticker', brief.tradeIdea.ticker],
                  ['Signal', brief.tradeIdea.signal],
                  ['Entry', brief.tradeIdea.entry],
                  ['Target', brief.tradeIdea.target],
                  ['Stop', brief.tradeIdea.stopLoss],
                  ['R:R', brief.tradeIdea.rr],
                  ['Confidence', brief.tradeIdea.confidence],
                  ['Sentiment', brief.tradeIdea.sentiment],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-200">{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">{brief.tradeIdea.newsDriver}</p>
              <p className="text-xs text-bear-text mt-1">⚠ {brief.tradeIdea.biggestRisk}</p>
            </div>
          )}

          {/* Signals table */}
          {brief.signals && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Signals</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(brief.signals).map(([ticker, signal]) => (
                  <div key={ticker} className="flex items-center gap-1.5 bg-surface rounded px-2 py-1">
                    <span className="text-xs font-bold font-mono text-slate-200">{ticker}</span>
                    <span className={`text-[10px] font-bold ${signal === 'AVOID' ? 'text-bear-text' : signal === 'BUY WATCH' || signal === 'STRONG BUY' ? 'text-bull-text' : 'text-slate-400'}`}>{signal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Full Brief</p>
            <pre className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-mono bg-surface rounded p-3 overflow-x-auto">{brief.body}</pre>
          </div>

          {/* Risk warning */}
          {brief.riskWarning && (
            <div className="bg-bear-dim rounded-lg p-3">
              <p className="text-xs font-bold text-bear-text mb-1">⚠ Risk Warning</p>
              <p className="text-xs text-bear-text/80">{brief.riskWarning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MorningBriefs() {
  const saved = useStore(s => s.morningBriefs)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const allBriefs = useMemo(() => {
    const list = [DEMO_BRIEF, ...saved]
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(b => b.title?.toLowerCase().includes(q) || b.body?.toLowerCase().includes(q))
  }, [saved, search])

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-100 mb-3">Morning Brief Archive</h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input w-full pl-8"
            placeholder="Search briefs by date, ticker, or keyword…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {allBriefs.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={32} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm">No briefs saved yet.</p>
          <p className="text-slate-600 text-xs mt-1">Say "morning brief" to generate and save one</p>
        </div>
      ) : (
        allBriefs.map(brief => (
          <BriefCard
            key={brief.id}
            brief={brief}
            expanded={expandedId === brief.id}
            onToggle={() => setExpandedId(expandedId === brief.id ? null : brief.id)}
          />
        ))
      )}
    </div>
  )
}
