import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_WATCHLIST = [
  { symbol: 'AAPL', name: 'Apple Inc.',   type: 'stock'  },
  { symbol: 'NVDA', name: 'Nvidia Corp.', type: 'stock'  },
  { symbol: 'TSLA', name: 'Tesla Inc.',   type: 'stock'  },
  { symbol: 'BTC',  name: 'Bitcoin',      type: 'crypto' },
  { symbol: 'SPY',  name: 'S&P 500 ETF', type: 'etf'    },
]

const DEFAULT_SIGNALS = {
  AAPL: 'BUY WATCH',
  NVDA: 'HOLD',
  TSLA: 'AVOID',
  BTC:  'BUY WATCH',
  SPY:  'HOLD',
}

const DEFAULT_SENTIMENT = {
  AAPL: { bullishRatio: 0.73, buzzScore: 68, trend: 'rising',  label: 'BULLISH' },
  NVDA: { bullishRatio: 0.60, buzzScore: 52, trend: 'falling', label: 'NEUTRAL' },
  TSLA: { bullishRatio: 0.71, buzzScore: 82, trend: 'flat',    label: 'BULLISH' },
  BTC:  { bullishRatio: 0.58, buzzScore: 63, trend: 'rising',  label: 'NEUTRAL' },
  SPY:  { bullishRatio: 0.80, buzzScore: 55, trend: 'rising',  label: 'BULLISH' },
}

export const useStore = create(
  persist(
    (set, get) => ({
      // Config
      watchlist:   DEFAULT_WATCHLIST,
      timezone:    'America/New_York',
      finnhubKey:  'd926m31r01qrfbe8p63gd926m31r01qrfbe8p640',
      claudeKey:   '',

      // Live data (not persisted)
      prices:      {},
      sparklines:  {},
      signals:     DEFAULT_SIGNALS,
      sentiment:   DEFAULT_SENTIMENT,
      news:        [],
      signalsLog:  [],
      morningBriefs: [],
      todayBrief:  null,
      lastUpdated: {},
      isLive:      false,
      marketOpen:  false,
      vix:         21.4,

      // Fundamentals (not persisted — refreshed on mount)
      fearGreed:    null,  // { value, classification, color }
      fundamentals: {},    // { AAPL: { high52w, low52w, targetMean, analysts, buy, hold, sell } }
      earnings:     {},    // { AAPL: { date, daysUntil } | null }

      // CoinGecko — crypto market data
      cryptoGlobal: null,  // { totalMarketCap, btcDominance, totalVolume24h, marketCapChangePct24h }
      topCoins:     [],    // [{ symbol, name, price, changePct24h, marketCap, rank }]

      // FRED — macro indicators
      fredKey:   '',
      macroData: null,     // { fedRate, yield10y, cpi, unemployment }

      // Price alerts (persisted)
      priceAlerts: [],     // [{ id, symbol, direction, price }]

      // Watchlist ideas — stocks saved for later consideration (persisted)
      ideaList: [],        // [{ symbol, name, type, addedAt }]

      // Auth
      isAuthenticated: false,
      isOwner:         false,
      authError:       '',

      authenticate: (password) => {
        if (password === 'owner2026') {
          set({ isAuthenticated: true, isOwner: true, authError: '' })
          return 'owner'
        }
        if (password === 'TradingDesk2026') {
          set({ isAuthenticated: true, isOwner: false, authError: '' })
          return 'viewer'
        }
        set({ authError: 'Incorrect password. Try again.' })
        return null
      },

      logout: () => set({ isAuthenticated: false, isOwner: false }),

      // Config actions
      setWatchlist:  (list) => set({ watchlist: list }),
      setTimezone:   (tz)   => set({ timezone: tz }),
      setFinnhubKey: (k)    => set({ finnhubKey: k }),
      setClaudeKey:  (k)    => set({ claudeKey: k }),
      setTodayBrief: (b)    => set({ todayBrief: b }),

      // Price actions
      updatePrice: (symbol, data) => set(s => ({
        prices:      { ...s.prices,      [symbol]: data },
        lastUpdated: { ...s.lastUpdated, [symbol]: Date.now() },
      })),

      addSparkPoint: (symbol, price) => set(s => {
        const prev = s.sparklines[symbol] ?? []
        return { sparklines: { ...s.sparklines, [symbol]: [...prev.slice(-24), price] } }
      }),

      updateSentiment: (symbol, data) => set(s => ({
        sentiment: { ...s.sentiment, [symbol]: data },
      })),

      addNews: (items) => set(s => {
        const existing = new Set(s.news.map(n => n.id))
        const fresh = items.filter(n => !existing.has(n.id))
        return { news: [...fresh, ...s.news].slice(0, 50) }
      }),

      addSignal: (signal) => set(s => ({
        signalsLog: [signal, ...s.signalsLog].slice(0, 200),
      })),

      saveMorningBrief: (brief) => set(s => ({
        morningBriefs: [brief, ...s.morningBriefs].slice(0, 14),
      })),

      setIsLive:    (v) => set({ isLive: v }),
      setMarketOpen:(v) => set({ marketOpen: v }),
      setVix:       (v) => set({ vix: v }),

      // Config
      setFredKey: (k) => set({ fredKey: k }),

      // Fundamentals actions
      setFearGreed: (data) => set({ fearGreed: data }),

      setFundamentals: (symbol, data) => set(s => ({
        fundamentals: { ...s.fundamentals, [symbol]: data },
      })),

      setEarnings: (symbol, data) => set(s => ({
        earnings: { ...s.earnings, [symbol]: data },
      })),

      // Alert actions
      addPriceAlert: (alert) => set(s => ({
        priceAlerts: [...s.priceAlerts, alert],
      })),

      removePriceAlert: (id) => set(s => ({
        priceAlerts: s.priceAlerts.filter(a => a.id !== id),
      })),

      // CoinGecko + macro actions
      setCryptoGlobal: (data) => set({ cryptoGlobal: data }),
      setTopCoins:     (data) => set({ topCoins: data }),
      setMacroData:    (data) => set({ macroData: data }),

      // Idea list actions
      addIdea: (item) => set(s => {
        if (s.ideaList.some(i => i.symbol === item.symbol)) return {}
        return { ideaList: [...s.ideaList, { ...item, addedAt: Date.now() }] }
      }),

      removeIdea: (symbol) => set(s => ({
        ideaList: s.ideaList.filter(i => i.symbol !== symbol),
      })),

      promoteIdea: (symbol) => set(s => {
        const idea = s.ideaList.find(i => i.symbol === symbol)
        if (!idea || s.watchlist.some(w => w.symbol === symbol)) return { ideaList: s.ideaList.filter(i => i.symbol !== symbol) }
        const { addedAt, ...stockItem } = idea
        return {
          watchlist: [...s.watchlist, stockItem],
          ideaList:  s.ideaList.filter(i => i.symbol !== symbol),
        }
      }),
    }),
    {
      name: 'trading-dashboard-store',
      partialize: (s) => ({
        watchlist:       s.watchlist,
        timezone:        s.timezone,
        finnhubKey:      s.finnhubKey,
        claudeKey:       s.claudeKey,
        morningBriefs:   s.morningBriefs,
        todayBrief:      s.todayBrief,
        isAuthenticated: s.isAuthenticated,
        isOwner:         s.isOwner,
        priceAlerts:     s.priceAlerts,
        ideaList:        s.ideaList,
        fredKey:         s.fredKey,
      }),
    }
  )
)
