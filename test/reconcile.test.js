'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../data/reconcile.js');

test('soldUnits: carried − returned', () => {
  assert.equal(R.soldUnits(30, 12), 18);
  assert.equal(R.soldUnits(24, 24), 0);
  assert.equal(R.soldUnits(24, 9), 15);
  assert.equal(R.soldUnits(30, 31), null);   // returned > carried rejected
  assert.equal(R.soldUnits(-1, 0), null);
});

test('lineExpectedPaise: sold × price in exact paise', () => {
  assert.equal(R.lineExpectedPaise(18, 5000), 90000);
  assert.equal(R.lineExpectedPaise(0, 3500), 0);
  assert.equal(R.lineExpectedPaise(-1, 100), null);
});

test('dayExpectedPaise: the worked example totals ₹2,700.00', () => {
  const lines = [
    { sold: 18, pricePaise: 5000 },
    { sold: 15, pricePaise: 12000 },
    { sold: 0, pricePaise: 3500 }
  ];
  assert.equal(R.dayExpectedPaise(lines), 270000);
});

test('variancePaise: ₹2,560 against ₹2,700 expected is short ₹140.00', () => {
  assert.equal(R.variancePaise(270000, 210000, 46000), -14000);
  assert.equal(R.variancePaise(270000, 224000, 46000), 0);
  assert.equal(R.variancePaise(0, 0, 0), 0);
});

test('validateReturn clamps to 0..carried', () => {
  assert.equal(R.validateReturn(30, 31), false);
  assert.equal(R.validateReturn(30, -1), false);
  assert.equal(R.validateReturn(30, 30), true);
  assert.equal(R.validateReturn(30, 0), true);
});

test('parseRupees: max 2 decimals, integers OK', () => {
  assert.equal(R.parseRupees('120.50'), 12050);
  assert.equal(R.parseRupees('35'), 3500);
  assert.equal(R.parseRupees('12.345'), null);
  assert.equal(R.parseRupees('12.5'), 1250);
  assert.equal(R.parseRupees('abc'), null);
});

test('formatPaise: Indian digit grouping', () => {
  assert.equal(R.formatPaise(12345675), '₹1,23,456.75');
  assert.equal(R.formatPaise(270000), '₹2,700.00');
  assert.equal(R.formatPaise(-14000), '−₹140.00');
  assert.equal(R.formatPaise(0), '₹0.00');
  assert.equal(R.formatPaise(100000000), '₹10,00,000.00');
});

test('sellThroughPct rounds to nearest integer', () => {
  assert.equal(R.sellThroughPct(33, 74), 45);   // 44.59 → 45
  assert.equal(R.sellThroughPct(18, 30), 60);
  assert.equal(R.sellThroughPct(0, 10), 0);
  assert.equal(R.sellThroughPct(5, 0), null);
});

test('DEMO_DAY fixture is internally consistent (engine derives page numbers)', () => {
  const lines = R.DEMO_DAY.items.map(it => ({
    sold: R.soldUnits(it.carried, it.returned),
    pricePaise: it.pricePaise
  }));
  assert.deepEqual(lines.map(l => l.sold), [18, 15, 0]);
  const expected = R.dayExpectedPaise(lines);
  assert.equal(expected, 270000);
  const v = R.variancePaise(expected, R.DEMO_DAY.cashPaise, R.DEMO_DAY.digitalPaise);
  assert.equal(v, -14000);
  assert.equal(R.formatPaise(v), '−₹140.00');
});

test('property: paise identities over 2000 seeded random days', () => {
  // deterministic LCG so the run is reproducible
  let s = 42;
  const rnd = (n) => { s = (s * 1103515245 + 12345) % 2147483648; return s % n; };
  for (let i = 0; i < 2000; i++) {
    const carried = rnd(200);
    const returned = carried === 0 ? 0 : rnd(carried + 1);
    const price = rnd(100000);
    const sold = R.soldUnits(carried, returned);
    assert.equal(sold + returned, carried);            // Σ parts === total
    const exp = R.lineExpectedPaise(sold, price);
    assert.ok(Number.isInteger(exp) && exp >= 0);
    const cash = rnd(exp + 1), digital = rnd(exp + 1);
    const v = R.variancePaise(exp, cash, digital);
    assert.equal(v + exp, cash + digital);             // variance identity, exact paise
    // format→parse round-trip for non-negative values
    if (v >= 0) {
      const plain = R.formatPaise(v).replace(/[₹,]/g, '');
      assert.equal(R.parseRupees(plain), v);
    }
  }
});
