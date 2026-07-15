// Finnhub + StockTwits + alternative.me + CoinGecko + FRED + SEC EDGAR

// ─── Finnhub ──────────────────────────────────────────────────────────────────

export async function fetchQuote(symbol, token) {
  const finnhubSymbol = symbol === 'BTC' ? 'BINANCE:BTCUSDT' : symbol
  const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${token}`)
  const d = await r.json()
  if (!d?.c) throw new Error(`No data for ${symbol}`)
  const change = d.c - d.pc
  const changePct = (change / d.pc) * 100
  return { price: d.c, change, changePct, prevClose: d.pc, open: d.o, high: d.h, low: d.l, volume: 0, avgVolume: 0 }
}

export async function fetchNews(symbol, token, from, to) {
  const isCrypto = symbol === 'BTC'
  const url = isCrypto
    ? `https://finnhub.io/api/v1/news?category=crypto&token=${token}`
    : `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${token}`
  const r = await fetch(url)
  return r.json()
}

export async function fetchSentiment(symbol) {
  const stwSymbol = symbol === 'BTC' ? 'BTC.X' : symbol
  try {
    const r = await fetch(`https://api.stocktwits.com/api/2/streams/symbol/${stwSymbol}.json`)
    const d = await r.json()
    const msgs = d?.messages ?? []
    let bull = 0, bear = 0
    msgs.forEach(m => {
      const s = m?.entities?.sentiment?.basic
      if (s === 'Bullish') bull++
      if (s === 'Bearish') bear++
    })
    const total = bull + bear
    const bullishRatio = total > 0 ? bull / total : 0.5
    const buzzScore = Math.min(100, Math.round((msgs.length / 60) * 100))
    const label = bullishRatio >= 0.65 ? 'BULLISH' : bullishRatio <= 0.40 ? 'BEARISH' : 'NEUTRAL'
    return { bullishRatio, buzzScore, label, bull, bear, total: msgs.length }
  } catch {
    return null
  }
}

export async function fetchVix(token) {
  const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=^VIX&token=${token}`)
  const d = await r.json()
  if (d?.c > 0) return d.c
  throw new Error('VIX unavailable from Finnhub')
}

export async function fetchFundamentals(symbol, token) {
  const [mR, tR, rR] = await Promise.all([
    fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${token}`),
    fetch(`https://finnhub.io/api/v1/stock/price-target?symbol=${symbol}&token=${token}`),
    fetch(`https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${token}`),
  ])
  const [m, t, recs] = await Promise.all([mR.json(), tR.json(), rR.json()])
  const rec = Array.isArray(recs) ? recs[0] : null
  return {
    high52w:    m?.metric?.['52WeekHigh']   ?? null,
    low52w:     m?.metric?.['52WeekLow']    ?? null,
    targetMean: t?.targetMean               ?? null,
    targetHigh: t?.targetHigh               ?? null,
    targetLow:  t?.targetLow                ?? null,
    analysts:   t?.numberOfAnalysts         ?? 0,
    buy:        (rec?.buy ?? 0) + (rec?.strongBuy ?? 0),
    hold:       rec?.hold                   ?? 0,
    sell:       (rec?.sell ?? 0) + (rec?.strongSell ?? 0),
  }
}

export async function fetchNextEarnings(symbol, token) {
  const from = new Date().toISOString().slice(0, 10)
  const to   = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
  const r = await fetch(`https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&symbol=${symbol}&token=${token}`)
  const d = await r.json()
  const items = d?.earningsCalendar ?? []
  if (!items.length) return null
  const next = items.sort((a, b) => new Date(a.date) - new Date(b.date))[0]
  const daysUntil = Math.ceil((new Date(next.date) - new Date()) / 86400000)
  return { date: next.date, daysUntil }
}

// ─── alternative.me Fear & Greed ──────────────────────────────────────────────

export async function fetchFearGreed() {
  const r = await fetch('https://api.alternative.me/fng/')
  const d = await r.json()
  const item = d?.data?.[0]
  if (!item) return null
  const value = parseInt(item.value)
  const color = value <= 25 ? '#f87171' : value <= 45 ? '#fbbf24' : value <= 55 ? '#7a7268' : value <= 75 ? '#4ade80' : '#22c55e'
  return { value, classification: item.value_classification, color }
}

// ─── CoinGecko (no key required) ──────────────────────────────────────────────

// Global crypto market data: total market cap, BTC dominance, 24h volume
export async function fetchCoinGeckoGlobal() {
  const r = await fetch('https://api.coingecko.com/api/v3/global')
  if (!r.ok) throw new Error('CoinGecko global unavailable')
  const d = await r.json()
  const data = d?.data
  return {
    totalMarketCap:           data?.total_market_cap?.usd            ?? null,
    totalVolume24h:           data?.total_volume?.usd                ?? null,
    btcDominance:             data?.market_cap_percentage?.btc       ?? null,
    ethDominance:             data?.market_cap_percentage?.eth       ?? null,
    marketCapChangePct24h:    data?.market_cap_change_percentage_24h_usd ?? null,
    activeCryptocurrencies:   data?.active_cryptocurrencies           ?? null,
  }
}

// Top coins by market cap with price change
export async function fetchCoinGeckoTopCoins(limit = 10) {
  const r = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
  )
  if (!r.ok) throw new Error('CoinGecko top coins unavailable')
  const d = await r.json()
  return d.map(c => ({
    id:          c.id,
    symbol:      c.symbol.toUpperCase(),
    name:        c.name,
    price:       c.current_price,
    changePct24h: c.price_change_percentage_24h,
    marketCap:   c.market_cap,
    volume24h:   c.total_volume,
    rank:        c.market_cap_rank,
  }))
}

// ─── FRED — Federal Reserve Economic Data (free key at fred.stlouisfed.org) ──

// Returns the most recent observation value for a FRED series
export async function fetchFredSeries(seriesId, apiKey) {
  const r = await fetch(
    `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`
  )
  if (!r.ok) throw new Error(`FRED ${seriesId} unavailable`)
  const d = await r.json()
  const obs = d?.observations?.find(o => o.value !== '.')
  return obs ? parseFloat(obs.value) : null
}

// Fetch the four key macro indicators in one call set
// seriesIds: FEDFUNDS (fed rate), DGS10 (10yr yield), CPIAUCSL (CPI), UNRATE (unemployment)
export async function fetchFredMacro(apiKey) {
  const ids = ['FEDFUNDS', 'DGS10', 'CPIAUCSL', 'UNRATE']
  const [fedRate, yield10y, cpi, unemployment] = await Promise.all(
    ids.map(id => fetchFredSeries(id, apiKey).catch(() => null))
  )
  return { fedRate, yield10y, cpi, unemployment }
}

// ─── SEC EDGAR (no key required, data.sec.gov is CORS-enabled) ───────────────

// Pre-seeded CIK map for common symbols to avoid the www.sec.gov CORS lookup
const KNOWN_CIKS = {
  AAPL: '0000320193', MSFT: '0000789019', AMZN: '0001018724',
  GOOGL: '0001652044', GOOG: '0001652044', META: '0001326801',
  TSLA: '0001318605', NVDA: '0001045810', AMD:  '0000002488',
  INTC: '0000050863', ORCL: '0001341439', CRM:  '0001108524',
  NFLX: '0001065280', PYPL: '0001633917', ADBE: '0000796343',
  QCOM: '0000804328', TXN:  '0000097476', MU:   '0000723125',
  JPM:  '0000019617', BAC:  '0000070858', WFC:  '0000072971',
  GS:   '0000886982', MS:   '0000895421', C:    '0000831001',
  BRK:  '0001067983', JNJ:  '0000200406', UNH:  '0000731766',
  LLY:  '0000059478', PFE:  '0000078003', ABBV: '0001551152',
  XOM:  '0000034088', CVX:  '0000093410', V:    '0001403161',
  MA:   '0001141391', WMT:  '0000104169', HD:   '0000354950',
  COST: '0000909832', DIS:  '0001001039', SBUX: '0000829224',
  NKE:  '0000320187', MCD:  '0000063754', KO:   '0000021344',
  PEP:  '0000077476', SPY:  '0000884394', QQQ:  '0001090872',
}

let _dynamicCIKMap = null

async function resolveCIK(symbol) {
  const upper = symbol.toUpperCase()
  if (KNOWN_CIKS[upper]) return KNOWN_CIKS[upper]
  // Fall back to dynamic lookup from EDGAR
  try {
    if (!_dynamicCIKMap) {
      const r = await fetch('https://www.sec.gov/files/company_tickers.json')
      const d = await r.json()
      _dynamicCIKMap = {}
      Object.values(d).forEach(({ ticker, cik_str }) => {
        _dynamicCIKMap[ticker.toUpperCase()] = String(cik_str).padStart(10, '0')
      })
    }
    return _dynamicCIKMap[upper] ?? null
  } catch {
    return null
  }
}

// Fetch recent 8-K, 10-Q, 10-K filings from SEC EDGAR and return them as news items
export async function fetchSECFilings(symbol) {
  const cik = await resolveCIK(symbol)
  if (!cik) return []
  const r = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`)
  if (!r.ok) return []
  const d = await r.json()
  const f = d?.filings?.recent
  if (!f?.form) return []

  const cutoff = Date.now() - 60 * 86400000 // last 60 days
  const TARGET_FORMS = new Set(['8-K', '10-Q', '10-K', '6-K'])
  const results = []

  for (let i = 0; i < f.form.length; i++) {
    if (!TARGET_FORMS.has(f.form[i])) continue
    const filedTs = new Date(f.filingDate[i]).getTime()
    if (filedTs < cutoff) break

    const cikRaw = cik.replace(/^0+/, '')
    const accClean = f.accessionNumber[i].replace(/-/g, '')
    const filingUrl = `https://www.sec.gov/Archives/edgar/data/${cikRaw}/${accClean}/`

    results.push({
      id:        `sec-${symbol}-${f.accessionNumber[i]}`,
      ticker:    symbol,
      headline:  f.primaryDocDescription[i] || `${f.form[i]} — ${symbol}`,
      summary:   `${symbol} submitted a ${f.form[i]} filing to the SEC on ${f.filingDate[i]}. Click to view the full filing on EDGAR.`,
      url:       filingUrl,
      source:    'SEC EDGAR',
      type:      'sec',
      form:      f.form[i],
      time:      filedTs,
      sentiment: 'neutral',
      impact:    ['10-K', '10-Q'].includes(f.form[i]) ? 'HIGH' : 'MEDIUM',
    })
    if (results.length >= 4) break
  }
  return results
}

// ─── News classifiers ─────────────────────────────────────────────────────────

export function classifyNewsImpact(headline, summary) {
  const text = (headline + ' ' + (summary ?? '')).toLowerCase()
  const highKeywords = ['earnings', 'beat', 'miss', 'guidance', 'upgrade', 'downgrade', 'fda', 'merger', 'acquisition', 'ceo', 'lawsuit', 'antitrust', 'ban', 'short', 'investigation', 'record', 'crash', 'surge', 'plunge', 'bankruptcy', 'default', 'fed', 'rate hike', 'rate cut', 'delivery']
  return highKeywords.some(k => text.includes(k)) ? 'HIGH' : 'MEDIUM'
}

export function classifyNewsSentiment(headline, summary) {
  const text = (headline + ' ' + (summary ?? '')).toLowerCase()
  const bullish = ['beat', 'surge', 'rally', 'upgrade', 'raised', 'record high', 'buy', 'bullish', 'strong', 'growth', 'expands', 'profit', 'gains', 'positive', 'approval', 'deal', 'partnership']
  const bearish = ['miss', 'plunge', 'crash', 'downgrade', 'cut', 'short', 'lawsuit', 'ban', 'warning', 'decline', 'drop', 'loss', 'bearish', 'weak', 'recession', 'investigation', 'fine', 'breach', 'delay']
  const bScore = bullish.filter(k => text.includes(k)).length
  const rScore = bearish.filter(k => text.includes(k)).length
  if (bScore > rScore) return 'bullish'
  if (rScore > bScore) return 'bearish'
  return 'neutral'
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function isMarketOpen(timezone = 'America/New_York') {
  const now = new Date()
  const et = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', minute: 'numeric', hour12: false, weekday: 'short' }).formatToParts(now)
  const day     = et.find(p => p.type === 'weekday')?.value
  const hour    = parseInt(et.find(p => p.type === 'hour')?.value ?? '0')
  const min     = parseInt(et.find(p => p.type === 'minute')?.value ?? '0')
  const timeVal = hour * 60 + min
  return !['Sat', 'Sun'].includes(day) && timeVal >= 570 && timeVal < 960
}

export function formatTime(ts, timezone = 'America/New_York') {
  return new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(ts))
}

export function formatDate(ts) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(ts))
}

export function toDateStr(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

export async function callClaude(prompt, apiKey, maxTokens = 1200) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Claude API error ${r.status}`)
  }
  const d = await r.json()
  return d.content[0]?.text ?? ''
}
