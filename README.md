# Owner RFI prototype

A working, responsive prototype of a redesigned owner Request for Information (RFI) flow for a vacation rental manager. It reframes the RFI from "fill out a sales form" to "build a property profile and see its rental potential", while collecting the same required data.

**Live prototype:** https://jonnierozin.github.io/owner-rfi-redesign/

**Prototype only:** nothing you enter is sent anywhere. Submission, the address autocomplete, the rental estimate and the consultation times are simulated.

## Run it

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 5179
```

Then open http://localhost:5179. It also works as-is on GitHub Pages, Netlify or Vercel (static).

Useful links:

- `#contact`, `#submitted`, etc. jump straight to a step, with sample answers filled in for the steps before it.
- `?debug=1` (or `#debug`) shows a live panel of the mock analytics events.

## The flow

| Phase | Steps |
| --- | --- |
| 1 · Your property | Intent → Property type → Bedrooms |
| 2 · The opportunity | Address + rental potential → Currently renting? → Management (only if renting) → Furnishing → Timeline |
| 3 · Connect | Contact details (RFI is submitted here) |
| 4 · Next steps | Submitted → optional: pick a time → booked, or skip → "we'll reach out" |

**Editing answers:** tap "Edit answers" (desktop) or the pencil (mobile) on the property profile and each answer becomes a link back to its step. After changing it, the owner returns straight to where they were. Switching "currently renting" to yes adds the management question first. Editing closes once the details are submitted.

Required data is all kept: name (first and last), email, phone, property address, property type, bedrooms, furnished, currently renting. Intent, management and timeline are kept for qualification and routing.

## What each change tests

| ID | Hypothesis | Where it shows up |
| --- | --- | --- |
| H1 | Owners drop off at the address step (30%) because they don't know why it's needed | Purpose-first heading, always-visible "Why we ask", autocomplete kept, manual entry, ZIP-only nudge, map confirmation, rental potential card |
| H2 | Owners drop off at contact (35%) because they fear an unexplained sales call | Leads with the rental estimate, "unlock it with an Evolve expert", phone helper, "What happens next", inline validation |
| H3 | Sequential questions feel like a lead form | Property profile that fills in as you answer, named phase progress |
| H4 | Generic reassurance doesn't address the owner's situation | Contextual lines on management and furnishing, based on earlier answers |
| H6 | Owners can't tell "submitted" from "booked" | Explicit "Your property details are in" before an optional booking, clear confirmation for both paths |
| H7 | "Free consultation" doesn't say what you get | Chat agenda shown before booking |

Illustrative test targets (not forecasts): address step completion 70% → 80%, contact step completion 65% → 75%. Primary metric: qualified RFI completions ÷ RFI starts, with lead quality holding steady.

## Mock analytics

Events are logged to the console and to `window.__rfiEvents`:

`rfi_started`, `step_viewed`, `step_completed`, `step_error`, `address_suggestion_selected`, `address_manual_entry_used`, `answer_edited`, `rfi_submitted`, `consultation_scheduler_viewed`, `consultation_booked`, `consultation_skipped`

## Code structure

```
index.html            Page shell (standalone hosting)
artifact.html         Same page, for publishing as a claude.ai artifact
styles.css            All styles; mobile first, two-column layout from 960px
src/lib.js            Preact + htm from a pinned CDN build (no build step)
src/data.js           Questions, copy, sample data (estimate, addresses, time slots)
src/flow.js           Step order, branching, validation, state + reducer, profile chips
src/analytics.js      Mock event tracking
src/components/ui.js  Shared pieces: progress header, profile strip/card, supporting cards, CTA
src/components/steps.js  One component per step
src/main.js           App: navigation (browser back works), CTAs, layout
```

## Sample data and open questions

- The **$42,000–$56,000** rental potential range is sample data, not an Evolve estimate. A live version would call a real estimate service, and the copy should avoid implying guaranteed earnings.
- Address suggestions are three demo addresses standing in for Google address autocomplete.
- The privacy line and the "By submitting…" consent line need Evolve's confirmed wording. The current live form says owners agree to be contacted by email, calls and texts.
- The multiple-properties and buying intents follow the same path; those branches weren't observed in the live flow.
- Consultation length, agenda and follow-up timing need Evolve to confirm before shipping.
