/**
 * Scan RPGMaker tileset_B and save a labeled preview grid 
 * so we can identify which tiles are floor/wall patterns.
 */
const { PNG } = require('pngjs')
const fs = require('fs')
const path = require('path')

const TILE_IN = 48
const tilesetPath = path.join(__dirname, '..', 'assets', 'rpgmaker', 'mvmz', 'tileset_B.png')
const buf = fs.readFileSync(tilesetPath)
const tileset = PNG.sync.read(buf)

// Extract a grid of tiles from columns 0-7, rows 0-15 (the left half)
// Save each row as a separate preview
const COLS = 8
const ROWS = 16

for (let row = 0; row < ROWS; row++) {
    const outW = COLS * TILE_IN
    const outH = TILE_IN
    const out = new PNG({ width: outW, height: outH })

    for (let col = 0; col < COLS; col++) {
        const srcX = col * TILE_IN
        const srcY = row * TILE_IN
        for (let y = 0; y < TILE_IN; y++) {
            for (let x = 0; x < TILE_IN; x++) {
                const srcIdx = ((srcY + y) * tileset.width + (srcX + x)) * 4
                const dstIdx = (y * outW + (col * TILE_IN + x)) * 4
                out.data[dstIdx] = tileset.data[srcIdx]
                out.data[dstIdx + 1] = tileset.data[srcIdx + 1]
                out.data[dstIdx + 2] = tileset.data[srcIdx + 2]
                out.data[dstIdx + 3] = tileset.data[srcIdx + 3]
            }
        }
    }

    const outPath = path.join(__dirname, '..', 'assets', `tilerow_${row.toString().padStart(2, '0')}.png`)
    fs.writeFileSync(outPath, PNG.sync.write(out))
    console.log(`Row ${row}: ${outPath}`)
}
