// FoodBridge. See src/data/projects/index.js for how entries are used.
export default { name: 'FoodBridge', tcls: 'ptt pt-fb', c: '#FF7A1C', fg: '#2E170E', tag: 'HACKATHON PROJECT', line: 'Food redistribution and donation-matching hackathon project.', tags: 'TYPESCRIPT / REACT / SUPABASE',
    repo: 'https://github.com/Shan456786/FoodBridge', demo: '',
    cs: {
      kind: 'fb', kicker: 'FOOD RESCUE / LOGISTICS', type: 'Hackathon project', started: 'Oct 2026', interactive: 'Rescue route and matching explainer',
      deck: 'Surplus food has hours, not days. FoodBridge moves it from a donor\'s counter to a verified receiver, and closes every rescue with a code-verified handover.',
      overview: 'A multi-role web platform for donors, receivers and volunteers, with an admin console. Donors list surplus food, receivers request it, volunteers collect it, and every rescue is traceable from listing to handover.',
      problem: 'Surplus food has a short safe-use window. Donors and receivers need a fast, trustworthy way to find each other before it expires, and a rescue should only count once the food has actually changed hands.',
      role: 'Independently designed and developed, as the repository states: the database schema and security rules, the workflow functions, the matching logic and the React front end.',
      stack: [
        { g: 'Front end', items: ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS v4', 'shadcn/ui', 'React Hook Form', 'Zod', 'Recharts'] },
        { g: 'Back end and data', items: ['Supabase (Auth, Realtime)', 'PostgreSQL', 'Row-level security', 'Security-definer functions', 'pgcrypto'] },
        { g: 'Testing', items: ['Vitest', 'React Testing Library', 'PGlite (Postgres in WASM)'] }
      ],
      route: [
        { t: 'Donor', who: 'Donor organisation', d: 'A donor organisation signs up. Roles are donor, receiver, volunteer and admin, and admin can never be self-assigned: the database enforces it.', fn: 'Supabase Auth, profiles', st: 'role: donor' },
        { t: 'Food listing', who: 'Donor', d: 'The donor lists surplus food with a safe-use deadline, a pickup window, storage needs (ambient, refrigerated or frozen), estimated meals, allergens and a pickup radius. The pickup window must end before the safe-use deadline.', fn: 'Zod + database constraints', st: 'listing: available' },
        { t: 'Matching', who: 'Receiver', d: 'Receivers see listings ranked by a deterministic score. Hard filters come first, then a weighted score. Try the explainer below.', fn: 'src/lib/matching.ts, request_listing()', st: 'request: pending' },
        { t: 'Receiver and volunteer', who: 'Donor, receiver', d: 'The donor accepts one request. Acceptance locks the listing row, creates the pickup and closes competing requests in one transaction. The receiver can assign a volunteer.', fn: 'respond_to_request(), assign_volunteer()', st: 'listing: reserved / pickup: scheduled, assigned' },
        { t: 'Pickup', who: 'Volunteer', d: 'The volunteer sees only their assigned pickups and marks progress on the way.', fn: 'update_pickup_progress()', st: 'pickup: en_route, arrived' },
        { t: 'Verified handover', who: 'Donor, collector, receiver', d: 'The donor generates a one-time 6-digit code. The collector enters it and the pickup becomes collected. The receiver confirms receipt and the rescue becomes verified. Only verified handovers count as rescued.', fn: 'generate_handover_code(), verify_handover_code(), confirm_receipt()', st: 'pickup: collected, verified / listing: completed' }
      ],
      handover: [
        'Generated on the server with gen_random_bytes, only by the donor organisation',
        'Stored only as a bcrypt hash. No API role can read the verification table',
        'Expires after 30 minutes, or at the safe-use deadline if that comes first',
        'Locked after 5 wrong attempts. Regenerating invalidates the old code',
        'Never reusable once the pickup is collected or verified',
        'Generation is rate-limited and written to the audit trail'
      ],
      security: [
        { k: 'Row-level security', v: 'Turned on for 9 tables in the security migration. Clients read only what their role and organisation allow.' },
        { k: 'Workflow functions', v: 'State changes go through security-definer functions that check membership and lock rows with FOR UPDATE.' },
        { k: 'Audit trail', v: 'Append-only. Clients cannot insert, update or delete audit events.' },
        { k: 'Demo isolation', v: 'Four demo accounts with fictional organisations. Demo and real records can never be matched.' }
      ],
      impl: [
        'Live expiry countdowns from stored UTC timestamps. Overdue listings count as expired in every query, even before the status row is updated.',
        'Notifications stored in Postgres and written by database functions, with Supabase Realtime and a 30-second polling fallback.',
        'Impact figures computed in SQL. Only verified handovers count, and kilograms and litres are never mixed.',
        'Database tests run against real Postgres in WebAssembly (PGlite).'
      ],
      decisions: [
        { d: 'Hard filters before any score', t: 'Safety rules are never traded against a good score. An ineligible match scores zero, however close it is.' },
        { d: 'Straight-line distance', t: 'Haversine distance needs no map service. The code says plainly that it is not road distance.' },
        { d: 'The server has the final word', t: 'The browser ranks matches, but request_listing() re-checks every hard constraint before a request is accepted.' },
        { d: 'Codes stored only as hashes', t: 'The plain code is shown to the donor once. A leaked table would not reveal live codes.' },
        { d: 'One accepted receiver per listing', t: 'Simple and safe under concurrent requests (row lock and a partial unique index), but no partial fulfilment yet.' }
      ],
      limits: [
        'No food photo upload yet. Listings use category icons.',
        'One accepted receiver per listing, so no partial fulfilment.',
        'Organisation verification is manual, in the admin console.',
        'Expiry notifications depend on clients loading the app (or optional pg_cron). Deadline enforcement does not.',
        'No map or geocoding. Location comes from presets, browser geolocation or typed coordinates.'
      ],
      shots: [],
      sources: ['README.md', 'src/lib/matching.ts', 'src/lib/geo.ts', 'src/lib/constants.ts', 'supabase/migrations/']
    } };
