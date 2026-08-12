# SOC Dashboard — Fix Buttons, Add Profile, Alignment, Color Balance, Best PCAP

## Context
The NetInspect SOC dashboard (React + TS, Figma Make export) had a full visual redesign but has several gaps: some prominent buttons do nothing, there's no analyst identity anywhere, layouts use fixed pixel widths with no responsiveness, and the user wants the "most real" network data the app can achieve. A browser cannot capture live NIC traffic, so per the user's decision we maximize the existing in-browser PCAP parsing path (real data) and keep the simulated feed as demo.

## Goals
1. Wire up the non-functional ("tool") buttons.
2. Add an analyst profile card in the sidebar footer.
3. Fix alignment and add responsive behavior.
4. Balance the color palette for consistency.
5. Make the real-PCAP upload as capable as possible.

## 1. Wire non-functional buttons
- **`AITriagePanel.tsx` "Run Full AI Triage"** (lines ~63–76): add an `onTriage` prop; pass `runAITriage` from `App.tsx` into the panel and attach it to the button's `onClick`.
- **`NavSidebar.tsx` "TOOLS" group** (Streams / PCAP Files / Settings, ~lines 107–120): add handlers.
  - "Streams" → switch to Sessions tab (reuse existing tab-switch prop).
  - "PCAP Files" → trigger the existing PCAP upload flow (`handlePcapUpload` / file input in `App.tsx`).
  - "Settings" → open `NetworkSetup` modal (reuse existing modal-open state in `App.tsx`).
- **AlertsManager toast-only actions** (View Packets / Escalate / Export): make View Packets actually select/filter the related packet(s) and switch to the packets tab; keep Escalate/Export as clearly-labeled actions (Export writes a real file where feasible).

## 2. Analyst profile (sidebar footer)
- Add a profile card at the bottom of `NavSidebar.tsx` above/around the interface-status footer: avatar, name, role, and an online status dot (reuse `live-dot` class).
- **PENDING: exact name / role / other info from the user** — insert their provided text. Until provided, use an editable constant at top of `NavSidebar.tsx` (e.g. `ANALYST = { name, role, initials }`).

## 3. Alignment & responsiveness
- Root layout `App.tsx:203` (`flex h-screen w-screen`): allow the sidebar and AI rail to collapse/stack on narrow widths (add breakpoints; hide/collapse rails under `lg`).
- Replace fixed `grid-cols-4`/`grid-cols-3` in `MetricCards.tsx`, `Statistics.tsx`, `Sessions.tsx`, `AlertsManager.tsx` with responsive variants (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, etc.).
- Header (`App.tsx:226`) single non-wrapping flex row: allow wrapping / condense buttons on small screens.
- Guard `TCPHandshake.tsx` absolute positioning with a min-width container.

## 4. Color balance
- Consolidate the palette into shared CSS custom properties in `src/styles/*` (navy scale + accents blue/cyan/green/red/purple) and reference tokens instead of scattered hex values, so accent usage is consistent across components. Reduce competing glows where several accents currently clash.

## 5. Best-possible real PCAP
- Harden `utils/pcapParser.ts` and `handlePcapUpload` (`App.tsx:95`): clear user feedback (toasts) for parse success/errors, support both PCAP and PCAPNG (already present — verify), show packet count / capture duration derived from real timestamps, and surface parse warnings. Keep everything client-side (no backend).
- Make the "PCAP Files" tool button and header upload share one code path.

## Critical files
- `src/app/App.tsx` (state, handlers, layout, header)
- `src/app/components/NavSidebar.tsx` (profile, TOOLS buttons)
- `src/app/components/AITriagePanel.tsx` (triage button)
- `src/app/components/AlertsManager.tsx` (action buttons)
- `src/app/components/{MetricCards,Statistics,Sessions,TCPHandshake}.tsx` (responsive grids)
- `src/app/utils/pcapParser.ts`, `src/app/data/packetData.ts`
- `src/styles/*` (color tokens)

## Verification
- App runs in the existing dev server (do not start manually); open the preview.
- Click every previously-dead button: Run Full AI Triage runs triage; Streams/PCAP Files/Settings each do their action.
- Upload a real `.pcap` and `.pcapng` file → packets/sessions/stats populate from real data with success toast; upload a bad file → clear error toast.
- Resize the preview from mobile to desktop → grids reflow, rails collapse, no overflow.
- Confirm profile card shows the provided name/role with status dot.
