# 🚚 FleetTraq

FleetTraq is a web-based fleet management system built with React and Firebase. It helps businesses monitor vehicles in real time, onboard drivers securely with invite codes, and manage day-to-day fleet operations from a single dashboard.

**Live app:** [fleettraq.vercel.app](https://fleettraq.vercel.app)

## 🌟 Features

- 🔍 **Live GPS tracking** — Leaflet map on the admin dashboard; drivers share location automatically after approval and vehicle assignment
- 🧑‍✈️ **Driver onboarding** — Invite codes, admin approval, roster sync, and vehicle assignment
- 🚗 **Vehicle management** — Add vehicles, set status (Active, Maintenance, On Route, etc.), assign drivers
- 📊 **Admin dashboard** — Fleet stats, live map, vehicle status (Moving / Parked / Offline), maintenance alerts
- 🛢 **Fuel tracking** — Log and monitor fuel usage per vehicle
- 📋 **Reports** — Maintenance, fuel, incident, performance, and summary reports (admin-managed)
- 📈 **Analytics** — Fleet charts and vehicle status breakdown
- 🔔 **Notifications** — In-app alerts for fleet updates
- 🌙 **Dark mode** — Responsive layout for desktop and mobile
- 🔐 **Scoped access** — Firestore security rules enforce organization boundaries and role-based permissions

## 👥 Roles

| Role | What they can do |
|------|------------------|
| **Admin** | Create the fleet, manage vehicles/drivers, view live map, approve drivers, generate invite codes |
| **Driver** | Sign up with an invite code, wait for approval, then share GPS from their phone while logged in |

## 🧰 Tech Stack

- **Frontend:** React 18, React Router, Tailwind CSS, Framer Motion, Chart.js
- **Backend:** Firebase Auth, Firestore, Storage, Cloud Functions
- **Maps:** Leaflet / react-leaflet (OpenStreetMap tiles)
- **Deployment:** Vercel (frontend), Firebase (rules, indexes, functions)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- A Firebase project (Blaze plan required only if deploying Cloud Functions)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/OketchManu/fleettraq.git
   cd fleettraq
   ```

2. Install dependencies:

   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. Configure Firebase:

   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable **Authentication** (Email/Password and Google sign-in)
   - Create a **Firestore** database
   - Copy your web app config into `src/firebase.js`

4. Run locally:

   ```bash
   npm start
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Deploy Firebase backend

Log in and select your project:

```bash
firebase login
firebase use your-project-id
```

Deploy Firestore rules and indexes:

```bash
firebase deploy --only firestore
```

Deploy Cloud Functions (optional — requires Blaze plan):

```bash
firebase deploy --only functions
```

The `permanentlyDeleteDriver` callable function removes a driver from Auth, Firestore, and related fleet data (tracking, fuel, notifications).

## 📋 Fleet setup (quick guide)

### Administrator (office / laptop)

1. Sign up as **Admin** — your Firebase UID becomes the fleet organization ID.
2. Copy the **Driver Invite Code** from the Dashboard, Drivers page, or Help.
3. Add vehicles under **More → Vehicles**.
4. When a driver signs up, open **More → Drivers** → **Approve** (and **Sync to roster** if needed).
5. Assign each driver to a vehicle on the Drivers page or under **Vehicles → Assigned driver**.

### Driver (phone in the vehicle)

1. Sign up as **Driver** and enter the admin’s **Invite Code**.
2. Wait for approval before using fleet features.
3. After approval, log in and **allow location access**. Keep the FleetTraq tab open — GPS shares automatically in the background.
4. Open **Tracking** to confirm your assigned vehicle and view your position on the map.

### View live locations (admin)

1. Open **Dashboard → Live Fleet Location** for vehicles with active GPS.
2. Check **Live Vehicle Status** for Moving, Parked, or Offline.

More detail is in the in-app **Help & Setup** page.

## 📁 Project structure

```
fleettraq/
├── src/
│   ├── components/     # UI pages and shared components
│   ├── context/        # FleetContext (auth, fleet data)
│   ├── hooks/          # useDriverGpsTracker (background GPS)
│   └── utils/          # Invites, motion state, device ID, etc.
├── functions/          # Firebase Cloud Functions
├── firestore.rules     # Security rules (deploy to Firebase)
└── firestore.indexes.json
```

## 🔒 Security

Firestore rules restrict reads and writes by role and organization. Highlights:

- Drivers must sign up with a valid **invite code** (`inviteCodeUsed`)
- Tracking writes are scoped to the driver’s assigned vehicle and registered device
- Vehicles, reports, driver roster, and invites are admin-managed
- Fuel record updates cannot change the linked `vehicleId`

Deploy rule changes with `firebase deploy --only firestore:rules`.

## 📄 License

Private project — see repository owner for usage terms.
