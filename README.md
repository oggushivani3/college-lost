# College Campus Lost & Found Portal

Welcome to the **College Campus Lost & Found Portal**! This is a modern, responsive web application built with **React, Tailwind CSS, Framer Motion, Node.js + Express**, and supports local mock stores as well as production integrations for **Firebase Authentication and Cloudinary Storage**.

---

## Technical Stack & Features

- **Frontend**: React.js SPA (scaffolded with Vite), Tailwind CSS v3 for responsive grid styling, Lucide React icons, and Framer Motion for premium card animations, transitions, and theme triggers.
- **Backend**: Node.js & Express.js REST API with file-based JSON stores (`/backend/data/`) to enable instant out-of-the-box local executions.
- **Real-Time AI Matching**: Scans categories, descriptions (fuzzy keyword Jaccard term overlap), locations, and date ranges dynamically upon new reports and notifies matching users immediately.
- **QR Code Engine**: Generates sharing QR codes automatically for every single reported listing.
- **Demo Mode**: Allows testing different roles (Student vs Admin) and actions immediately when Firebase configuration is absent.

---

## Project Structure

```text
college-lost-found/
├── backend/
│   ├── data/                 # File-based JSON database tables
│   │   ├── users.json
│   │   ├── lost_items.json
│   │   ├── found_items.json
│   │   ├── claims.json
│   │   └── notifications.json
│   ├── src/
│   │   ├── controllers/      # Express API handlers
│   │   ├── routes/           # Express URL routing
│   │   ├── services/         # Real-time AI matching logic
│   │   └── index.js          # Backend API server entrance
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Layouts (Navbar, Footer)
│   │   ├── context/          # Authentication & Theme Contexts
│   │   ├── pages/            # View Pages (Home, Browse, Report, Dashboard, Admin)
│   │   ├── App.jsx           # App layout assembly
│   │   ├── index.css         # Tailwind & custom CSS variables
│   │   └── main.jsx          # React entrance
│   ├── package.json
│   └── tailwind.config.js
├── package.json              # Monorepo configuration
└── README.md                 # Project guide
```

---

## Local Setup & Quick Start

Follow these steps to run the portal on your system.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [NPM](https://www.npmjs.com/) (usually bundles with Node.js)

### Installation

1. Navigate to the project root directory.
2. Install all dependencies across the project monorepo by running:
   ```bash
   npm run install-all
   ```

### Running Locally

To start both the frontend development server and the backend API server concurrently, execute:
```bash
npm start
```

- **Frontend client** will run at: [http://localhost:5173](http://localhost:5173)
- **Backend API server** will run at: [http://localhost:5000](http://localhost:5000)

---

## Production Setup & Integrations

For production deployment, you can configure the portal to connect to actual cloud services:

1. **Authentication (Firebase Google Sign-In)**:
   Create a project on [Firebase Console](https://console.firebase.google.com/), enable Google Provider in Authentication tab, and create a `.env` in `frontend/` containing:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   ```
   *Note: If these variables are not found, the portal automatically loads **Demo Mode** on Google Sign-In click, enabling you to select pre-configured student or administrator profiles.*

2. **Database (MongoDB or Firestore)**:
   You can easily redirect backend file reads and writes inside [backend/src/controllers/apiControllers.js](file:///c:/Users/oggus/Desktop/college%20lost/backend/src/controllers/apiControllers.js#L23-L33) to point to standard Mongoose or Firestore models.

3. **Storage (Cloudinary)**:
   Provide Cloudinary client credentials in `backend/.env` to switch image uploading inside [backend/src/routes/apiRoutes.js](file:///c:/Users/oggus/Desktop/college%20lost/backend/src/routes/apiRoutes.js#L22-L37) from local disk uploads to direct Cloudinary uploads.
