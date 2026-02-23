import { readFileSync, writeFileSync } from 'fs'

const inputPath = './scripts/.tileset-working/asset-editor-output.json'
const outputPath = './scripts/.tileset-working/tileset-metadata-final.json'

const inputData = JSON.parse(readFileSync(inputPath, 'utf-8'))
const assets = inputData.assets

const outputAssets = assets.map((a: any, i: number) => ({
    id: a.id,
    paddedX: a.paddedX,
    paddedY: a.paddedY,
    paddedWidth: a.paddedWidth,
    paddedHeight: a.paddedHeight,
    erasedPixels: [],
    name: `RETRO_PROP_${i}`,
    label: `Retro Prop ${i}`,
    category: 'misc',
    footprintW: Math.max(1, Math.round(a.paddedWidth / 16)),
    footprintH: Math.max(1, Math.round(a.paddedHeight / 16)),
    isDesk: false,
    canPlaceOnWalls: false,
    discard: false,
    canPlaceOnSurfaces: true
}))

const output = {
    version: 1,
    timestamp: new Date().toISOString(),
    sourceFile: inputData.sourceFile,
    tileset: inputData.tileset,
    backgroundColor: inputData.backgroundColor,
    assets: outputAssets
}

writeFileSync(outputPath, JSON.stringify(output, null, 2))
console.log('Faked metadata generated.')
