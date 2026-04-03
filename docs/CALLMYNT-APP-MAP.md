# CallMynt — Complete App Map
## Every section, page, interaction, and data point

---

## APP SHELL (Global Features — present on every page)

### Top Bar

Always visible. Contains:

**Left:** CallMynt logo + wordmark

**Center:** Today's quick stats — Dials, Connects, Samples, Orders (clickable → jumps to Analytics)

**Right:**
- Global search (see below)
- Notifications bell (see below)
- Agent status selector: Available / Do Not Disturb / On Break / Offline (with colored dot)
- Agent avatar + name (click → opens dropdown menu: status selector, profile link, keyboard shortcuts, help, dark mode toggle, logout — see "Agent Avatar Dropdown" in UX Patterns section for full spec)

**Inbound hold queue banner:**
- When callers are holding, a red/amber bar appears directly below the top bar
- Shows across ALL pages, not just the dialer
- "[count] caller(s) holding" with per-caller details expandable
- Persists until resolved

### Global Search

Accessible from the top bar search icon or keyboard shortcut (Cmd+K / Ctrl+K).

**Search overlay (modal with search input at top):**
- Searches across: course names, buyer names, phone numbers, call transcripts, order numbers, notes
- Results grouped by type:
  - Courses (name, city, stage, buyer)
  - Calls (course, date, transcript snippet with highlight)
  - Orders (order #, course, amount)
  - Contacts/Buyers (name, course, phone)
- Click result → navigates to that detail page
- Recent searches shown when opening empty
- Keyboard navigation: arrow keys to select, Enter to open

### Notifications Center

Bell icon in top bar with unread count badge.

**Notification dropdown (click bell to open):**
- Scrollable list of recent notifications, newest first
- Each notification: icon, title, subtitle, timestamp, read/unread indicator
- Click notification → navigates to relevant page
- "Mark all as read" button
- "View all" link → full notifications page

**Notification types:**
- Inbound call missed: "Missed call from Riverside Golf Club (2:34 PM)" → links to course page
- Voicemail received: "New voicemail from Fox Hollow GC — 'wants to place an order'" → links to voicemail player
- Sample shipped: "Sample shipped to Dave Martinez at Fox Hollow GC — tracking #1Z999..." → links to sample detail
- Sample delivered: "Sample delivered to Riverside Golf Club — follow-up due Apr 3" → links to sample + auto-focuses follow-up
- Follow-up overdue: "Follow-up overdue: Mike Thompson at Riverside Golf Club (2 days late)" → links to course, highlights callback
- Callback due: "Scheduled callback: Jeff Willis at Sunbrook Golf Course — now" → links to dialer with course pre-loaded
- Order placed: "New order from Thanksgiving Point GC — 36 units ($900)" → links to order detail
- Order payment received: "Payment received for Order #1042 — $900" → links to order
- AI coaching note: "New weekly coaching report available" → links to coaching page
- Script updated: "AI recommended a new gatekeeper script — review it" → links to script editor
- Agent mentioned: "Jordan tagged you in a note on Fox Hollow GC" → links to course activity

**Notification delivery channels (configurable in Settings):**
- In-app (always on)
- Desktop browser notifications (opt-in)
- Mobile push (opt-in, requires mobile app/PWA)
- Email digest (daily summary, opt-in)
- Slack webhook (per notification type)

### Sidebar Navigation

**Desktop (1024px+):** Fixed left sidebar, 56px wide, icon-only with tooltips
- Dialer (phone icon) — always first
- Courses (people icon)
- Campaigns (flag icon)
- Samples (package icon)
- Orders (shopping bag icon) — NEW
- Call Library (microphone icon)
- Coaching (book icon)
- Analytics (chart icon)
- Settings (gear icon) — bottom of sidebar

**Mobile (< 768px):** Bottom tab bar, 5 most important:
- Dialer
- Courses
- Samples
- Calls
- More (hamburger → slides out full nav)

---

## 1. DIALER

The main workspace. This is where reps spend 90% of their time.

### 1.1 Dialer States (center panel behavior)

**1.1a IDLE STATE** — Rep just logged in, no campaign active
- Campaign selector: list of available campaigns with name, pipeline stage, course count, dialing mode
- Today's stats: dials, connects, gatekeepers reached, samples sent, orders closed, total talk time
- Recent activity feed: last 5-10 calls with course name, outcome, timestamp
- Quick-start buttons for most recent or most urgent campaign
- Agent status toggle: Available / Do Not Disturb / On Break / Offline

**1.1b READY STATE** — Campaign selected, queue loaded
- Campaign name + stats (total courses, remaining, completion %)
- Queue preview: next 5-8 courses with name, stage, buyer (if known), attempt count
- Dialer mode indicator: Power / Parallel / Preview
- Parallel line count selector (if parallel mode): 1-5 lines
- Big "Start Dialing" button
- "Change campaign" link
- Estimated session time based on queue size

**1.1c DIALING STATE** — Power dialer actively cycling
- Current contact being dialed: course name, buyer name (if known), phone number, course type, attempt #
- **Phone number indicator:** "Calling: (801) 555-0140 — Main" or "Pro Shop" — shows which number the dialer chose
- **Caller ID indicator:** "Showing: (801) 555-9999" — which BYRDGANG number appears on the prospect's phone
- Dialing animation / progress indicator
- Parallel line status indicators (which lines are active, ringing, idle)
- "Pause" button (prominently placed)
- "Stop session" button
- Coming up next: next 3-4 courses in queue
- Auto-skipping indicator: shows when system skips a bad number, DNC, or cooldown contact
- **Timezone auto-skip:** If a course's local time is outside the calling window (default 8am-9pm), the dialer auto-skips it with a brief indicator: "Skipped Sunbrook GC — outside calling hours (9:14 PM MST)". The skipped course stays in the queue and will be dialed when its timezone is back in window. This prevents TCPA violations.

**1.1d RINGING STATE** — Specific number ringing, waiting for pickup
- Same as dialing but with ring animation on the contact card
- Ring timer (how long it's been ringing)
- After 30 seconds no answer → auto-advance or offer "Leave VM" option

**1.1e CONNECTED STATE** — Live call with someone
- **Sticky header:** Course name, buyer name, stage pill, sample status badge, timer, gatekeeper/buyer toggle
  - **Phone number indicator:** "Calling: (801) 555-0140 — Main" with dropdown to switch to pro shop number mid-call
  - **Caller ID indicator:** "From: (801) 555-9999" — so rep can answer "what number did you call from?"
- **IVR Quick Bar:** Shortcut buttons to navigate phone tree (see section 1.12)
- **Quick Capture Bar:** Inline fields for capturing data from the gatekeeper without leaving the call view (see section 1.13)
- **Scrollable workspace:** Script panel, notes, margin calculator, dispositions
- **Floating controls:** Mute, hold, end call, VM drop, skip, transfer, record, SMS
- This is the three-panel layout on desktop (queue left, workspace center, intel right)
- See sections 1.2-1.5 for what's in each panel

**1.1f WRAP-UP STATE** — Call ended, disposition required
- If no disposition set: force disposition selection before advancing
- If disposition set: show confirmation + auto-advance countdown (5 seconds)
- "Dial next now" button to skip countdown
- "Pause dialer" button to take a break
- "Add notes" last chance before advancing
- If disposition was "Sending sample": the sample modal should have already fired during the call

**1.1g PAUSED STATE** — Dialer paused (manual or inbound interrupt)
- Campaign name, queue position ("Position 12 of 142")
- Courses remaining count
- Session stats so far: dials this session, connects, samples sent
- "Resume" button (large, prominent)
- "End session" button
- "Switch campaign" button
- Break timer (how long they've been paused)

**1.1h CAMPAIGN COMPLETE** — All courses in queue have been dialed
- "Campaign complete" confirmation with checkmark
- Session summary stats:
  - Total dials this session
  - Total connects
  - Gatekeepers reached
  - Buyers reached
  - Samples sent
  - Orders placed
  - Total talk time
  - Session duration
- "Start another campaign" button → returns to campaign selector (IDLE)
- "Re-queue unanswered" button → resets no-answer and voicemail courses back to queued status, returns to READY
- "View detailed report" → opens Analytics filtered to this session
- If there are scheduled callbacks from this session: "You have X callbacks pending" with list

**1.1i INBOUND — Known caller (phone matches a course in database)**

The inbound experience depends on what the rep was doing when the call arrived:

*If rep was IDLE/READY/PAUSED:*
- Call routes instantly — no ring, no accept button, just connects
- Screen transitions to CONNECTED state with a green banner: "INBOUND CALL — Riverside Golf Club"
- Intel panel auto-populates with full course profile
- Script panel loads context-appropriate script based on course's pipeline stage:
  - If sample was delivered → follow-up script with sample details
  - If they're an existing customer → reorder script
  - If cold_list → generic inbound script ("Thanks for calling, how can I help?")
- Inbound indicator stays visible throughout the call: green "INBOUND" badge next to the timer

*If rep was DIALING/RINGING (between connects):*
- Power dialer pauses instantly — current outbound dial is dropped
- Yellow banner at top: "Dialer paused — inbound call from Riverside Golf Club"
- Same screen pop as above with full course profile
- After inbound call ends + disposition → "Resume dialer" button appears
- Dialer picks up exactly where it left off in the queue

*If rep was on a LIVE OUTBOUND CALL:*
- Do NOT interrupt the outbound call
- Persistent notification banner appears at top of screen (visible but not blocking):
  "INBOUND HOLDING — Riverside Golf Club (Mike Thompson) — 0:45"
- Hold timer counts up in real time
- Banner has a "Transfer here" button (for warm transfer if rep wants to hand off outbound)
- When rep ends outbound call → disposition screen, but instead of auto-advancing to next dial:
  "Inbound call waiting — Mike Thompson at Riverside Golf Club (held 1:22)"
  [Take inbound call] button (primary, prominent)
  [Skip to voicemail] button (secondary)
- Taking the inbound immediately connects and loads the screen pop
- After inbound handled → resume dialer flow

*If ALL reps are on live calls (no one available):*
- Caller enters hold queue
- Branded hold message plays: "Thanks for calling BYRDGANG, all of our team members are currently helping other customers. We'll be with you shortly."
- Hold music plays
- ALL agents see a persistent red notification bar across every view (not just dialer):
  "1 CALLER HOLDING — Riverside Golf Club — 1:15" (with pulsing red dot)
- The first rep to end their current call gets the inbound routed automatically
- If hold exceeds threshold (configurable, default 2 minutes):
  - Option A: System offers caller voicemail: "Press 1 to leave a message"
  - Option B: Auto-send SMS: "Thanks for calling BYRDGANG. A team member will call you back within 10 minutes."
  - Option C: Both — offer VM, and if no VM left after 30 more seconds, send SMS
- Held calls that go to VM or SMS → create a high-priority callback task

**1.1j INBOUND — Unknown caller (phone not in database)**
- Same routing logic as 1.1h
- Screen pop shows: "UNKNOWN CALLER" with just the phone number displayed large
- No course info, no history, no script
- Prompt: "Who is this calling? Create or link course record after the call."
- During the call, rep can:
  - Search for an existing course to link this number to
  - Create a new course record on the fly (minimal fields: course name, caller name, phone)
- After disposition:
  - If linked to existing course → phone number saved to that course's record
  - If new course created → goes into cold_list stage with the call as first activity
  - If spam/wrong number → disposition "Not a lead" and optionally block the number

**1.1k INBOUND — After hours (no agents online)**
- No agents with status "Available" or "On Break"
- Caller hears after-hours greeting:
  "Thanks for calling BYRDGANG. Our team is currently unavailable. Please leave a message and we'll call you back on the next business day."
- Voicemail recorded → transcribed by Whisper (local Mac Mini) → stored in database
- System creates a callback task:
  - Assigned to: last agent who handled this course (if known), or round-robin
  - Priority: HIGH
  - Scheduled: next business day, 9:00 AM
  - Notes: auto-populated with voicemail transcript
- The callback appears at the top of the assigned rep's queue the next morning
- If the caller's number matches a course: voicemail appears on that course's activity timeline

### 1.6 Inbound Hold Queue (visible across all views)

When callers are holding, every agent sees it regardless of what page they're on:

**Global notification bar (top of screen, below top bar):**
- Red/amber background strip
- "[count] caller(s) holding" with pulsing indicator
- Expandable: click to see each holding caller:
  - Phone number
  - Course name (if recognized) + buyer name
  - Hold time (counting up)
  - Which number they called (BYRDGANG main, pro shop line, etc.)
- Click any held caller → routes to that rep (if available)
- Bar persists until all held calls are answered, go to VM, or abandon

**Hold queue sounds:**
- Subtle notification tone when a new inbound enters hold queue
- Escalating tone if hold time exceeds threshold
- Configurable in Settings → Notifications

### 1.7 Inbound Dispositions

Separate from outbound dispositions. When an inbound call ends, these options appear:

**Known caller (course in database):**
- Placing reorder → triggers order creation flow, moves to reorder stage
- Pricing inquiry → logs interest, schedules follow-up
- Sample question → links to existing sample record
- New pro shop inquiry → if cold caller from a course not yet contacted, fast-track to buyer_identified
- Wants to become a partner → high-priority lead, tag as "inbound_interested"
- Checking order status → logs inquiry, links to order
- Complaint/issue → tags for review, notifies manager
- General inquiry → freeform notes
- Wrong number / not a lead → dismiss

**Unknown caller:**
- New pro shop inquiry → create course record + tag "inbound_lead"
- Wrong number → dismiss
- Personal/spam → optionally block number
- Transfer to another department → log + transfer
- Voicemail follow-up → create callback task from VM

### 1.8 Inbound Call Log

Accessible from the dialer view as a tab or from the top bar notification area:

**Today's inbound calls:**
- Timestamp
- Caller phone number
- Course name (if recognized) / "Unknown"
- Agent who handled
- Duration
- Hold time (if applicable)
- Disposition
- Status: Answered / Missed / Voicemail / Abandoned

**Missed / Abandoned inbound section:**
- Calls that were abandoned before anyone answered
- Calls where hold time exceeded threshold and caller hung up
- Auto-generated callback task status: pending / completed
- "Call back now" button on each

**Voicemails:**
- Transcribed voicemail text
- Audio playback
- Linked course (if recognized)
- Callback task status
- "Call back now" button

### 1.9 Inbound Analytics (feeds into main Analytics section)

- Total inbound calls (today / week / month)
- Answer rate (answered / total inbound)
- Average hold time
- Abandonment rate (hung up while holding)
- Average time to answer
- Inbound by source number (which BYRDGANG numbers get the most inbound)
- Inbound by course pipeline stage (are reorder customers calling? sample follow-ups?)
- Inbound conversion rate (inbound calls that resulted in orders)
- Peak inbound hours (heatmap)
- Inbound vs outbound ratio

### 1.10 Order Creation Flow (during a live call)

When a buyer says "let's do it" on the phone, the rep needs to capture the order without losing momentum. This is triggered by the "Placing order" disposition or the "Create wholesale order" quick action.

**Order modal (slides up as bottom sheet on mobile, centered modal on desktop):**

Step 1 — Line Items:
- Product selector (dropdown: BYRDGANG Performance Polo, or future products)
- Size/color matrix: grid where rep taps quantities per size/color combo
  - Columns: S, M, L, XL, XXL
  - Rows: Navy, Charcoal, Forest, Black, White
  - Tap a cell → enter quantity (default 0)
  - Running total at bottom: "36 units"
- Quick presets: "Starter pack (4 of each size in Navy)" / "Custom"
- Unit price: $25 (auto-filled, editable for special pricing)

Step 2 — Shipping:
- Auto-filled from course address (editable)
- Same as sample address checkbox (if sample was sent before)
- Shipping method: Standard / Express
- Special instructions text field

Step 3 — Payment:
- Net 30 invoice (default for first orders)
- Credit card (Stripe payment link sent via email)
- Pay now (if buyer gives card over phone → Stripe terminal or manual entry)
- PO number field (optional, for courses that require it)

Step 4 — Review + Confirm:
- Full order summary: items, quantities, subtotal, shipping, total
- Course name, buyer name, shipping address
- Payment terms
- "Create order" button → creates Shopify paid order at $25/unit
- "Save as draft" button → saves but doesn't push to Shopify yet

**After order created:**
- Confirmation screen with Shopify order number
- Auto-sends order confirmation email to buyer (via Klaviyo or Shopify)
- Course moves to first_order or stays in reorder stage
- Order appears on course detail page + Orders dashboard
- Disposition auto-set to "Placing order" if not already

### 1.11 Message Composer (SMS + Email)

Triggered by "Send SMS" or "Send follow-up email" quick actions during or after a call.

**SMS Composer:**
- To: buyer's phone number (auto-filled, shows course name)
- Template selector: dropdown of saved SMS templates
  - "Post-call follow-up"
  - "Sample shipping notification"
  - "Order confirmation"
  - "Check-in"
  - Custom
- Message preview with variables auto-filled ([buyer_name], [course_name], [tracking_number], etc.)
- Character count (160 limit for single SMS, multi-part indicator)
- Compliance footer auto-appended: "Reply STOP to unsubscribe"
- Send button
- Schedule send option (pick date/time)
- Message logged to course activity timeline after sending

**Email Composer:**
- To: buyer's email (auto-filled)
- From: rep's BYRDGANG email
- Template selector: dropdown of saved email templates
  - "Nice talking to you" (post-call)
  - "Your sample is on the way" (with tracking)
  - "Following up on your sample" (pre-follow-up call)
  - "Order confirmation" (with order details)
  - "Reorder check-in"
  - Custom
- Subject line (auto-filled from template, editable)
- Body preview with variables auto-filled
- Rich text editing (basic: bold, links, lists)
- Attach files (product catalog PDF, price sheet)
- Send button
- Schedule send option
- Email logged to course activity timeline + sent via Klaviyo or direct SMTP

### 1.2 Queue Panel (left sidebar on desktop)

Shows during: DIALING, RINGING, CONNECTED, WRAP-UP states

- Campaign name + remaining count at top
- Search/filter contacts within queue
- Each queue item shows:
  - Course name
  - Buyer name (or "Unknown buyer")
  - Pipeline stage pill
  - Status indicator: queued / ringing / live / VM dropped / talked / skipped
  - Call time (for completed/live calls)
  - Attempt count
  - Scheduled callback time (if applicable)
  - Sample status callout (if sample delivered + follow-up due)
- Priority sorting:
  1. Live call (current)
  2. Inbound waiting
  3. Scheduled callbacks (time has arrived)
  4. Sample follow-ups (delivered, not yet followed up)
  5. Buyer identified (warm leads)
  6. Cold list
- Click a queued course to preview their info in the intel panel
- Visual hierarchy: live = green left border, sample follow-up = orange, callbacks = blue

### 1.3 Script Panel (center panel, left column)

- Dynamic script loading based on:
  - Pipeline stage of the course
  - Gatekeeper vs buyer mode
- Each script has titled sections (Opening, Value Prop, Close, Objection Responses)
- Variable substitution: [buyer name], [color], [size], [course name] auto-filled from course data
- Objection responses in expandable accordion
- "Copy to clipboard" button on individual script sections
- Script version indicator (if AI has recommended a new version)
- Link to full script library in Settings

### 1.4 Intel Panel (right sidebar on desktop)

Shows during: CONNECTED state (and available on-demand in other states)

**Course Info Card:**
- Course name
- Course type (Public / Private / Resort / Municipal / Semi-Private)
- Address (full)
- Main phone number (click to call)
- Pro shop phone number (click to call)
- Website (click to open)
- Hours of operation (if available)
- Number of holes (9/18/27/36)
- Source (scraped / Apollo / manual / inbound / referral)
- Tags
- DNC status

**Buyer Info Card:**
- Buyer name (or "Unknown — ask gatekeeper" prompt)
- Title / role
- Direct phone (click to call)
- Email (click to email)
- Shirt size
- Notes about this buyer
- LinkedIn profile (if available)
- When buyer was first identified + by which agent

**Pipeline Status Card:**
- Current stage with visual indicator
- Days in current stage
- Stage history timeline (when did they move through each stage)
- Next action due (follow-up date, callback scheduled, etc.)

**Sample Tracking Card (if applicable):**
- Sample status: pending / shipped / in transit / delivered / converted
- Shopify order number (linked to Shopify admin)
- Size, color sent
- Ship date
- Tracking number (linked to carrier tracking page)
- Estimated delivery / actual delivery date
- Follow-up scheduled date
- Follow-up status (done / overdue / upcoming)

**Call History Card:**
- List of all previous calls with this course
- Each entry shows: date, time, duration, who answered (gatekeeper/buyer/VM), agent name, disposition, AI score
- Expandable: click to see notes, play recording, read transcript
- Recording player: waveform, play/pause, scrub, speed (1x/1.5x/2x), download
- Transcript viewer: speaker-labeled, timestamped, clickable timestamps jump to audio position
- AI analysis summary for that call

**Order History Card (if applicable):**
- List of all wholesale orders from this course
- Each order: date, number of units, styles/sizes, total amount, status, Shopify order link
- Lifetime revenue total
- Reorder frequency / average order size

**AI Insights Card:**
- Live during call: sentiment indicator, talk ratio, keyword detection
- Post-call: full analysis score, coaching notes, suggested next step
- Historical: best time to reach this buyer, what approaches have worked before, sentiment trend

**Quick Actions:**
- Send follow-up email (pre-composed template)
- Schedule callback (date/time picker → adds to queue)
- Create wholesale order (opens order creation flow)
- Ship sample (opens sample modal)
- Send SMS (template selection → send)
- Add tag
- Edit course info
- Mark as DNC
- Transfer to another agent

### 1.5 Margin Calculator Widget

- Always visible in the workspace during CONNECTED state
- Editable fields: retail price (default $49), order quantity (default 24)
- Calculated fields: margin per shirt ($), margin percentage (%), total investment, total revenue, total profit
- Wholesale cost fixed at $25
- Website retail reference: $69
- Quick presets: "Show them $49 math" / "Show them $59 math"

### 1.12 Dialpad & IVR Navigation

**Critical for golf course calling.** Nearly every golf course has an IVR phone tree: "Press 1 for tee times, press 2 for the pro shop, press 3 for events..." Reps MUST be able to send DTMF tones during a live call to navigate through the IVR to reach the pro shop.

**IVR Quick Bar (sticky, below the call header during CONNECTED state):**
- Appears as a thin blue bar directly below the caller info header
- Shows pre-configured IVR shortcuts for the current course:
  - "2 Pro Shop" / "0 Operator" / "1 Tee Times" (configurable per course)
  - Each shortcut is a button that sends the DTMF digit immediately on click
- "Full dialpad" link opens the full dialpad overlay
- "Sent: 2" indicator shows which digits have been pressed this call
- On the FIRST call to a new course, shortcuts are generic (2, 0, 1)
- After the rep navigates the IVR, they can save the correct shortcut:
  "Pro shop was option 3" → saves to the course record for next time
- After that, future calls to the same course show the correct shortcut

**IVR Shortcut Data (stored per course):**
- `ivr_pro_shop_key` — which digit reaches the pro shop (e.g., "2")
- `ivr_notes` — any IVR navigation notes (e.g., "Press 2, then 1 for merchandise")
- `ivr_direct_extension` — if the buyer has a direct extension (e.g., "ext 104")
- These are editable from the course detail page and from the dialpad during a call

**Full Dialpad Overlay (modal, opened from controls bar or IVR bar):**
- Standard phone number pad: 1-9, *, 0, #
- Each key shows sub-letters (2=ABC, 3=DEF, etc.)
- Tapping a key sends the DTMF tone immediately via Twilio `sendDigits()`
- Digits pressed display in a readout at the top of the dialpad
- IVR shortcut bar at the top of the dialpad: "Pro Shop: Press 2" (one-tap)
- "Edit shortcut" button to save the correct IVR path for this course
- "Clear & close" button to dismiss

**Dialpad Button in Controls Bar:**
- NOT in the floating controls bar — the IVR Quick Bar handles all DTMF access
- "Full dialpad" link in the IVR bar opens the full overlay when needed
- This keeps the controls bar clean: Mute, Hold, End, VM Drop, Skip
- Keyboard shortcut: `P` toggles the full dialpad overlay open/closed

**Auto-IVR Navigation (Phase 2 feature):**
- If the system knows the IVR path for a course AND AMD detects a human (not machine):
  - System can auto-send the DTMF sequence after the IVR greeting
  - e.g., call connects → wait 3 seconds → auto-press 2 → auto-press 1
  - This is opt-in per campaign: "Auto-navigate IVR when known"
  - Saves the rep 10-15 seconds per call × 200 calls/day = significant time savings

**DTMF during AMD detection:**
- If AMD is running and detects an IVR greeting (machine_start), the system should:
  - NOT auto-drop a voicemail (it's an IVR, not a personal voicemail)
  - Instead, send the known IVR digits to navigate to the pro shop
  - Then re-evaluate: did a human answer at the pro shop? If yes → connect to agent
  - This requires `machineDetection: "DetectMessageEnd"` and post-detection DTMF injection

### 1.13 Quick Capture Bar (during live call)

When a gatekeeper gives the rep info — buyer name, direct number, extension, best time — the rep needs to capture it instantly without fumbling with the full course edit form.

**Quick Capture Bar (sits below IVR bar during CONNECTED state, gatekeeper mode):**
- Shows only when gatekeeper/buyer toggle is set to "Gatekeeper" (this is when capture info is most likely)
- Compact horizontal row of inline-editable fields:
  - **Buyer name** — text input, placeholder: "Buyer name..."
  - **Title** — text input, placeholder: "Title..." (smaller)
  - **Direct phone** — tel input, placeholder: "Direct #..."
  - **Extension** — small input, placeholder: "Ext"
  - **Best time** — dropdown: "Morning" / "Afternoon" / "Anytime" / custom
- **Save button** — saves all fields directly to the course record in Supabase
- Auto-save: fields save individually on blur (field loses focus)
- Visual confirmation: field border flashes green briefly after saving
- Pre-filled: if the course already has buyer info, fields show existing values
- Can also be toggled open/closed to save vertical space when not needed

**Why this matters:**
- On a cold call, the gatekeeper might say: "The buyer is John Smith, he's the head pro, his direct line is extension 204, try him before 9am"
- That's 4 pieces of data in one sentence
- Without quick capture, the rep types it in freeform notes and hopes someone cleans it up later
- With quick capture, it's structured data saved to the course record instantly
- The next time anyone calls this course, the buyer info is right there

**After saving, automatic effects:**
- Course record updated with buyer_name, buyer_title, buyer_direct_phone
- If buyer name was previously empty → pipeline stage auto-advances to `buyer_identified`
- Next call to this course shows the buyer info in the intel panel
- Disposition "Got buyer name" auto-fills if buyer name was captured during the call

### 1.14 Phone Number Selection & Caller ID

**Phone number being called (visible in sticky header during CONNECTED and DIALING states):**
- Small indicator below course name: "📞 (801) 555-0140 — Main line"
- If course has multiple numbers (main + pro shop + buyer direct):
  - Dropdown arrow → switch to another number
  - "Try pro shop instead" / "Try buyer direct" options
  - Switching mid-dial: current call drops, new call initiated to selected number
  - Switching during connected call: not available (you're already talking to someone)
  - Between calls in the queue: rep can flag "try pro shop next time" for this course

**Caller ID being shown (visible in sticky header):**
- "From: (801) 555-9999 — Utah local"
- Shows which BYRDGANG number is being displayed on the prospect's phone
- This matters because prospects will ask "what number called me?" or "what number should I call back?"
- The rep needs this answer instantly
- If the prospect is in a different area code: "From: (435) 555-1234 — St. George local"
- Non-editable — caller ID is selected automatically by the local presence system

**Phone priority logic for the dialer:**
1. If `buyer_direct_phone` exists → dial that first (highest chance of reaching the buyer)
2. Else if `pro_shop_phone` exists → dial that (more likely to reach merchandise person)
3. Else `main_phone` → dial that (might hit IVR)
4. Rep can override this per-course: "Always try main line first for Riverside GC"

### 1.15 Timezone & Calling Hours

**Auto-skip logic during power dialing:**
- Each course has a timezone derived from its city/state (or explicitly set)
- Before dialing, the system checks: is the course's local time within the calling window?
- Default calling window: 8:00 AM – 8:00 PM local time (configurable per campaign in Settings)
- If outside the window → auto-skip with indicator:
  - "⏭ Skipped Sunbrook GC — 9:14 PM local (MST)"
  - Skipped course stays in queue, will be dialed when timezone is back in window
- If approaching the edge (e.g., it's 7:50 PM local):
  - Warning indicator: "⚠ Valley View Golf — 7:52 PM local, calling window closes in 8 min"
  - Rep can choose to call anyway or skip

**Timezone display:**
- Shown on every course in the queue panel: small clock icon + local time
- In the dialer header during connected call: "Local time: 2:34 PM MST"
- In the course detail page: timezone field

**Compliance:**
- TCPA requires calls only during 8am-9pm recipient local time
- The default 8am-8pm window gives a 1-hour safety buffer
- Admins can adjust per campaign in Settings > Campaigns > Time Windows
- Auto-skip cannot be overridden by reps (compliance enforcement)

---

## 2. COURSES (Lead Database)

The CRM for golf courses. This is the master database.

### 2.1 Course List View (default)

- **Pipeline board view** (toggle): Kanban-style columns for each stage, courses as cards you can drag between stages
- **Table view** (toggle): Sortable/filterable data table
- **Map view** (toggle): Courses plotted on a map, colored by pipeline stage

**Filters sidebar/bar:**
- Pipeline stage (multi-select)
- Course type (Public/Private/Resort/Municipal/Semi-Private)
- State / region
- Has buyer name (yes/no)
- Sample status (none/pending/shipped/delivered/converted)
- Last contacted (date range)
- Attempt count (range)
- DNC status
- Tags
- Assigned agent
- AI score range

**Bulk actions (when rows selected):**
- Add to campaign
- Change pipeline stage
- Assign to agent
- Add tag
- Export CSV
- Mark DNC

**Table columns (configurable):**
- Course name
- Course type
- City, State
- Pipeline stage
- Buyer name
- Buyer title
- Attempts
- Last contacted
- Sample status
- Total orders / lifetime revenue
- AI score
- Assigned agent
- Next follow-up date

### 2.2 Course Detail Page (/courses/[id])

This is the full profile page for a single golf course. It's what a rep sees when they want to dig deep into a lead outside of the dialer.

**Header:**
- Course name (large)
- Course type badge
- Pipeline stage pill (with dropdown to manually change stage)
- Address + city, state
- Quick action buttons: Call, SMS, Email, Schedule, Edit

**Overview Tab:**
- Course info card (all course fields, editable inline)
- Buyer info card (all buyer fields, editable inline)
- Pipeline timeline: visual history of stage changes with dates
- Next action card: what's the next thing that should happen with this course

**Activity Tab:**
- Unified timeline of ALL interactions:
  - Calls (with recording player inline)
  - Emails sent
  - SMS messages
  - Notes added
  - Stage changes
  - Sample shipped / delivered
  - Orders placed
- Each activity: timestamp, agent, type icon, summary
- Filter by activity type
- Add manual note button

**Calls Tab:**
- List of all calls with full detail
- Each call: date, agent, duration, direction (inbound/outbound), who answered, disposition
- Expandable: recording player, full transcript, AI analysis
- Call comparison: see score trends over multiple calls

**Samples Tab (if applicable):**
- Full sample history
- Current sample status with visual tracker (ordered → shipped → in transit → delivered → followed up)
- Shopify order details (linked)
- Tracking info with carrier link
- Cost tracking: COGS + shipping

**Orders Tab (if applicable):**
- All wholesale orders
- Each order: date, items (styles/sizes/quantities), total, payment status, fulfillment status
- Shopify order link
- Lifetime value summary
- Reorder pattern visualization (if multiple orders)

**AI Tab:**
- AI-generated course profile: likelihood to convert, recommended approach, best time to call
- Aggregated call analysis across all calls with this course
- Suggested next steps
- Objection history: what they've said before and what worked
- Comparison to similar courses (same type/region) that converted

### 2.3 Course Import

- CSV upload with field mapping
- Apollo.io sync (pull enriched data)
- Manual add form
- Duplicate detection + merge
- Bulk field update

---

## 3. CAMPAIGNS

How courses get organized into call lists.

### 3.1 Campaign List View

- All campaigns with: name, pipeline stage, status (active/paused/completed), course count, completion %, assigned agents, created date
- Quick stats: dials, connects, samples sent per campaign
- Filter by: status, stage, agent
- Create new campaign button

### 3.2 Campaign Detail Page (/campaigns/[id])

**Header:**
- Campaign name (editable)
- Pipeline stage
- Status badge (active/paused/completed)
- Assigned agents
- Dialer mode (power/parallel/preview)

**Settings Tab:**
- Dialer mode selector
- Parallel line count (if parallel)
- Retry rules: max attempts, cooldown between attempts (hours), retry on no-answer (hours), retry on gatekeeper (hours)
- Time windows: allowed call hours per timezone (e.g., 8am-6pm local)
- Caller ID pool: which phone numbers to rotate through
- Voicemail drop: select pre-recorded VM for this campaign
- Script: select or customize script for this campaign
- Auto-advance: on/off, countdown timer duration

**Queue Tab:**
- All courses in this campaign
- Sortable by: position, priority, status, attempts, scheduled time
- Each course: name, buyer, stage, attempts, status (queued/completed/skipped), scheduled time
- Manual reorder (drag and drop)
- Add courses (from course database with filters)
- Remove courses
- Reset completed courses (re-queue)
- Priority override per course

**Performance Tab:**
- Campaign metrics: total dials, connects, connect rate, talk time, samples sent, orders generated
- Disposition breakdown (pie chart)
- Agent performance within this campaign
- Calls per hour trend
- Best performing call times
- A/B script comparison (if multiple scripts used)

### 3.3 Campaign Creation Flow

1. Name the campaign
2. Select pipeline stage (determines available scripts + dispositions)
3. Select dialing mode
4. Set retry rules + time windows
5. Add courses (filter from database, import list, or auto-populate based on stage)
6. Assign agents
7. Select script + voicemail drop
8. Review + activate

---

## 4. SAMPLES

Tracking the full lifecycle of every free sample polo.

### 4.1 Samples Dashboard

**Summary cards:**
- Total samples sent (all time, this month, this week)
- Currently in transit
- Delivered — awaiting follow-up
- Overdue follow-ups (delivered but no follow-up call made past due date)
- Converted to orders
- Conversion rate (samples → orders)
- Average days: send → delivery, delivery → follow-up, follow-up → order

**Urgent actions banner:**
- "X samples delivered with overdue follow-ups" (click to see list)
- "X samples pending Shopify fulfillment" (stuck in queue)

**Filterable table:**
- Course name
- Buyer name
- Size / color
- Status (pending / shipped / in transit / delivered / followed up / converted)
- Shopify order # (linked)
- Ship date
- Tracking # (linked to carrier)
- Delivery date
- Follow-up scheduled
- Follow-up status
- Conversion: order amount (if converted)
- Agent who sent it

### 4.2 Sample Detail Page (/samples/[id])

- Full timeline: created → Shopify order → shipped → in transit → delivered → follow-up scheduled → follow-up made → order placed
- Each step: timestamp, status, links (Shopify admin, tracking page)
- Course info summary (linked to course detail page)
- The call where sample was requested (with recording player)
- The follow-up call (if made, with recording player)
- Cost breakdown: COGS + shipping
- Actions: resend sample, cancel, mark delivered manually, schedule follow-up manually

---

## 5. ORDERS (Wholesale)

The revenue center. Every wholesale order from first purchase through reorders.

### 5.1 Orders Dashboard

**Summary cards:**
- Orders this week / month / all time (count)
- Revenue this week / month / all time ($)
- Average order value
- Average units per order
- Pending orders (placed but not yet shipped)
- Reorder rate (% of courses that order more than once)

**Orders table (filterable, sortable):**
- Order number (Shopify order #, linked)
- Course name (linked to course detail page)
- Buyer name
- Date placed
- Items summary: "36 units — Navy, Charcoal" (condensed line item view)
- Total amount
- Payment status: paid / pending / invoiced / overdue
- Fulfillment status: unfulfilled / shipped / delivered
- Tracking number (linked to carrier)
- Agent who closed the deal

**Filters:**
- Date range
- Payment status
- Fulfillment status
- Agent
- Course type
- State / region
- Amount range
- First order vs reorder

**Bulk actions:**
- Export selected (CSV)
- Mark as paid
- Send payment reminder
- Print packing slips

### 5.2 Order Detail Page (/orders/[id])

**Header:**
- Order number + Shopify link
- Course name + buyer name (linked to course detail page)
- Date placed
- Status badges: payment status + fulfillment status
- Agent who closed

**Line Items:**
- Table: style, color, size, quantity, unit price ($25), line total
- Subtotal
- Shipping cost
- Total

**Payment Info:**
- Payment method: Net 30 / Credit card / Invoice
- Payment status: paid / pending / overdue
- Stripe payment ID (if applicable, linked)
- Invoice number (if applicable)
- Date paid (if applicable)
- "Send payment reminder" button (if unpaid)
- "Mark as paid" button (manual override)
- Payment terms: Net 30 / due on receipt / custom

**Fulfillment Info:**
- Shopify fulfillment status
- Tracking number (linked to carrier tracking page)
- Carrier name
- Ship date
- Estimated delivery
- Delivery confirmation date
- Shipping address

**Related Data:**
- The call where order was placed (with recording player)
- Course's full order history (is this a reorder? what did they order last time?)
- Sample that led to this order (if applicable, linked)

**Actions:**
- Edit order (change quantities before fulfillment)
- Cancel order
- Refund (full or partial via Stripe)
- Duplicate order (for quick reorders)
- Send order confirmation email
- Print invoice

### 5.3 Order Creation Page (/orders/new)

Same flow as the in-call order modal (section 1.10) but as a full page for creating orders outside of a call context:
- Course selector (search + select)
- Line item builder (size/color matrix)
- Shipping address
- Payment terms
- Notes
- This is used when a buyer emails or texts their order instead of calling

---

## 6. CALL LIBRARY

Searchable archive of every recorded call.

### 5.1 Call List View

**Search:** Full-text search across transcripts, course names, buyer names, agent notes

**Filters:**
- Date range
- Agent
- Direction (inbound/outbound)
- Disposition
- Pipeline stage (at time of call)
- Who answered (gatekeeper/buyer/VM/no answer)
- AI score range
- Campaign
- Duration range
- Has transcript (yes/no)

**Table:**
- Course name
- Buyer / contact name
- Agent
- Date + time
- Duration
- Direction (in/out icon)
- Who answered
- Disposition (color-coded)
- AI score (color-coded)
- Campaign name

**Bulk actions:**
- Export selected calls
- Tag calls
- Add to coaching playlist
- Re-analyze with AI

### 5.2 Call Detail Page (/calls/[id])

**Header:**
- Course name + buyer name
- Agent who made/received the call
- Date, time, duration
- Direction (inbound/outbound)
- Disposition
- Pipeline stage before → after

**Recording Player:**
- Dual-channel waveform visualization (agent channel + prospect channel)
- Play / pause / scrub
- Speed control: 0.5x, 1x, 1.5x, 2x
- Volume control
- Download recording button
- Jump to timestamp (from transcript or AI moments)

**Transcript Panel:**
- Speaker-labeled (Agent / Prospect)
- Timestamped (clicking a timestamp jumps audio to that point)
- Searchable within transcript
- Highlighted keywords (AI-detected objections, buying signals, etc.)
- Copy transcript button
- Edit transcript (correct errors)

**AI Analysis Panel:**
- Overall score (1-100) with breakdown
- Talk-to-listen ratio (visual bar)
- Script adherence checklist: ✓/✗ mentioned sample, mentioned SunRun, asked for size, asked for address, attempted close
- Gatekeeper navigation analysis: encountered (yes/no), got past (yes/no), technique used
- Objections detected: list with the prospect's exact words, agent's response, effectiveness rating
- Key moments: timestamped list of important events (clicking jumps to audio)
- Sentiment trajectory: chart showing sentiment over the call duration
- Coaching notes: 2-3 specific, actionable tips for this call
- Suggested next step

**Notes Panel:**
- Agent's notes from the call
- Post-call additions
- Manager annotations
- AI-generated summary

**Context Panel:**
- Course info summary
- Where this call fits in the overall interaction history
- What happened before this call / what happened after

---

## 7. COACHING

AI-driven performance insights and training.

### 7.1 Coaching Dashboard (Manager View)

**Team Scorecards:**
- Each agent: photo/avatar, name, avg AI score, calls this week, connects, samples sent, orders
- Ranking by performance
- Score trend arrows (improving/declining/stable)
- Click agent → individual coaching page

**Team Metrics:**
- Avg call score trend (line chart, weekly)
- Gatekeeper pass-through rate trend
- Sample close rate trend
- Objection handling effectiveness trend

**Pattern Insights (from nightly AI batch):**
- Top 3 gatekeeper techniques this week (with conversion stats)
- Top 3 objection responses this week (with conversion stats)
- Top 3 opening lines this week
- Best call times heatmap (day × hour, colored by connect rate)
- Course type analysis: which types convert best

**Script Recommendations:**
- AI-generated script variations based on what's working
- A/B comparison: current script vs AI-recommended
- Adoption rate (how many reps are using the recommended version)

**Flagged Calls:**
- Calls that scored below threshold (e.g., < 50)
- Calls where prospect expressed strong negative sentiment
- Calls that deviated significantly from script
- "Listen first" suggestions for managers

### 7.2 Agent Coaching Page (/coaching/[agentId])

**Agent Profile:**
- Name, role, avatar
- Active campaigns
- Overall stats: total calls, connects, samples, orders, revenue generated

**Performance Trend:**
- AI score trend over time (line chart)
- Talk ratio trend
- Connect rate trend
- Comparison to team average

**Strengths + Areas to Improve:**
- AI-identified strengths (with supporting call examples)
- AI-identified improvement areas (with supporting call examples)
- Specific coaching recommendations

**Call Playlist:**
- Best calls (highest scored) — for the agent to reference
- Calls needing review (lowest scored) — for self-improvement
- Exemplar calls from other agents (anonymized or with permission)

**Weekly Report:**
- Auto-generated every Monday
- Summary of previous week: calls, outcomes, score changes
- Specific coaching notes
- Goals for next week (AI-suggested)

### 7.3 Gatekeeper Playbook

- AI-compiled and continuously updated
- Ranked list of gatekeeper techniques with conversion rates
- Real call excerpts (anonymized) showing each technique in action
- Time-of-day recommendations
- Course-type-specific approaches
- What NOT to say (anti-patterns from failed calls)

### 7.4 Objection Library

- Every objection the AI has detected across all calls
- Categorized: already have supplier, no budget, send email, minimum order, need approval, etc.
- For each objection: best responses ranked by effectiveness, with example audio clips
- Response templates that agents can customize

---

## 8. ANALYTICS

Data and metrics across the entire operation.

### 8.1 Dashboard (default view)

**Summary Row:**
- Total dials (today / this week / this month)
- Connects
- Connect rate
- Talk time
- Gatekeepers reached
- Buyers reached
- Samples sent
- Orders placed
- Revenue

**Pipeline Funnel:**
- Visual funnel: Cold List → Buyer Identified → Sample Sent → Sample Follow-Up → First Order → Reorder
- Conversion rate between each stage
- Number of courses in each stage
- Average time in each stage

**Revenue:**
- Revenue this week / month / all time
- Average order value
- Average units per order
- Revenue per agent
- Revenue per course type
- Revenue per state/region

**Sample ROI:**
- Cost per sample (COGS + shipping)
- Total sample spend
- Revenue generated from converted samples
- ROI ratio (revenue / sample cost)
- Average number of samples needed per order

### 8.2 Agent Performance

- Comparison table: all agents side-by-side
- Metrics: dials, connects, connect rate, talk time, samples, orders, revenue, avg AI score
- Sortable by any metric
- Trend lines per agent
- Activity heatmap (when is each agent most productive)

### 8.3 Campaign Performance

- All campaigns with metrics
- Dials, connects, connect rate per campaign
- Pipeline progression from each campaign
- Cost per lead / cost per order by campaign
- Best performing campaign identification

### 8.4 Call Analytics

- Calls over time (line chart)
- Disposition breakdown (pie chart)
- Call duration distribution (histogram)
- Best day of week / time of day analysis
- Inbound vs outbound ratio
- Answer rate by local presence number

### 8.5 Course Type Analysis

- Performance breakdown by course type (Public/Private/Resort/Municipal)
- Which types are most receptive
- Which types convert fastest
- Which types have highest order values
- Recommended targeting strategy

---

## 9. SETTINGS

App configuration.

### 9.1 My Profile

- Name, email, avatar
- Phone extension (for internal transfers)
- Working hours (when to receive inbound routing)
- Notification preferences (desktop notifications, sounds)
- Personal voicemail greeting

### 9.2 Team Management (admin only)

- Agent list: name, email, role, status, active campaigns
- Invite new agent
- Edit agent roles (agent / manager / admin)
- Deactivate agent
- Assign default campaigns

### 9.3 Phone Numbers

- List of all phone numbers (Twilio/Telnyx)
- For each number: number, area code, type (local/toll-free), health score, assigned campaigns, monthly usage
- Buy new number (search by area code)
- Retire/release number
- Number rotation settings
- Spam score monitoring

### 9.4 Inbound Routing

**Routing Rules:**
- Default strategy: Ring all available → first to answer gets it (default)
- Round-robin: rotate between agents evenly
- Skills-based: route based on language, expertise, or territory
- Priority routing: route to the agent who last handled this course (relationship continuity)
- Fallback chain: if primary agent unavailable, try agent 2, then agent 3, etc.

**Per-Number Routing:**
- Map each BYRDGANG phone number to specific agents or teams
- e.g., Utah number → Alex and Jordan, Texas number → Taylor
- Overflow rules: if assigned agents are all busy, overflow to all available

**Hold Queue Configuration:**
- Max hold time before escalation (default: 2 minutes)
- Hold message: upload custom audio or use text-to-speech
- Hold music: upload custom or select from library
- Position announcements: "You are caller number [X]" (on/off)
- Estimated wait time announcement (on/off)
- Auto-SMS threshold: send SMS after [X] seconds of hold (configurable, default 120)
- Auto-SMS message template (editable)
- Voicemail offer threshold: offer VM option after [X] seconds (configurable, default 150)
- Max callers in queue before rejecting (default: 10)

**After-Hours Configuration:**
- Business hours definition (per timezone, per day of week)
- After-hours greeting: upload audio or text-to-speech
- After-hours behavior:
  - Voicemail only (default)
  - Voicemail + auto-SMS
  - Forward to mobile number (per agent)
  - Auto-attendant with menu options
- Voicemail transcription: on (default) / off
- Callback task auto-creation: on (default) / off
- Callback assignment: last agent who handled course / round-robin / specific agent
- Callback priority: HIGH for known courses, MEDIUM for unknown

**Inbound Caller ID Matching:**
- Match against: main_phone, pro_shop_phone, buyer_direct_phone (all on by default)
- Fuzzy matching: strip country code, handle +1 vs (xxx) formats
- Manual number linking: allow reps to link an unknown number to a course during/after call
- Block list: numbers to auto-reject (spammers, robocalls)

**Inbound Notifications:**
- Notification sound for new inbound call (selectable)
- Notification sound for caller entering hold queue
- Escalation sound when hold time exceeds threshold
- Desktop browser notifications: on/off
- Mobile push notifications: on/off (for agents using mobile app)

**Inbound Dispositions:**
- Customize the inbound disposition list
- Add/remove/reorder disposition options
- Map each disposition to pipeline actions (e.g., "Placing reorder" → create order + move to reorder stage)
- Required fields per disposition (e.g., "New inquiry" requires course name + caller name)

### 9.5 Scripts

- Script library: list of all scripts
- Each script: name, pipeline stage, version history
- Script editor: rich text with variable placeholders ([buyer name], [course name], etc.)
- Objection response sections (expandable accordion in editor)
- AI-recommended scripts: review and approve/edit before deploying
- A/B testing: assign different scripts to different agents/campaigns
- Script performance analytics: which scripts produce the best outcomes

### 9.6 Voicemail Drops

- Library of pre-recorded voicemail messages
- Upload new recording (or record in-browser)
- Assign to campaigns / pipeline stages
- Playback preview
- Usage stats: how often each VM is dropped, callback rate per VM

### 9.7 SMS Templates

- Library of SMS templates
- Variable placeholders
- Assign to campaign stages
- Character count
- Preview on phone mockup
- Compliance: opt-out footer auto-appended

### 9.8 Integrations

**Shopify:**
- Connected store info
- Sample product configuration (select product, map variants to sizes/colors)
- Webhook status (connected/disconnected, last received)
- Test connection button
- Order sync settings

**Twilio / Telnyx:**
- Account info
- Connection status
- Monthly usage + cost
- Recording storage settings
- Transcription provider selection

**Mac Mini (Recording + Transcription):**
- Connection status (Cloudflare tunnel health)
- WebSocket server status (recording active)
- Whisper model loaded (large-v3 / medium / base)
- Disk space: used / available
- Transcription queue depth
- Recordings stored: count, total size
- Playback endpoint status
- Cleanup rules: retain for X days

**OpenClaw (AI Analysis + Coaching):**
- Connection status (running on Mac Mini)
- Model backend: Gemini Flash / Kimi K2.5 / other
- ChromaDB memory stats: total entries, memory size
- Calls analyzed: today / total
- Avg analysis time per call
- Coaching reports generated
- Custom analysis prompt template (editable)
- Memory reset option (clear ChromaDB and start fresh)

**Klaviyo:**
- Connection status
- Event triggers configured
- Email template selection for follow-ups

**Other:**
- Apollo.io (lead enrichment)
- Google Calendar (callback scheduling)
- Slack (notifications)
- Zapier/Webhook (custom automations)

### 9.9 Data Management

- Export all data (CSV/JSON)
- DNC list management (upload, download, search)
- Data cleanup tools (find duplicates, merge records)
- Audit log (who changed what, when)

### 9.10 Billing (if multi-tenant in future)

- Current plan
- Usage: calls, recordings, AI analysis credits
- Invoices
- Payment method

---

## USER FLOWS (How sections connect)

### Flow 1: Cold Call → Sample → Order
1. Rep opens Dialer (Section 1)
2. Selects "Cold List — Utah" campaign
3. Power dialer starts, connects to a course
4. Rep talks to gatekeeper → gets buyer name → dispositions "Got buyer name"
5. System moves course from cold_list → buyer_identified (visible in Courses section 2)
6. Next dial session, rep calls back in "Buyer Follow-ups" campaign
7. Reaches buyer → pitches with margin calculator → buyer wants a sample
8. Rep dispositions "Sending sample" → Sample modal captures size/address
9. System creates Shopify $0 order → visible in Samples section 4
10. 3PL ships → Shopify webhook fires → tracking stored → follow-up auto-scheduled
11. Course moves to sample_follow_up stage
12. Follow-up call surfaces in rep's queue → they call → buyer loves it → "Placing order!"
13. Order created → visible in Analytics section 7 and Course detail page section 2.2
14. Course moves to first_order → eventually reorder stage

### Flow 2: Inbound Call
1. Course calls BYRDGANG number
2. System looks up phone in Courses database
3. Routes to available agent (4-tier priority)
4. Screen pop: full course profile appears (from Courses section 2)
5. Rep sees sample was delivered yesterday → uses follow-up script
6. Buyer wants to order → rep creates wholesale order
7. Call recorded → goes to Call Library (section 5)
8. AI analyzes → shows in Coaching (section 6)

### Flow 3: Manager Reviews Performance
1. Manager opens Coaching (section 6.1)
2. Sees team scorecard, notices one agent declining
3. Clicks agent → Agent Coaching Page (section 6.2)
4. Sees AI-identified issue: agent isn't mentioning SunRun social proof
5. Opens flagged call → Call Detail Page (section 5.2) → listens to recording
6. Adds coaching note → agent sees it next time they open Coaching
7. Manager opens Scripts (section 8.5) → updates script to make SunRun mention more prominent

### Flow 4: Analyzing What Works
1. Manager opens Analytics (section 7.1)
2. Sees conversion funnel — notices Sample → Order rate dropped this month
3. Drills into Sample section (4.1) → sees 3 overdue follow-ups
4. Opens Coaching (6.1) → checks pattern insights
5. AI shows: "Follow-up calls made within 2 days of delivery convert at 2x the rate of calls made after 5+ days"
6. Manager adjusts follow-up scheduling rule in campaign settings

### Flow 5: Inbound Call — Known Buyer (Sample Follow-Up)
1. Mike Thompson at Riverside Golf Club calls the BYRDGANG number
2. System matches (801) 555-0142 → Riverside Golf Club → buyer_direct_phone
3. Rep Alex is between power dial connects → dialer pauses
4. Screen pop: "INBOUND — Riverside Golf Club — Mike Thompson, Head Pro"
5. Intel panel shows: sample delivered Apr 1 (Navy, XL), no follow-up call yet
6. Follow-up script auto-loads: "Hey Mike, glad you called — did you get a chance to try that polo?"
7. Mike loves it, wants 36 units → rep dispositions "Placing reorder"
8. Order creation flow → Shopify wholesale order at $25/unit = $900
9. Course moves to first_order stage
10. Call recorded → AI scores 94 (perfect inbound conversion)
11. "Resume dialer" button appears → Alex continues cold calling

### Flow 6: Inbound Call — Unknown Number
1. Unknown number (512) 555-9999 calls BYRDGANG line
2. System checks main_phone, pro_shop_phone, buyer_direct_phone → no match
3. Rep Jordan is idle → call routes immediately
4. Screen shows: "UNKNOWN CALLER — (512) 555-9999"
5. Jordan answers: "Thanks for calling BYRDGANG, this is Jordan."
6. Caller says: "Hi, I'm the pro shop manager at Barton Creek CC in Austin. Saw your polos online."
7. Jordan searches "Barton Creek" → not in database
8. Jordan clicks "Create new course" button during the call:
   - Course name: Barton Creek Country Club
   - City: Austin, State: TX
   - Buyer: [caller name], Title: Pro Shop Manager
   - Phone: (512) 555-9999
9. Jordan pitches → caller wants a sample → "Sending sample" disposition
10. New course created at buyer_identified stage, immediately moves to sending_sample
11. Sample ships via Shopify → normal follow-up flow kicks in
12. This is a high-value inbound lead — tagged "inbound_interested" for priority

### Flow 7: Inbound Call — All Reps Busy
1. Course calls BYRDGANG at 2:30 PM
2. Both Alex and Jordan are on live outbound calls
3. Caller enters hold queue → hears branded hold message + music
4. Both reps see red banner: "1 CALLER HOLDING — Valley View Golf — 0:30"
5. Hold timer ticks up: 0:45... 1:00... 1:15...
6. Alex finishes outbound call → dispositions it → instead of "next dial":
   "Inbound call waiting — Valley View Golf (held 1:22) [Take call]"
7. Alex takes the inbound → full screen pop loads
8. Hold timer stops, banner disappears for all agents
9. If neither rep finishes within 2 minutes:
   → System auto-sends SMS: "Thanks for calling BYRDGANG. A rep will call you back within 10 minutes."
   → Creates high-priority callback task assigned to first available rep
   → Caller can still hold or hang up

### Flow 8: Inbound Call — After Hours
1. Course calls at 7:30 PM, no agents online
2. Auto-attendant: "Thanks for calling BYRDGANG. We're currently closed. Please leave a message."
3. Caller leaves voicemail: "Hey, this is Dave at Fox Hollow. Those polos arrived today, love the quality. Give me a call when you get a chance, want to place an order."
4. Voicemail recorded → Whisper transcribes locally → stored
5. System matches number to Fox Hollow GC → links to course record
6. Callback task created:
   - Assigned to: Alex (last agent who handled this course)
   - Priority: HIGH (voicemail mentions ordering intent)
   - Scheduled: next business day 8:30 AM
   - Notes: "VM transcript: wants to place an order after receiving sample"
7. Next morning Alex opens app → callback is #1 in queue with banner:
   "Voicemail from Fox Hollow GC — Dave Martinez wants to order"
8. Alex calls back → closes order → $1,200 deal

### Flow 9: Inbound During Outbound Call (Warm Transfer)
1. Alex is on a live outbound call with a cold list course
2. Inbound comes in: "INBOUND HOLDING — Thanksgiving Point GC (Sarah Chen) — 0:15"
3. Alex sees the banner, recognizes Sarah is an existing customer
4. Alex decides to wrap up the outbound call quickly
5. Dispositions outbound as "Call back later"
6. System immediately routes the inbound: "Take inbound — Sarah Chen at Thanksgiving Point GC"
7. Alex takes the call, Sarah wants a reorder
8. After the reorder is placed and dispositioned, Alex sees:
   "Resume dialer? You were on Cold List — Utah (position 47 of 142)"
   [Resume] [Pause] [End session]

---

## DATA ON EVERY COURSE (master field list for Course Detail Page)

**Course Fields:**
name, course_type, main_phone, pro_shop_phone, website, address_line1, address_line2, city, state, zip, region, holes, source, tags[], notes, ai_score, dnc, ivr_pro_shop_key, ivr_notes, ivr_direct_extension, timezone, phone_dial_priority, created_at, updated_at

**Buyer Fields (per course):**
buyer_name, buyer_title, buyer_direct_phone, buyer_email, buyer_shirt_size, buyer_identified_date, buyer_identified_by (agent), buyer_notes, buyer_linkedin

**Pipeline Fields:**
pipeline_stage, pipeline_stage_changed_at, pipeline_history[] (array of {stage, entered_at, exited_at}), next_follow_up_at, assigned_agent_id

**Call History:**
total_attempts, total_conversations, total_gatekeeper_calls, total_buyer_calls, total_inbound_calls, last_attempt_at, last_conversation_at, last_inbound_at, average_call_duration, best_time_to_reach (AI-determined)

**Inbound Fields:**
total_inbound_calls, last_inbound_at, last_inbound_disposition, inbound_source_number (which BYRDGANG number they called), has_left_voicemail, voicemail_transcript, pending_callback (boolean), callback_scheduled_at, callback_assigned_to

**Sample Fields:**
has_sample, sample_id, sample_status, sample_shipped_at, sample_delivered_at, sample_follow_up_at, sample_follow_up_completed, sample_converted

**Order Fields:**
total_orders, total_units_ordered, lifetime_revenue, last_order_at, average_order_value, reorder_frequency

---

## RESPONSIVE BEHAVIOR

**Desktop (1024px+):** Full sidebar nav + three-panel dialer + data tables
**Tablet (768-1024px):** Collapsed sidebar (icons only) + two-panel dialer (queue hidden, accessible via tab) + responsive tables
**Mobile (< 768px):** Bottom tab navigation + single-panel tabbed views + card-based layouts instead of tables + bottom sheet modals + larger touch targets (minimum 44px)

---

## UX PATTERNS & MICRO-INTERACTIONS

Everything below applies across the entire app. Dezmon should implement these as global patterns, not per-page one-offs.

### Agent Avatar Dropdown (top right)

Click the avatar circle to open a dropdown menu:
- **Agent card at top:** Avatar, full name, email, role badge (Agent / Manager / Admin)
- **Status selector:** Radio-style list with colored dots
  - 🟢 Available — receives inbound, appears in routing
  - 🟡 On Break — temporarily unavailable, will return (shows break timer)
  - 🔴 Do Not Disturb — no inbound routing, no notifications
  - ⚫ Offline — logged out of phone system
  - Changing status updates the `agents` table in real time via Supabase
- **Menu items:**
  - My Profile → Settings > Profile tab
  - Keyboard Shortcuts → opens shortcuts reference modal
  - Help & Support → link to docs/support
  - Dark Mode toggle (future — save preference per agent)
  - Log Out → clears session, sets status to offline

### Toast Notifications (Action Feedback)

Every user action that modifies data should show a toast notification confirming success or reporting failure. Toasts slide in from the top-right, stack vertically, auto-dismiss after 4 seconds, and have a manual dismiss X button.

**Success toasts (green left border):**
- "Sample order created — Shopify #1044"
- "Disposition saved — dialing next in 5s"
- "Notes saved for Riverside Golf Club"
- "Call back scheduled for Apr 5 at 9:00 AM"
- "Course moved to Buyer Identified"
- "Wholesale order #1003 created — $600"
- "SMS sent to Mike Thompson"
- "Email sent to mike@riversidegc.com"
- "Contact saved to course record"
- "Campaign activated — 142 courses queued"

**Error toasts (red left border):**
- "Failed to create Shopify order — check connection" [Retry button]
- "Call dropped — network issue" [Reconnect button]
- "Transcription failed for call #234" [Retry button]
- "Could not send SMS — invalid number"
- "Whisper error — recording saved, will retry transcription"

**Info toasts (blue left border):**
- "Inbound call from Riverside Golf Club — routing to you"
- "Sample delivered — follow-up auto-scheduled for Apr 3"
- "New coaching report available"
- "AI analysis complete for 12 calls"

### Call Control Toggle States

During a live call, control buttons must visually show their active/inactive state:

**Mute button:**
- Default: Gray icon, light background
- Active (muted): Red background, white microphone-slash icon, "Muted" label in red
- The rep should NEVER be confused about whether they're muted

**Hold button:**
- Default: Gray icon, light background  
- Active (holding): Amber/yellow background, white pause icon, "On Hold" label
- Hold timer appears next to button: "Hold 0:45"

**Record button:**
- Default: Gray icon
- Active (recording): Pulsing red dot, "Recording" label, red background
- Should indicate if recording is automatic (always on) vs. manual

**Speaker / Volume:**
- Should show volume level indicator
- Click to toggle speaker/headset

**All control buttons:** Tooltip on hover showing the keyboard shortcut

### Keyboard Shortcuts

Reps are on the phone all day. Mouse clicks are slow. Every critical action needs a keyboard shortcut.

**During a live call:**
| Shortcut | Action |
|----------|--------|
| `M` | Toggle mute |
| `H` | Toggle hold |
| `R` | Toggle recording |
| `E` | End call |
| `V` | Drop voicemail + advance |
| `S` | Skip to next contact |
| `P` | Toggle dialpad |
| `1-9` during dialpad open | Send DTMF tone |
| `N` | Focus notes textarea |
| `D` | Open disposition panel / cycle dispositions |
| `Enter` | Confirm selected disposition |
| `1-9` | Quick-select disposition by number |
| `Tab` | Switch between script / notes / dispositions panels |
| `G` | Toggle gatekeeper/buyer mode |

**Global (any page):**
| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open global search |
| `Cmd+Shift+D` | Jump to Dialer |
| `Cmd+Shift+C` | Jump to Courses |
| `Escape` | Close any modal / dropdown / search |

**Dialer states:**
| Shortcut | Action |
|----------|--------|
| `Space` | Start dialing (from Ready state) |
| `Space` | Pause/resume dialer |
| `Q` | Quit dialing session |

**Shortcut reference modal:**
- Opened from avatar dropdown "Keyboard Shortcuts"
- Or by pressing `?` anywhere
- Shows all shortcuts in a clean grid layout
- Grouped by context: Global, Dialer, Live Call

### Callback Scheduling UI

When rep clicks "Schedule callback" or selects a "Call back" disposition:

**Quick picker dropdown:**
- "In 1 hour"
- "In 3 hours"  
- "Tomorrow morning (9:00 AM)"
- "Tomorrow afternoon (2:00 PM)"
- "In 2 days"
- "In 1 week"
- "Custom date/time..." → opens full date/time picker

**Custom date/time picker:**
- Calendar date selector
- Time selector (15-minute increments)
- Timezone indicator (auto-detected from course location)
- "Set reminder" checkbox: remind me 5 min before
- Assign to: self (default) or select another agent
- Notes field: "What to say when you call back"

**After scheduling:**
- Toast: "Callback scheduled for Apr 5 at 9:00 AM"
- Course queue entry shows: "📅 Callback: Apr 5, 9am" badge
- When callback time arrives: notification + course jumps to top of queue

### Empty States

Every list and dashboard needs a friendly empty state when there's no data. Don't show a blank white page.

**Dialer — No campaigns:**
- Illustration or icon
- "No campaigns yet"
- "Create your first campaign to start dialing."
- [+ Create campaign] button

**Courses — No results after filter:**
- "No courses match your filters"
- "Try broadening your search or clearing filters."
- [Clear filters] button

**Samples — No samples sent:**
- Package icon
- "No samples sent yet"
- "Start dialing to send your first free polo sample."
- [Go to dialer] button

**Orders — No orders:**
- Shopping bag icon
- "No orders yet"
- "Orders are created when buyers convert from samples."
- [View sample pipeline] button

**Call Library — No recordings:**
- Microphone icon
- "No calls recorded yet"
- "Recordings will appear here after your first dialing session."

**Coaching — Not enough data:**
- Book icon
- "Need more call data for AI coaching"
- "The AI needs at least 20 analyzed calls to generate insights."
- Progress bar: "7 of 20 calls analyzed"

**Course Detail — No activity:**
- "No interactions with this course yet"
- [Start a call] button / [Send SMS] button

### Error States

**Network disconnected:**
- Banner at top of screen (below topbar): "Connection lost — reconnecting..."
- Auto-retry with exponential backoff
- When reconnected: "Connection restored" toast

**API failure:**
- Inline error message near the failed action
- Retry button
- Never silently fail — always tell the user what happened

**Call quality issues:**
- "Audio quality degraded" indicator near waveform
- "Call may have dropped — checking connection..."
- Auto-reconnect attempt

**Shopify integration down:**
- Sample modal shows: "Shopify connection error — try again or save as draft"
- [Retry] / [Save draft] buttons
- Draft samples appear in Samples dashboard with "Pending — Shopify error" status

### Loading States

**Page transitions:** Skeleton loaders that match the layout of the destination page. Not a generic spinner — show the shape of the content that's loading (card outlines, table row placeholders, text line blocks).

**Search results:** Show "Searching..." with a subtle animation, then results fade in.

**Call connecting:** Pulsing animation on the contact card (already have this for ringing state).

**Transcript loading:** Show "Transcribing..." with a progress indicator after a recording is saved.

**AI analysis:** Show "AI analyzing call..." with a progress bar.

**Recording playback:** Waveform loads progressively as audio buffers.

### Multi-Agent Awareness

**Agent presence indicators:**
- In the sidebar or a collapsible "Team" panel:
  - Each online agent: avatar, name, status (available / on call / break)
  - If on a call: which course they're calling, call duration
  - Live count: "2 agents online, 1 on call"

**Routing visibility:**
- When an inbound is holding, show which agents are available to take it
- When transferring, see who's available vs. busy

**Activity feed (optional, manager view):**
- Real-time feed of team activity: "Alex connected with Riverside GC", "Jordan sent sample to Fox Hollow"
- Helps managers see what's happening without hovering

### Call Transfer Flow

When rep clicks the Transfer button during a live call:

**Transfer modal / dropdown:**
- List of all agents with their current status:
  - "Jordan — 🟢 Available" [Transfer]
  - "Taylor — 🔴 On call (Fox Hollow) — 2:15" [Queue transfer]
  - "Morgan — ⚫ Offline" [unavailable]
- Two transfer types:
  - **Cold transfer:** Immediately route call to selected agent. Rep disconnects. Receiving agent gets screen pop.
  - **Warm transfer:** Rep stays on, brief the receiving agent first, then hand off. Three-way bridge temporarily.
- Search agents by name
- Transfer to external number (for forwarding to a manager's cell, etc.)

### Tab Count Badges

On Course Detail page, show counts on each tab:
- "Overview" (no count needed)
- "Activity (12)" — total interactions
- "Calls (4)" — total call recordings
- "Samples (1)" — total samples sent
- "Orders (2)" — total orders
- "AI" (no count, but could show score badge: "AI 83")

Counts help the rep quickly see how much history exists without clicking each tab.

### Recent & Favorites

**Recent courses (on Dialer idle screen):**
- "Recently contacted" section below campaign selector
- Last 5 courses the agent interacted with
- Course name, last action, timestamp
- Click to open course detail page or start a call

**Favorite / pinned courses:**
- Star icon on any course row or detail page
- Pinned courses appear in a "Pinned" section at top of Courses list
- Also accessible from dialer idle screen
- Useful for reps working a small set of high-priority leads

### Confirmation Dialogs

Destructive actions should require confirmation:
- "End dialing session? You've completed 47 of 142 courses." [End session] [Cancel]
- "Mark Valley View Golf as DNC? This will remove them from all campaigns." [Mark DNC] [Cancel]
- "Delete this note? This cannot be undone." [Delete] [Cancel]
- "Cancel this sample order? The Shopify order will be voided." [Cancel order] [Keep]

Non-destructive but significant actions should show a brief confirmation:
- "Start dialing Cold List — Utah? 142 courses in queue." [Start] [Back]

### Accessibility

- All interactive elements must be focusable and keyboard-navigable
- Minimum 4.5:1 contrast ratio for text (WCAG AA)
- All icons paired with labels or aria-labels
- Focus rings visible on tab navigation
- Screen reader support for call status changes
- Reduced motion mode: disable waveform, pulsing, and breathing animations

---

*This is the complete app map — App Shell + 9 sections + full inbound handling + order creation flows + message composers + notifications + global search + comprehensive UX patterns. All dialer states, all sub-pages, all data fields, all user flows, all micro-interactions mapped. Ready for build.*
