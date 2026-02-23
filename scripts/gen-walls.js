/**
 * Fix wall tiles:
 * 1. Sample from the MIDDLE of the brick tile (row 2, col 1 in tileset_B)
 *    to avoid the dark top/bottom borders that cause visible seams.
 * 2. Generate a seamless 64×64 walls.png (4×4 grid of 16×16 tiles).
 *
 * The brick tile in the RPGMaker tileset has:
 *   - Top border (dark decorative line)
 *   - Middle area (seamless brick pattern)
 *   - Bottom border (dark decorative line)
 *
 * By sampling from y+12 to y+36 (middle 24px of the 48px tile),
 * then downscaling to 16px, we get a seamless brick pattern.
 */
const { PNG } = require('pngjs')
const fs = require('fs')
const path = require('path')

const TILE_IN = 48
const TILE_OUT = 16
const GRID_COLS = 4
const GRID_ROWS = 4

const tilesetPath = path.join(__dirname, '..', 'assets', 'rpgmaker', 'mvmz', 'tileset_B.png')
const buf = fs.readFileSync(tilesetPath)
const tileset = PNG.sync.read(buf)

/**
 * Extract a 16×16 tile from the MIDDLE section of a 48×48 tileset tile.
 * Avoids top and bottom 12px borders → samples rows 12..35 (24px → 16px).
 * Also avoids left/right 6px borders → samples cols 6..41 (36px → 16px).
 * Wait, that gives us 24×36 which doesn't scale evenly.
 *
 * Better approach: just use the middle 48×48 area but offset Y by a few pixels
 * to skip the top border. Let me analyze the actual pixel data first.
 */

// Let's scan the brick tile at (1,2) to find the border rows
const brickCol = 1
const brickRow = 2
const srcX = brickCol * TILE_IN
const srcY = brickRow * TILE_IN

console.log('--- Scanning brick tile rows for dark borders ---')
for (let y = 0; y < TILE_IN; y++) {
    let totalBrightness = 0
    for (let x = 0; x < TILE_IN; x++) {
        const idx = ((srcY + y) * tileset.width + (srcX + x)) * 4
        const r = tileset.data[idx]
        const g = tileset.data[idx + 1]
        const b = tileset.data[idx + 2]
        totalBrightness += (r + g + b) / 3
    }
    const avgBrightness = Math.round(totalBrightness / TILE_IN)
    const bar = '█'.repeat(Math.round(avgBrightness / 4))
    console.log(`  y=${y.toString().padStart(2)}: brightness=${avgBrightness} ${bar}`)
}

// Now let's try sampling safely from the middle section.
// Strategy: offset the source by a few pixels to skip the border rows.
// The border appears to be at the very top and bottom of the tile.
// We'll extract from y+6 to y+6+48*(16/48) = effectively the middle.
//
// Actually, the simplest approach: sample from a DIFFERENT row of the same
// brick tile that's all middle brick with no borders. Row 1 (y=TILE_IN*1)
// has the same bricks but is the top portion which may also have borders.
//
// Let me try: instead of row 2 (which has borders), sample the brick body
// by offsetting 12px down from the tile top (skipping the top border).

// Downscale from 48px → 16px with a Y offset to skip top border
function downscaleMiddle(col, row, topSkip, leftSkip) {
    const sx = col * TILE_IN + leftSkip
    const sy = row * TILE_IN + topSkip
    const srcW = TILE_IN - leftSkip * 2
    const srcH = TILE_IN - topSkip * 2
    const scaleX = srcW / TILE_OUT
    const scaleY = srcH / TILE_OUT

    const pixels = []
    for (let y = 0; y < TILE_OUT; y++) {
        for (let x = 0; x < TILE_OUT; x++) {
            const srcPx = sx + Math.floor(x * scaleX + scaleX / 2)
            const srcPy = sy + Math.floor(y * scaleY + scaleY / 2)
            const idx = (srcPy * tileset.width + srcPx) * 4
            pixels.push(tileset.data[idx], tileset.data[idx + 1], tileset.data[idx + 2], tileset.data[idx + 3])
        }
    }
    return pixels
}

// Standard downscale (full tile)
function downscaleFull(col, row) {
    const sx = col * TILE_IN
    const sy = row * TILE_IN
    const scale = TILE_IN / TILE_OUT
    const pixels = []
    for (let y = 0; y < TILE_OUT; y++) {
        for (let x = 0; x < TILE_OUT; x++) {
            const srcPx = sx + Math.floor(x * scale + scale / 2)
            const srcPy = sy + Math.floor(y * scale + scale / 2)
            const idx = (srcPy * tileset.width + srcPx) * 4
            pixels.push(tileset.data[idx], tileset.data[idx + 1], tileset.data[idx + 2], tileset.data[idx + 3])
        }
    }
    return pixels
}

// Try extracting from the middle of the brick tile (skip 8px top/bottom borders)
const brickPixels = downscaleMiddle(1, 2, 8, 0)

// Build 64×64 walls.png
const wallsOut = new PNG({ width: GRID_COLS * TILE_OUT, height: GRID_ROWS * TILE_OUT })

for (let mask = 0; mask < 16; mask++) {
    const col = mask % GRID_COLS
    const row = Math.floor(mask / GRID_COLS)
    const dstX = col * TILE_OUT
    const dstY = row * TILE_OUT

    for (let y = 0; y < TILE_OUT; y++) {
        for (let x = 0; x < TILE_OUT; x++) {
            const srcOff = (y * TILE_OUT + x) * 4
            const dstIdx = ((dstY + y) * wallsOut.width + (dstX + x)) * 4
            wallsOut.data[dstIdx] = brickPixels[srcOff]
            wallsOut.data[dstIdx + 1] = brickPixels[srcOff + 1]
            wallsOut.data[dstIdx + 2] = brickPixels[srcOff + 2]
            wallsOut.data[dstIdx + 3] = brickPixels[srcOff + 3]
        }
    }
}

const wallsPath = path.join(__dirname, '..', 'assets', 'walls.png')
fs.writeFileSync(wallsPath, PNG.sync.write(wallsOut))
console.log(`\n✅ Wrote walls.png (${wallsOut.width}×${wallsOut.height})`)

// Generate a preview to visually verify seamless tiling (4×4 of the brick)
const previewOut = new PNG({ width: TILE_OUT * 4, height: TILE_OUT * 4 })
for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
        for (let y = 0; y < TILE_OUT; y++) {
            for (let x = 0; x < TILE_OUT; x++) {
                const srcOff = (y * TILE_OUT + x) * 4
                const dstIdx = ((ty * TILE_OUT + y) * previewOut.width + (tx * TILE_OUT + x)) * 4
                previewOut.data[dstIdx] = brickPixels[srcOff]
                previewOut.data[dstIdx + 1] = brickPixels[srcOff + 1]
                previewOut.data[dstIdx + 2] = brickPixels[srcOff + 2]
                previewOut.data[dstIdx + 3] = brickPixels[srcOff + 3]
            }
        }
    }
}
const previewPath = path.join(__dirname, '..', 'assets', 'walls_preview.png')
fs.writeFileSync(previewPath, PNG.sync.write(previewOut))
console.log(`✅ Wrote walls_preview.png for visual verification`)

// Copy to webview-ui
const dst = path.join(__dirname, '..', 'webview-ui', 'public', 'assets', 'walls.png')
fs.copyFileSync(wallsPath, dst)
console.log(`✅ Copied to webview-ui/public/assets/walls.png`)
