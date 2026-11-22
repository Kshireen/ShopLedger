const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

const cases = [
  {
    name: '#1001 uses HSN rates for 5% and 12% lines without a stored rate',
    items: [
      { name: 'Rice', hsn: '1006', price: 50, qty: 2 },
      { name: 'Ghee', hsn: '0405', price: 200, qty: 1 }
    ],
    coupon: '',
    billed: { subtotal: 300, discount: 0, tax: 29, cgst: 14.5, sgst: 14.5, total: 329 },
    printed: { subtotal: 300, discount: 0, tax: 29, cgst: 14.5, sgst: 14.5, total: 329 },
    billedLines: [{ gstPercent: 5, tax: 5 }, { gstPercent: 12, tax: 24 }],
    printedLines: [{ gstPercent: 5, tax: 5 }, { gstPercent: 12, tax: 24 }]
  },
  {
    name: '#1002 applies SAVE10 before GST',
    items: [
      { name: 'Rice', hsn: '1006', price: 300, qty: 2 },
      { name: 'Sunflower oil', hsn: '1512', price: 400, qty: 1 }
    ],
    coupon: 'SAVE10',
    billed: { subtotal: 1000, discount: 100, tax: 45, cgst: 22.5, sgst: 22.5, total: 945 },
    printed: { subtotal: 1000, discount: 100, tax: 45, cgst: 22.5, sgst: 22.5, total: 945 },
    billedLines: [{ gstPercent: 5, tax: 27 }, { gstPercent: 5, tax: 18 }],
    printedLines: [{ gstPercent: 5, tax: 27 }, { gstPercent: 5, tax: 18 }]
  },
  {
    name: '#1004 enforces the SAVE10 cap on a 2240 subtotal',
    items: [{ name: 'Groundnut oil', hsn: '1508', price: 280, qty: 8 }],
    coupon: 'SAVE10',
    billed: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    printed: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    billedLines: [{ gstPercent: 5, tax: 104.5 }],
    printedLines: [{ gstPercent: 5, tax: 104.5 }]
  },
  {
    name: '#1008 agrees with checkout for all-18% items without a coupon',
    items: [
      { name: 'Tea', hsn: '0902', price: 150, qty: 2 },
      { name: 'Syrup', hsn: '2106', gstRate: 18, price: 200, qty: 1 }
    ],
    coupon: '',
    billed: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    printed: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    billedLines: [{ gstPercent: 18, tax: 54 }, { gstPercent: 18, tax: 36 }],
    printedLines: [{ gstPercent: 18, tax: 54 }, { gstPercent: 18, tax: 36 }]
  }
];

for (const scenario of cases) {
  test('CURRENT BEHAVIOUR: ' + scenario.name, () => {
    const { items, coupon } = scenario;
    const { taxable, lines, ...billed } = pricing.computeTotals(items, coupon);
    const { rows, ...printed } = invoice.computeInvoiceFigures({ ...billed, items, coupon });

    assert.deepStrictEqual(billed, scenario.billed, 'checkout totals');
    assert.deepStrictEqual(printed, scenario.printed, 'invoice totals');
    assert.deepStrictEqual(
      lines.map(({ gstPercent, tax }) => ({ gstPercent, tax })),
      scenario.billedLines,
      'checkout GST by line'
    );
    assert.deepStrictEqual(
      rows.map(({ gstPercent, lineTax }) => ({ gstPercent, tax: lineTax })),
      scenario.printedLines,
      'invoice GST by line'
    );
  });
}
test('invoice matches checkout for mixed GST slabs with capped SAVE10', () => {
  const items = [
    { name: 'Rice', hsn: '1006', price: 400, qty: 3 },
    { name: 'Ghee', hsn: '0405', price: 520, qty: 2 }
  ];
  const coupon = 'SAVE10';
  const { taxable, lines, ...billed } = pricing.computeTotals(items, coupon);
  const order = { ...billed, items, coupon };
  const { rows, ...printed } = invoice.computeInvoiceFigures(order);

  assert.equal(billed.discount, 150);
  assert.deepStrictEqual(printed, billed);
  assert.deepStrictEqual(rows.map(row => row.gstPercent), [5, 12]);
  assert.deepStrictEqual(rows.map(row => row.lineTax), lines.map(line => line.tax));
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});
