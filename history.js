(function () {
  'use strict';

  function formatNum(n) {
    return (Math.round(n * 100) / 100).toString();
  }

  const listEl = document.getElementById('historyList');
  const history = Storage.getHistory();

  if (history.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No archived days yet. Use "Start New Day" on the notepad to archive today\'s entries.';
    listEl.appendChild(empty);
    return;
  }

  for (const day of history) {
    const details = document.createElement('details');
    details.className = 'day';

    const summary = document.createElement('summary');

    const dateSpan = document.createElement('span');
    dateSpan.className = 'day-date';
    dateSpan.textContent = day.date;

    const totalsSpan = document.createElement('span');
    totalsSpan.className = 'day-totals';
    const count = day.totals.count;
    totalsSpan.textContent =
      `${formatNum(day.totals.calories)} cal · ${formatNum(day.totals.protein)}g protein · ${count} ${count === 1 ? 'entry' : 'entries'}`;

    summary.appendChild(dateSpan);
    summary.appendChild(totalsSpan);

    const pre = document.createElement('pre');
    pre.className = 'raw-text';
    pre.textContent = day.rawText;

    details.appendChild(summary);
    details.appendChild(pre);
    listEl.appendChild(details);
  }
})();
