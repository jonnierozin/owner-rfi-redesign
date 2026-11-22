// Mock analytics. Events go to the console, window.__rfiEvents, and the ?debug=1 panel.
// Event names follow the measurement plan:
//   rfi_started, step_viewed, step_completed, step_error,
//   address_suggestion_selected, address_manual_entry_used,
//   profile_summary_opened, answer_edited,
//   rfi_submitted, consultation_scheduler_viewed, consultation_booked, consultation_skipped

const log = [];
const listeners = new Set();

export function track(name, props = {}) {
  const event = { name, props, at: new Date().toISOString() };
  log.push(event);
  window.__rfiEvents = log;
  // eslint-disable-next-line no-console
  console.info('[rfi]', name, props);
  listeners.forEach((fn) => fn(log.slice()));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
