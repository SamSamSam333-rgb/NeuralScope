// Copies three.js r128 (the version the lab modules were written against) next to the app so it works offline.
import { copyFileSync, mkdirSync } from 'node:fs';
mkdirSync('public/vendor', { recursive: true });
copyFileSync('node_modules/three/build/three.min.js', 'public/vendor/three.min.js');
console.log('three.min.js copied');
