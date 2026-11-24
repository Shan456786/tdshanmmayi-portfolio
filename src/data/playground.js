import { ART } from '../assets/index.js';
export const HEX_TEXT = 'Engineer by curiosity, artist by imagination, performer by passion.';
export const PENCILS = [
  { label: 'Ganache', c: '#2E170E' }, { label: 'Cobalt', c: '#1D45D6' }, { label: 'Aruba', c: '#3CCBC8' }, { label: 'Hot pink', c: '#FF5DA8' },
  { label: 'Tomato', c: '#F0442B' }, { label: 'Tangerine', c: '#FF7A1C' }, { label: 'Yellow', c: '#FFE11A' }
];
export const HASH_PALETTE = ['#1D45D6', '#3CCBC8', '#FF5DA8', '#F0442B', '#FF7A1C', '#FFE11A', '#2E170E', '#FFFBEF'];
export const STICKERS0 = [
  { k: 'paper', x: 50, y: 50, w: 26, r: -3 },
  { k: 'scrapA', x: 22, y: 40, w: 18, r: -8 },
  { k: 'scrapB', x: 76, y: 62, w: 16, r: 6 },
  { k: 'scrapC', x: 70, y: 26, w: 12, r: -12 },
  { k: 'dot', x: 88, y: 40, w: 9, r: 0 },
  { k: 'tape', x: 44, y: 84, w: 18, r: 10 },
  { k: 'img', src: ART.star, x: 50, y: 18, w: 8, r: 0 },
  { k: 'img', src: ART.burst, x: 9, y: 16, w: 7, r: -10 },
  { k: 'img', src: ART.star2, x: 12, y: 82, w: 6, r: 12 },
  { k: 'word', text: 'dance', x: 30, y: 15, w: 13, r: -5 },
  { k: 'word', text: 'draw', x: 26, y: 68, w: 12, r: 6 },
  { k: 'word', text: 'read', x: 84, y: 82, w: 11, r: -4 },
  { k: 'stamp', text: 'hello', x: 62, y: 35, w: 10, r: -12 },
  { k: 'mark', text: 't.', x: 92, y: 14, w: 7, r: 0 },
  { k: 'label', text: 'BUILDS THINGS', x: 52, y: 68, w: 16, r: 4 }
];
export const POSTER_STYLES = [
  { id: 'ps-shout', label: 'Shout', k: 1, w: .46 },
  { id: 'ps-whisper', label: 'Whisper', k: 1.05, w: .42 },
  { id: 'ps-mixed', label: 'Mixed', k: 1.1, w: .46 },
  { id: 'ps-type', label: 'Typewriter', k: .62, w: .66 },
  { id: 'ps-hand', label: 'Handwritten', k: 1, w: .42 }
];
export const THEMES = [
  { label: 'Butter and ganache', bg: '#FCEFC7', fg: '#2E170E', ac: '#F0442B' },
  { label: 'Aruba', bg: '#3CCBC8', fg: '#2E170E', ac: '#2E170E' },
  { label: 'Hot pink', bg: '#FF5DA8', fg: '#2E170E', ac: '#FFFBEF' },
  { label: 'Cobalt', bg: '#1D45D6', fg: '#FCEFC7', ac: '#FFE11A' },
  { label: 'Tomato', bg: '#F0442B', fg: '#FCEFC7', ac: '#FCEFC7' },
  { label: 'Ganache', bg: '#2E170E', fg: '#FCEFC7', ac: '#3CCBC8' },
  { label: 'Electric yellow', bg: '#FFE11A', fg: '#2E170E', ac: '#1D45D6' }
];
export const FONTS = [
  { label: 'Condensed', ff: "'Big Shoulders Display', Impact, sans-serif", k: 1 },
  { label: 'Serif italic', ff: "'Instrument Serif', Georgia, serif", k: 1, it: true },
  { label: 'Grotesk', ff: "'Bricolage Grotesque', Arial, sans-serif", k: .8 },
  { label: 'Mono', ff: "'Space Mono', monospace", k: .62 },
  { label: 'Hand', ff: "'Caveat', cursive", k: 1 }
];
export const PAIRS = [
  { label: 'Ganache on butter', bg: '#FCEFC7', fg: '#2E170E' },
  { label: 'Pink on ganache', bg: '#2E170E', fg: '#FF5DA8' },
  { label: 'Yellow on cobalt', bg: '#1D45D6', fg: '#FFE11A' },
  { label: 'Butter on tomato', bg: '#F0442B', fg: '#FCEFC7' },
  { label: 'Ganache on aruba', bg: '#3CCBC8', fg: '#2E170E' },
  { label: 'Cobalt on pink', bg: '#FF5DA8', fg: '#1D45D6' }
];
export const FX = [{ id: 'ext', label: 'Extrude' }, { id: 'mis', label: 'Misprint' }, { id: 'out', label: 'Outline' }, { id: 'wave', label: 'Wave' }, { id: 'jit', label: 'Jitter' }];
