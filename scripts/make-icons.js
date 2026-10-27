// Generates the PNG app icons Android needs to make the app installable.
// No image libraries: it draws the same "rising line" as public/icon.svg
// pixel by pixel and writes a PNG using Node's built-in zlib.
// Run with: npm run icons
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [0x0b, 0x0e, 0x13]
const FG = [0xc6, 0xf4, 0x32]
// Line points on a 512 grid, matching icon.svg.
const POINTS = [[96, 368], [208, 208], [280, 288], [416, 136]]
const STROKE = 22 // half the stroke width

function distToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

function draw(size) {
  const scale = 512 / size
  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3) // first byte = PNG filter type 0
    for (let x = 0; x < size; x++) {
      const px = (x + 0.5) * scale, py = (y + 0.5) * scale
      let d = Infinity
      for (let i = 0; i < POINTS.length - 1; i++) d = Math.min(d, distToSegment(px, py, POINTS[i], POINTS[i + 1]))
      // Soft edge for anti-aliasing.
      const a = Math.max(0, Math.min(1, STROKE - d + 0.5))
      for (let c = 0; c < 3; c++) row[1 + x * 3 + c] = Math.round(BG[c] + (FG[c] - BG[c]) * a)
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
