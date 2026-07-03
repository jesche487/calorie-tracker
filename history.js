(function () {
  'use strict';

  function formatNum(n) {
    return (Math.round(n * 100) / 100).toString();
  }

  function totalsLine(totals) {
    const count = totals.count;
    return `${formatNum(totals.calories)} cal · ${formatNum(totals.protein)}g protein · ${count} ${count === 1 ? 'entry' : 'entries'}`;
  }

  const openBtn = document.getElementById('historyBtn');
  const closeBtn = document.getElementById('drawerClose');
  const backBtn = document.getElementById('drawerBack');
  const overlay = document.getElementById('historyOverlay');
  const drawer = document.getElementById('historyDrawer');
  const listEl = document.getElementById('drawerList');
  const detailEl = document.getElementById('drawerDetail');
  const detailDateEl = document.getElementById('drawerDetailDate');
  const detailTotalsEl = document.getElementById('drawerDetailTotals');
  const detailTextEl = document.getElementById('drawerDetailText');

  function renderList() {
    listEl.innerHTML = '';
    const history = Storage.getHistory();

    if (history.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No archived days yet. Use "Start New Day" to archive today\'s entries.';
      listEl.appendChild(empty);
      return;
    }

    history.forEach((day, index) => {
      const btn = document.createElement('button');
      btn.className = 'day-item';
      btn.type = 'button';

      const dateSpan = document.createElement('span');
      dateSpan.className = 'day-date';
      dateSpan.textContent = day.date;

      const totalsSpan = document.createElement('span');
      totalsSpan.className = 'day-totals';
      totalsSpan.textContent = totalsLine(day.totals);

      btn.appendChild(dateSpan);
      btn.appendChild(totalsSpan);
      btn.addEventListener('click', () => showDetail(index));
      listEl.appendChild(btn);
    });
  }

  // Shows the exact raw text as it was saved for that day, before
  // "Start New Day" archived it — the same free-text pad content, just
  // read-only.
  function showDetail(index) {
    const day = Storage.getHistory()[index];
    if (!day) return;
    detailDateEl.textContent = day.date;
    detailTotalsEl.textContent = totalsLine(day.totals);
    detailTextEl.textContent = day.rawText;
    listEl.hidden = true;
    detailEl.hidden = false;
  }

  function showList() {
    detailEl.hidden = true;
    listEl.hidden = false;
  }

  function openDrawer() {
    renderList();
    showList();
    drawer.classList.add('open');
    overlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    // Move focus out before hiding the drawer from assistive tech —
    // otherwise a focused control (e.g. Close) would be left inside an
    // aria-hidden container.
    if (drawer.contains(document.activeElement)) {
      openBtn.focus();
    }
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  openBtn.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  backBtn.addEventListener('click', showList);
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
  });
})();
