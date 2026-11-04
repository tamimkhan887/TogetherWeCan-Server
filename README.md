# Together We Can — Backend API 🤝

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

> Robust, serverless-ready RESTful API powering **Together We Can** — a community-driven volunteering platform connecting individuals with impactful social drives, charity events, and environmental campaigns.

---

## 🌐 Live Deployments & Repositories

| Component | URL / Repository |
| :--- | :--- |
| **Live API Server** | [`https://together-we-can-server.vercel.app`](https://together-we-can-server.vercel.app) |
| **Backend Repository** | [GitHub: TogetherWeCan-Server](https://github.com/tamimkhan887/TogetherWeCan-Server) |
| **Frontend Application** | [`https://together-we-can-md-tamim-khans-projects.vercel.app`](https://together-we-can-md-tamim-khans-projects.vercel.app) |
| **Frontend Repository** | [GitHub: TogetherWeCan](https://github.com/tamimkhan887/TogetherWeCan) |

---

## 🌟 Key Features

- **📅 Event Lifecycle Management (CRUD)**:
  - Create, view, update, and remove volunteer events.
  - Automatically segregates events into **Upcoming** and **Past** drives based on the current date.
  - Organizer-specific querying to manage events created by authenticated organizers.

- **🤝 Volunteer Participation System**:
  - Seamlessly join community events with automated validations.
  - **Self-Join Prevention**: Organizers are blocked from joining their own events as volunteers.
  - **Status Validation**: Automatically blocks registration for expired or completed drives.
  - **Duplicate Prevention**: Rejects duplicate registrations for the same event and user.
  - View participants/volunteers list for each individual event.
  - Ability to cancel volunteer attendance at any time.

- **🔒 Token Verification & Security**:
  - Protected API routes using **JWT verification** via **JWKS** (JSON Web Key Set) integrated with the frontend authentication system.
  - CORS configured for secure cross-origin requests.

- **⚡ Serverless-Optimized Architecture**:
  - Engineered specifically for **Vercel Serverless Functions**.
  - Dynamic connection pooling and automatic reconnect logic to prevent `Topology is closed` cold-start issues.
  - Resilient Proxy collections and uniform JSON error handling.

---

## 🛠️ Tech Stack

- **Runtime & Framework**: [Node.js](https://nodejs.org/) (ES Modules) & [Express.js v5](https://expressjs.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with official Node.js Driver (`mongodb v7`)
- **Authentication**: [Jose](https://github.com/panva/jose) (JWT / JWKS verification)
- **Environment Management**: [Dotenv](https://www.npmjs.com/package/dotenv)
- **Deployment & Hosting**: [Vercel](https://vercel.com/) (Serverless Runtime `@vercel/node`)

---

## 📚 API Endpoints Reference

### 1. Base / System Health
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/` | No | Server health check; returns `{ message: "Api Is Running" }` |

---

### 2. Events (`/upcomingevents` & `/pastevents`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/upcomingevents` | No | Fetch upcoming events (sorted by date ascending, limited to 6 for homepage) |
| `GET` | `/pastevents` | No | Fetch past events (`date < today`, sorted by date descending) |
| `GET` | `/upcomingevents/:idOrEmail` | Optional / Yes | Fetch single event details by ObjectId **OR** all upcoming events created by organizer email |
| `POST` | `/upcomingevents` | **Bearer Token** | Create a new community event drive |
| `PATCH` | `/upcomingevents/:id` | No | Update event details by event ID |
| `DELETE` | `/upcomingevents/:id` | No | Delete an event by event ID |

#### Querying by `:idOrEmail`:
- If parameter is a valid **ObjectId** (e.g. `6ae907f2461c51117cca87a9`): Returns the single event object.
- If parameter contains an **email** (e.g. `organizer@example.com`): Requires `Authorization: Bearer <token>` and returns all active events posted by that organizer.

---

### 3. Joined Events / Volunteering (`/joinedevents`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/joinedevents` | No | Register/join an event as a volunteer |
| `DELETE` | `/joinedevents/:id` | No | Cancel attendance by registration `_id` or `eventId` |
| `GET` | `/joinedevents/event/:eventId` | No | Fetch all volunteer attendees registered for a specific event |
| `GET` | `/joinedevents/:email` | **Bearer Token** | Fetch all drives joined by a specific volunteer |

---

## 📋 Sample Request & Response Payloads

### Create an Event (`POST /upcomingevents`)
**Headers**: `Authorization: Bearer <token>`
```json
{
  "title": "Winter Warmth Drive 2026",
  "category": "Donation",
  "date": "2026-11-20T10:00",
  "location": "Dhanmondi Community Center, Dhaka",
  "maxCapacity": 50,
  "description": "Distributing warm clothes and blankets to underprivileged families.",
  "image": "https://images.unsplash.com/photo-example",
  "organizerName": "Md. Tamim Khan",
  "organizerEmail": "tamimkhan887@gmail.com",
  "organizerAvatar": "https://example.com/avatar.jpg"
}
```

### Join an Event (`POST /joinedevents`)
```json
{
  "eventId": "6ae907f2461c51117cca87a9",
  "eventTitle": "Winter Warmth Drive 2026",
  "eventDate": "2026-11-20T10:00",
  "userEmail": "volunteer@example.com",
  "userName": "Volunteer Name",
  "userAvatar": "https://example.com/user.jpg",
  "joinedAt": "2026-11-05T01:00:00.000Z"
}
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
# Port for local development
PORT=8000

# MongoDB Atlas connection string
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority

# Live Frontend URL (used by JWKS to verify JWT tokens)
ForntEND_URL=https://together-we-can-md-tamim-khans-projects.vercel.app
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) database cluster

### 1. Clone the repository
```bash
git clone https://github.com/tamimkhan887/TogetherWeCan-Server.git
cd TogetherWeCan-Server
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create `.env` based on the [Environment Variables](#️-environment-variables) section above:
```bash
cp .env.example .env   # or create .env manually
```

### 4. Run the development server
```bash
npm start
```
The server will start listening at:
`http://localhost:8000`

---

## ☁️ Deployment Guide (Vercel)

This backend is pre-configured with [`vercel.json`](file:///c:/Mec/WebDevelopment/Programming_Hero_14_Batch/Milestone8/TogetherWeCan/vercel.json) to deploy effortlessly to Vercel:

1. **Push your code to GitHub**.
2. **Import repository into Vercel**.
3. **Configure Environment Variables** in Vercel Project Settings:
   - `MONGODB_URL`: Your MongoDB connection string.
   - `ForntEND_URL`: Your deployed frontend client URL.
4. **MongoDB Atlas Network Whitelist**:
   - In MongoDB Atlas, go to **Network Access** > **IP Access List**.
   - Add `0.0.0.0/0` (Allow Access from Anywhere) so Vercel's serverless functions can connect.

---

## 📁 Project Structure

```
TogetherWeCan-Server/
├── index.js          # Core Express application, route handlers & DB pooling
├── package.json      # Dependencies and NPM scripts
├── vercel.json       # Vercel Serverless deployment routes & build rules
├── .env              # Environment configurations (gitignored)
├── .gitignore        # Files excluded from version control
└── README.md         # Project documentation
```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

---

## 👨‍💻 Author

**Md. Tamim Khan**
- GitHub: [@tamimkhan887](https://github.com/tamimkhan887)
- Project: [Together We Can](https://together-we-can-md-tamim-khans-projects.vercel.app)
