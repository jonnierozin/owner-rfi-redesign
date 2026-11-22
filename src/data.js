// Content and sample data for the prototype.
// Everything marked SAMPLE is illustrative, not Evolve data.

// SAMPLE: shown as the rental potential estimate. A real build would call Evolve's estimate service.
export const ESTIMATE = { low: 42000, high: 56000 };

export const formatEstimate = () =>
  `$${ESTIMATE.low.toLocaleString('en-US')}–$${ESTIMATE.high.toLocaleString('en-US')}`;

export const PHASES = [
  { id: 'property', label: 'Your property', short: 'Your property' },
  { id: 'opportunity', label: 'The opportunity', short: 'Opportunity' },
  { id: 'connect', label: 'Connect', short: 'Connect' },
  { id: 'next', label: 'Next steps', short: 'Next steps' }
];

// Single-choice questions. `next` can be a step id or a function of the chosen value.
export const QUESTIONS = {
  intent: {
    title: 'How would you like to work with Evolve?',
    helper: 'This helps us point you to the right kind of support.',
    options: [
      { value: 'one', label: 'Rent out my property' },
      { value: 'multi', label: 'Rent out multiple properties' },
      { value: 'buy', label: 'Buy a property to rent out' }
    ],
    next: 'type'
  },
  type: {
    title: 'What kind of property is it?',
    helper: '',
    options: [
      { value: 'home', label: 'Whole home or condo', chip: 'Whole home' },
      { value: 'room', label: 'Private room', chip: 'Private room' },
      { value: 'timeshare', label: 'Timeshare', chip: 'Timeshare' },
      { value: 'other', label: 'Something else', chip: 'Other' }
    ],
    next: 'beds'
  },
  renting: {
    title: 'Is it currently rented to guests?',
    helper: 'Either way, we’ll tailor the conversation to where you are today.',
    options: [
      { value: 'yes', label: 'Yes, it’s rented today', chip: 'Renting' },
      { value: 'no', label: 'Not yet', chip: 'Not renting yet' }
    ],
    next: (v) => (v === 'yes' ? 'manage' : 'furnish')
  },
  manage: {
    title: 'How do you manage it today?',
    helper: '',
    options: [
      { value: 'self', label: 'I manage it myself', chip: 'Self-managed' },
      { value: 'pm', label: 'I use a property manager', chip: 'Has a manager' }
    ],
    next: 'furnish'
  },
  furnish: {
    title: 'Is it furnished?',
    helper: 'This helps us understand what may be needed before guests arrive.',
    options: [
      { value: 'furnished', label: 'Furnished', chip: 'Furnished' },
      { value: 'unfurnished', label: 'Unfurnished', chip: 'Unfurnished' }
    ],
    next: 'timeline'
  },
  timeline: {
    title: 'When would you like to start?',
    helper: 'This helps your Evolve expert plan around your timing.',
    options: [
      { value: 'asap', label: 'As soon as possible', chip: 'ASAP' },
      { value: '90', label: 'Within 90 days', chip: 'Within 90 days' },
      { value: '6mo', label: 'Within 6 months', chip: 'Within 6 months' },
      { value: 'none', label: 'No firm timeframe', chip: 'No firm date' }
    ],
    next: 'contact'
  }
};

// Contextual reassurance (H4). Qualitative only: no invented statistics.
export function bannerFor(step, answers) {
  if (step === 'manage') return 'Let’s see whether your rental could perform better.';
  if (step === 'furnish') {
    if (answers.renting === 'no') return 'We’ll help you see what getting rental-ready could involve.';
    if (answers.manage === 'pm') return 'We’ll show you how Evolve approaches owner support.';
    return 'Explore what management support could take off your plate.';
  }
  return '';
}

// SAMPLE: stands in for Google Places autocomplete, which the live RFI already uses.
export const SUGGESTIONS = [
  { main: '128 Mountain View Rd', sub: 'Asheville, NC 28801', city: 'Asheville' },
  { main: '128 Mountain Laurel Dr', sub: 'Black Mountain, NC 28711', city: 'Black Mountain' },
  { main: '128 Mountainside Ct', sub: 'Weaverville, NC 28787', city: 'Weaverville' }
];

// SAMPLE: consultation times.
export const TIMES = ['9:00 AM', '11:30 AM', '2:00 PM', '4:30 PM'];

// Next four weekdays, starting tomorrow.
export function upcomingDays(from = new Date()) {
  const days = [];
  const d = new Date(from);
  while (days.length < 4) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push({
        key: d.toISOString().slice(0, 10),
        dow: d.toLocaleDateString('en-US', { weekday: 'short' }),
        num: d.getDate(),
        long: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
  }
  return days;
}

// SAMPLE answers, used only when deep-linking to a later step (?step=contact) for demos.
export const SAMPLE = {
  intent: 'one',
  type: 'home',
  beds: 3,
  addr: SUGGESTIONS[0],
  renting: 'yes',
  manage: 'self',
  furnish: 'furnished',
  timeline: '90',
  contact: { first: 'Jordan', last: 'Rivera', email: 'jordan.rivera@example.com', phone: '(828) 555-0142' }
};
