import { todayISO, yesterdayISO } from './format';

export function seed() {
  const d0 = todayISO();
  const y = yesterdayISO();
  return {
    biz: { name: 'Sharma Kirana Store', cash: 25000 },
    lang: 'en',
    voiceLang: 'en-IN',
    accounts: ['Cash', 'Sales', 'Purchases', 'Wages', 'Rent', 'Electricity', 'Debtors', 'Creditors'],
    parties: [
      { n: 'Ramu', t: 'Customer' },
      { n: 'Sharma Traders', t: 'Supplier' },
      { n: 'Verma Ji', t: 'Customer' },
    ],
    entries: [
      { id: 1, date: d0, phrase: 'aaj Ramu ko 5000 ka maal becha', party: 'Ramu', amount: 5000, dir: 'in', nature: 'Sales', status: 'pending', conf: 0.96, flags: [], lines: [{ a: 'Cash', d: 5000, c: 0 }, { a: 'Sales', d: 0, c: 5000 }] },
      { id: 2, date: d0, phrase: '3.5k bijli ka bill pay kiya', party: '', amount: 3500, dir: 'out', nature: 'Electricity', status: 'pending', conf: 0.93, flags: [], lines: [{ a: 'Electricity', d: 3500, c: 0 }, { a: 'Cash', d: 0, c: 3500 }] },
      { id: 3, date: d0, phrase: 'becha 2500', party: '', amount: 2500, dir: 'in', nature: 'Sales', status: 'pending', conf: 0.58, flags: ['Missing customer name'], lines: [{ a: 'Cash', d: 2500, c: 0 }, { a: 'Sales', d: 0, c: 2500 }] },
      { id: 4, date: d0, phrase: 'payment ki', party: '', amount: null, dir: null, nature: 'Other', status: 'pending', conf: 0.41, flags: ['Missing amount', 'Unclear direction'], lines: [] },
      { id: 5, date: y, phrase: 'kal 2 hazar kiraya diya', party: '', amount: 2000, dir: 'out', nature: 'Rent', status: 'approved', conf: 0.94, flags: [], lines: [{ a: 'Rent', d: 2000, c: 0 }, { a: 'Cash', d: 0, c: 2000 }] },
      { id: 6, date: y, phrase: '1.2 lakh Sharma Traders ko payment ki', party: 'Sharma Traders', amount: 120000, dir: 'out', nature: 'Purchases', status: 'approved', conf: 0.91, flags: [], lines: [{ a: 'Purchases', d: 120000, c: 0 }, { a: 'Cash', d: 0, c: 120000 }] },
    ],
    nextId: 7,
  };
}
