# Tally — Calorie & Protein Notepad

A tiny, single-user calorie/protein tracker that works like a notepad. No
build step, no framework, no backend — open `index.html` in a browser
(mobile or desktop) or host the folder as a static site (e.g. GitHub Pages)
and it just works.

## Usage

Type one entry per line:

```
100, 10
200, 20
300, 30 chicken breast
```

Each line is `calories, protein, note` — commas or spaces both work as
separators, and everything after the second number is treated as a free-text
note. The header above the pad shows a live running total of calories,
protein, and entry count as you type. Entries save automatically a moment
after you stop typing.

When you're done for the day, hit **Start New Day**. This archives today's
entries (and their totals) into **History** and clears the pad for
tomorrow. Nothing is ever deleted — the History page (`history.html`) lists
every past day with its totals and the exact original text you typed.

## Files

- `index.html` / `app.js` — the notepad: parsing, live totals, save, and the
  Start New Day flow.
- `history.html` / `history.js` — read-only view of archived days.
- `storage.js` — the storage layer (see below).
- `style.css` — shared styles for both pages.

## Storage architecture

Free text is convenient to type, but under the hood each line is parsed into
a structured entry:

```js
{ id, date, calories, protein, note, raw_line, created_at }
```

These structured entries (plus the raw pad text, so your exact wording is
never lost) are stored as JSON in `localStorage`.

All persistence is intentionally isolated behind `storage.js`, which exposes
a small function-based API — `getEntries()`, `addEntry()`, `saveCurrent()`,
`archiveDay()`, `getHistory()`, etc. **No other file touches `localStorage`
directly.** `app.js` and `history.js` only ever call into `storage.js`.

This is deliberate: it's a personal, single-user app today, so localStorage
is fine. But because the rest of the app only ever talks to `storage.js`'s
functions — never to `localStorage` itself — swapping the storage backend
later (a small SQLite-backed API, or a hosted DB like Supabase or Turso)
only means rewriting the internals of `storage.js`. The UI code wouldn't
need to change at all.

## Future ideas

- Once entries live in a real database, a **charts page** (e.g. using
  Chart.js) could show trends over time — daily calorie totals, rolling
  protein averages, etc. Today's structured entry format
  (`{ id, date, calories, protein, note, raw_line, created_at }`) is already
  shaped to support this later without any rework of the entry data itself.
- Editing/deleting individual archived entries, rather than only the raw
  pad text.
- Export history as CSV/JSON.
