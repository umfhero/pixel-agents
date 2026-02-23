import * as fs from 'fs';
import * as path from 'path';
import { createDefaultLayout } from '../webview-ui/src/office/layout/layoutSerializer.js';

const layout = createDefaultLayout();
const outputPath = path.resolve('webview-ui/public/assets/default-layout.json');

fs.writeFileSync(outputPath, JSON.stringify(layout, null, 2), 'utf8');

console.log(`Generated default layout to ${outputPath}`);
