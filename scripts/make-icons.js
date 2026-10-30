// Generates the PNG app icons Android needs to make the app installable.
// No image libraries: it draws the same "pace lines" picture as public/icon.svg
// pixel by pixel and writes a PNG using Node's built-in zlib.
// Run with: npm run icons
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

// Pastel palette.
const BG = [0xfb, 0xe8, 0xd3]   // peach
const BALL = [0x5c, 0x40, 0x33] // dark brown
// "Pace lines": three streaks trailing a ball, on a 512 grid, matching icon.svg.
const STREAKS = [
  { from: [90, 200], to: [270, 200], colour: [0xa3, 0xd3, 0x9c] },  // pastel green
  { from: [140, 262], to: [300, 262], colour: [0xf6, 0xa7, 0x7a] }, // pastel orange
  { from: [100, 324], to: [250, 324], colour: [0xc8, 0xa2, 0x7f] }, // light brown
]
const HALF_STROKE = 18
const BALL_C = [370, 262], BALL_R = 70

function distToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}
function colourAt(px, py) {
  if (Math.hypot(px - BALL_C[0], py - BALL_C[1]) <= BALL_R) return BALL
  const streak = STREAKS.find((l) => distToSegment(px, py, l.from, l.to) <= HALF_STROKE)
  return streak ? streak.colour : BG
}

function draw(size) {
  const scale = 512 / size
  const N = 3 // 3x3 samples per pixel for smooth edges
  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3) // first byte = PNG filter type 0
    for (let x = 0; x < size; x++) {
      const sum = [0, 0, 0]
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const c = colourAt((x + (i + 0.5) / N) * scale, (y + (j + 0.5) / N) * scale)
        for (let k = 0; k < 3; k++) sum[k] += c[k]
      }
      for (let k = 0; k < 3; k++) row[1 + x * 3 + k] = Math.round(sum[k] / (N * N))
    }
    rows.push(row)
  }
  return Buffer.concat(rows)
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function png(size) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(draw(size))),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [192, 512]) {
  writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), png(size))
  console.log(`wrote public/icon-${size}.png`)
}
