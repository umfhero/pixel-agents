import { TileType, FurnitureType } from '../types.js'
import type { OfficeLayout, FloorColor, PlacedFurniture, TileType as TileTypeVal } from '../types.js'
import { createDefaultLayout } from './layoutSerializer.js'

// ── Floor tile patterns (1-indexed, matching floors.png) ──
// 1 = light wood planks
// 2 = wood with cross pattern
// 3 = wood strip pattern
// 4 = warm checkered
// 5 = purple diamond lattice
// 6 = cool checkered
// 7 = gray mosaic/chevron

// Neutral color — preserves the tile's native colors
const NEUTRAL: FloorColor = { h: 0, s: 0, b: 0, c: 0 }
// Slight warm tint for walls
const WARM: FloorColor = { h: 25, s: 20, b: 5, c: 0 }
// Dark maroon-brown for bedroom walls (matches screenshot (3)'s dark wooden walls)
const DARK_BROWN: FloorColor = { h: 15, s: 45, b: -35, c: 10 }

// ── Helper: build a tile grid from a 2D array of characters ──
function gridFromTemplate(
    template: string[],
    mapping: Record<string, { tile: TileTypeVal; color: FloorColor | null }>,
): { tiles: TileTypeVal[]; tileColors: Array<FloorColor | null>; cols: number; rows: number } {
    const rows = template.length
    const cols = template[0].length
    const tiles: TileTypeVal[] = []
    const tileColors: Array<FloorColor | null> = []

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const ch = template[r][c]
            const entry = mapping[ch] ?? { tile: TileType.VOID, color: null }
            tiles.push(entry.tile)
            tileColors.push(entry.color)
        }
    }

    return { tiles, tileColors, cols, rows }
}

/**
 * Dense Office — four workstations, warm checkered floor, brick walls.
 * PCs face front (toward viewer). Agents sit behind desks facing down.
 */
export function createDenseOfficePreset(): OfficeLayout {
    // Simple rectangular layout
    const template = [
        'WWWWWWWWWWWWWWWWWWWW',
        'W..................W',
        'W..................W',
        'W..................W',
        'W..................W',
        'W..................W',
        'W..................W',
        'W..................W',
        'W..................W',
        'W..................W',
        'W..................W',
        'WWWWWWWWWWWWWWWWWWWW',
    ]

    const { tiles, tileColors, cols, rows } = gridFromTemplate(template, {
        W: { tile: TileType.WALL, color: WARM },
        '.': { tile: TileType.FLOOR_6, color: NEUTRAL }, // cool checkered
    })

    const furniture: PlacedFurniture[] = [
        // ── Top-left workstation ──
        { uid: 'desk-tl', type: FurnitureType.DESK, col: 3, row: 3 },
        { uid: 'pc-tl', type: FurnitureType.PC, col: 3, row: 3 },
        { uid: 'chair-tl', type: FurnitureType.CHAIR, col: 4, row: 5 },

        // ── Top-right workstation ──
        { uid: 'desk-tr', type: FurnitureType.DESK, col: 13, row: 3 },
        { uid: 'pc-tr', type: FurnitureType.PC, col: 14, row: 3 },
        { uid: 'chair-tr', type: FurnitureType.CHAIR, col: 14, row: 5 },

        // ── Bottom-left workstation ──
        { uid: 'desk-bl', type: FurnitureType.DESK, col: 3, row: 7 },
        { uid: 'pc-bl', type: FurnitureType.PC, col: 3, row: 7 },
        { uid: 'chair-bl', type: FurnitureType.CHAIR, col: 4, row: 9 },

        // ── Bottom-right workstation ──
        { uid: 'desk-br', type: FurnitureType.DESK, col: 13, row: 7 },
        { uid: 'pc-br', type: FurnitureType.PC, col: 14, row: 7 },
        { uid: 'chair-br', type: FurnitureType.CHAIR, col: 14, row: 9 },

        // ── Decor ──
        { uid: 'plant-1', type: FurnitureType.PLANT, col: 1, row: 1 },
        { uid: 'plant-2', type: FurnitureType.PLANT, col: 18, row: 1 },
        { uid: 'plant-3', type: FurnitureType.PLANT, col: 1, row: 10 },
        { uid: 'plant-4', type: FurnitureType.PLANT, col: 18, row: 10 },
        { uid: 'cooler', type: FurnitureType.COOLER, col: 9, row: 1 },
        { uid: 'wb', type: FurnitureType.WHITEBOARD, col: 10, row: 1 },
        { uid: 'bookshelf-1', type: FurnitureType.BOOKSHELF, col: 1, row: 5 },
        { uid: 'bookshelf-2', type: FurnitureType.BOOKSHELF, col: 18, row: 5 },
        { uid: 'lamp-1', type: FurnitureType.LAMP, col: 8, row: 5 },
        { uid: 'lamp-2', type: FurnitureType.LAMP, col: 11, row: 5 },
    ]

    return { version: 1, cols, rows, tiles, tileColors, furniture }
}

/**
 * Cozy Bedroom — inspired by screenshot (3).png (the bedroom).
 * A-frame style room with warm wood floor, bed, desk, plants, carpet.
 * Uses VOID tiles for the triangular roof shape.
 */
export function createCozyBedroomPreset(): OfficeLayout {
    // Roughly based on screenshot (3): bedroom with angled roof
    // Wider at bottom, narrowing at top for a house-like shape
    const template = [
        '______WWWWWW________', // top of roof (8 wall)
        '____WWWWWWWWWW______', // wider
        '___WW........WW_____', // attic room starts
        '__WW..........WW____',
        '_WW............WW___', // widening
        'WW..............WW__',
        'W................W__',
        'W................W__',
        'W................W__',
        'W................W__',
        'WWWWWWWWWWWWWWWWWW__',
    ]

    const { tiles, tileColors, cols, rows } = gridFromTemplate(template, {
        W: { tile: TileType.WALL, color: DARK_BROWN },
        '.': { tile: TileType.FLOOR_1, color: NEUTRAL }, // light wood planks
        _: { tile: TileType.VOID, color: null },
    })

    const furniture: PlacedFurniture[] = [
        // ── Desk + PC against the wall ──
        { uid: 'desk', type: FurnitureType.DESK, col: 3, row: 7 },
        { uid: 'pc', type: FurnitureType.PC, col: 3, row: 7 },
        { uid: 'chair', type: FurnitureType.CHAIR, col: 4, row: 9 },

        // ── Bookshelf on left wall ──
        { uid: 'bs-1', type: FurnitureType.BOOKSHELF, col: 1, row: 7 },

        // ── Plants ──
        { uid: 'plant-1', type: FurnitureType.PLANT, col: 5, row: 3 },
        { uid: 'plant-2', type: FurnitureType.PLANT, col: 14, row: 5 },

        // ── Decor ──
        { uid: 'lamp-1', type: FurnitureType.LAMP, col: 10, row: 3 },
        { uid: 'cooler', type: FurnitureType.COOLER, col: 12, row: 8 },

        // ── Right side furniture ──
        { uid: 'lamp-2', type: FurnitureType.LAMP, col: 15, row: 7 },
        { uid: 'bs-2', type: FurnitureType.BOOKSHELF, col: 8, row: 7 },
    ]

    return { version: 1, cols, rows, tiles, tileColors, furniture }
}

/**
 * Living Room — inspired by screenshot (2).png.
 * L-shaped house interior with warm wood floor, central dining table,
 * bookshelves, plants, sofas, and a work area.
 */
export function createLivingRoomPreset(): OfficeLayout {
    // L-shaped house: main floor is wide at bottom, upper-right extends up
    // Total: 22 wide × 14 tall
    //
    // Reference layout from screenshot (2):
    //   Top section: room with stairs (upper-right)
    //   Main section: big open area with table + decorations
    //   Bottom: walls with doorway
    //
    const template = [
        '______WWWWWWWWWWWWWWWW', // upper-right room top
        '______W..............W', // upper-right room
        '______W..............W',
        '______W..............W',
        'WWWWWWW..............W', // main room starts on left
        'W....................W',
        'W....................W',
        'W....................W',
        'W....................W',
        'W....................W',
        'W....................W',
        'W....................W',
        'W....................W',
        'WWWWWWWWWWWWWWWWWWWWWW', // bottom wall
    ]

    const { tiles, tileColors, cols, rows } = gridFromTemplate(template, {
        W: { tile: TileType.WALL, color: WARM },
        '.': { tile: TileType.FLOOR_1, color: NEUTRAL }, // light wood planks
        _: { tile: TileType.VOID, color: null },
    })

    const furniture: PlacedFurniture[] = [
        // ── Upper-right room (study/stairway area) ──
        { uid: 'bs-ur1', type: FurnitureType.BOOKSHELF, col: 18, row: 1 },
        { uid: 'bs-ur2', type: FurnitureType.BOOKSHELF, col: 18, row: 3 },
        { uid: 'lamp-ur', type: FurnitureType.LAMP, col: 12, row: 1 },
        { uid: 'wb-ur', type: FurnitureType.WHITEBOARD, col: 14, row: 1 },
        { uid: 'plant-ur', type: FurnitureType.PLANT, col: 7, row: 1 },

        // ── Left wall (bookshelves + decor) ──
        { uid: 'bs-l1', type: FurnitureType.BOOKSHELF, col: 1, row: 5 },
        { uid: 'bs-l2', type: FurnitureType.BOOKSHELF, col: 1, row: 7 },
        { uid: 'plant-l', type: FurnitureType.PLANT, col: 1, row: 9 },
        { uid: 'lamp-l', type: FurnitureType.LAMP, col: 1, row: 11 },

        // ── Central work area ──
        { uid: 'desk-c', type: FurnitureType.DESK, col: 8, row: 7 },
        { uid: 'pc-c', type: FurnitureType.PC, col: 8, row: 7 },
        { uid: 'chair-c1', type: FurnitureType.CHAIR, col: 9, row: 9 },
        { uid: 'chair-c2', type: FurnitureType.CHAIR, col: 7, row: 8 },
        { uid: 'chair-c3', type: FurnitureType.CHAIR, col: 10, row: 8 },
        { uid: 'lamp-c', type: FurnitureType.LAMP, col: 9, row: 6 },

        // ── Right side (fireplace area) ──
        { uid: 'cooler-r', type: FurnitureType.COOLER, col: 20, row: 6 },
        { uid: 'bs-r', type: FurnitureType.BOOKSHELF, col: 20, row: 8 },
        { uid: 'plant-r1', type: FurnitureType.PLANT, col: 20, row: 10 },
        { uid: 'plant-r2', type: FurnitureType.PLANT, col: 20, row: 12 },

        // ── Secondary work area (lower-left) ──
        { uid: 'desk-ll', type: FurnitureType.DESK, col: 3, row: 10 },
        { uid: 'pc-ll', type: FurnitureType.PC, col: 3, row: 10 },
        { uid: 'chair-ll', type: FurnitureType.CHAIR, col: 4, row: 12 },

        // ── Decor along bottom wall ──
        { uid: 'plant-b1', type: FurnitureType.PLANT, col: 14, row: 12 },
        { uid: 'lamp-b', type: FurnitureType.LAMP, col: 17, row: 12 },

        // ── Upper stairway area work station ──
        { uid: 'desk-ur', type: FurnitureType.DESK, col: 9, row: 2 },
        { uid: 'pc-ur', type: FurnitureType.PC, col: 9, row: 2 },
        { uid: 'chair-ur', type: FurnitureType.CHAIR, col: 10, row: 4 },
    ]

    return { version: 1, cols, rows, tiles, tileColors, furniture }
}

export const LAYOUT_PRESETS = [
    { id: 'default', name: '🏢 Default', create: createDefaultLayout },
    { id: 'dense', name: '💻 Dense Office', create: createDenseOfficePreset },
    { id: 'bedroom', name: '🛏️ Cozy Bedroom', create: createCozyBedroomPreset },
    { id: 'living', name: '🏠 Living Room', create: createLivingRoomPreset },
]
