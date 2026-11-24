export const ROOM_SLUGS = ['lab', 'studio', 'backstage'];
export function projSlug(p) { return p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
export const CHAPTERS = [
  { id: 'top', t: 'Opening', d: 'Engineer by curiosity, artist by imagination, performer by passion.', c: '#FCEFC7', f: '#2E170E' },
  { id: 'about', t: 'Profile', d: 'Who I am, what I study, what I am curious about.', c: '#1D45D6', f: '#FCEFC7' },
  { id: 'worlds', t: 'Three worlds', d: 'The lab, the studio and backstage.', c: '#FFE11A', f: '#2E170E' },
  { id: 'work', t: 'Work', d: 'Four case studies and the archive.', c: '#FF7A1C', f: '#2E170E' },
  { id: 'lab', t: 'The learning lab', d: 'Learning now, and curious about next.', c: '#3CCBC8', f: '#2E170E' },
  { id: 'leetcode', t: 'Report card', d: 'Problem solving practice on LeetCode.', c: '#F0442B', f: '#FCEFC7' },
  { id: 'play', t: 'Playground', d: 'Posters, collage, type and hash patterns.', c: '#FF5DA8', f: '#2E170E' },
  { id: 'hi', t: 'Say hi', d: 'Email, LinkedIn and GitHub.', c: '#FCEFC7', f: '#2E170E' }
];
