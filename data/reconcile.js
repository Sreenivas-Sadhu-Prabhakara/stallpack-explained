/* stallpack-explained — the same two-count arithmetic the live app uses.
   All money is INTEGER PAISE. Dual export: browser global + Node tests. */

/** Sold units for one item: carried out minus what came back. */
function soldUnits(carried, returned) {
  if (!Number.isInteger(carried) || !Number.isInteger(returned)) return null;
  if (carried < 0 || returned < 0 || returned > carried) return null;
  return carried - returned;
}

/** Expected takings for one line, in paise: sold × unit price. */
function lineExpectedPaise(sold, pricePaise) {
  if (!Number.isInteger(sold) || !Number.isInteger(pricePaise)) return null;
  if (sold < 0 || pricePaise < 0) return null;
  return sold * pricePaise;
}

/** Expected takings for the day: Σ sold × price over [{sold, pricePaise}]. */
function dayExpectedPaise(lines) {
  let total = 0;
  for (const l of lines) {
    const p = lineExpectedPaise(l.sold, l.pricePaise);
    if (p === null) return null;
    total += p;
  }
  return total;
}

/** Variance in paise: (cash + digital) − expected. Negative = short. */
function variancePaise(expectedPaise, cashPaise, digitalPaise) {
  if (![expectedPaise, cashPaise, digitalPaise].every(Number.isInteger)) return null;
  return cashPaise + digitalPaise - expectedPaise;
}

/** Returned quantity is valid only if 0 ≤ returned ≤ carried (integers). */
function validateReturn(carried, returned) {
  return Number.isInteger(carried) && Number.isInteger(returned) &&
    returned >= 0 && returned <= carried;
}

/** Parse a rupee string ("120.50", "35") to integer paise; max 2 decimals. */
function parseRupees(str) {
  if (typeof str !== 'string') return null;
  const m = /^\s*(\d+)(?:\.(\d{1,2}))?\s*$/.exec(str);
  if (!m) return null;
  const rupees = parseInt(m[1], 10);
  const frac = m[2] ? (m[2].length === 1 ? m[2] + '0' : m[2]) : '00';
  return rupees * 100 + parseInt(frac, 10);
}

/** Format integer paise with Indian digit grouping: 12345675 → "₹1,23,456.75". */
function formatPaise(paise, symbol) {
  if (!Number.isInteger(paise)) return '';
  const sym = symbol || '₹';
  const sign = paise < 0 ? '−' : '';
  const abs = Math.abs(paise);
  const rupees = String(Math.trunc(abs / 100));
  const frac = String(abs % 100).padStart(2, '0');
  let grouped;
  if (rupees.length <= 3) {
    grouped = rupees;
  } else {
    const head = rupees.slice(0, rupees.length - 3);
    const tail = rupees.slice(-3);
    grouped = head.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + tail;
  }
  return sign + sym + grouped + '.' + frac;
}

/** Sell-through % (rounded to nearest integer). */
function sellThroughPct(sold, carried) {
  if (!Number.isInteger(sold) || !Number.isInteger(carried)) return null;
  if (carried <= 0 || sold < 0 || sold > carried) return null;
  return Math.round((sold / carried) * 100);
}

/* The worked example used throughout the explainer page (and on the OG card).
   Same numbers as the stallpack self-test fixtures. */
const DEMO_DAY = {
  market: 'Tuesday haat',
  items: [
    { name: 'Glass bangles', carried: 30, returned: 12, pricePaise: 5000 },
    { name: 'Jhumka earrings', carried: 24, returned: 9, pricePaise: 12000 },
    { name: 'Cotton scarves', carried: 10, returned: 10, pricePaise: 3500 }
  ],
  cashPaise: 210000,
  digitalPaise: 46000
};

if (typeof module !== 'undefined') {
  module.exports = {
    soldUnits, lineExpectedPaise, dayExpectedPaise, variancePaise,
    validateReturn, parseRupees, formatPaise, sellThroughPct, DEMO_DAY
  };
}
