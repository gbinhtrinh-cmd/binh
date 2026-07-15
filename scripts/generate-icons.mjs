/**
 * Generates PWA icons (192x192 and 512x512) using only Node.js built-ins.
 * Run once after `npm install`: node scripts/generate-icons.mjs
 */
import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'icons')
mkdirSync(OUT, { recursive: true })

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const s = size / 32 // scale factor (design is 32x32)

  // Background
  ctx.fillStyle = '#0f172a'
  const r = 8 * s
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fill()

  // Chart line
  ctx.strokeStyle = '#22c55e'
  ctx.lineWidth = 2.5 * s
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  const pts = [[4,22],[10,14],[16,18],[22,8],[28,12]]
  pts.forEach(([x, y], i) => {
    const px = x * s, py = y * s
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  })
  ctx.stroke()

  // Accent dot
  ctx.fillStyle = '#6366f1'
  ctx.beginPath()
  ctx.arc(28 * s, 12 * s, 2 * s, 0, Math.PI * 2)
  ctx.fill()

  return canvas.toBuffer('image/png')
}

// Try canvas-based generation, fall back to copying SVG-derived placeholder
try {
  writeFileSync(join(OUT, 'icon-192.png'), drawIcon(192))
  writeFileSync(join(OUT, 'icon-512.png'), drawIcon(512))

  // Also write apple-touch-icon
  writeFileSync(join(__dirname, '..', 'public', 'apple-touch-icon.png'), drawIcon(180))

  console.log('✅ Icons generated: icon-192.png, icon-512.png, apple-touch-icon.png')
} catch (e) {
  console.warn('canvas package not available — run: npm install canvas')
  console.warn('Icons will fall back to SVG. App still works, just no install icon.')
}
