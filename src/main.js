import { html, render, useReducer, useEffect, useRef, useState, useMemo } from './lib.js';
import { QUESTIONS, upcomingDays, TIMES } from './data.js';
import { track, subscribe } from './analytics.js';
import {
  createState, reducer, nextStep, phaseInfo, profileChips, confirmedAddress,
  contactErrors, POST_SUBMIT
} from './flow.js';
import {
  TopBar, ProfileStrip, ProfileCard, TrustBanner, WhyWeAsk, WhatHappensNext, WhereHeading, Cta, EventLog
} from './components/ui.js';
import {
  ChoiceStep, BedsStep, AddressStep, ContactStep, SubmittedStep, ScheduleStep, BookedStep, SkippedStep
} from './components/steps.js';

const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug') || location.hash === '#debug';

// Steps live in the URL hash (#contact), so any screen can be linked to directly.
function urlFor(step) {
  return `${location.pathname}${location.search}#${step}`;
}
const startStep = (location.hash.slice(1) !== 'debug' && location.hash.slice(1)) || params.get('step') || 'intent';

function App() {
  const [s, dispatch] = useReducer(reducer, startStep, createState);
  const [events, setEvents] = useState([]);
  const histIdx = useRef(0);
  const firstView = useRef(true);
  const days = useMemo(() => upcomingDays(), []);
  const a = s.answers;
  const addr = confirmedAddress(a);
  const city = addr ? addr.city : 'your area';

  // ---- Navigation (browser back/forward aware) ----
  const go = (step, opts = {}) => {
    track('step_completed', { step_id: s.step });
    histIdx.current += 1;
    history.pushState({ step, idx: histIdx.current }, '', urlFor(step));
    dispatch({ type: 'go', step, returnTo: opts.returnTo });
  };

  // Leaving a step: normally go to the next one, but after editing an earlier
  // answer from the profile, jump straight back to where the owner was.
  const advance = (from, natural, answersAfter) => {
    const back = s.returnTo;
    if (back && back !== from) {
      // Switching to "Yes, it's rented" adds the management question.
      if (from === 'renting' && answersAfter.renting === 'yes' && !answersAfter.manage) return go('manage');
      return go(back, { returnTo: null });
    }
    return go(natural, { returnTo: null });
  };

  const editStep = (step) => {
    if (step === s.step) { dispatch({ type: 'editing', value: false }); return; }
    track('answer_edited', { step_id: step, from_step: s.step });
    go(step, { returnTo: s.returnTo || s.step });
  };
  const toggleEditing = () => {
    if (!s.editing) track('profile_summary_opened', { step_id: s.step });
    dispatch({ type: 'editing', value: !s.editing });
  };

  const back = () => {
    if (history.state && history.state.idx > 0) { history.back(); return; }
    const prev = s.visited[s.visited.length - 1];
    if (!prev) return;
    history.replaceState({ step: prev, idx: 0 }, '', urlFor(prev));
    dispatch({ type: 'restore', step: prev });
  };

  useEffect(() => {
    history.replaceState({ step: s.step, idx: 0 }, '', urlFor(s.step));
    track('rfi_started', { entry_step: s.step });
    const onPop = (e) => {
      const target = (e.state && e.state.step) || 'intent';
      histIdx.current = (e.state && e.state.idx) || 0;
      dispatch({ type: 'restore', step: target });
    };
    window.addEventListener('popstate', onPop);
    const unsub = DEBUG ? subscribe(setEvents) : () => {};
    return () => { window.removeEventListener('popstate', onPop); unsub(); };
  }, []);

  // Once submitted, don't let browser-back land on the form again.
  useEffect(() => {
    if (s.submitted && !POST_SUBMIT.includes(s.step)) {
      history.pushState({ step: 'submitted', idx: ++histIdx.current }, '', urlFor('submitted'));
      dispatch({ type: 'go', step: 'submitted' });
    }
  }, [s.step, s.submitted]);

  // Track views and move focus to the new step's heading for screen readers.
  useEffect(() => {
    track('step_viewed', { step_id: s.step });
    if (s.step === 'schedule') track('consultation_scheduler_viewed', {});
    if (firstView.current) { firstView.current = false; return; }
    window.scrollTo({ top: 0 });
    const h = document.getElementById('step-title');
    if (h) h.focus({ preventScroll: true });
  }, [s.step]);

  // ---- Step handlers ----
  const pick = (step, value) => {
    if (a[step] && a[step] !== value) track('answer_edited', { step_id: step });
    dispatch({ type: 'answer', patch: { [step]: value } });
    const next = typeof QUESTIONS[step].next === 'function' ? QUESTIONS[step].next(value) : QUESTIONS[step].next;
    setTimeout(() => advance(step, next, { ...a, [step]: value }), 220);
  };

  const errors = contactErrors(s.contact);
  const contactOk = !Object.values(errors).some(Boolean);
  const show = {
    first: s.tried || s.touched.first,
    last: s.tried || s.touched.last,
    email: s.tried || s.touched.email,
    phone: s.tried || s.touched.phone
  };

  const slotText = s.slot.day !== null && s.slot.time !== null ? `${days[s.slot.day].long} · ${TIMES[s.slot.time]}` : '';

  // True while the owner is changing an earlier answer from "Edit answers".
  const isEditingPast = !!s.returnTo && s.returnTo !== s.step;

  let cta = null;
  if (s.step === 'beds') {
    cta = { label: 'See rental potential', note: 'Next: add your address to see it', enabled: true,
      onClick: () => { dispatch({ type: 'answer', patch: { bedsSet: true } }); advance('beds', 'address', a); } };
  }
  if (s.step === 'address') {
    cta = { label: 'Continue to unlock it', note: 'Next: how it’s rented today', enabled: !!addr,
      onClick: () => {
        if (!addr) { track('step_error', { step_id: 'address', error_type: 'no_address' }); return; }
        if (addr.manual) track('address_manual_entry_used', {});
        dispatch({ type: 'answer', patch: { addr } });
        advance('address', 'renting', a);
      } };
  }
  if (s.step === 'contact') {
    cta = { label: 'Submit property details', note: 'Next: choose a time, or we’ll reach out', legal: true, enabled: contactOk,
      onClick: () => {
        if (!contactOk) {
          dispatch({ type: 'tried' });
          Object.entries(errors).filter(([, v]) => v).forEach(([field]) => track('step_error', { step_id: 'contact', error_type: `invalid_${field}` }));
          const firstBad = ['first', 'last', 'email', 'phone'].find((f) => errors[f]);
          const el = document.getElementById(`c-${firstBad}`);
          if (el) el.focus();
          return;
        }
        track('rfi_submitted', { renting: a.renting, intent: a.intent });
        go('submitted');
      } };
  }
  if (s.step === 'schedule') {
    const ok = s.slot.day !== null && s.slot.time !== null;
    cta = { label: 'Book this time', note: 'Your property details are already submitted.', enabled: ok,
      onClick: () => { if (ok) { track('consultation_booked', {}); go('booked'); } } };
  }
  if (cta && isEditingPast && (s.step === 'beds' || s.step === 'address')) {
    cta = { ...cta, label: 'Save and go back', note: 'You’ll return to where you were' };
  }

  let content;
  if (QUESTIONS[s.step]) content = html`<${ChoiceStep} step=${s.step} answers=${a} onPick=${pick} />`;
  else if (s.step === 'beds') content = html`<${BedsStep} beds=${a.beds} onChange=${(beds) => dispatch({ type: 'answer', patch: { beds } })} />`;
  else if (s.step === 'address') content = html`<${AddressStep} answers=${a} addr=${addr} beds=${a.beds} dispatch=${dispatch}
      onSuggestion=${(sug) => { track('address_suggestion_selected', {}); dispatch({ type: 'answer', patch: { addr: sug, query: sug.main } }); }} />`;
  else if (s.step === 'contact') content = html`<${ContactStep} contact=${s.contact} errors=${errors} show=${show} city=${city} dispatch=${dispatch} />`;
  else if (s.step === 'submitted') content = html`<${SubmittedStep} city=${city} onSchedule=${() => go('schedule')} onSkip=${() => { track('consultation_skipped', {}); go('skipped'); }} />`;
  else if (s.step === 'schedule') content = html`<${ScheduleStep} days=${days} slot=${s.slot} onSlot=${(patch) => dispatch({ type: 'slot', patch })} />`;
  else if (s.step === 'booked') content = html`<${BookedStep} slotText=${slotText} city=${city} onChange=${() => go('schedule')} />`;
  else if (s.step === 'skipped') content = html`<${SkippedStep} onSchedule=${() => go('schedule')} />`;

  const supporting =
    s.step === 'address' ? html`<${WhyWeAsk} />` :
    s.step === 'contact' ? html`<${WhatHappensNext} />` :
    ['intent', 'type', 'beds'].includes(s.step) ? html`<${WhereHeading} />` : null;

  const chips = profileChips(s);
  const phase = phaseInfo(s.step, a);
  const canGoBack = s.visited.length > 0 && (!s.submitted || s.step === 'schedule');
  const mobileTrust = ['intent', 'type', 'beds', 'contact'].includes(s.step);
  // Answers can be edited until the details are submitted.
  const canEdit = !s.submitted && chips.length > 0;

  return html`
    <div class="app">
      <p class="proto-bar">Concept prototype for a case study · nothing you enter is sent or saved</p>
      <${TopBar} phase=${phase} canGoBack=${canGoBack} onBack=${back} />
      <div class="layout">
        <main class="main" key=${s.step}>
          ${s.step !== 'intent' && html`<${ProfileStrip} chips=${chips} editing=${s.editing} canEdit=${canEdit}
              current=${s.step} onToggle=${toggleEditing} onEdit=${editStep} />`}
          <div class="main__content">
            ${isEditingPast && !s.submitted && html`
              <p class="edit-notice" role="status">Changing an earlier answer. You’ll go right back to where you were after.</p>`}
            ${content}
            ${supporting && html`<div class="mobile-only">${supporting}</div>`}
            ${mobileTrust && html`<div class="mobile-only"><${TrustBanner} /></div>`}
          </div>
          ${cta && html`<${Cta} ...${cta} />`}
        </main>
        <aside class="aside desktop-only" aria-label="About your property">
          <${ProfileCard} chips=${chips} editing=${s.editing} canEdit=${canEdit}
            current=${s.step} onToggle=${toggleEditing} onEdit=${editStep} />
          ${supporting}
          <${TrustBanner} />
        </aside>
      </div>
      ${DEBUG && html`<${EventLog} events=${events} />`}
    </div>`;
}

render(html`<${App} />`, document.getElementById('root'));
