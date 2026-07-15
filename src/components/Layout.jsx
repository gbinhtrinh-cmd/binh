import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutGrid, Newspaper, Zap, BookOpen, Settings } from 'lucide-react'
import { useStore } from '../store/useStore'

const OWNER_NAV = [
  { to: '/',         label: 'Watch',    icon: LayoutGrid },
  { to: '/news',     label: 'News',     icon: Newspaper  },
  { to: '/signals',  label: 'Signals',  icon: Zap        },
  { to: '/briefs',   label: 'Briefs',   icon: BookOpen   },
  { to: '/settings', label: 'Settings', icon: Settings   },
]

const VIEWER_NAV = [
  { to: '/',        label: 'Watch',   icon: LayoutGrid },
  { to: '/news',    label: 'News',    icon: Newspaper  },
  { to: '/signals', label: 'Signals', icon: Zap        },
  { to: '/briefs',  label: 'Briefs',  icon: BookOpen   },
]

export default function Layout({ children }) {
  const marketOpen  = useStore(s => s.marketOpen)
  const vix         = useStore(s => s.vix)
  const isOwner     = useStore(s => s.isOwner)
  const watchlist   = useStore(s => s.watchlist)
  const prices      = useStore(s => s.prices)
  const nav         = isOwner ? OWNER_NAV : VIEWER_NAV
  const location    = useLocation()

  const [clock, setClock]       = useState(new Date())
  const [scrolled, setScrolled] = useState(false)
  const mainRef = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Header shadow when scrolled
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => setScrolled(el.scrollTop > 4)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Reset scroll on route change
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [location.pathname])

  const vixColor = vix >= 25 ? '#f87171' : vix >= 18 ? '#fbbf24' : '#4ade80'
  const vixLabel = vix >= 25 ? 'RISK OFF' : vix >= 18 ? 'CAUTION' : 'RISK ON'
  const timeStr  = clock.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    timeZone: 'America/New_York',
  })

  // Ticker items — duplicate for seamless loop
  const tickerItems = watchlist
    .map(s => ({ ...s, p: prices[s.symbol] }))
    .filter(s => s.p)

  return (
    <div className="flex flex-col h-dvh overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center gap-4 px-5 py-3 z-40 transition-shadow duration-300"
        style={{
          background: 'rgba(13,13,11,0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: scrolled
            ? '0 1px 32px rgba(0,0,0,0.5), 0 0 0 0 transparent'
            : '0 0 0 rgba(0,0,0,0)',
        }}
      >
        {/* Brand */}
        <span
          className="font-serif shrink-0 select-none"
          style={{ fontSize: 15, fontWeight: 300, color: '#f0ece3', letterSpacing: '-0.01em' }}
        >
          Trading Desk
        </span>

        <div className="shrink-0 hidden sm:block" style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />

        {/* Market status */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${marketOpen ? 'animate-pulse-slow' : ''}`}
            style={{ background: marketOpen ? '#22c55e' : 'rgba(255,255,255,0.18)', transition: 'background 1s ease' }}
          />
          <span style={{
            fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: marketOpen ? '#4ade80' : '#7a7268',
            transition: 'color 1s ease',
          }}>
            {marketOpen ? 'Market Open' : 'Closed'}
          </span>
        </div>

        {/* Live ticker — scrolling marquee on desktop */}
        {tickerItems.length > 0 && (
          <div className="hidden lg:block flex-1 overflow-hidden min-w-0 relative" style={{ maskImage: 'linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)' }}>
            <div
              className="flex items-center gap-6 whitespace-nowrap"
              style={{
                animation: tickerItems.length > 2 ? 'ticker 28s linear infinite' : 'none',
                width: tickerItems.length > 2 ? 'max-content' : 'auto',
              }}
            >
              {/* Duplicate for seamless loop */}
              {[...tickerItems, ...(tickerItems.length > 2 ? tickerItems : [])].map((s, i) => {
                const up = s.p.changePct >= 0
                return (
                  <div key={`${s.symbol}-${i}`} className="flex items-center gap-1.5 shrink-0">
                    <span style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#52525b' }}>
                      {s.symbol}
                    </span>
                    <span className="font-mono price-num" style={{ fontSize: 11, color: '#f0ece3', fontWeight: 500 }}>
                      {s.symbol === 'BTC'
                        ? `$${Math.round(s.p.price).toLocaleString()}`
                        : `$${s.p.price.toFixed(2)}`}
                    </span>
                    <span className="font-mono price-num" style={{ fontSize: 10, color: up ? '#4ade80' : '#f87171', fontWeight: 500 }}>
                      {up ? '+' : ''}{s.p.changePct.toFixed(2)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Right cluster */}
        <div className="flex items-center gap-4 ml-auto shrink-0">
          <span className="font-mono hidden sm:inline-flex items-center gap-1.5 price-num" style={{ fontSize: 10, color: '#52525b', letterSpacing: '0.06em' }}>
            VIX
            <span style={{ color: vixColor, fontWeight: 600, transition: 'color 0.6s ease' }}>{vix.toFixed(1)}</span>
            <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.5, color: vixColor, transition: 'color 0.6s ease' }}>{vixLabel}</span>
          </span>

          <span
            className="font-mono hidden md:block price-num"
            style={{ fontSize: 11, color: 'rgba(240,236,227,0.22)', letterSpacing: '0.08em' }}
          >
            {timeStr} ET
          </span>

          {!isOwner && (
            <span style={{
              fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(122,114,104,0.45)',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '2px 7px', borderRadius: 4,
            }}>
              View Only
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar — desktop ──────────────────────────────────────────────── */}
        <nav
          className="hidden lg:flex flex-col w-44 shrink-0 overflow-y-auto py-6"
          style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="px-3 space-y-0.5">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'text-[#c9a87c]'
                      : 'text-[#7a7268] hover:text-[#d4cfc7]'
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'rgba(184,149,106,0.09)' : 'transparent',
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                })}
              >
                {({ isActive }) => (
                  <>
                    {/* Active left bar */}
                    <div
                      className="absolute left-0 top-2 bottom-2 rounded-full transition-all duration-300"
                      style={{
                        width: 2,
                        background: '#b8956a',
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? 'scaleY(1)' : 'scaleY(0)',
                        transformOrigin: 'center',
                      }}
                    />
                    <Icon
                      size={13}
                      strokeWidth={isActive ? 1.8 : 1.5}
                      style={{ transition: 'stroke-width 0.2s ease, opacity 0.2s ease', opacity: isActive ? 1 : 0.6 }}
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Bottom version tag */}
          <div className="mt-auto px-6 pb-3">
            <p style={{ fontSize: 8, color: '#3a3730', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Research only
            </p>
          </div>
        </nav>

        {/* ── Main content ───────────────────────────────────────────────────── */}
        <main
          ref={mainRef}
          key={location.pathname}
          className="flex-1 overflow-y-auto min-w-0 page-enter scrollbar-none"
          style={{ padding: '24px 20px 96px', }}
        >
          <div className="max-w-screen-xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ── Bottom nav — mobile ────────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(13,13,11,0.95)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-around px-2 py-2.5" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
              style={{ minWidth: 52 }}
            >
              {({ isActive }) => (
                <>
                  <div style={{ transition: 'transform 0.2s var(--ease-spring)', transform: isActive ? 'scale(1.08)' : 'scale(1)' }}>
                    <Icon size={19} strokeWidth={isActive ? 1.8 : 1.5} />
                  </div>
                  <span style={{ transition: 'opacity 0.2s ease', opacity: isActive ? 1 : 0.6 }}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
