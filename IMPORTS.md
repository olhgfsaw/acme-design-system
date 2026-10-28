# Design imports from Claude Design

Log written by `/import-design`. Newest first. One entry per import.

<!--
## 2026-10-21 — design-import/2026-10-21/
- Source: https://claude.ai/artifact/… (or the export file)
- Applied: …
- Snaps: `#3B82F6 → primary`, `13px → 3 (12px)` …
- Not applied: … (why)
- Frames: added …, changed … (approved: … — needs the client again)
-->

## 2026-10-28 — design-import/2026-10-28/ (stages 3–8 of 8: the rest of the product)
- Source: same design, artboards Clients, Client, NewClient, Projects, Project, NewProject, ProjectBoard, Finance, Invoice, NewInvoice, Team, Member, InviteMember, Calendar, Settings, Login, Me, MyTime, Account, AccountSecurity, AccountNotifications, AccountCalendar, AccountCapture, EmpProjects, EmpProject, EmpBoard, EmpCalendar, EmpTeam. All 34 artboards are now imported.
- Applied:
  - Screens (draft): Clients (list, client, new client) · Projects (board, list, project, project board, new project) · Finance (overview, invoice, record payment, new invoice) · Team (list, member, assign to project, invite) · Calendar (+ new event) · Settings (General, Integrations, Disconnect Google Calendar, Project stages) · Sign in (sign in, wrong password, forgot password, reset link sent, accept invite) · My space for team members (My work, Time and time off, request time off, My projects, project, board, calendar, team, Account: profile, sign-in and security, notifications, my calendar, capture).
  - My space reuses the admin project, board, calendar and team templates with `member: true` (no finance, no invites, links stay in My space); `appChrome(member=true)` renders the member chrome (`layouts/_space-chrome.njk`).
  - New components (draft): RecordCell, AvatarGroup, BudgetBar, FileDropzone, FileRow, FormSection, TaskSummary, EventRow, CoverSwatches, CoverPicker, ProjectCard, ProjectBoard, TaskCard, TaskQuickAdd, TaskBoard, StageEditor, StatusMenu, BarChart, InvoiceDocument, MemberCard, EmailPreview, StepList, CalendarGrid, DateTile, DeadlineRow, CodeTag, SpaceNav, AuthLayout, TextDivider, PasswordRules, TimeTracker, TimesheetGrid, NotificationMatrix.
  - Changed components (every use changes): BaseAvatar sizes up to `xl`; BaseInput `filter` variant; BaseButton `href`, `pressed`; BaseCheckbox `aside`, `appearance: card`, `swatch`; BaseSwitch `aside`, `locked`; BaseSegmented avatars; BaseTabs `panel`; ToastMessage `actionHref`; ProjectCover `header` size; PageHeader crumbs, avatar, badge, cover, lead; DataTable cell kinds and row class; StageTracker `label`; StageEditor `dates`, `reorder`; LineItemEditor `removable`; EventRow tones for the calendar (meetings, deadlines, finance); ProjectCard `stats`; TopBar `context` chip.
  - Data: client (status, money, contacts, billing), project (budget, team, dates, billing), task (tag, priority, subtasks, comments), meeting; new contracts invoice, file, payment, workspace, invite, calendar-event, integration, sync-event, timesheet, notification, session, capture; statuses clientStatus, invoiceStatus, paymentMethod, discipline, inviteStatus, eventCalendar, deadlineRisk, syncResult, timesheetStatus, notificationKind, captureStatus; glossary month and weekday names.
- Snaps: calendar side column 320 → 384 px; time-off tone neutral → warning (the same tone as everywhere else); My space chip 13 → 12 px; SpaceNav 232 → 240 px; sign-in column 400 → 384 px; timer 40 → 36 px; event time column 76 → 80 px; Settings two-column layouts start at xl.
- Not applied:
  - Month calendar as `role="grid"` without rows → a real table with weekday headers; the "+2 more" popover, month switching and syncing are Nuxt behavior.
  - Open panels shown as their own frames (new event, request time off, disconnect confirmation, add task) instead of toggles.
  - Faded rows (opacity) for switches that need another switch first → disabled switches; text stays readable.
  - Telegram "linked" state and live code countdown: only the linking steps are shown.
  - Google and other brand icons: Lucide has no brand marks; buttons say the name.
  - The timesheet and the "My recent captures" table become cards below lg instead of scrolling sideways; the captures' Sent column moved under the title.
  - Event times are formatted in the time zone of the machine that builds the canvas.
- Frames: added clients, client, client-new, projects, projects-list, project, project-board, project-new, finance, invoice, invoice-payment, invoice-new, team, member, member-assign, invite-member, calendar, calendar-new-event, settings, settings-integrations, settings-disconnect, settings-stages, sign-in, sign-in-error, forgot-password, reset-sent, accept-invite, me, my-time, my-time-off, my-projects, my-project, my-board, my-calendar, my-team, account, account-security, account-notifications, account-calendar, account-capture. No approved frames changed.

## 2026-10-28 — design-import/2026-10-28/ (stage 2 of 8: Inbox)
- Source: same design, artboards Inbox, Proposal, QuickCapture, TelegramBot, CaptureButton.
- Applied:
  - Screens (draft): Inbox · pending (states loading, empty, no-results, error, stress), Inbox · approved, Inbox · rejected, Proposal · new invoice / record payment / needs an answer / conflict (loading, error; stress on the first). Shared chrome moved to `layouts/_app-chrome.njk`; the dashboard uses it and counts only pending proposals.
  - New components (draft): DataTable, ProposalRow, FiltersToolbar, BulkActionBar, ToastMessage, ProvenanceMark, ProvenanceLegend, ProvenanceField, MatchedValue, LineItemEditor, InvoiceTotals, ChangeSummary, RadioCards, ValueCompare, VoicePlayer, SourceQuote, FilePreview, ActivityList, InlineAlert, DetailList, InlinePanel.
  - Changed components: BaseInput and BaseSelect get `attention` (guessed value) and `missing` variants; BaseButton gets `ariaLabel`, `haspopup`, `expanded`, `describedby`.
  - Data: proposal gets status, kind, check detail and the decision; new proposal-review contract (fields with provenance, lines, changes, choices, conflict, source, activity); statuses proposalStatus, proposalCheck conflict / unreadable, proposalSource calendar.
- Renamed: FillMenu → BaseDropdown inside ProposalRow; the design's activity list → ActivityList (ActivityTimeline in patterns.md is the larger pattern with a line and icons).
- Snaps: quote border 3 → 4 px; thumbnail column 88 px kept via the spacing scale in a grid template; line-item columns 72 / 132 / 116 → 80 / 128 / 112 px; provenance mark text 11 → 12 px.
- Not applied:
  - Quick capture, open as a full-page frame: the open panel covers the page, so text under it can't be contrast-checked. The open states live on the CaptureButton matrix.
  - Telegram bot: it is Telegram's interface, not this product's.
  - Tables on phones and tablets show rows as cards (data-mobile-view="cards") instead of scrolling sideways.
  - The proposal "done" card, recording timer, playback, undo toast timing and filter behavior: static here, Nuxt behavior.
- Frames: added inbox, inbox-approved, inbox-rejected, proposal-create, proposal-update, proposal-duplicate, proposal-conflict; dashboard-overview changed (shared chrome, pending count).

## 2026-10-28 — design-import/2026-10-28/ (stage 1 of 8)
- Source: https://claude.ai/artifact/JtvjNW5danUWAVZHs6XcmE#page-dcb81aee8d83 (version 1793194370-9e63) — 34 artboards, platform.css, built on the published Acme system. Imported in stages; this stage: shared foundation + Dashboard. Next: Inbox → Clients → Projects → Finance → Team → Calendar and Settings → Sign in and employee space.
- Applied:
  - Dashboard: pinned project (cover, stage bar, next tasks, Open board) replaces the promo; Inbox card across the bottom; Team workload replaces Team performance; card headers link to their section; top bar gets Capture and the account menu; Inbox count on the rail; actions are links.
  - New components (draft): BaseTextarea, BaseSelect, BaseCheckbox, BaseSwitch, BaseTabs, BaseSegmented, Breadcrumbs, BaseDropdown, UserMenu, ProjectCover, StageTracker, TaskList, PinnedProject, InboxCard, CaptureButton.
  - Changed components (every use changes): BaseButton and BaseIconButton render links with `href`; BaseIconButton announces a popup (`haspopup`, `expanded`); BaseAvatar size `xs`; IconTile size `sm`; NavRail item `count`; BaseCard `actionHref` / `actionLabel`; CountdownTimer 60 → 48 px.
  - Data: referenceDate → 2026-10-28; project gets stage, cover, due date, pinned, opened; new task and proposal contracts; team member workload replaces performance; client company; revenue May–Oct 2026; statuses projectStage, taskStatus, proposalSource, proposalAction, proposalCheck.
- Renamed to the base-set names: FormTextarea → BaseTextarea, FormSelect → BaseSelect.
- Snaps: countdown 52 → text-5xl (48); cover height 168 → h-40 (160); cover strip 88 / 112 → h-24 (96); monogram 28 → text-3xl (30); stage dot ring 5 → 4 px; checkbox 18 → size-4 (16), corner 5 → rounded-xs (2); task rows 10 → 12 px; avatar 28 → size-7 (28, text 11 → 12).
- Not applied:
  - CSS-gradient cover patterns → drawn in SVG from the same tokens; on grid, rings and stripes the monogram sits on a surface chip (the dark-theme tone backgrounds are translucent, so text over the pattern can't be checked).
  - Behavior (open / close menus and capture, unpin with undo, recording timer, series toggles) — static states here, Reka in Nuxt.
  - Nav links point to sections that are not imported yet (`#inbox`, `#clients` …).
- Frames: changed dashboard-overview (draft); added 15 component matrices.

## 2026-10-21 — design-import/2026-10-21-2/
- Source: Dashboard Overview https://claude.ai/artifact/JtvjNW5danUWAVZHs6XcmE#artboard-15dd8cd198dd (Main.dc.html; built on the old Acme system, mapped by value).
- Applied:
  - Screen `pages/dashboard/overview.njk`, frame `dashboard-overview` (draft) with states loading, empty, error, stress; 1440 and 390.
  - Data contracts (draft): revenue-month, project, team-member, client, meeting — schemas + six scenarios each; statuses `projectStatus`, `projectHealth`; glossary terms and short month names.
  - New components (draft): BaseSkeleton, EmptyState, ErrorState. AreaChart takes `currency` for its hidden data table.
  - Layout: 4 : 3 : 3 : 3 grid at xl (promo across two rows, revenue across two columns), 2 columns at md, 1 column on phones in reading order.
- Snaps: "$284.5K" → full money "$284,500.00" (no compact money filter); chart months Jan–Jun → the six months before referenceDate (Aug–Jan); highlighted chart point → the latest month (the design tagged April); gauge and lists count real fixture records (design: 23 / 13 / 3 / 3).
- Not applied:
  - Title Case copy → sentence case.
  - Logo image and promo illustration (`/_blob/…`) — no image files; brand as text.
  - Outer frame rim and the `theme` / `showPromo` canvas switches (theme is the canvas toggle; dismissing the promo is behavior for Nuxt).
  - Mobile reordering from the design (side cards above team) — DOM order kept so tab order matches what is seen.
- Frames: added dashboard-overview; added skeleton, empty-state, error-state matrices.

## 2026-10-21 — design-import/2026-10-21/
- Source: Acme design system https://claude.ai/artifact/KVDtSnxpyMvVjunsCp9tL9 (README, tokens.json, 25 component READMEs, index.d.ts, bundle.css). Brought in before the first publish so nothing live is lost.
- Applied:
  - Tokens: new accent group `accent`, `accent-strong`, `accent-subtle`, `on-accent` (Acme amber 400 / 600 / 200, on-amber); palette `accent-200…950`. Dark theme: primary flips to near-white with dark text, as in Acme.
  - Changed components (every use changes): BaseButton (pill, no shadow, sm 36 / md 48 / lg 56 px), BaseIconButton (round; new variants muted, surface, primary; `dot`), BaseBadge (tone `accent`, size `md`, `iconName`), BaseInput (variant `search`, size `lg`, `iconLeading`).
  - New components (draft): AppShell, TopBar, NavRail, PageHeader, BaseCard, StatBlock, AreaChart, GaugeChart, ChartLegend, LegendToggle, ProgressBar, MeterBar, CountdownTimer, ValueTag, IconTile, ProjectItem, BaseAvatar, AvatarStack, PromoCard, HelpCallout. Acme `Icon` = the `icon()` helper (all 27 icons are Lucide).
  - Renamed to multi-word Vue names: Card → BaseCard, Stat → StatBlock, Gauge → GaugeChart, Legend → ChartLegend, Countdown → CountdownTimer, Avatar → BaseAvatar.
- Snaps: type 40 → text-4xl (36), 32 → text-3xl (30), 56 → text-6xl (60), 13 → text-sm (14), 11 / 12.5 → text-xs (12); control-lg 54 → h-14 (56); toggle 34 → h-9 (36); meter bar 26 → h-7 (28); icon tile lg 58 → size-14 (56); radius 16 → rounded-md (12); search max width 608 → max-w-xl (576); avatar in stack 52 → size-12 (48); `surface-control-hover` #dedede → `divider`; `surface-control` #e9e9e9 → `surface-subtle`; `surface-muted` #f4f4f4 → `canvas` (meter bar and progress track → `surface-subtle` #e9e9e9, visible on dark cards); `chart-line` #cfcfcf → `control` (3:1 for a data line); `chart-area` → `canvas`; `neutral-fill` → `divider`; amber-500 / 300 gauge segments → `accent` / `accent-subtle`.
- Not applied:
  - Title Case → sentence case (AGENTS.md §2.5, designer's decision).
  - Promo gradient, `promo-glass`, chart tokens and soft success / danger fills — new tokens declined; PromoCard is a flat `accent-subtle` card with a white sheet, progress fills use the tone `-fg` colors.
  - Logo (raster crop) and the promo illustration — image files declined; TopBar shows the product name as text.
  - Outer app frame rim (`surface-page`, `surface-frame`, 44 px radius): device mock-up, not part of the app.
  - Gauge total sits under the arc, not inside it: text over the SVG can't be contrast-checked (axe).
  - Value tag on the chart is hidden below md; a tag above the chart shows the value instead (SVG text would shrink below 12 px).
  - ProjectItem shows the percentage or a status label next to the bar, so the tone never carries the state alone.
  - Brand book (voice, number formats, chart rules) is not published: the export script generates the README; extending it is a toolchain change that was not approved.
- Frames: added 20 component matrices; changed button, icon-button, badge, input matrices. No approved frames affected.
