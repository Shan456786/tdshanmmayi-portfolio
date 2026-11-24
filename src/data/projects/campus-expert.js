// Campus Expert. See src/data/projects/index.js for how entries are used.
export default { name: 'Campus Expert', tcls: 'ptt pt-ce', c: '#FF5DA8', fg: '#2E170E', tag: 'AI PROJECT', line: 'AI-powered VIT-AP student Q&A assistant.', tags: 'NEXT.JS / FASTAPI / LLM',
    // Live demo hidden until its availability is verified. To restore it, copy demoOptional into demo.
    repo: 'https://github.com/Shan456786/CampusExpert', demo: '', demoOptional: 'https://campus-expert.vercel.app',
    cs: {
      kind: 'ce', kicker: 'AI / INFORMATION SYSTEM', type: 'AI project', started: 'Jul 2026', interactive: 'Question tracer',
      deck: 'A campus assistant that would rather say "I could not find that" than guess. It looks up cited facts first, and only then lets a language model phrase the answer.',
      overview: 'Campus Expert answers everyday VIT-AP questions (hostels, mess, library, exams, fees, transport and more) from a hand-curated knowledge base of 36 cited entries across 17 topics. Every answer shows its official source and whether that fact is verified.',
      problem: 'Campus information is spread across many pages, PDFs and word of mouth. A general-purpose chatbot asked about a specific campus will often give a confident but invented answer, which is worse than no answer.',
      role: 'Built as an independent student project: the FastAPI backend, the retrieval and answer pipeline, the knowledge base, accounts and saved chats, and the Next.js front end.',
      stack: [
        { g: 'Front end', items: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS 4'] },
        { g: 'Back end', items: ['FastAPI', 'Python 3.13', 'Pydantic', 'SQLite'] },
        { g: 'Language model', items: ['OpenRouter (configured for a Google Gemma model)'] }
      ],
      kb: { entries: 36, topics: 17, official: 34, unverified: 2 },
      topics: ['academics', 'attendance', 'campus map', 'campus services', 'clubs', 'contacts', 'examinations', 'faculty', 'fees', 'hostel', 'important dates', 'library', 'medical', 'mess', 'placements', 'student resources', 'transport'],
      weights: [
        { k: 'Exact phrase', v: 4.0 }, { k: 'Alias phrase', v: 3.0 }, { k: 'Single-word keyword', v: 1.0 }, { k: 'Category hint', v: 1.0 },
        { k: 'Alias word', v: 0.75 }, { k: 'Keyword token overlap', v: 0.5 }, { k: 'Title token overlap', v: 0.5 }, { k: 'Alias token overlap', v: 0.4 }
      ],
      traces: [
        { label: 'A greeting', q: 'Thanks!', path: ['q', 'small', 'reply'],
          log: ['Smalltalk check: thanks is recognised.', 'A canned reply is sent straight away.', 'No retrieval and no language model call.'] },
        { label: 'A campus question', q: 'How does FFCS course registration work?', path: ['q', 'small', 'retr', 'gate', 'llm', 'ans'],
          log: ['Smalltalk check: not smalltalk, so retrieval runs.', 'Keyword retrieval: "ffcs" and "course registration" are keywords of the FFCS entry.', 'Evidence gate: the score clears the 1.0 threshold. Up to 3 entries, one per category.', 'OpenRouter is called with the evidence only, at temperature 0.2.', 'Answer returned with its source card: title, category, link, date and verified label.'] },
        { label: 'Outside the 17 topics', q: 'What is the weather on Mars?', path: ['q', 'small', 'retr', 'gate', 'none'],
          log: ['Smalltalk check: not smalltalk.', 'Keyword retrieval: no entry scores 1.0 or more.', 'Evidence gate: closed. The language model is never called.', 'Reply: "I couldn\'t find verified information in the current knowledge base for that", with related topics.'] },
        { label: 'Language model down', q: 'How does FFCS course registration work?', path: ['q', 'small', 'retr', 'gate', 'llm', 'err'],
          log: ['Retrieval and the evidence gate pass, as before.', 'The OpenRouter call fails: missing key, timeout or HTTP error.', 'The stored answer text is returned instead, with its sources.', 'Chat keeps working while the provider is down.'] }
      ],
      accounts: [
        { k: 'Passwords', v: 'PBKDF2-HMAC-SHA256, 260,000 iterations, a random salt per user, constant-time comparison.' },
        { k: 'Sessions', v: 'Random opaque tokens checked on the server. 7 days, or 4 hours for demos. Logout deletes the session row.' },
        { k: 'Chats', v: 'Every conversation query is scoped to the signed-in user. Someone else\'s chat and a missing chat return the same 404.' },
        { k: 'Demo accounts', v: 'One click creates an isolated demo account with two seeded chats. Logging out deletes it and all its data.' },
        { k: 'Abuse limits', v: 'Messages capped at 4,000 characters. Sign-up, login and demo creation are rate-limited.' }
      ],
      decisions: [
        { d: 'Keyword retrieval, not embeddings', t: 'Every match can be traced to a keyword, phrase or alias. The cost: a phrasing that shares no keywords with an entry will not match. An earlier embedding pipeline is still in the repository but is not on the live path.' },
        { d: 'Retrieval gates generation', t: 'No evidence means no model call, so nothing is invented. The cost is more honest "not found" replies.' },
        { d: 'The model may only rephrase', t: 'Temperature 0.2, at most 400 tokens, and a system prompt that treats evidence and chat history as data, never as instructions.' },
        { d: 'Stored answers as a fallback', t: 'If the model call fails, the stored answer is returned, so chat never depends on the provider being up.' },
        { d: 'SQLite and server-side sessions', t: 'Simple for a prototype. The repository notes it is a single local file, not built for several backend instances.' }
      ],
      limits: [
        'A small knowledge base: 36 entries. Anything outside them gets the fallback reply.',
        'Keyword retrieval only. No semantic matching.',
        'No admin interface. Knowledge is edited by hand in JSON files.',
        'No password change or reset, and account deletion is client-side only for regular users.',
        'Session tokens are stored in plain form. Rate limiting is in memory.',
        'No automated test suite yet.'
      ],
      shots: [],
      sources: ['README.md', 'backend/app/services/knowledge_retriever.py', 'backend/app/api/chat.py', 'backend/app/services/answer_generator.py', 'backend/app/services/security.py', 'backend/app/data/knowledge/']
    } };
