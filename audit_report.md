# 🔍 Data Structures Visualizer — Full Audit Report

Comprehensive analysis of bugs, security flaws, missing features, and architectural issues across the entire codebase.

---

## 🔴 Critical / Security Issues

### 1. No Authentication on API Endpoints — Anyone Can Impersonate Any User

> [!CAUTION]
> **All backend endpoints trust the client-supplied `user_email` with zero server-side authentication.** There are no JWT tokens, session cookies, or any mechanism to verify the caller is who they claim to be.

**Impact:** Any user (or attacker) can:
- Create presentations under someone else's email
- List and read another teacher's private presentations
- Save/overwrite slide configs on presentations they don't own (the ownership check in `save-slide-config` compares against the **client-supplied** `user_email`, which can be faked)

**Affected files:**
- [create-presentation/index.ts](file:///c:/Transfer/Sites/whiteboard/backend/supabase/functions/create-presentation/index.ts) — line 23
- [get-presentations/index.ts](file:///c:/Transfer/Sites/whiteboard/backend/supabase/functions/get-presentations/index.ts) — line 23
- [save-slide-config/index.ts](file:///c:/Transfer/Sites/whiteboard/backend/supabase/functions/save-slide-config/index.ts) — line 29

---

### 2. No Email Domain Validation on Presentation Endpoints

The `create-presentation`, `get-presentations`, and `save-slide-config` functions accept **any** `user_email` — they never call `isAllowedEmail()`. Only the auth endpoints validate the `@bmsce.ac.in` domain. An attacker can create presentations with `attacker@evil.com`.

**Affected files:**
- [create-presentation/index.ts](file:///c:/Transfer/Sites/whiteboard/backend/supabase/functions/create-presentation/index.ts)
- [get-presentations/index.ts](file:///c:/Transfer/Sites/whiteboard/backend/supabase/functions/get-presentations/index.ts)
- [save-slide-config/index.ts](file:///c:/Transfer/Sites/whiteboard/backend/supabase/functions/save-slide-config/index.ts)

---

### 3. RLS Policies Are Useless (Using `auth.uid()` but Custom Auth)

> [!WARNING]
> The SQL schema defines RLS policies using `auth.uid()::text = user_id`, but the app uses a **custom password auth system** — not Supabase Auth. `auth.uid()` will always be `null` for these requests. 

The edge functions use the **service_role key** which **bypasses RLS entirely**, so the policies are dead code. If you ever switch to the anon key, all policies will deny access because `auth.uid()` is never set.

**Affected file:** [schema.sql](file:///c:/Transfer/Sites/whiteboard/backend/supabase/sql/schema.sql) — lines 62-126

The one policy that does work: `"anon read by share token"` with `using (true)` — this grants full read access to **all** presentations to **any** anonymous user, not just ones with the correct share token.

---

### 4. `document.execCommand('copy')` Is Deprecated

> [!WARNING]
> [script.js line 703](file:///c:/Transfer/Sites/whiteboard/script.js#L700-L705) uses the deprecated `document.execCommand('copy')`. This is already removed in some browsers.

```javascript
// Current (broken in modern browsers)
shareUrl.select();
document.execCommand('copy');

// Should use
navigator.clipboard.writeText(shareUrl.value);
```

---

### 5. XSS Risk via `innerHTML` in Slide Content

[script.js lines 326-329](file:///c:/Transfer/Sites/whiteboard/script.js#L326-L329) injects slide content directly via `innerHTML`:
```javascript
this.elements.slideContent.innerHTML = `
  <h2 class="slide-title">${slide.title}</h2>
  ${slide.content}
`;
```
While the slides are currently hardcoded, the `slide.title` is inserted without escaping. If slide content ever comes from user input or the database (e.g., from `slide_configs`), this becomes an XSS vector.

---

## 🟠 Bugs — Things That Are Broken

### 6. `openPresentation()` Clobbers the Create Modal's `#presentation-title` Input

> [!IMPORTANT]
> Both the "Create Presentation" modal and the presentation viewer header use an element with `id="presentation-title"`.

- The `<input>` in the create modal: [index.html line 284](file:///c:/Transfer/Sites/whiteboard/index.html#L284)
- The `<h2>` in the viewer header: [index.html line 160](file:///c:/Transfer/Sites/whiteboard/index.html#L160)

**Result:** `document.getElementById('presentation-title')` always returns the **first match** (the `<input>`). When `openPresentation()` runs:
```javascript
document.getElementById('presentation-title').textContent = presentation.title;
```
It sets `.textContent` on the **`<input>` element**, which does nothing visible. The viewer `<h2>` title is never updated. Same bug in `loadPublicPresentation()` at [line 734](file:///c:/Transfer/Sites/whiteboard/script.js#L734).

---

### 7. `deletePresentation()` Is Not Implemented

[script.js lines 707-712](file:///c:/Transfer/Sites/whiteboard/script.js#L707-L712):
```javascript
async deletePresentation(presentationId) {
    if (!confirm('...')) return;
    // TODO: Implement delete endpoint
    alert('Delete functionality coming soon');
}
```
The delete button renders on every presentation card, but clicking it just shows an alert. No backend endpoint exists.

---

### 8. `btn-dashboard` Has Two Click Listeners (Double Navigation + Double API Call)

[script.js line 92](file:///c:/Transfer/Sites/whiteboard/script.js#L92) registers:
```javascript
document.getElementById('btn-dashboard').addEventListener('click', () => this.showScreen('dashboard'));
```
Then [line 257](file:///c:/Transfer/Sites/whiteboard/script.js#L255-L258) registers **another** listener on the same button:
```javascript
dashboardBtn.addEventListener('click', () => this.loadPresentations());
```
Both fire on every click. This works accidentally (screen switches and data loads), but it means `loadPresentations()` fires every time the button is clicked even if data is already loaded, and there's no loading indicator.

---

### 9. `ArrayVisualizer.reset()` Called Without `capacity` Parameter

[script.js line 181](file:///c:/Transfer/Sites/whiteboard/script.js#L179-L184):
```javascript
this.visualizer.reset([...this.initialValues]);
```
But `reset()` calls `this.init(values)` **without a capacity argument**:
```javascript
reset(values) {
    this.anim.abort();
    this.init(values);  // capacity is undefined → defaults to values.length
    this.clearInfo();
}
```
This loses the original capacity. If the user created an array with size=10 and 5 values, resetting collapses capacity to 5.

---

### 10. Share URL Pattern Breaks on Non-Hex Share Tokens

The `bootstrapApp()` URL regex at [auth.js line 185](file:///c:/Transfer/Sites/whiteboard/backend/auth/auth.js#L185):
```javascript
const publicPresentMatch = path.match(/^\/present\/([a-f0-9]+)$/);
```
Only matches lowercase hex `[a-f0-9]`. The share tokens generated by PostgreSQL's `encode(gen_random_bytes(16), 'hex')` do produce lowercase hex, but if tokens are ever changed to include uppercase or other characters, the routing breaks silently.

---

### 11. `save-slide-config` Rejects `slide_number = 0`

[save-slide-config/index.ts line 30](file:///c:/Transfer/Sites/whiteboard/backend/supabase/functions/save-slide-config/index.ts#L30):
```typescript
if (!presentation_id || !slide_number || !user_email)
```
`!slide_number` is `true` when `slide_number === 0`. If slides are zero-indexed, the first slide can never be saved.

---

### 12. Public Presentation View Shows Auth-Required UI Elements

When a public viewer loads `/present/[token]`, the presentation viewer shows:
- **"Share" button** — [index.html line 163](file:///c:/Transfer/Sites/whiteboard/index.html#L163) — still visible (public viewers don't need to share)
- **"Toggle View" button** — visible
- **"Back" button** goes to dashboard — [line 101](file:///c:/Transfer/Sites/whiteboard/script.js#L101): `showScreen('dashboard')` — but the dashboard requires auth
- **Presentation controls** (traverse, search, reset) are all active — `setReadOnlyMode(true)` only hides the "Save Config" button

---

### 13. `home-grid` Layout: Cards Stack Vertically Instead of Side-by-Side

[index.html lines 76-87](file:///c:/Transfer/Sites/whiteboard/index.html#L76-L87) has a `.home-grid` containing two cards, but there's no CSS rule for `.home-grid`. The cards use `margin: 0 auto` which forces them into a vertical single-column stack. The "Teacher Dashboard" card is likely below the fold.

---

### 14. No Loading States / Error Feedback for Async Operations

- `loadPresentations()` shows no spinner or loading text while fetching
- `handleCreatePresentation()` doesn't disable the submit button during the request (can submit duplicates)
- `openPresentation()` uses `alert()` for errors — the entire app has no toast/snackbar system
- Network failures show raw error messages via `alert()`

---

## 🟡 Missing Features / Incomplete Implementations

### 15. "Save Config" Button Does Nothing

The `#presentation-btn-save-config` button exists in the HTML ([line 183](file:///c:/Transfer/Sites/whiteboard/index.html#L183)) but has **no event listener** attached anywhere in `script.js`. The `save-slide-config` edge function exists on the backend but is never called from the frontend.

---

### 16. Presentation Visualizer Controls Not Wired Up

The presentation viewer has its own set of controls ([index.html lines 180-188](file:///c:/Transfer/Sites/whiteboard/index.html#L180-L188)):
- `#presentation-btn-traverse`
- `#presentation-btn-search`
- `#presentation-btn-reset`
- Speed buttons

**None of these have event listeners.** Only the main visualizer screen buttons are wired. Clicking traverse/search/reset in the presentation viewer does nothing.

---

### 17. Language Switcher in Presentation Code Panel Not Wired

The presentation viewer has its own code panel with C/Python language buttons ([index.html lines 196-199](file:///c:/Transfer/Sites/whiteboard/index.html#L196-L199)), but the language switcher listeners use `document.querySelectorAll('.lang-btn')` which also catches these buttons. However, the presentation code panel (`#presentation-code-content`) is never written to — only the main visualizer's `#code-panel-content` is updated.

---

### 18. Slide Configs Are Never Loaded or Applied

The database has a `slide_configs` table, and `get_presentation_by_token` returns `slide_configs` data, but:
- `openPresentation()` ignores the returned `slide_configs`
- `initPresentationVisualizer()` hardcodes `[10, 20, 30, 40, 50]` with capacity 10
- There's no UI to choose between array/linked-list visualizer types per slide

---

### 19. No Presentation Edit/Update Capability

- No endpoint to update presentation title/description/URL
- No endpoint to delete presentations
- No way to change the Google Slides URL after creation

---

### 20. `create-presentation-form` Uses Default Form Behavior (Not `method="dialog"`)

The create presentation dialog ([index.html line 280](file:///c:/Transfer/Sites/whiteboard/index.html#L280)):
```html
<form class="modal-content" id="create-presentation-form">
```
Unlike other modals, this form has no `method="dialog"`. The JS handler calls `e.preventDefault()` so it works, but if the handler throws, the form will try to navigate. Additionally, the `create-presentation-cancel` button calls `.close()` but doesn't reset the form, leaving stale data.

---

## 🔵 Architecture / Code Quality Issues

### 21. `window.app` Created Multiple Times

- [auth.js line 170](file:///c:/Transfer/Sites/whiteboard/backend/auth/auth.js#L170): `window.app = new App()` — after login
- [auth.js line 189](file:///c:/Transfer/Sites/whiteboard/backend/auth/auth.js#L189): `window.app = new App()` — for public presentations
- [auth.js line 195](file:///c:/Transfer/Sites/whiteboard/backend/auth/auth.js#L195): `window.app = new App()` — for returning logged-in users

Each `new App()` re-attaches **all event listeners** to the same DOM elements. If a user logs in, every button will have doubled listeners from the constructor's `_bindEvents()`. Over time this causes multiple handler executions.

---

### 22. `btn-speed` Event Listeners Affect Both Visualizers Unintentionally

[script.js lines 151-157](file:///c:/Transfer/Sites/whiteboard/script.js#L151-L157) uses `document.querySelectorAll('.btn-speed')` which selects speed buttons from **both** the main visualizer screen AND the presentation viewer screen. Clicking a speed button in one view toggles `.active` on all speed buttons across both views.

---

### 23. `presentation-title` Input ID Collision (Duplicate IDs)

As noted in Bug #6, the HTML has two elements with `id="presentation-title"`:
- [Line 160](file:///c:/Transfer/Sites/whiteboard/index.html#L160): `<h2 class="viz-title" id="presentation-title">`
- [Line 284](file:///c:/Transfer/Sites/whiteboard/index.html#L284): `<input type="text" id="presentation-title">`

Duplicate IDs are invalid HTML and cause unpredictable `getElementById()` behavior.

---

### 24. `ModuleRegistry` Defined but Never Used

[script.js lines 763-768](file:///c:/Transfer/Sites/whiteboard/script.js#L763-L768):
```javascript
const ModuleRegistry = {
  array: { title: 'Arrays', Visualizer: ArrayVisualizer },
  linkedlist: { title: 'Linked Lists', Visualizer: LinkedListVisualizer },
};
window.ModuleRegistry = ModuleRegistry;
```
This is defined and exposed globally but never referenced anywhere. Dead code.

---

### 25. Inline `onclick` Handlers in Presentation Cards — Fragile Patterns

[script.js lines 577-578](file:///c:/Transfer/Sites/whiteboard/script.js#L577-L578):
```javascript
onclick="window.app.openPresentation('${p.id}', '${p.share_token}')"
onclick="window.app.deletePresentation('${p.id}')"
```
Uses inline `onclick` with string interpolation. If a presentation ID or share token contains a `'` character, this breaks. More importantly, it couples HTML rendering to a global `window.app` reference.

---

### 26. `presentationVisualizer` Shares the Same `AnimationController` Instance

The main visualizer and the presentation visualizer both use `this.anim` (the single `AnimationController`). If a teacher is in the middle of a traversal animation, switches to the presentation view, and triggers another animation, both share the same abort flag and speed — they interfere with each other.

---

### 27. CORS Set to Wildcard `*` in Production

[cors.ts](file:///c:/Transfer/Sites/whiteboard/backend/supabase/functions/_shared/cors.ts#L1-L7):
```typescript
"Access-Control-Allow-Origin": "*"
```
All edge functions are publicly accessible from any origin. While acceptable during development, this should be restricted to the actual domain in production.

---

### 28. `Netlify.toml` `force = false` May Not Route Correctly

[netlify.toml line 8](file:///c:/Transfer/Sites/whiteboard/netlify.toml#L8): `force = false` means Netlify will serve existing files first. If any static file matches a path pattern like `/present/`, it will be served instead of the rewrite to `index.html`. This is subtle and can cause hard-to-debug routing issues.

---

## 📋 Summary Table

| # | Severity | Category | Issue |
|---|----------|----------|-------|
| 1 | 🔴 Critical | Security | No authentication on API endpoints |
| 2 | 🔴 Critical | Security | No email domain validation on presentation APIs |
| 3 | 🔴 Critical | Security | RLS policies reference `auth.uid()` but custom auth is used |
| 4 | 🔴 Critical | Compat | `document.execCommand('copy')` deprecated |
| 5 | 🔴 Critical | Security | Potential XSS via `innerHTML` |
| 6 | 🟠 Bug | DOM | Duplicate `#presentation-title` ID clobbers title update |
| 7 | 🟠 Bug | Feature | `deletePresentation()` not implemented |
| 8 | 🟠 Bug | Logic | Dashboard button has two click listeners |
| 9 | 🟠 Bug | Logic | Array reset loses original capacity |
| 10 | 🟠 Bug | Routing | Share URL regex only matches lowercase hex |
| 11 | 🟠 Bug | Backend | `save-slide-config` rejects `slide_number = 0` |
| 12 | 🟠 Bug | UX | Public view shows auth-required UI elements |
| 13 | 🟠 Bug | CSS | `.home-grid` has no grid layout styles |
| 14 | 🟠 Bug | UX | No loading states or proper error handling |
| 15 | 🟡 Missing | Feature | "Save Config" button has no listener |
| 16 | 🟡 Missing | Feature | Presentation visualizer controls not wired |
| 17 | 🟡 Missing | Feature | Presentation code panel language switcher broken |
| 18 | 🟡 Missing | Feature | Slide configs never loaded or applied |
| 19 | 🟡 Missing | Feature | No edit/update/delete for presentations |
| 20 | 🟡 Missing | Form | Create modal form missing `method="dialog"` |
| 21 | 🔵 Quality | Architecture | `App` constructor re-registers all listeners |
| 22 | 🔵 Quality | Logic | Speed buttons shared across both visualizer contexts |
| 23 | 🔵 Quality | HTML | Duplicate element IDs |
| 24 | 🔵 Quality | Dead Code | `ModuleRegistry` never used |
| 25 | 🔵 Quality | Pattern | Inline `onclick` handlers with string interpolation |
| 26 | 🔵 Quality | Architecture | Shared `AnimationController` across visualizers |
| 27 | 🔵 Quality | Security | CORS wildcard `*` in production |
| 28 | 🔵 Quality | Config | Netlify rewrite `force = false` may fail |
