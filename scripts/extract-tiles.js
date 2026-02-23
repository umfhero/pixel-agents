/**
 * Extract 7 floor tiles from RPGMaker tileset_B.png and save as floors.png (112x16 strip)
 * Also extract wall brick textures.
 * 
 * Uses nearest-neighbor downscale from 48px → 16px.
 */
const { PNG } = require('pngjs')
const fs = require('fs')
const path = require('path')

const TILE_IN = 48
const TILE_OUT = 16
const SCALE = TILE_IN / TILE_OUT  // 3

const tilesetPath = path.join(__dirname, '..', 'assets', 'rpgmaker', 'mvmz', 'tileset_B.png')
const outputDir = path.join(__dirname, '..', 'assets')
const buf = fs.readFileSync(tilesetPath)
const tileset = PNG.sync.read(buf)

function downscaleTile(col, row) {
    const srcX = col * TILE_IN
    const srcY = row * TILE_IN
    const tile = []
    for (let y = 0; y < TILE_OUT; y++) {
        for (let x = 0; x < TILE_OUT; x++) {
            const srcPx = srcX + Math.floor(x * SCALE + SCALE / 2)
            const srcPy = srcY + Math.floor(y * SCALE + SCALE / 2)
            const idx = (srcPy * tileset.width + srcPx) * 4
            tile.push(tileset.data[idx], tileset.data[idx + 1], tileset.data[idx + 2], tileset.data[idx + 3])
        }
    }
    return tile
}

// 7 floor tiles selected from the tileset:
// Using _bottom half_ of row 1 as a reference for wall style:
// Row 1 bottom = bricks. But for floor we want row 6-8 patterns.
const floorTiles = [
    // [col, row, label]
    [0, 7, 'wood_light'],       // warm light wood planks
    [1, 7, 'wood_cross'],       // wood with cross pattern
    [2, 7, 'wood_strips'],      // wood strip pattern
    [4, 7, 'checker_warm'],     // warm orange/brown checkered
    [3, 6, 'lattice_purple'],   // purple diamond lattice
    [5, 7, 'checker_cool'],     // cool purple/mauve checkered
    [6, 7, 'mosaic_gray'],      // gray/muted chevron pattern
]

console.log(`Extracting ${floorTiles.length} floor tiles...`)

const FLOOR_COUNT = floorTiles.length
const floorsOut = new PNG({ width: FLOOR_COUNT * TILE_OUT, height: TILE_OUT })

for (let i = 0; i < FLOOR_COUNT; i++) {
    const [col, row, label] = floorTiles[i]
    const pixels = downscaleTile(col, row)
    console.log(`  ${label}: tile(${col},${row})`)

    for (let y = 0; y < TILE_OUT; y++) {
        for (let x = 0; x < TILE_OUT; x++) {
            const srcOff = (y * TILE_OUT + x) * 4
            const dstIdx = (y * floorsOut.width + (i * TILE_OUT + x)) * 4
            floorsOut.data[dstIdx] = pixels[srcOff]
            floorsOut.data[dstIdx + 1] = pixels[srcOff + 1]
            floorsOut.data[dstIdx + 2] = pixels[srcOff + 2]
            floorsOut.data[dstIdx + 3] = pixels[srcOff + 3]
        }
    }
}

const floorsPath = path.join(outputDir, 'floors.png')
fs.writeFileSync(floorsPath, PNG.sync.write(floorsOut))
console.log(`✅ Wrote ${floorsPath}`)

// Also build a 48px preview for visual verification
const previewOut = new PNG({ width: FLOOR_COUNT * TILE_IN, height: TILE_IN })
for (let i = 0; i < FLOOR_COUNT; i++) {
    const [col, row] = floorTiles[i]
    const srcX = col * TILE_IN
    const srcY = row * TILE_IN
    for (let y = 0; y < TILE_IN; y++) {
        for (let x = 0; x < TILE_IN; x++) {
            const sIdx = ((srcY + y) * tileset.width + (srcX + x)) * 4
            const dIdx = (y * previewOut.width + (i * TILE_IN + x)) * 4
            previewOut.data[dIdx] = tileset.data[sIdx]
            previewOut.data[dIdx + 1] = tileset.data[sIdx + 1]
            previewOut.data[dIdx + 2] = tileset.data[sIdx + 2]
            previewOut.data[dIdx + 3] = tileset.data[sIdx + 3]
        }
    }
}
const previewPath = path.join(outputDir, 'floors_preview.png')
fs.writeFileSync(previewPath, PNG.sync.write(previewOut))
console.log(`✅ Wrote preview at ${previewPath}`)

// ── Walls ──
// We also need wall.png. The wall auto-tile expects 16 sprites (one per bitmask).
// The tileset has brick patterns at rows 1-3, cols 0-2.
// Row 2, col 0 = brick stone (purple/gray)  
// Row 2, col 1 = brick warm (orange)
// Row 2, col 2 = brick wood paneling (dark brown)
// For wall auto-tiling, we'll just use a single recurring brick tile (the warm one).
// The wall system expects 16 sprites (one per 4-bit neighbor mask), each 16px wide
// and potentially varying height (16px or 32px for tall wall sprites).
// 
// Since the pack doesn't provide auto-tile wall variants in 16-mask format,
// we'll provide a simple repeating brick tile as all 16 masks.
// This gives a uniform textured look — much better than flat color.

const wallTileCol = 1  // orange brick
const wallTileRow = 2

// Single wall tile 16x16
const wallPixels = downscaleTile(wallTileCol, wallTileRow)

// Create walls.png: 16 copies of the same brick tile in a horizontal strip (256 x 16)
const WALL_COUNT = 16
const wallsOut = new PNG({ width: WALL_COUNT * TILE_OUT, height: TILE_OUT })

for (let mask = 0; mask < WALL_COUNT; mask++) {
    for (let y = 0; y < TILE_OUT; y++) {
        for (let x = 0; x < TILE_OUT; x++) {
            const srcOff = (y * TILE_OUT + x) * 4
            const dstIdx = (y * wallsOut.width + (mask * TILE_OUT + x)) * 4
            wallsOut.data[dstIdx] = wallPixels[srcOff]
            wallsOut.data[dstIdx + 1] = wallPixels[srcOff + 1]
            wallsOut.data[dstIdx + 2] = wallPixels[srcOff + 2]
            wallsOut.data[dstIdx + 3] = wallPixels[srcOff + 3]
        }
    }
}

const wallsPath = path.join(outputDir, 'walls.png')
fs.writeFileSync(wallsPath, PNG.sync.write(wallsOut))
console.log(`✅ Wrote ${wallsPath} (${WALL_COUNT} × ${TILE_OUT}px brick tiles)`)

// Clean up scan tiles
for (let i = 0; i < 16; i++) {
    const f = path.join(outputDir, `tilerow_${i.toString().padStart(2, '0')}.png`)
    if (fs.existsSync(f)) fs.unlinkSync(f)
}
const fprev = path.join(outputDir, 'floors_preview.png')
if (fs.existsSync(fprev)) fs.unlinkSync(fprev)
console.log('🧹 Cleaned up temp files')
