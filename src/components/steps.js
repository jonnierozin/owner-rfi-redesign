// One component per step. Each renders only the main task; layout lives in main.js.
import { html } from '../lib.js';
import { QUESTIONS, SUGGESTIONS, TIMES, bannerFor, formatEstimate } from '../data.js';
import { Icon, RentalPotential } from './ui.js';
import { isZipOnly, formatPhone } from '../flow.js';

const Title = ({ children }) => html`<h1 id="step-title" class="title" tabindex="-1">${children}</h1>`;

// ---- Single-choice questions (intent, type, renting, manage, furnish, timeline) ----
export function ChoiceStep({ step, answers, onPick }) {
  const q = QUESTIONS[step];
  const banner = bannerFor(step, answers);
  return html`
    <div class="stack">
      <div class="stack-sm">
        <${Title}>${q.title}<//>
        ${q.helper && html`<p class="lede">${q.helper}</p>`}
      </div>
      ${banner && html`<p class="banner" role="status">${Icon.trend}<span>${banner}</span></p>`}
      <fieldset class="options" aria-labelledby="step-title">
        ${q.options.map((o) => {
          const checked = answers[step] === o.value;
          return html`
            <label class=${`option ${checked ? 'is-selected' : ''}`} key=${o.value}>
              <input type="radio" name=${step} value=${o.value} checked=${checked}
                onChange=${() => onPick(step, o.value)} />
              <span class="option__label">${o.label}</span>
              <span class="option__dot" aria-hidden="true"></span>
            </label>`;
        })}
      </fieldset>
    </div>`;
}

// ---- Bedrooms ----
export function BedsStep({ beds, onChange }) {
  return html`
    <div class="stack">
      <div class="stack-sm">
        <${Title}>How many bedrooms?<//>
        <p class="lede">Bedroom count is one of the biggest drivers of what a rental can earn.</p>
      </div>
      <div class="stepper">
        <button class="stepper__btn" aria-label="Fewer bedrooms" onClick=${() => onChange(Math.max(0, beds - 1))} disabled=${beds === 0}>−</button>
        <div class="stepper__value" aria-live="polite">
          <span class="stepper__num">${beds === 0 ? 'Studio' : beds}</span>
          <span class="stepper__unit">${beds === 0 ? 'no separate bedroom' : beds === 1 ? 'bedroom' : 'bedrooms'}</span>
        </div>
        <button class="stepper__btn" aria-label="More bedrooms" onClick=${() => onChange(Math.min(12, beds + 1))} disabled=${beds === 12}>+</button>
      </div>
    </div>`;
}

// ---- Address (H1) ----
function MapCard({ addr, onChange }) {
  return html`
    <div class="map-card">
      <div class="map-card__map">
        <svg width="100%" height="100%" viewBox="0 0 358 150" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map with a pin on the selected property">
          <rect width="358" height="150" fill="#E6EFEA"/>
          <rect x="18" y="10" width="78" height="46" rx="8" fill="#CFE6D3"/>
          <rect x="252" y="12" width="90" height="44" rx="8" fill="#CFE6D3"/>
          <path d="M-10 128 C 60 108, 110 146, 186 122 S 300 100, 370 114" stroke="#BCDDE6" stroke-width="16" fill="none"/>
          <path d="M0 36 L358 50" stroke="#F7FAFA" stroke-width="5"/>
          <path d="M0 78 H358" stroke="#FDFEFE" stroke-width="11"/>
          <path d="M118 0 V150" stroke="#FDFEFE" stroke-width="9"/>
          <path d="M240 0 L214 150" stroke="#FDFEFE" stroke-width="9"/>
          <path d="M150 0 V78 M300 56 V150 M60 78 V150 M0 104 H118" stroke="#F7FAFA" stroke-width="4"/>
          <rect x="168" y="54" width="22" height="16" rx="2" fill="#9FC3C8"/>
          <ellipse cx="179" cy="72" rx="14" ry="5" fill="#093F45" opacity="0.18"/>
          <path d="M179 70 C 171 60 164 52 164 42 A 15 15 0 0 1 194 42 C 194 52 187 60 179 70 Z" fill="#C0443A"/>
          <circle cx="179" cy="42" r="6" fill="#FDFEFE"/>
        </svg>
        <span class="map-card__tag">Illustrative map</span>
      </div>
      <div class="map-card__body">
        <div>
          <p class="map-card__main">${addr.main}</p>
          <p class="small muted-strong">${addr.sub}</p>
        </div>
        <button class="link-btn" onClick=${onChange}>Change</button>
      </div>
    </div>`;
}

function Field({ id, label, optional, error, help, children }) {
  return html`
    <div class="field">
      <label for=${id}>${label}${optional && html` <span class="optional">(optional)</span>`}</label>
      ${children}
      ${error && html`<p class="field__error" id=${`${id}-err`}>${error}</p>`}
      ${help && html`<p class="field__help" id=${`${id}-help`}>${help}</p>`}
    </div>`;
}

export function AddressStep({ answers, addr, beds, dispatch, onSuggestion }) {
  const q = answers.query || '';
  const trimmed = q.trim();
  const zipOnly = !addr && isZipOnly(trimmed);
  const showSuggestions = !addr && !answers.manualMode && trimmed.length >= 3 && !zipOnly;
  const lower = q.toLowerCase();
  const m = answers.manual;
  const setManual = (patch) => dispatch({ type: 'manual', patch });

  if (addr) {
    return html`
      <div class="stack">
        <h1 id="step-title" class="field-title" tabindex="-1">Property address</h1>
        <${MapCard} addr=${addr} onChange=${() => dispatch({ type: 'answer', patch: { addr: null, query: '', manualMode: false } })} />
        <p class="saved">${Icon.check} Saved to your property profile</p>
        <${RentalPotential} beds=${beds} city=${addr.city} />
      </div>`;
  }

  return html`
    <div class="stack">
      <div class="stack-sm">
        <${Title}>Let’s explore your local rental market<//>
        <p class="lede">Your property’s location helps Evolve understand the market around it and assess whether it’s a good fit.</p>
      </div>

      ${!answers.manualMode && html`
        <div class="field">
          <label for="addr">Property address</label>
          <div class="input-icon">
            <span class="input-icon__icon">${Icon.pin}</span>
            <input id="addr" class=${`input input--hero ${trimmed ? 'is-active' : ''}`} type="text" autocomplete="street-address"
              placeholder="Start typing the street address" value=${q}
              aria-autocomplete="list" aria-controls="addr-list" aria-expanded=${showSuggestions}
              onInput=${(e) => dispatch({ type: 'answer', patch: { query: e.target.value, addr: null } })} />
          </div>
          ${zipOnly && html`
            <p class="hint" role="status">${Icon.info}<span>Got the ZIP code. Add the street address so your Evolve expert can look at this specific property.</span></p>`}
          ${showSuggestions && html`
            <div class="suggestions" id="addr-list" role="listbox" aria-label="Address suggestions">
              ${SUGGESTIONS.map((s) => {
                const match = s.main.toLowerCase().startsWith(lower);
                return html`
                  <button role="option" class="suggestion" key=${s.main} onClick=${() => onSuggestion(s)}>
                    <span class="suggestion__pin">${Icon.pin}</span>
                    <span><span class="suggestion__main">${match ? html`<b>${s.main.slice(0, q.length)}</b>${s.main.slice(q.length)}` : s.main}</span>
                    <span class="suggestion__sub">${s.sub}</span></span>
                  </button>`;
              })}
              <p class="suggestions__demo">Demo suggestions. The live RFI uses Google address autocomplete.</p>
              <button class="suggestion suggestion--manual" onClick=${() => dispatch({ type: 'answer', patch: { manualMode: true } })}>Don’t see it? Enter the address manually</button>
            </div>`}
          ${!showSuggestions && html`
            <button class="link-btn self-start" onClick=${() => dispatch({ type: 'answer', patch: { manualMode: true } })}>Enter the address manually</button>`}
        </div>`}

      ${answers.manualMode && html`
        <div class="manual-grid">
          <div class="manual-grid__street"><${Field} id="m-street" label="Street address"><input id="m-street" class="input" autocomplete="address-line1" value=${m.street} onInput=${(e) => setManual({ street: e.target.value })} /><//></div>
          <${Field} id="m-unit" label="Apt, suite or unit" optional=${true}><input id="m-unit" class="input" autocomplete="address-line2" value=${m.unit} onInput=${(e) => setManual({ unit: e.target.value })} /><//>
          <${Field} id="m-city" label="City"><input id="m-city" class="input" autocomplete="address-level2" value=${m.city} onInput=${(e) => setManual({ city: e.target.value })} /><//>
          <${Field} id="m-state" label="State"><input id="m-state" class="input" autocomplete="address-level1" maxlength="2" placeholder="NC" value=${m.state} onInput=${(e) => setManual({ state: e.target.value })} /><//>
          <${Field} id="m-zip" label="ZIP code"><input id="m-zip" class="input" inputmode="numeric" autocomplete="postal-code" maxlength="5" value=${m.zip} onInput=${(e) => setManual({ zip: e.target.value.replace(/\D/g, '') })} /><//>
          <button class="link-btn self-start" onClick=${() => dispatch({ type: 'answer', patch: { manualMode: false } })}>Search for the address instead</button>
        </div>`}
    </div>`;
}

// ---- Contact (H2) ----
export function ContactStep({ contact, errors, show, city, dispatch, quick, onFullFlow }) {
  const input = (id, field, extra = {}) => html`
    <input id=${id} class=${`input ${show[field] && errors[field] ? 'is-error' : ''} ${!errors[field] ? 'is-valid' : ''}`}
      value=${contact[field]} aria-invalid=${!!(show[field] && errors[field])}
      aria-describedby=${[show[field] && errors[field] ? `${id}-err` : '', extra.help ? `${id}-help` : ''].filter(Boolean).join(' ') || undefined}
      onInput=${(e) => dispatch({ type: 'contact', patch: { [field]: field === 'phone' ? formatPhone(e.target.value) : e.target.value } })}
      onBlur=${() => dispatch({ type: 'touch', field })}
      ...${extra.attrs || {}} />`;
  return html`
    <div class="stack">
      ${quick ? html`
        <div class="stack-sm">
          <${Title}>Talk to an Evolve expert<//>
          <p class="lede">Leave your details and an expert will reach out. You can share your property details on the call.</p>
          <button class="link-btn self-start" onClick=${onFullFlow}>Or see your property’s rental potential first</button>
        </div>` : html`
        <div class="stack-sm">
          <p class="eyebrow">${Icon.trend} Your rental potential</p>
          <h1 id="step-title" class="title title--number" tabindex="-1">${formatEstimate()} <span>per year</span></h1>
          <p class="lede">Unlock it by chatting with an Evolve expert. Submit your property details and they’ll show you how your ${city} home could get there.</p>
        </div>`}
      <div class="contact-grid">
        <${Field} id="c-first" label="First name" error=${show.first && errors.first}>${input('c-first', 'first', { attrs: { autocomplete: 'given-name' } })}<//>
        <${Field} id="c-last" label="Last name" error=${show.last && errors.last}>${input('c-last', 'last', { attrs: { autocomplete: 'family-name' } })}<//>
        <${Field} id="c-email" label="Email" error=${show.email && errors.email}>${input('c-email', 'email', { attrs: { type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'name@example.com' } })}<//>
        <${Field} id="c-phone" label="Phone" error=${show.phone && errors.phone} help="So your Evolve expert can reach you to talk it through.">${input('c-phone', 'phone', { help: true, attrs: { type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: '(555) 555-5555' } })}<//>
      </div>
    </div>`;
}

// ---- After submit (H6 / H7) ----
const Done = ({ title, children }) => html`
  <div class="stack-sm">
    <span class="done-badge">${Icon.check}</span>
    <${Title}>${title}<//>
    <p class="lede">${children}</p>
  </div>`;

const doneLead = (quick) => (quick ? 'Your call request is in' : 'Your property details are in');

export function SubmittedStep({ city, quick, onSchedule, onSkip }) {
  return html`
    <div class="stack">
      <${Done} title=${doneLead(quick)}>${quick
        ? 'An Evolve expert will reach out using the details you shared.'
        : `An Evolve expert will review your ${city} property before you talk. Nothing else is required from you.`}<//>
      <section class="chat-card" aria-labelledby="chat-title">
        <h2 id="chat-title" class="chat-card__title">Want to talk sooner? Pick a time.</h2>
        <p class="eyebrow eyebrow--plain">What you’ll cover</p>
        <ul class="chat-card__list">
          <li>Your property’s rental potential</li>
          <li>How Evolve would rent and manage it</li>
          <li>Whether Evolve is the right fit</li>
        </ul>
        <div class="chat-card__actions">
          <button class="btn btn--primary" onClick=${onSchedule}>Choose a time</button>
          <button class="link-btn" onClick=${onSkip}>I’ll wait for an expert to reach out</button>
        </div>
      </section>
    </div>`;
}

export function ScheduleStep({ days, slot, onSlot }) {
  return html`
    <div class="stack">
      <div class="stack-sm">
        <${Title}>Pick a time to chat<//>
        <p class="lede">You’ll talk through your property’s rental potential with an Evolve expert. Times are in your local time.</p>
      </div>
      <fieldset class="slots">
        <legend>Day</legend>
        <div class="slots__grid slots__grid--days">
          ${days.map((d, i) => html`
            <label class=${`slot ${slot.day === i ? 'is-selected' : ''}`} key=${d.key}>
              <input type="radio" name="day" checked=${slot.day === i} onChange=${() => onSlot({ day: i })} />
              <span class="slot__dow">${d.dow}</span><span class="slot__num">${d.num}</span>
            </label>`)}
        </div>
      </fieldset>
      <fieldset class="slots">
        <legend>Time</legend>
        <div class="slots__grid">
          ${TIMES.map((t, i) => html`
            <label class=${`slot slot--time ${slot.time === i ? 'is-selected' : ''}`} key=${t}>
              <input type="radio" name="time" checked=${slot.time === i} onChange=${() => onSlot({ time: i })} />
              <span>${t}</span>
            </label>`)}
        </div>
      </fieldset>
    </div>`;
}

export function BookedStep({ slotText, city, quick, onChange }) {
  return html`
    <div class="stack">
      <${Done} title="You’re booked">${doneLead(quick)}, and your chat with an Evolve expert is set.<//>
      <div class="card card--pad booked">
        <p class="eyebrow eyebrow--plain">Your chat</p>
        <p class="booked__time">${slotText}</p>
        <p class="small muted-strong">${quick ? 'Your property and how Evolve could help' : `Rental potential for your ${city} property`}</p>
      </div>
      <button class="link-btn self-start" onClick=${onChange}>Change time</button>
    </div>`;
}

export function SkippedStep({ quick, onSchedule }) {
  return html`
    <div class="stack">
      <${Done} title="You’re all set">${doneLead(quick)}. An Evolve expert will reach out using the contact details you shared.<//>
      <div class="soft-card">
        <p>Changed your mind? You can still pick a time that works for you.</p>
        <button class="btn btn--secondary" onClick=${onSchedule}>Choose a time</button>
      </div>
    </div>`;
}
