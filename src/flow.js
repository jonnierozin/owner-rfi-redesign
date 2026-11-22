// Flow definition, state, reducer and derived values. No UI in here.
import { QUESTIONS, SAMPLE } from './data.js';

export const ORDER = [
  'intent', 'type', 'beds', 'address', 'renting', 'manage', 'furnish', 'timeline',
  'contact', 'submitted', 'schedule', 'booked', 'skipped'
];
export const POST_SUBMIT = ['submitted', 'schedule', 'booked', 'skipped'];

export function nextStep(step, answers) {
  const q = QUESTIONS[step];
  if (q) return typeof q.next === 'function' ? q.next(answers[step]) : q.next;
  return { beds: 'address', address: 'renting', contact: 'submitted' }[step];
}

export function phaseInfo(step, answers) {
  const groups = [
    ['intent', 'type', 'beds'],
    answers.renting === 'no'
      ? ['address', 'renting', 'furnish', 'timeline']
      : ['address', 'renting', 'manage', 'furnish', 'timeline'],
    ['contact'],
    POST_SUBMIT
  ];
  let index = groups.findIndex((g) => g.includes(step));
  if (index < 0) index = 0;
  const within = groups[index].indexOf(step);
  const frac = index === 3 ? (step === 'submitted' ? 0.5 : 1) : (within + 0.5) / groups[index].length;
  return { index, frac };
}

// ---- Validation -----------------------------------------------------------
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || '').trim());
export const phoneDigits = (v) => (v || '').replace(/\D/g, '');
export const isPhone = (v) => phoneDigits(v).length === 10;
export const isZipOnly = (v) => /^\d{5}$/.test((v || '').trim());

export function formatPhone(v) {
  let d = phoneDigits(v);
  if (d.length === 11 && d[0] === '1') d = d.slice(1);
  d = d.slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function contactErrors(c) {
  return {
    first: c.first.trim() ? '' : 'Enter your first name',
    last: c.last.trim() ? '' : 'Enter your last name',
    email: isEmail(c.email) ? '' : 'Enter a valid email, like name@example.com',
    phone: isPhone(c.phone) ? '' : 'Enter a 10-digit phone number'
  };
}

export function manualAddress(m) {
  const ok = m.street.trim() && m.city.trim() && /^[A-Za-z]{2}$/.test(m.state.trim()) && /^\d{5}$/.test(m.zip.trim());
  if (!ok) return null;
  const city = m.city.trim();
  return {
    main: m.unit.trim() ? `${m.street.trim()}, ${m.unit.trim()}` : m.street.trim(),
    sub: `${city}, ${m.state.trim().toUpperCase()} ${m.zip.trim()}`,
    city,
    manual: true
  };
}

// The address currently confirmed (picked from suggestions, or a valid manual entry).
export function confirmedAddress(a) {
  if (a.addr) return a.addr;
  if (a.manualMode) return manualAddress(a.manual);
  return null;
}

// ---- Profile chips ----------------------------------------------------------
export function profileChips(s) {
  const a = s.answers;
  const chip = (step) => {
    const opt = QUESTIONS[step].options.find((o) => o.value === a[step]);
    return opt && opt.chip;
  };
  const out = [];
  if (a.type) out.push(chip('type'));
  if (a.bedsSet) out.push(a.beds === 0 ? 'Studio' : `${a.beds} bed`);
  const addr = confirmedAddress(a);
  if (addr) out.push(addr.city);
  if (a.renting) out.push(chip('renting'));
  if (a.manage && a.renting === 'yes') out.push(chip('manage'));
  if (a.furnish) out.push(chip('furnish'));
  if (a.timeline) out.push(chip('timeline'));
  return out.filter(Boolean);
}

// ---- State ------------------------------------------------------------------
const emptyManual = { street: '', unit: '', city: '', state: '', zip: '' };

export function createState(startStep = 'intent') {
  const step = ORDER.includes(startStep) ? startStep : 'intent';
  const at = ORDER.indexOf(step);
  const before = (k) => ORDER.indexOf(k) < at;
  const answers = { beds: 3, bedsSet: false, query: '', addr: null, manualMode: false, manual: { ...emptyManual } };
  const contact = { first: '', last: '', email: '', phone: '' };

  // Deep links (?step=…) prefill sample answers for the steps before, so any screen can be demoed directly.
  if (before('intent')) answers.intent = SAMPLE.intent;
  if (before('type')) answers.type = SAMPLE.type;
  if (before('beds')) { answers.beds = SAMPLE.beds; answers.bedsSet = true; }
  if (before('address')) { answers.addr = SAMPLE.addr; answers.query = SAMPLE.addr.main; }
  if (before('renting')) answers.renting = SAMPLE.renting;
  if (before('manage')) answers.manage = SAMPLE.manage;
  if (before('furnish')) answers.furnish = SAMPLE.furnish;
  if (before('timeline')) answers.timeline = SAMPLE.timeline;
  if (before('contact')) Object.assign(contact, SAMPLE.contact);

  const visited = ORDER.slice(0, at).filter((k) => !POST_SUBMIT.includes(k) && !(k === 'manage' && answers.renting === 'no'));
  if (['schedule', 'booked', 'skipped'].includes(step)) visited.push('submitted');

  return {
    step,
    visited,
    answers,
    contact,
    touched: {},
    tried: false,
    submitted: POST_SUBMIT.includes(step),
    slot: step === 'booked' ? { day: 1, time: 2 } : { day: null, time: null }
  };
}

export function reducer(s, action) {
  switch (action.type) {
    case 'answer':
      return { ...s, answers: { ...s.answers, ...action.patch } };
    case 'manual':
      return { ...s, answers: { ...s.answers, manual: { ...s.answers.manual, ...action.patch } } };
    case 'contact':
      return { ...s, contact: { ...s.contact, ...action.patch } };
    case 'touch':
      return { ...s, touched: { ...s.touched, [action.field]: true } };
    case 'tried':
      return { ...s, tried: true };
    case 'slot':
      return { ...s, slot: { ...s.slot, ...action.patch } };
    case 'go': {
      const keep = ['schedule', 'booked', 'skipped'].includes(s.step) ? s.visited : [...s.visited, s.step];
      return {
        ...s,
        step: action.step,
        visited: keep,
        tried: false,
        submitted: s.submitted || action.step === 'submitted'
      };
    }
    case 'restore': {
      // Browser back/forward.
      const i = s.visited.lastIndexOf(action.step);
      const visited = i >= 0 ? s.visited.slice(0, i) : s.visited;
      return { ...s, step: action.step, visited, tried: false };
    }
    default:
      return s;
  }
}
