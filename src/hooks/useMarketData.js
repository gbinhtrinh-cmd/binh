import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import {
  fetchQuote, fetchSentiment, fetchNews, fetchVix,
  fetchFundamentals, fetchNextEarnings, fetchFearGreed,
  fetchCoinGeckoGlobal, fetchCoinGeckoTopCoins,
  fetchFredMacro, fetchSECFilings,
  classifyNewsImpact, classifyNewsSentiment, isMarketOpen, toDateStr,
} from '../lib/api'

function checkAlerts(symbol, price) {
  const { priceAlerts, removePriceAlert } = useStore.getState()
  priceAlerts
    .filter(a => a.symbol === symbol)
    .forEach(alert => {
      const triggered = alert.direction === 'above' ? price >= alert.price : price <= alert.price
      if (!triggered) return
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${symbol} Price Alert`, {
          body: `${symbol} is ${alert.direction === 'above' ? 'above' : 'below'} $${alert.price} — now $${price.toFixed(2)}`,
        })
      }
      removePriceAlert(alert.id)
    })
}

const delay = (ms) => new Promise(r => setTimeout(r, ms))

export function useMarketData() {
  const {
    watchlist, finnhubKey, fredKey,
    setIsLive, setMarketOpen, setVix,
    updatePrice, addSparkPoint, updateSentiment, addNews,
    setFearGreed, setFundamentals, setEarnings,
    setCryptoGlobal, setTopCoins, setMacroData,
  } = useStore()

  const intervalRef          = useRef(null)
  const sentimentIntervalRef = useRef(null)
  const vixIntervalRef       = useRef(null)
  const newsIntervalRef      = useRef(null)
  const fgIntervalRef        = useRef(null)
  const cryptoIntervalRef    = useRef(null)
  const macroIntervalRef     = useRef(null)

  // ── Finnhub: prices every 10s ─────────────────────────────────────────────
  async function fetchAllPrices() {
    setMarketOpen(isMarketOpen())
    for (const stock of watchlist) {
      try {
        const data = await fetchQuote(stock.symbol, finnhubKey)
        updatePrice(stock.symbol, data)
        addSparkPoint(stock.symbol, data.price)
        checkAlerts(stock.symbol, data.price)
      } catch (e) {
        console.warn(`Price fetch failed for ${stock.symbol}:`, e.message)
      }
      await delay(200)
    }
    setIsLive(true)
  }

  // ── StockTwits: sentiment every 10 min ────────────────────────────────────
  async function fetchAllSentiment() {
    for (const stock of watchlist) {
      try {
        const data = await fetchSentiment(stock.symbol)
        if (data) updateSentiment(stock.symbol, data)
      } catch (e) {
        console.warn(`Sentiment fetch failed for ${stock.symbol}:`, e.message)
      }
      await delay(300)
    }
  }

  // ── Finnhub: news every 5 min ─────────────────────────────────────────────
  async function fetchAllNews() {
    const today     = toDateStr()
    const yesterday = toDateStr(new Date(Date.now() - 86400000))
    const freshNews = []
    for (const stock of watchlist) {
      try {
        const items = await fetchNews(stock.symbol, finnhubKey, yesterday, today)
        if (!Array.isArray(items)) continue
        items.slice(0, 5).forEach(item => {
          freshNews.push({
            id:        item.url || `${stock.symbol}-${item.datetime}`,
            ticker:    stock.symbol,
            headline:  item.headline,
            summary:   item.summary,
            url:       item.url || null,
            sentiment: classifyNewsSentiment(item.headline, item.summary),
            impact:    classifyNewsImpact(item.headline, item.summary),
            time:      item.datetime * 1000,
            source:    item.source,
          })
        })
      } catch (e) {
        console.warn(`News fetch failed for ${stock.symbol}:`, e.message)
      }
      await delay(200)
    }
    if (freshNews.length) addNews(freshNews)
  }

  // ── Finnhub: VIX every 15 min ─────────────────────────────────────────────
  async function fetchVixData() {
    try {
      const v = await fetchVix(finnhubKey)
      setVix(v)
    } catch (e) {
      console.warn('VIX fetch failed:', e.message)
    }
  }

  // ── alternative.me: Fear & Greed hourly ───────────────────────────────────
  async function fetchFearGreedData() {
    try {
      const data = await fetchFearGreed()
      if (data) setFearGreed(data)
    } catch (e) {
      console.warn('Fear & Greed fetch failed:', e.message)
    }
  }

  // ── CoinGecko: global market + top coins every 5 min ─────────────────────
  async function fetchCryptoData() {
    try {
      const [global, coins] = await Promise.all([
        fetchCoinGeckoGlobal(),
        fetchCoinGeckoTopCoins(10),
      ])
      setCryptoGlobal(global)
      setTopCoins(coins)
    } catch (e) {
      console.warn('CoinGecko fetch failed:', e.message)
    }
  }

  // ── FRED: macro indicators hourly (only if key set) ───────────────────────
  async function fetchMacroData() {
    if (!fredKey) return
    try {
      const data = await fetchFredMacro(fredKey)
      setMacroData(data)
    } catch (e) {
      console.warn('FRED fetch failed:', e.message)
    }
  }

  // ── Finnhub: fundamentals once on mount (3s gap per symbol) ───────────────
  async function fetchFundamentalsAll() {
    const stocks = watchlist.filter(s => s.type !== 'crypto')
    for (const stock of stocks) {
      try {
        const data = await fetchFundamentals(stock.symbol, finnhubKey)
        setFundamentals(stock.symbol, data)
      } catch (e) {
        console.warn(`Fundamentals fetch failed for ${stock.symbol}:`, e.message)
      }
      await delay(3000)
    }
  }

  // ── Finnhub: earnings once on mount (2s gap per symbol) ───────────────────
  async function fetchEarningsAll() {
    const stocks = watchlist.filter(s => s.type === 'stock')
    for (const stock of stocks) {
      try {
        const data = await fetchNextEarnings(stock.symbol, finnhubKey)
        setEarnings(stock.symbol, data)
      } catch (e) {
        console.warn(`Earnings fetch failed for ${stock.symbol}:`, e.message)
        setEarnings(stock.symbol, null)
      }
      await delay(2000)
    }
  }

  // ── SEC EDGAR: 8-K/10-Q/10-K filings once on mount ───────────────────────
  async function fetchSECFilingsAll() {
    const stocks = watchlist.filter(s => s.type !== 'crypto')
    const allFilings = []
    for (const stock of stocks) {
      const filings = await fetchSECFilings(stock.symbol)
      allFilings.push(...filings)
      await delay(800)
    }
    if (allFilings.length) addNews(allFilings)
  }

  useEffect(() => {
    // Immediate fetches
    fetchAllPrices()
    fetchAllNews()
    fetchAllSentiment()
    fetchVixData()
    fetchFearGreedData()
    fetchCryptoData()
    fetchMacroData()

    // Staggered one-time fetches (avoid rate-limit burst at mount)
    const fundTimer     = setTimeout(fetchFundamentalsAll, 8000)
    const earningsTimer = setTimeout(
      fetchEarningsAll,
      8000 + watchlist.filter(s => s.type !== 'crypto').length * 3200
    )
    const secTimer = setTimeout(fetchSECFilingsAll, 20000)

    // Recurring intervals
    intervalRef.current          = setInterval(fetchAllPrices,     10000)   // prices: 10s
    sentimentIntervalRef.current = setInterval(fetchAllSentiment,  600000)  // sentiment: 10 min
    vixIntervalRef.current       = setInterval(fetchVixData,       900000)  // VIX: 15 min
    newsIntervalRef.current      = setInterval(fetchAllNews,       300000)  // news: 5 min
    fgIntervalRef.current        = setInterval(fetchFearGreedData, 3600000) // F&G: 1 hr
    cryptoIntervalRef.current    = setInterval(fetchCryptoData,    300000)  // CoinGecko: 5 min
    macroIntervalRef.current     = setInterval(fetchMacroData,     3600000) // FRED: 1 hr

    return () => {
      clearInterval(intervalRef.current)
      clearInterval(sentimentIntervalRef.current)
      clearInterval(vixIntervalRef.current)
      clearInterval(newsIntervalRef.current)
      clearInterval(fgIntervalRef.current)
      clearInterval(cryptoIntervalRef.current)
      clearInterval(macroIntervalRef.current)
      clearTimeout(fundTimer)
      clearTimeout(earningsTimer)
      clearTimeout(secTimer)
    }
  }, [watchlist.length, finnhubKey, fredKey])
}
