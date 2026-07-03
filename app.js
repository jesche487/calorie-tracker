(function () {
  'use strict';

  // Matches: leading number, comma/space separator, second number, then an
  // optional separator followed by a free-text note for the rest of the line.
  const LINE_RE = /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*[, ]?\s*(.*)$/;

  function parseLine(line) {
    const m = line.match(LINE_RE);
    if (!m) return null;
    return {
      calories: parseFloat(m[1]),
      protein: parseFloat(m[2]),
      note: m[3].trim()
    };
  }

  // Parses the pad's free text into structured entries. Reuses id/date/
  // created_at from previousEntries for lines whose exact text is
  // unchanged, so untouched lines keep their original timestamp; editing
  // a line's text (even just its note) is treated as a new entry.
  function parseText(text, previousEntries) {
    const pool = (previousEntries || []).slice();
    const entries = [];

    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      const parsed = parseLine(line);
      if (!parsed) continue;

      const poolIndex = pool.findIndex(e => e.raw_line === line);
      let id, date, created_at;
      if (poolIndex !== -1) {
        const prev = pool[poolIndex];
        id = prev.id;
        date = prev.date;
        created_at = prev.created_at;
        pool.splice(poolIndex, 1);
      } else {
        id = Storage.makeId();
        date = Storage.todayStr();
        created_at = new Date().toISOString();
      }

      entries.push({
        id,
        date,
        calories: parsed.calories,
        protein: parsed.protein,
        note: parsed.note,
        raw_line: line,
        created_at
      });
    }

    const totals = entries.reduce((acc, e) => {
      acc.cal += e.calories;
      acc.pro += e.protein;
      acc.count += 1;
      return acc;
    }, { cal: 0, pro: 0, count: 0 });

    return { entries, totals };
  }

  function formatNum(n) {
    return (Math.round(n * 100) / 100).toString();
  }

  const pad = document.getElementById('pad');
  const calTotalEl = document.getElementById('calTotal');
  const proTotalEl = document.getElementById('proTotal');
  const lineCountEl = document.getElementById('lineCount');
  const statusEl = document.getElementById('status');
  const newDayBtn = document.getElementById('newDayBtn');

  let saveTimer = null;

  function updateTotals() {
    const { totals } = parseText(pad.value, Storage.getEntries());
    calTotalEl.textContent = formatNum(totals.cal);
    proTotalEl.innerHTML = formatNum(totals.pro) + '<span class="unit">g</span>';
    lineCountEl.textContent = totals.count + (totals.count === 1 ? ' entry' : ' entries');
  }

  function showStatus(msg) {
    statusEl.textContent = msg;
    statusEl.classList.add('show');
    clearTimeout(showStatus._t);
    showStatus._t = setTimeout(() => statusEl.classList.remove('show'), 1200);
  }

  function saveNow() {
    clearTimeout(saveTimer);
    const { entries } = parseText(pad.value, Storage.getEntries());
    const ok = Storage.saveCurrent(pad.value, entries);
    showStatus(ok ? 'saved' : 'save failed');
  }

  function loadText() {
    pad.value = Storage.getRawText();
    updateTotals();
  }

  pad.addEventListener('input', () => {
    updateTotals();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 600);
  });

  newDayBtn.addEventListener('click', () => {
    saveNow();
    if (Storage.getEntries().length === 0) {
      showStatus('nothing to archive');
      return;
    }
    const ok = confirm("Start a new day? Today's entries will be saved to history and the pad will be cleared.");
    if (!ok) return;
    Storage.archiveDay();
    pad.value = '';
    updateTotals();
    showStatus('day archived');
  });

  loadText();
})();
