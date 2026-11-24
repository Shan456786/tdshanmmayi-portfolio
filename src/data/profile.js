import { ASSETS } from '../assets/index.js';
/* ---------- EDITABLE CONTENT ----------
   Everything personal lives in this block, so updating the site never means touching the layout.
   PROFILE: name, facts and the "so far" trail.   PROJECTS: case files, written only from each repository.
   LAB: move an item from curious to learning (or add new ones) as you go.   CONTACT: email and links.
   LEETCODE: see the notes inside.   CHARACTER: the opening-screen illustration. */
export const CHARACTER = {
  fullbody: { cut: ASSETS.fullbodyCut, alt: 'Full-length illustration of Shanmayi Tadala in a cream cardigan, cargo trousers and red sneakers' }
};
export const PROFILE = {
  tryHackMeRooms: 5, tryHackMeAsOf: 'November 2026',
  trail: [
    { when: '2025', what: 'B.Tech in Cybersecurity begins', note: 'VIT-AP University, Andhra Pradesh', k: '' },
    { when: 'Along the way', what: 'Cisco Networking Academy', note: 'Introduction to Cybersecurity, completed', k: '' },
    { when: 'Jun 2026', what: 'Password Generator', note: 'Repository started. Python.', k: 'proj' },
    { when: 'Jul 2026', what: 'Campus Expert', note: 'Repository started. Next.js and FastAPI.', k: 'proj' },
    { when: 'Oct 2026', what: 'SmartCrutch+ and FoodBridge', note: 'Both repositories started.', k: 'proj' },
    { when: 'Along the way', what: 'TryHackMe', note: 'Five rooms completed', k: '' },
    { when: 'Now', what: 'Second year', note: 'Learning, building and practising problem solving', k: 'now' }
  ],
  nodes: [
    { t: 'Digital forensics', x: 20, y: 21, href: '#lab' }, { t: 'Cloud computing', x: 78, y: 17, href: '#lab' },
    { t: 'DevSecOps', x: 87, y: 55, href: '#lab' }, { t: 'AI', x: 72, y: 88, href: '#lab' },
    { t: 'Building products', x: 28, y: 86, href: '#work' }, { t: 'Malware analysis', x: 13, y: 57, href: '#lab' },
    { t: 'Cybersecurity', x: 50, y: 9, href: '#worlds' }
  ]
};
export const CONTACT = {
  email: 'tdshanmmayi@gmail.com',
  linkedin: 'https://www.linkedin.com/in/shanmayi-tadala-45955b417/',
  github: 'https://github.com/Shan456786'
};
