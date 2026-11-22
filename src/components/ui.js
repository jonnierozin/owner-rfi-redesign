// Shared layout pieces: progress header, property profile, supporting cards, CTA.
import { html } from '../lib.js';
import { PHASES, formatEstimate } from '../data.js';

export const Icon = {
  back: html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>`,
  edit: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`,
  trend: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h6v6"/></svg>`,
  lock: html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
  clock: html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  pin: html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
  home: html`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>`,
  check: html`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`,
  info: html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>`
};

export function TopBar({ phase, canGoBack, onBack }) {
  const current = PHASES[phase.index];
  return html`
    <header class="topbar">
      <div class="topbar__inner">
        <button class="back" onClick=${onBack} aria-label="Back" style=${{ visibility: canGoBack ? 'visible' : 'hidden' }}>
          ${Icon.back}<span class="desktop-only">Back</span>
        </button>
        <p class="topbar__step mobile-only">Step ${phase.index + 1} of 4 · ${current.label}</p>
        <ol class="phases" aria-label=${`Progress: phase ${phase.index + 1} of 4, ${current.label}`}>
          ${PHASES.map((p, i) => {
            const fill = i < phase.index ? 100 : i === phase.index ? Math.round(phase.frac * 100) : 0;
            return html`
              <li class=${`phase ${i === phase.index ? 'is-current' : ''} ${i < phase.index ? 'is-done' : ''}`} aria-current=${i === phase.index ? 'step' : undefined}>
                <span class="phase__bar"><span class="phase__fill" style=${{ width: `${fill}%` }}></span></span>
                <span class="phase__label">${p.short}</span>
              </li>`;
          })}
        </ol>
        <p class="topbar__step desktop-only">Step ${phase.index + 1} of 4</p>
      </div>
    </header>`;
}

// A profile answer. In edit mode it becomes a button that jumps back to its step.
function ProfileChip({ chip, editing, current, large, onEdit }) {
  const cls = `chip ${large ? 'chip--lg' : ''}`;
  if (!editing) return html`<span class=${cls}>${chip.label}</span>`;
  const here = chip.step === current;
  return html`
    <button class=${`${cls} chip--edit ${here ? 'is-here' : ''}`} onClick=${() => onEdit(chip.step)}
      aria-label=${here ? `${chip.label}, on this step` : `Change ${chip.label}`} aria-current=${here ? 'step' : undefined}>
      ${chip.label}${!here && html`<span class="chip__icon">${Icon.edit}</span>`}
    </button>`;
}

export function ProfileStrip({ chips, editing, canEdit, current, onToggle, onEdit }) {
  const shown = editing ? chips : chips.slice(0, 3);
  const more = chips.length - shown.length;
  return html`
    <div class=${`profile-strip mobile-only ${editing ? 'is-editing' : ''}`} role="group" aria-label="Your property">
      ${editing && html`
        <div class="profile-strip__row">
          <p class="profile-strip__hint">Tap an answer to change it</p>
          <button class="link-btn link-btn--sm" onClick=${onToggle} aria-pressed=${true}>Done</button>
        </div>`}
      <div class="profile-strip__row">
        <div class="profile-strip__chips">
          ${shown.length === 0 && html`<span class="muted">Your property profile builds here</span>`}
          ${shown.map((c) => html`<${ProfileChip} key=${c.step} chip=${c} editing=${editing} current=${current} onEdit=${onEdit} />`)}
          ${more > 0 && html`<span class="chip">+${more}</span>`}
        </div>
        ${canEdit && !editing && html`
          <button class="icon-btn" onClick=${onToggle} aria-pressed=${false} aria-label="Edit your property answers">${Icon.edit}</button>`}
      </div>
    </div>`;
}

export function ProfileCard({ chips, editing, canEdit, current, onToggle, onEdit }) {
  return html`
    <section class=${`card profile-card ${editing ? 'is-editing' : ''}`} aria-labelledby="profile-title">
      <div class="card__head">
        <h2 id="profile-title" class="card__title">Your property</h2>
        ${canEdit && html`<button class="link-btn" onClick=${onToggle} aria-pressed=${editing}>${editing ? 'Done' : 'Edit answers'}</button>`}
      </div>
      ${editing && html`<p class="small muted-strong">Choose an answer to change it. You’ll come right back here after.</p>`}
      <div class="chips">
        ${chips.length === 0 && html`<p class="muted small">Your answers build your property profile here as you go.</p>`}
        ${chips.map((c) => html`<${ProfileChip} key=${c.step} chip=${c} editing=${editing} current=${current} large=${true} onEdit=${onEdit} />`)}
      </div>
    </section>`;
}

export function TrustBanner() {
  return html`
    <div class="trust">
      <span class="trust__icon">${Icon.home}</span>
      <p>Over 30,000 owners trust Evolve to rent out homes like yours.</p>
    </div>`;
}

export function WhyWeAsk() {
  return html`
    <section class="card" aria-labelledby="why-title">
      <h2 id="why-title" class="card__label">${Icon.lock} Why we ask for your address</h2>
      <div class="card__body stack-sm">
        <p class="small"><b>Show what it could earn</b> · based on rentals like yours nearby</p>
        <p class="small"><b>Check whether Evolve is a fit</b> · for this specific property</p>
        <p class="small"><b>Prepare your Evolve expert</b> · so your first chat starts with your property</p>
        <p class="fine divider-top">
          Your address is used to prepare your consultation and assess whether Evolve is a fit.
          It’s handled in line with Evolve’s <a href="#privacy">Privacy Policy</a>.
        </p>
      </div>
    </section>`;
}

export function WhatHappensNext() {
  return html`
    <section class="card" aria-labelledby="next-title">
      <h2 id="next-title" class="card__label">${Icon.clock} What happens next</h2>
      <ol class="card__body steps-list">
        <li><b>1 · Submit your property details</b><br />Your property profile goes to an Evolve expert</li>
        <li><b>2 · Pick a time, or we’ll reach out</b><br />Book a chat, or an expert follows up</li>
        <li><b>3 · Unlock your rental potential</b><br />How to reach it, and whether Evolve is a fit</li>
      </ol>
    </section>`;
}

export function WhereHeading() {
  return html`
    <section class="card card--pad">
      <h2 class="card__label card__label--flush">Where this is heading</h2>
      <p class="small muted-strong">A few basics about your property, then its address, and you’ll see an estimate of what it could earn as a rental.</p>
    </section>`;
}

export function RentalPotential({ beds, city }) {
  const home = beds === 0 ? 'studio' : `${beds}-bedroom home`;
  return html`
    <section class="rental" aria-labelledby="rental-title">
      <h2 id="rental-title" class="eyebrow">${Icon.trend} Rental potential</h2>
      <p class="rental__value">${formatEstimate()} <span>per year</span></p>
      <p class="small muted-strong">Estimated rental income for a ${home} in ${city}. An Evolve expert will walk you through it.</p>
    </section>`;
}

export function Cta({ label, note, legal, enabled, onClick }) {
  return html`
    <div class="cta">
      <div class="cta__row">
        <button class="btn btn--primary" aria-disabled=${!enabled} onClick=${onClick}>${label}</button>
        ${note && html`<p class="cta__note">${note}</p>`}
      </div>
      ${legal && html`<p class="cta__legal">By submitting, you agree to Evolve’s <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>`}
    </div>`;
}

export function EventLog({ events }) {
  return html`
    <aside class="event-log" aria-label="Analytics events (debug)">
      <p class="event-log__title">Mock analytics events</p>
      <ol>
        ${events.slice(-8).reverse().map((e, i) => html`<li key=${e.at + i}><b>${e.name}</b> ${Object.keys(e.props).length ? JSON.stringify(e.props) : ''}</li>`)}
      </ol>
    </aside>`;
}
