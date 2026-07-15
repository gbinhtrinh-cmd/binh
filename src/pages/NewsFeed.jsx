import { useState, useMemo } from 'react'
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatTime, formatDate } from '../lib/api'

// ─── Impact reasoning ─────────────────────────────────────────────────────────

const IMPACT_TRIGGERS = [
  { k: 'earnings',      msg: 'Earnings event — direct P&L impact on stock price' },
  { k: 'beat',          msg: 'Beat analyst expectations — typically a bullish catalyst' },
  { k: 'miss',          msg: 'Missed analyst expectations — typically a bearish catalyst' },
  { k: 'guidance',      msg: 'Forward guidance revision — markets often react more to outlook than results' },
  { k: 'upgrade',       msg: 'Analyst upgraded rating — signals improving institutional conviction' },
  { k: 'downgrade',     msg: 'Analyst downgraded rating — signals weakening institutional conviction' },
  { k: 'fda',           msg: 'FDA regulatory action — binary outcome risk with sharp price moves' },
  { k: 'merger',        msg: 'Merger activity — acquisition premium or dilution risk' },
  { k: 'acquisition',   msg: 'Acquisition announced — deal premium or financing risk' },
  { k: 'ceo',           msg: 'Leadership change — management transitions affect market confidence' },
  { k: 'lawsuit',       msg: 'Legal action filed — liability overhang and reputation risk' },
  { k: 'antitrust',     msg: 'Antitrust scrutiny — could limit growth or force a break-up' },
  { k: 'ban',           msg: 'Regulatory ban — could restrict operations or market access' },
  { k: 'investigation', msg: 'Under regulatory investigation — uncertainty overhang' },
  { k: 'bankruptcy',    msg: 'Bankruptcy filing — severe downside and counterparty risk' },
  { k: 'default',       msg: 'Debt default — liquidity and credit event risk' },
  { k: 'fed',           msg: 'Federal Reserve action — macro impact on all equities and rates' },
  { k: 'rate hike',     msg: 'Rate increase — raises borrowing costs and pressures valuations' },
  { k: 'rate cut',      msg: 'Rate cut — eases borrowing costs and supports risk assets' },
  { k: 'surge',         msg: 'Significant price surge noted — momentum follow-through possible' },
  { k: 'plunge',        msg: 'Significant price drop noted — watch for support levels' },
  { k: 'crash',         msg: 'Sharp crash reported — assess contagion risk to related positions' },
  { k: 'delivery',      msg: 'Delivery or production data — key operational metric for growth stocks' },
  { k: 'record',        msg: 'Record performance milestone — confirms trend strength or reversal' },
]

function getImpactReasoning(headline, summary) {
  const text = ((headline ?? '') + ' ' + (summary ?? '')).toLowerCase()
  const found = IMPACT_TRIGGERS.filter(t => text.includes(t.k))
  if (found.length === 0) return null
  return found.slice(0, 2).map(t => t.msg).join(' — also: ')
}

// ─── Sentiment / badge helpers ────────────────────────────────────────────────

const SENT_BORDER = {
  bullish: 'border-l-bull',
  bearish: 'border-l-bear',
  neutral: 'border-l-surface-border',
}
const SENT_BADGE = {
  bullish: 'badge-bull',
  bearish: 'badge-bear',
  neutral: 'badge-neutral',
}

// ─── NewsCard ─────────────────────────────────────────────────────────────────

function NewsCard({ item, timezone }) {
  const [expanded, setExpanded] = useState(false)
  const reasoning = getImpactReasoning(item.headline, item.summary)
  const isSEC = item.type === 'sec'

  return (
    <div
      className={`card border-l-2 ${isSEC ? 'border-l-amber-700' : (SENT_BORDER[item.sentiment] ?? 'border-l-surface-border')} mb-2.5 animate-fade-in cursor-pointer select-none`}
      style={{ transition: 'background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#1a1a17'; e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.boxShadow = '' }}
      onClick={() => setExpanded(v => !v)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge-neutral text-[10px] font-mono">{item.ticker}</span>
          {isSEC ? (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
              style={{ color: '#b8956a', background: 'rgba(184,149,106,0.12)', border: '1px solid rgba(184,149,106,0.25)' }}
            >
              SEC {item.form}
            </span>
          ) : (
            <>
              <span className={item.impact === 'HIGH' ? 'badge-high' : 'badge-medium'}>{item.impact}</span>
              <span className={SENT_BADGE[item.sentiment] ?? 'badge-neutral'}>{item.sentiment}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-slate-500 font-mono">{formatTime(item.time, timezone)}</span>
          {expanded
            ? <ChevronUp size={12} className="text-slate-600" />
            : <ChevronDown size={12} className="text-slate-600" />}
        </div>
      </div>

      {/* Headline */}
      <p className="text-sm font-medium text-slate-100 leading-snug mb-1.5">{item.headline}</p>

      {/* Summary — clipped when collapsed, full when expanded */}
      {item.summary && (
        <p
          className="text-xs leading-relaxed transition-colors duration-300"
          style={{
            color: expanded ? '#d4d0c9' : '#6b7280',
            display: '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            transition: 'color 0.3s ease',
          }}
        >
          {item.summary}
        </p>
      )}

      {/* Expanded detail panel — smooth max-height transition */}
      <div
        className="expand-panel"
        style={{ maxHeight: expanded ? '480px' : '0', opacity: expanded ? 1 : 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="expand-panel-inner mt-3 space-y-3"
          style={{ opacity: expanded ? 1 : 0, transform: expanded ? 'translateY(0)' : 'translateY(-4px)' }}
        >
          {/* Why this matters */}
          {(reasoning || isSEC) && (
            <div
              className="rounded-lg px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="uppercase mb-1" style={{ fontSize: 9, letterSpacing: '0.14em', color: '#b8956a' }}>
                Why this matters
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#c4bfb5' }}>
                {isSEC
                  ? item.form === '10-K'
                    ? 'Annual report (10-K) — comprehensive view of financials, risk factors, and business outlook. High information density; often moves the stock.'
                    : item.form === '10-Q'
                      ? 'Quarterly report (10-Q) — earnings, revenue, and guidance update. Watch for surprises vs. consensus estimates.'
                      : item.form === '6-K'
                        ? 'Foreign private issuer report (6-K) — material news from a non-US company filed with the SEC.'
                        : '8-K current report — material corporate event (earnings, M&A, leadership change, legal) required to be disclosed immediately.'
                  : reasoning}
              </p>
            </div>
          )}

          {/* Source link */}
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px]"
              style={{ color: '#b8956a', transition: 'color 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.color = '#d4b08a'}
              onMouseLeave={e => e.currentTarget.style.color = '#b8956a'}
            >
              <ExternalLink size={11} />
              Read full article · {item.source}
            </a>
          ) : (
            <p className="text-[10px]" style={{ color: '#52525b' }}>
              Source: {item.source} · No direct link
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="text-[10px] text-slate-600">{item.source} · {formatDate(item.time)}</span>
        <span className="text-[10px]" style={{ color: '#52525b', letterSpacing: '0.05em' }}>
          {expanded ? 'Tap to collapse' : 'Tap to expand'}
        </span>
      </div>
    </div>
  )
}

// ─── NewsFeed page ────────────────────────────────────────────────────────────

export default function NewsFeed() {
  const [filter, setFilter] = useState('ALL')
  const news      = useStore(s => s.news)
  const timezone  = useStore(s => s.timezone)
  const watchlist = useStore(s => s.watchlist)

  const FILTERS = ['ALL', ...watchlist.map(s => s.symbol), 'SEC', 'HIGH IMPACT']

  const filtered = useMemo(() => {
    let items = [...news].sort((a, b) => b.time - a.time)
    if (filter === 'HIGH IMPACT') return items.filter(n => n.impact === 'HIGH')
    if (filter === 'SEC')         return items.filter(n => n.type === 'sec')
    if (filter !== 'ALL')         return items.filter(n => n.ticker === filter)
    return items
  }, [news, filter])

  const secCount = news.filter(n => n.type === 'sec').length

  const highCount = news.filter(n => n.impact === 'HIGH').length

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-slate-100">News Feed</h1>
          <span className="text-[10px] font-mono" style={{ color: '#7a7268' }}>
            {news.length} stories · {highCount} high impact
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all"
              style={filter === f
                ? { background: '#b8956a20', borderColor: '#b8956a80', color: '#b8956a' }
                : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: '#7a7268' }
              }
            >
              {f}
              {f === 'HIGH IMPACT' && highCount > 0 && (
                <span className="ml-1.5 text-[9px]" style={{ color: '#f87171' }}>{highCount}</span>
              )}
              {f === 'SEC' && secCount > 0 && (
                <span className="ml-1.5 text-[9px]" style={{ color: '#b8956a' }}>{secCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-slate-500">No stories match this filter</p>
          <p className="text-xs text-slate-600 mt-1">News refreshes every 5 minutes</p>
        </div>
      ) : (
        filtered.map(item => <NewsCard key={item.id} item={item} timezone={timezone} />)
      )}
    </div>
  )
}
