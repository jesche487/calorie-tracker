/*
 * Storage layer for Tracker.
 *
 * This is the ONLY file that touches localStorage. Everything else in the
 * app (app.js, history.js) talks to the functions below, not to
 * localStorage directly. That's intentional: today this persists to
 * localStorage as JSON, but the storage could later be swapped for a real
 * backend (a small SQLite-backed API, Supabase, Turso, etc.) by rewriting
 * the internals of this file only — no UI code would need to change.
 */
(function () {
  'use strict';

  // Demo mode (?demo=true) uses entirely separate storage keys from real
  // usage, so a demo visit — including the site owner opening their own
  // demo link — can never read or write real entries, and vice versa.
  let isDemo = false;
  try {
    isDemo = new URLSearchParams(window.location.search).get('demo') === 'true';
  } catch (e) {
    isDemo = false;
  }

  const CURRENT_KEY = isDemo ? 'tally:demo:current' : 'tally:current';
  const HISTORY_KEY = isDemo ? 'tally:demo:history' : 'tally:history';

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (e) {
      console.error('Storage read error for', key, e);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage write error for', key, e);
      return false;
    }
  }

  function todayStr() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function makeId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  function getCurrent() {
    return readJSON(CURRENT_KEY, { rawText: '', entries: [] });
  }

  function getRawText() {
    return getCurrent().rawText || '';
  }

  function getEntries() {
    return getCurrent().entries || [];
  }

  // Replaces today's raw pad text + structured entries in one go. The
  // notepad re-parses the whole textarea on every save, so this is the
  // main write path for the current day.
  function saveCurrent(rawText, entries) {
    return writeJSON(CURRENT_KEY, { rawText: rawText || '', entries: entries || [] });
  }

  // Appends a single structured entry to the current day, filling in
  // id/date/created_at if not supplied.
  function addEntry(entry) {
    const current = getCurrent();
    const full = Object.assign({
      id: makeId(),
      date: todayStr(),
      created_at: new Date().toISOString()
    }, entry);
    current.entries = current.entries || [];
    current.entries.push(full);
    writeJSON(CURRENT_KEY, current);
    return full;
  }

  function getHistory() {
    return readJSON(HISTORY_KEY, []);
  }

  // Archives the current day (raw text + entries + computed totals) into
  // history, then clears the pad for a fresh day. Returns the archived
  // record.
  function archiveDay() {
    const current = getCurrent();
    const entries = current.entries || [];
    const totals = entries.reduce((acc, e) => {
      acc.calories += e.calories;
      acc.protein += e.protein;
      acc.count += 1;
      return acc;
    }, { calories: 0, protein: 0, count: 0 });

    const record = {
      // The archive date is "today" (when Start New Day is clicked), not
      // necessarily each entry's own .date — if the pad is left open past
      // midnight, entries still archive together under the day they're
      // closed out on.
      date: todayStr(),
      rawText: current.rawText || '',
      entries,
      totals,
      archived_at: new Date().toISOString()
    };

    const history = getHistory();
    history.unshift(record);
    writeJSON(HISTORY_KEY, history);
    writeJSON(CURRENT_KEY, { rawText: '', entries: [] });

    return record;
  }

  // Populates demo mode with realistic sample data on its first-ever load
  // in this browser, so a portfolio visitor sees a populated notepad and
  // history right away instead of a blank pad. Never runs again once demo
  // data exists (so a visitor's own edits during their session persist
  // across a reload), and never touches the real-mode keys.
  function seedDemoDataIfEmpty() {
    if (localStorage.getItem(CURRENT_KEY) !== null || localStorage.getItem(HISTORY_KEY) !== null) {
      return;
    }

    function dateStrDaysAgo(n) {
      const d = new Date();
      d.setDate(d.getDate() - n);
      const p = x => String(x).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    }

    function isoAt(daysAgo, hour, minute) {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hour, minute, 0, 0);
      return d.toISOString();
    }

    function entry(calories, protein, note, daysAgo, hour, minute) {
      return {
        id: makeId(),
        date: dateStrDaysAgo(daysAgo),
        calories,
        protein,
        note,
        raw_line: note ? `${calories}, ${protein} ${note}` : `${calories}, ${protein}`,
        created_at: isoAt(daysAgo, hour, minute)
      };
    }

    function totalsOf(entries) {
      return entries.reduce((acc, e) => {
        acc.calories += e.calories;
        acc.protein += e.protein;
        acc.count += 1;
        return acc;
      }, { calories: 0, protein: 0, count: 0 });
    }

    const todayEntries = [
      entry(350, 28, 'oatmeal with peanut butter and banana', 0, 8, 15),
      entry(120, 3, 'black coffee', 0, 8, 20),
      entry(520, 42, 'turkey sandwich, chips', 0, 12, 45),
      entry(90, 1, 'apple', 0, 15, 30)
    ];

    const yesterdayEntries = [
      entry(300, 25, 'greek yogurt with granola', 1, 8, 0),
      entry(450, 38, 'grilled chicken salad', 1, 12, 30),
      entry(600, 45, 'salmon, rice, broccoli', 1, 19, 0),
      entry(150, 20, 'protein shake', 1, 20, 15)
    ];

    const twoDaysAgoEntries = [
      entry(250, 20, 'scrambled eggs, toast', 2, 7, 45),
      entry(500, 40, 'turkey burger, sweet potato fries', 2, 13, 0),
      entry(350, 30, 'cottage cheese and berries', 2, 16, 30),
      entry(200, 15, 'mixed nuts', 2, 21, 0)
    ];

    writeJSON(CURRENT_KEY, {
      rawText: todayEntries.map(e => e.raw_line).join('\n'),
      entries: todayEntries
    });

    writeJSON(HISTORY_KEY, [
      {
        date: dateStrDaysAgo(1),
        rawText: yesterdayEntries.map(e => e.raw_line).join('\n'),
        entries: yesterdayEntries,
        totals: totalsOf(yesterdayEntries),
        archived_at: isoAt(1, 22, 0)
      },
      {
        date: dateStrDaysAgo(2),
        rawText: twoDaysAgoEntries.map(e => e.raw_line).join('\n'),
        entries: twoDaysAgoEntries,
        totals: totalsOf(twoDaysAgoEntries),
        archived_at: isoAt(2, 22, 0)
      }
    ]);
  }

  if (isDemo) seedDemoDataIfEmpty();

  window.Storage = {
    isDemo,
    getRawText,
    getEntries,
    saveCurrent,
    addEntry,
    getHistory,
    archiveDay,
    todayStr,
    makeId
  };
})();
