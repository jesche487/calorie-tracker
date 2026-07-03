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
tomorrow. Nothing is ever deleted — click **History** to slide open a panel
listing every past day; click a date to see the exact original text you
typed that day (the saved snapshot from just before you hit Start New Day).

## Files

- `index.html` / `app.js` — the notepad: parsing, live totals, save, and the
  Start New Day flow.
- `history.js` — the slide-out History drawer (list of past days, and the
  read-only view of a selected day's original text).
- `storage.js` — the storage layer (see below).
- `style.css` — shared styles.

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
directly.** `app.js` and `history.js` (the History drawer) only ever call
into `storage.js`.

This is deliberate: it's a personal, single-user app today, so localStorage
is fine. But because the rest of the app only ever talks to `storage.js`'s
functions — never to `localStorage` itself — swapping the storage backend
later (a small SQLite-backed API, or a hosted DB like Supabase or Turso)
only means rewriting the internals of `storage.js`. The UI code wouldn't
need to change at all.

## Hosting & demo mode

**Where this runs:** day-to-day real logging happens at the GitHub Pages URL
for this repo (`https://<username>.github.io/calorie-tracker/`, no custom
domain). `localStorage` is scoped per browser origin (scheme + host + port —
not per path), so *any* other page served under that same
`<username>.github.io` host — including a personal portfolio site hosted as
another GitHub Pages repo under the same account — technically shares that
origin. In practice this is not a data-safety issue for visitors: `localStorage`
never syncs across browsers or devices, so a portfolio visitor on their own
machine can never see or affect real entries, and vice versa, regardless of
origin. The one real edge case is the site owner opening a same-origin demo
link in *their own* browser (e.g. during a live walkthrough) — without demo
mode, that would just open the real, live app with real data.

**Demo mode** exists to handle that case, and to give portfolio visitors a
populated, realistic experience instead of a blank pad. Append `?demo=true`
to the URL to enable it:

```
https://<username>.github.io/calorie-tracker/?demo=true
```

- **Isolation:** demo mode reads/writes entirely separate `localStorage`
  keys (`tally:demo:current`, `tally:demo:history`) from real usage
  (`tally:current`, `tally:history`). This is enforced once, at the top of
  `storage.js` — there is no code path anywhere else in the app where demo
  and real data can read or write the same key, even in the same browser.
- **Seeded data:** the first time `?demo=true` is loaded in a browser, the
  pad is pre-filled with a handful of sample entries and History gets two
  sample archived days, so the notepad, live totals, and History drawer all
  have something to show immediately. After that first seed, a demo
  visitor's own typing and archived days persist normally across reloads
  (same as real mode) — it only re-seeds when the demo keys are empty.
- **Fully interactive:** typing, live totals, and Start New Day all work
  identically to real mode — demo mode only changes which storage keys are
  used underneath.
- **Visibly marked as a demo:** a banner reading "Demo — sample data, not
  connected to any real account" appears at the top of the page, and the
  page title changes to "Tally Notepad — Demo", so it's never ambiguous
  which mode you're in.

**Linking from a personal site:** since visitor isolation is already
guaranteed by the browser (different device = different `localStorage`, no
matter the origin), a plain link is enough — no iframe needed:

```html
<a href="https://<username>.github.io/calorie-tracker/?demo=true" target="_blank" rel="noopener">
  Try the live demo
</a>
```

## Future ideas

- Once entries live in a real database, a **charts page** (e.g. using
  Chart.js) could show trends over time — daily calorie totals, rolling
  protein averages, etc. Today's structured entry format
  (`{ id, date, calories, protein, note, raw_line, created_at }`) is already
  shaped to support this later without any rework of the entry data itself.
- Editing/deleting individual archived entries, rather than only the raw
  pad text.
- Export history as CSV/JSON.
