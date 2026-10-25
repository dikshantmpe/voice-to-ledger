import { todayISO, yesterdayISO } from './format';

const dago = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

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
      { id: 7, date: dago(2), phrase: 'aaj 8000 ka maal becha', party: 'Verma Ji', amount: 8000, dir: 'in', nature: 'Sales', status: 'approved', conf: 0.95, flags: [], lines: [{ a: 'Cash', d: 8000, c: 0 }, { a: 'Sales', d: 0, c: 8000 }] },
      { id: 8, date: dago(2), phrase: '1500 mazdoori di', party: '', amount: 1500, dir: 'out', nature: 'Wages', status: 'approved', conf: 0.92, flags: [], lines: [{ a: 'Wages', d: 1500, c: 0 }, { a: 'Cash', d: 0, c: 1500 }] },
      { id: 9, date: dago(3), phrase: 'becha 12000 Ramu ko', party: 'Ramu', amount: 12000, dir: 'in', nature: 'Sales', status: 'approved', conf: 0.94, flags: [], lines: [{ a: 'Cash', d: 12000, c: 0 }, { a: 'Sales', d: 0, c: 12000 }] },
      { id: 10, date: dago(4), phrase: '9000 ka samaan khareeda', party: 'Sharma Traders', amount: 9000, dir: 'out', nature: 'Purchases', status: 'approved', conf: 0.9, flags: [], lines: [{ a: 'Purchases', d: 9000, c: 0 }, { a: 'Cash', d: 0, c: 9000 }] },
      { id: 11, date: dago(5), phrase: 'aaj 6500 ki bikri', party: '', amount: 6500, dir: 'in', nature: 'Sales', status: 'approved', conf: 0.93, flags: [], lines: [{ a: 'Cash', d: 6500, c: 0 }, { a: 'Sales', d: 0, c: 6500 }] },
      { id: 12, date: dago(6), phrase: '2500 bijli ka bill diya', party: '', amount: 2500, dir: 'out', nature: 'Electricity', status: 'approved', conf: 0.93, flags: [], lines: [{ a: 'Electricity', d: 2500, c: 0 }, { a: 'Cash', d: 0, c: 2500 }] },
    ],
    nextId: 13,
  };
}
