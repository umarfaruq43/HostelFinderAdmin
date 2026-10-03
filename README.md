# OCHF Admin Portal - Off-Campus Hostel Finder

A modern, high-performance administrative control console for the **Off-Campus Hostel Finder (OCHF)** platform, built with **React 19**, **TypeScript**, **Vite**, **TanStack React Query**, and pure modern **Vanilla CSS**.

---

## 🚀 Live Backend Integration
- **Base URL**: `https://hostelfinderbe.onrender.com`
- **Default Super Admin**: `admin@ochf.com`
- **Default Password**: `AdminPassword123!`

---

## 🛠 Features & Endpoints Consumed

### 1. Authentication & Session Management
- `POST /auth/login`: Admin authentication with token persistence in `localStorage`.
- `GET /auth/me`: Profile and token validity verification on boot.
- One-click **Demo Credentials Auto-fill** on login.
- Dynamic Base URL switcher in login and settings.

### 2. Platform Overview & Metrics (`/`)
- Real-time aggregated metric cards:
  - Total users count with student/provider breakdown.
  - Pending student verifications count.
  - Pending provider accreditations count.
  - Property listings awaiting moderation.
  - Platform booked inspections count.
  - Open user reports/disputes counter.
- Quick preview feeds for pending properties and student queues.
- Registered campus proximity anchor badges.

### 3. User Directory & Account Governance (`/users`)
- `GET /admin/users?role=&status=&q=`: Filter by role (`student`, `provider`, `admin`), account status (`active`, `suspended`), or search by name/email with debouncing.
- `PUT /admin/users/:userId/status`: Suspend or reactivate user accounts with required moderation reason prompt.
- `POST /notifications/announce`: Dispatch targeted announcements directly to specific user accounts.

### 4. Student Verification Queue (`/students`)
- `GET /admin/students?status=pending|verified|rejected`: Tabbed review queue for student applicants.
- `PUT /admin/students/:studentProfileId`: Approve (`verified`) or reject student profiles with optional reason.
- Campus mapping to assigned institutions.
- Detailed modal inspector for student applicants.

### 5. Provider Accreditation Queue (`/providers`)
- `GET /admin/providers?status=pending|verified|rejected`: Tabbed queue for landlord/agency accreditations.
- `PUT /admin/providers/:providerProfileId`: Review and approve/reject landlord business credentials.
- Detailed landlord inspection modal.

### 6. Property Listings Moderation (`/properties`)
- `GET /admin/properties?status=pending|verified|rejected`: Queue for newly submitted hostel listings.
- `PUT /admin/properties/:propertyId`: Approve listings to publish to students, or reject with feedback.
- Photo gallery carousel, price formatting (₦), additional charges breakdown (caution fee, waste & security), amenities pills, and campus distance/driving time metrics.

### 7. Platform Inspections (`/inspections`)
- `GET /admin/inspections?status=`: Comprehensive view of all platform viewing appointments.
- Filter by status: `confirmed`, `requested`, `completed`, `missed`, `cancelled`, `declined`.
- Track student decisions (`accepted` / `rejected` with reasons).

### 8. Dispute & Flagged Reports (`/reports`)
- `GET /admin/reports?status=open|reviewed|resolved`: Filter and audit open disputes, misleading listings, or spam.
- `PUT /admin/reports/:reportId`: Mark tickets as `reviewed` (in progress) or `resolved`.

### 9. Schools & Campuses (`/schools`)
- `GET /schools?q=`: Browse registered tertiary institutions used as proximity anchors.
- `POST /schools`: Register new university campuses with geographical latitude & longitude.
- Quick presets for major universities + direct Google Maps pin links.

### 10. System Diagnostics & Notifications (`/notifications`)
- `POST /notifications/test`: Real-time SMTP email delivery diagnostic health check.
- `POST /notifications/announce`: Broadcast announcement dispatcher to any registered user.

### 11. Complete DELETE Operations Integration
- **`DELETE /auth/me` (Delete Account)**: Available in **Settings & Configuration** under the **Danger Zone**. Requires confirmation with the user's current password (`{ "password": "..." }`), cascades linked profile deletions, revokes the session, and redirects to login.
- **`DELETE /properties/:id` (Delete Property Listing)**: Available in **Property Moderation Queue** table actions and within the **Property Detail Modal**. Permanently deletes the listing document with ownership verification.
- **`DELETE /inspections/:id` (Cancel Inspection Booking)**: Available in **Platform Inspections** table for active bookings. Sets inspection status to `cancelled`, atomically flips the booked slot back to `open` status for other students, and dispatches cancellation notifications.
- **`DELETE /slots/:id` (Remove Inspection Slot)**: Available inside the **Property Detail Modal** under the **Inspection Slots** tab. Atomically deletes unbooked `open` time slots and prevents race conditions (returns 409 Conflict if already booked).
- **`DELETE /reviews/:id` (Delete Review)**: Available in the dedicated **Reviews & Ratings Moderation** section and within the **Property Detail Modal** Reviews tab. Deletes offending or inappropriate reviews with student author verification.

### 12. System & API Configuration (`/settings`)
- Custom Base URL configuration.
- Real-time API Ping diagnostic tool with latency measurement in milliseconds.
- Admin Bearer Token viewer with 1-click clipboard copy.
- React Query cache invalidation button.
- Danger Zone account deletion dialog (`DELETE /auth/me`).
- Dark & Light theme switcher.

---

## 💻 Getting Started Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```

Development server runs on: `http://localhost:5173/`
