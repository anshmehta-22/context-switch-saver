// src/db/seed.js
// Run: node src/db/seed.js
// Populates the DB with 3 sample snapshots for local development.

const { initDb } = require('./db');
const { createSnapshot } = require('../controllers/snapshotsController');

const SAMPLES = [
  {
    name: 'Auth refactor — JWT middleware',
    notes: 'Next: add refresh token rotation. Blocked on @alex security review.',
    urls: ['https://github.com/myorg/api/pull/42', 'https://jwt.io/#debugger'],
    files: [{ path: '/src/middleware/auth.js', line: 87, col: 4 }],
    tags: ['auth', 'backend'],
  },
  {
    name: 'Dashboard perf — lazy-load images',
    notes: 'IntersectionObserver works. Test Safari. Bundle: 420 → 310 kb.',
    urls: ['https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver'],
    files: [{ path: '/src/components/Dashboard.jsx', line: 45, col: 10 }],
    tags: ['performance', 'frontend'],
  },
  {
    name: 'Hotfix — null pointer in payment webhook',
    notes: 'Fixed. Deployed 16:45. Root cause: missing guard on event.data.object.customer.',
    urls: ['https://dashboard.stripe.com/webhooks'],
    files: [{ path: '/src/webhooks/stripe.js', line: 102, col: 7 }],
    tags: ['hotfix', 'payments'],
  },
];

initDb();
SAMPLES.forEach(s => {
  const snap = createSnapshot(s);
  console.log(`[seed] Created ${snap.id.slice(0, 8)}  "${snap.name}"`);
});
console.log('[seed] Done.');