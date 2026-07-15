import { useState } from 'react'
import { Bell } from 'lucide-react'
import Sparkline from './Sparkline'
import { useStore } from '../store/useStore'
import { formatTime } from '../lib/api'

const SIGNAL_CLASS = {
  'STRONG BUY': 'signal-strong-buy',
  'BUY WATCH':  'signal-buy-watch',
  'HOLD':       'signal-hold',
  'AVOID':      'signal-avoid',
  'SHORT WATCH':'signal-short-watch',
}

function calcRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) return null
  const slice = prices.slice(-(period + 1))
  let gains = 0, losses = 0
  for (let i = 1; i < slice.length; i++) {
    const delta = slice[i] - slice[i - 1]
    if (delta > 0) gains += delta
    else losses += -delta
  }
  if (losses === 0) return 100
  const rs = (gains / period) / (losses / period)
  return Math.round(100 - 100 / (1 + rs))
}

// Shimmer skeleton row
function SkeletonRow({ w, h = 'h-2.5' }) {
  return (
    <div
      className={`${h} rounded-md skeleton`}
      style={{ width: w }}
    />
  )
}

export default function StockCard({ symbol, name, type, flash, staggerIndex = 0 }) {
  const prices           = useStore(s => s.prices)
  const sparklines       = useStore(s => s.sparklines)
  const signals          = useStore(s => s.signals)
  const sentiment        = useStore(s => s.sentiment)
  const lastUpdated      = useStore(s => s.lastUpdated)
  const fundamentals     = useStore(s => s.fundamentals)
  const earnings         = useStore(s => s.earnings)
  const priceAlerts      = useStore(s => s.priceAlerts)
  const addPriceAlert    = useStore(s => s.addPriceAlert)
  const removePriceAlert = useStore(s => s.removePriceAlert)

  const [showAlertForm, setShowAlertForm] = useState(false)
  const [alertDir, setAlertDir]           = useState('above')
  const [alertPrice, setAlertPrice]       = useState('')

  const p         = prices[symbol]
  const spark     = sparklines[symbol] ?? []
  const signal    = signals[symbol] ?? 'HOLD'
  const sent      = sentiment[symbol]
  const updatedAt = lastUpdated[symbol]
  const fund      = fundamentals[symbol]
  const earn      = earnings[symbol]
  const myAlerts  = priceAlerts.filter(a => a.symbol === symbol)

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (!p) return (
    <div
      className="slide-up py-5 border-b border-surface-border lg:border lg:rounded-2xl lg:p-5"
      style={{
        animationDelay: `${staggerIndex * 50}ms`,
        background: 'rgba(22,22,19,0.7)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <SkeletonRow w="64px" h="h-3" />
          <SkeletonRow w="96px" h="h-2" />
        </div>
        <SkeletonRow w="56px" h="h-5" />
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <SkeletonRow w="120px" h="h-8" />
          <SkeletonRow w="80px" h="h-2.5" />
        </div>
        <SkeletonRow w="96px" h="h-11" />
      </div>
      <div className="flex gap-4 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <SkeletonRow w="80px" />
        <SkeletonRow w="60px" />
        <SkeletonRow w="40px" className="ml-auto" />
      </div>
    </div>
  )

  const up  = p.changePct >= 0
  const big = Math.abs(p.changePct) >= 2

  const fmt      = (n, d = 2) => typeof n === 'number' ? n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—'
  const fmtPrice = (n) => symbol === 'BTC'
    ? `$${n?.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : `$${fmt(n)}`
  const fmtNum   = (n) => n >= 1000 ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : n.toFixed(2)

  const changeColor = up ? '#4ade80' : '#f87171'
  const sentColor   = sent?.label === 'BULLISH' ? '#4ade80' : sent?.label === 'BEARISH' ? '#f87171' : '#7a7268'

  // RSI
  const rsi      = calcRSI(spark)
  const rsiColor = rsi === null ? '#7a7268' : rsi >= 70 ? '#f87171' : rsi <= 30 ? '#4ade80' : '#7a7268'
  const rsiLabel = rsi !== null && (rsi >= 70 ? 'OB' : rsi <= 30 ? 'OS' : null)

  // 52-week bar
  const has52w = fund?.high52w && fund?.low52w && p.price && fund.high52w !== fund.low52w
  const pos52w = has52w
    ? Math.max(0, Math.min(100, ((p.price - fund.low52w) / (fund.high52w - fund.low52w)) * 100))
    : null

  // Analyst target
  const hasTarget = fund?.targetMean && p.price
  const targetPct = hasTarget ? ((fund.targetMean - p.price) / p.price) * 100 : null

  // Earnings
  const showEarnings = type === 'stock' && earn != null && earn.daysUntil !== undefined

  // Rec bar
  const recTotal = fund ? (fund.buy + fund.hold + fund.sell) : 0

  function handleSetAlert() {
    const price = parseFloat(alertPrice)
    if (isNaN(price) || price <= 0) return
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
    addPriceAlert({ id: `${symbol}-${Date.now()}`, symbol, direction: alertDir, price })
    setAlertPrice('')
    setShowAlertForm(false)
  }

  const hasActiveAlert = myAlerts.length > 0

  return (
    <div
      className={`group relative slide-up border-b border-surface-border lg:border lg:rounded-2xl lg:bg-surface-card ${flash ? `flash-${flash}` : ''}`}
      style={{
        animationDelay: `${staggerIndex * 50}ms`,
        padding: '20px 0',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Left gold bar — CSS group-hover */}
      <div
        className="absolute left-0 top-0 bottom-0 origin-center rounded-r-sm transition-all duration-500 ease-spring scale-y-0 group-hover:scale-y-100"
        style={{ width: 2, background: 'linear-gradient(180deg, transparent, #b8956a 30%, #b8956a 70%, transparent)', opacity: 0.85 }}
      />

      <div
        className="transition-all duration-300 ease-spring group-hover:pl-3"
        style={{ paddingLeft: 0, paddingRight: 0 }}
      >
        {/* Row 1 — symbol + signal + bell */}
        <div className="flex items-start justify-between mb-2.5 lg:px-5 px-0">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-serif font-light"
                style={{ fontSize: 21, color: '#f0ece3', letterSpacing: '-0.01em' }}
              >
                {symbol}
              </span>
              {big && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse-slow"
                  style={{ background: up ? '#4ade80' : '#f87171' }}
                />
              )}
            </div>
            <p className="eyebrow mt-0.5">{name}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAlertForm(v => !v)}
              className="transition-all duration-200"
              style={{ opacity: hasActiveAlert ? 1 : 0.3, transform: showAlertForm ? 'scale(1.15)' : 'scale(1)' }}
              title="Set price alert"
            >
              <Bell
                size={12}
                style={{ color: hasActiveAlert ? '#b8956a' : '#f0ece3', fill: hasActiveAlert ? '#b8956a' : 'none', transition: 'color 0.3s ease, fill 0.3s ease' }}
              />
            </button>
            <span className={SIGNAL_CLASS[signal] ?? 'signal-hold'}>{signal}</span>
          </div>
        </div>

        {/* Row 2 — price + sparkline */}
        <div className="flex items-end justify-between gap-4 lg:px-5 px-0">
          <div>
            <p
              className="font-serif font-light price-num leading-none"
              style={{ fontSize: 34, color: '#f0ece3', letterSpacing: '-0.02em' }}
            >
              {fmtPrice(p.price)}
            </p>
            <p
              className="font-mono price-num mt-1"
              style={{ fontSize: 11, color: changeColor, letterSpacing: '0.06em' }}
            >
              {up ? '+' : ''}{fmt(p.change)} &nbsp;·&nbsp; {up ? '+' : ''}{fmt(p.changePct)}%
            </p>
          </div>
          <div style={{ width: 96, height: 44, opacity: 0.7, flexShrink: 0, transition: 'opacity 0.3s ease' }}>
            <Sparkline data={spark} positive={up} />
          </div>
        </div>

        {/* Row 3 — info strip */}
        {(rsi !== null || showEarnings || hasTarget || hasActiveAlert) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 lg:px-5 px-0" style={{ fontSize: 10 }}>
            {rsi !== null && (
              <div className="flex items-center gap-1.5">
                <span className="eyebrow" style={{ opacity: 0.5 }}>RSI</span>
                <span className="font-mono price-num" style={{ color: rsiColor, letterSpacing: '0.06em' }}>
                  {rsi}
                  {rsiLabel && <span style={{ fontSize: 8, marginLeft: 3, letterSpacing: '0.15em' }}>{rsiLabel}</span>}
                </span>
              </div>
            )}
            {showEarnings && (
              <div className="flex items-center gap-1.5">
                <span className="eyebrow" style={{ opacity: 0.5 }}>Earn</span>
                <span
                  className="font-mono price-num"
                  style={{ color: earn.daysUntil <= 7 ? '#fbbf24' : earn.daysUntil <= 30 ? '#b8956a' : '#7a7268', letterSpacing: '0.04em', transition: 'color 0.4s ease' }}
                >
                  {earn.daysUntil <= 0 ? 'TODAY' : `${earn.daysUntil}d`}
                </span>
              </div>
            )}
            {hasTarget && (
              <div className="flex items-center gap-1.5">
                <span className="eyebrow" style={{ opacity: 0.5 }}>Target</span>
                <span className="font-mono price-num" style={{ color: targetPct >= 0 ? '#4ade80' : '#f87171', letterSpacing: '0.04em' }}>
                  ${fmtNum(fund.targetMean)}
                  <span style={{ marginLeft: 3, fontSize: 9 }}>
                    ({targetPct >= 0 ? '+' : ''}{targetPct.toFixed(1)}%)
                  </span>
                </span>
              </div>
            )}
            {hasActiveAlert && !showAlertForm && (
              <span className="font-mono ml-auto" style={{ fontSize: 9, color: '#b8956a', letterSpacing: '0.08em' }}>
                ● {myAlerts.length} alert{myAlerts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* 52-week bar */}
        {pos52w !== null && (
          <div className="hidden lg:block mt-3 px-5">
            <div className="flex items-center justify-between mb-1.5" style={{ fontSize: 9, color: '#52525b', letterSpacing: '0.05em' }}>
              <span className="font-mono">${fmtNum(fund.low52w)} L</span>
              <span className="eyebrow" style={{ opacity: 0.3 }}>{pos52w.toFixed(0)}% of 52w range</span>
              <span className="font-mono">H ${fmtNum(fund.high52w)}</span>
            </div>
            <div className="relative h-px rounded-full overflow-visible" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{ width: `${pos52w}%`, background: 'linear-gradient(90deg, rgba(122,114,104,0.5), #b8956a)', transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)' }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 rounded-full border"
                style={{ width: 6, height: 6, left: `calc(${pos52w}% - 3px)`, background: '#f0ece3', borderColor: '#0f0f0d', borderWidth: 1.5, transition: 'left 1.2s cubic-bezier(0.16,1,0.3,1)', boxShadow: '0 0 6px rgba(240,236,227,0.3)' }}
              />
            </div>
          </div>
        )}

        {/* Recommendation bar */}
        {recTotal > 0 && (
          <div className="hidden lg:block mt-2.5 px-5">
            <div className="flex h-px rounded-full overflow-hidden">
              <div style={{ width: `${(fund.buy / recTotal) * 100}%`, background: '#4ade80', transition: 'width 0.8s ease' }} />
              <div style={{ width: `${(fund.hold / recTotal) * 100}%`, background: '#3f3f46', transition: 'width 0.8s ease' }} />
              <div style={{ width: `${(fund.sell / recTotal) * 100}%`, background: '#f87171', transition: 'width 0.8s ease' }} />
            </div>
            <div className="flex justify-between mt-0.5" style={{ fontSize: 8, letterSpacing: '0.06em' }}>
              <span style={{ color: '#4ade80' }}>{fund.buy} buy</span>
              <span style={{ color: '#52525b' }}>{fund.hold} hold</span>
              <span style={{ color: '#f87171' }}>{fund.sell} sell</span>
            </div>
          </div>
        )}

        {/* Sentiment row */}
        {sent && (
          <div
            className="flex items-center gap-4 mt-3 pt-3 lg:px-5 px-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-2">
              <span className="eyebrow" style={{ opacity: 0.5 }}>Sentiment</span>
              <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: sentColor, transition: 'color 0.5s ease' }}>
                {sent.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="eyebrow" style={{ opacity: 0.5 }}>Buzz</span>
              <span className="font-mono price-num" style={{ fontSize: 10, color: sent.buzzScore >= 80 ? '#f87171' : '#7a7268' }}>
                {sent.buzzScore}
                {sent.buzzScore >= 80 && <span className="ml-1" style={{ fontSize: 8, color: '#f87171', letterSpacing: '0.15em' }}>HIGH</span>}
              </span>
            </div>
            <span className="ml-auto eyebrow" style={{ opacity: 0.28 }}>
              {updatedAt ? formatTime(updatedAt, 'America/New_York') : type}
            </span>
          </div>
        )}

        {/* Alert form — smooth slide */}
        <div
          className="expand-panel lg:px-5 px-0"
          style={{ maxHeight: showAlertForm ? '200px' : '0', opacity: showAlertForm ? 1 : 0 }}
        >
          <div
            className="expand-panel-inner pt-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', opacity: showAlertForm ? 1 : 0, transform: showAlertForm ? 'translateY(0)' : 'translateY(-6px)' }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <button
                onClick={() => setAlertDir('above')}
                className="text-[10px] px-2 py-0.5 rounded transition-all duration-200"
                style={{
                  background: alertDir === 'above' ? 'rgba(74,222,128,0.12)' : 'transparent',
                  color:      alertDir === 'above' ? '#4ade80' : '#7a7268',
                  border:     `1px solid ${alertDir === 'above' ? '#4ade8066' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                ABOVE
              </button>
              <button
                onClick={() => setAlertDir('below')}
                className="text-[10px] px-2 py-0.5 rounded transition-all duration-200"
                style={{
                  background: alertDir === 'below' ? 'rgba(248,113,113,0.12)' : 'transparent',
                  color:      alertDir === 'below' ? '#f87171' : '#7a7268',
                  border:     `1px solid ${alertDir === 'below' ? '#f8717166' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                BELOW
              </button>
              <input
                type="number"
                value={alertPrice}
                onChange={e => setAlertPrice(e.target.value)}
                placeholder={p.price.toFixed(symbol === 'BTC' ? 0 : 2)}
                className="flex-1 min-w-0 font-mono text-[11px] rounded px-2 py-0.5 outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f0ece3',
                }}
                onFocus={e => e.target.style.borderColor = '#b8956a66'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                onKeyDown={e => e.key === 'Enter' && handleSetAlert()}
              />
              <button
                onClick={handleSetAlert}
                className="text-[10px] px-2.5 py-0.5 rounded transition-all duration-200 hover:opacity-90"
                style={{ background: 'rgba(184,149,106,0.15)', color: '#b8956a', border: '1px solid rgba(184,149,106,0.4)' }}
              >
                Set
              </button>
            </div>
            {myAlerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between py-0.5">
                <span className="font-mono" style={{ fontSize: 10, color: alert.direction === 'above' ? '#4ade80' : '#f87171' }}>
                  {alert.direction === 'above' ? '↑' : '↓'} ${fmtNum(alert.price)}
                </span>
                <button
                  onClick={() => removePriceAlert(alert.id)}
                  className="transition-colors duration-150 hover:text-red-400"
                  style={{ color: '#52525b', fontSize: 11 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
