import { useState } from 'react'
import { useStore } from '../store/useStore'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { BarChart2 } from 'lucide-react'

const SENT_HISTORY = {
  AAPL: [
    { t: '6/26', bull: 0.62, buzz: 48, price: 281 },
    { t: '6/27', bull: 0.65, buzz: 52, price: 283 },
    { t: '6/28', bull: 0.70, buzz: 61, price: 285 },
    { t: '6/29', bull: 0.68, buzz: 55, price: 282 },
    { t: '6/30', bull: 0.73, buzz: 68, price: 289 },
    { t: '7/1',  bull: 0.75, buzz: 70, price: 294 },
    { t: '7/2',  bull: 0.73, buzz: 68, price: 308 },
  ],
  NVDA: [
    { t: '6/26', bull: 0.72, buzz: 60, price: 208 },
    { t: '6/27', bull: 0.70, buzz: 58, price: 205 },
    { t: '6/28', bull: 0.65, buzz: 62, price: 202 },
    { t: '6/29', bull: 0.60, buzz: 65, price: 200 },
    { t: '6/30', bull: 0.55, buzz: 72, price: 197 },
    { t: '7/1',  bull: 0.52, buzz: 68, price: 196 },
    { t: '7/2',  bull: 0.60, buzz: 52, price: 195 },
  ],
  TSLA: [
    { t: '6/26', bull: 0.55, buzz: 60, price: 390 },
    { t: '6/27', bull: 0.60, buzz: 65, price: 405 },
    { t: '6/28', bull: 0.65, buzz: 70, price: 415 },
    { t: '6/29', bull: 0.70, buzz: 74, price: 420 },
    { t: '6/30', bull: 0.68, buzz: 72, price: 425 },
    { t: '7/1',  bull: 0.72, buzz: 78, price: 428 },
    { t: '7/2',  bull: 0.71, buzz: 82, price: 393 },
  ],
  BTC: [
    { t: '6/26', bull: 0.45, buzz: 55, price: 60000 },
    { t: '6/27', bull: 0.42, buzz: 60, price: 59000 },
    { t: '6/28', bull: 0.40, buzz: 65, price: 58500 },
    { t: '6/29', bull: 0.38, buzz: 68, price: 58000 },
    { t: '6/30', bull: 0.42, buzz: 63, price: 59000 },
    { t: '7/1',  bull: 0.50, buzz: 60, price: 60000 },
    { t: '7/2',  bull: 0.58, buzz: 63, price: 61480 },
  ],
  SPY: [
    { t: '6/26', bull: 0.70, buzz: 52, price: 542 },
    { t: '6/27', bull: 0.72, buzz: 54, price: 545 },
    { t: '6/28', bull: 0.68, buzz: 56, price: 548 },
    { t: '6/29', bull: 0.65, buzz: 58, price: 546 },
    { t: '6/30', bull: 0.62, buzz: 55, price: 549 },
    { t: '7/1',  bull: 0.75, buzz: 52, price: 550 },
    { t: '7/2',  bull: 0.80, buzz: 55, price: 549 },
  ],
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.value < 2 ? (p.value * 100).toFixed(0) + '%' : p.value}</p>
      ))}
    </div>
  )
}

export default function SentimentDashboard() {
  const [selected, setSelected] = useState('TSLA')
  const sentiment = useStore(s => s.sentiment)
  const watchlist = useStore(s => s.watchlist)
  const data = SENT_HISTORY[selected] ?? []
  const current = sentiment[selected]

  // Normalize price to 0-100 scale for dual axis overlay
  const priceMin = Math.min(...data.map(d => d.price))
  const priceMax = Math.max(...data.map(d => d.price))
  const chartData = data.map(d => ({
    ...d,
    priceNorm: priceMax > priceMin ? ((d.price - priceMin) / (priceMax - priceMin)) : 0.5,
  }))

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-100 mb-3">Sentiment Dashboard</h1>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {watchlist.map(s => (
            <button
              key={s.symbol}
              onClick={() => setSelected(s.symbol)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${selected === s.symbol ? 'bg-accent border-accent text-white' : 'bg-surface-card border-surface-border text-slate-400'}`}
            >
              {s.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Current sentiment cards */}
      {current && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Bull Ratio', value: `${Math.round(current.bullishRatio * 100)}%`, color: current.bullishRatio >= 0.65 ? 'text-bull-text' : current.bullishRatio <= 0.40 ? 'text-bear-text' : 'text-caution-text' },
            { label: 'Buzz Score', value: current.buzzScore, color: current.buzzScore >= 85 ? 'text-bear-text' : current.buzzScore >= 70 ? 'text-caution-text' : 'text-slate-200' },
            { label: 'Trend', value: current.trend ?? '—', color: current.trend === 'rising' ? 'text-bull-text' : current.trend === 'falling' ? 'text-bear-text' : 'text-caution-text' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center">
              <p className="text-[10px] text-slate-500 uppercase mb-1">{label}</p>
              <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Bullish ratio chart */}
      <div className="card mb-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Bullish Ratio vs Price — {selected}</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0.65} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={0.40} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4} />
            <Line type="monotone" dataKey="bull" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8', r: 3 }} name="Bull Ratio" isAnimationActive={false} />
            <Line type="monotone" dataKey="priceNorm" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Price (norm.)" isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-[10px] text-slate-500 justify-center">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent-text inline-block" /> Bullish Ratio</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-slate-500 inline-block border-dashed" /> Price (normalized)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-px bg-bull inline-block" /> Bullish threshold</span>
          <span className="flex items-center gap-1"><span className="w-3 h-px bg-bear inline-block" /> Bearish threshold</span>
        </div>
      </div>

      {/* Buzz score chart */}
      <div className="card">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Buzz Score History — {selected}</p>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'SPIKE', fill: '#ef4444', fontSize: 9 }} />
            <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.4} />
            <Line type="monotone" dataKey="buzz" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} name="Buzz" isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
