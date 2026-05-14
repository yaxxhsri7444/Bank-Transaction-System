# 🏦 Bank Transaction System

A production-grade **Banking Transaction API** built with **Node.js**, **Express**, and **MongoDB**. Designed to simulate real-world banking logic with a focus on financial integrity, data consistency, and enterprise-level security.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Security](#security)
- [Email Notifications](#email-notifications)
- [System Integrity Controls](#system-integrity-controls)
- [License](#license)

---

## Overview

This system goes beyond a simple money-transfer app. It implements a **double-entry ledger model**, **idempotency enforcement**, and **aggregation-derived balances** — the same principles used in production fintech systems. Every credit and debit is recorded as an immutable ledger entry, making the system fully auditable and tamper-resistant.

---

## Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Secure login/register with token-based auth and cookie session management |
| 🔒 **Password Hashing** | bcrypt-based password encryption with salt rounds |
| 🏛️ **Ledger-Based Transactions** | Double-entry bookkeeping model for all debits and credits |
| 🔑 **Idempotency Keys** | Prevents duplicate transactions on retried requests |
| 📊 **Aggregation-Derived Balances** | Account balance calculated dynamically from ledger via MongoDB Aggregation Pipelines |
| 📧 **Email Notifications** | Nodemailer + Gmail API for transaction confirmations and welcome emails |
| 🚫 **Token Blacklist** | Secure logout via token invalidation using a Blacklist model |
| 🏗️ **System User Controls** | Special privileged user for seeding and managing initial funds |
| 📁 **Account Management** | Full CRUD for user accounts with status tracking |

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT)
- **Password Security:** bcrypt
- **Email Service:** Nodemailer with Gmail OAuth2 / App Password
- **Session Handling:** HTTP-only Cookie-based sessions

---

## Project Structure

```
Bank-Transaction-System/
├── src/
│   ├── config/          # DB connection, environment config
│   ├── controllers/     # Route handler logic
│   ├── middlewares/     # Auth middleware, error handlers
│   ├── models/          # Mongoose schemas (User, Account, Ledger, Blacklist)
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic, email service
│   └── utils/           # Helper functions, idempotency validators
├── server.js            # App entry point
├── package.json
└── .gitignore
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Gmail account (for email notifications)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yaxxhsri7444/Bank-Transaction-System.git
cd Bank-Transaction-System

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your values in .env

# 4. Start the server
npm start

# For development with hot-reload
npm run dev
```

The server will start on `http://localhost:3000` (or your configured PORT).

---

## Environment Variables

Create a `.env` file in the root directory with the following keys:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/bank_transaction_system

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Cookie
COOKIE_SECRET=your_cookie_secret

# Email (Gmail)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# System User
SYSTEM_USER_EMAIL=system@bank.internal
SYSTEM_USER_PASSWORD=your_secure_system_password
```

> ⚠️ Never commit `.env` to version control. It is already listed in `.gitignore`.

---

## API Endpoints

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT cookie |
| `POST` | `/api/auth/logout` | Invalidate token (blacklisted) |

### Account

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/accounts` | Create a new bank account |
| `GET` | `/api/accounts/:id` | Get account details and current balance |
| `GET` | `/api/accounts/:id/status` | Get account status (active/inactive) |

### Transactions

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/transactions/deposit` | Deposit funds into an account |
| `POST` | `/api/transactions/withdraw` | Withdraw funds from an account |
| `POST` | `/api/transactions/transfer` | Transfer funds between accounts |
| `GET` | `/api/transactions/:accountId` | Fetch full transaction history for an account |

> All transaction endpoints require `Authorization` via cookie (JWT) and a unique `Idempotency-Key` header.

---

## Architecture & Design Decisions

### Ledger Model (Double-Entry Bookkeeping)

Instead of a simple `balance` field, every transaction creates an **immutable ledger entry** with a `type` (CREDIT/DEBIT), `amount`, `accountId`, `referenceId`, and `timestamp`. The account balance is **never stored directly** — it is **derived at query time** using a MongoDB Aggregation Pipeline:

```js
// Pseudo-aggregation to calculate balance
[
  { $match: { accountId: ObjectId(id) } },
  {
    $group: {
      _id: "$accountId",
      balance: {
        $sum: {
          $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", { $multiply: ["$amount", -1] }]
        }
      }
    }
  }
]
```

This ensures the balance is always the **source of truth**, derived from the actual transaction history — not a mutable field that could go out of sync.

### Idempotency Keys

Every mutating transaction request must include an `Idempotency-Key` header. The system:

1. Checks if the key already exists in the database.
2. If it does → returns the cached response without re-processing.
3. If not → processes the transaction and stores the key with the result.

This prevents double charges caused by network retries or client-side re-submissions.

---

## Security

- **Passwords** are hashed using `bcrypt` before storage. Plain-text passwords are never persisted.
- **JWT tokens** are stored in **HTTP-only cookies** to prevent XSS-based token theft.
- **Token Blacklist**: On logout, the JWT is added to a `Blacklist` collection. The auth middleware checks this list on every protected request, effectively invalidating the session server-side.
- **Protected Routes**: All account and transaction endpoints are guarded by a JWT verification middleware.

---

## Email Notifications

Powered by **Nodemailer** with the **Gmail API**, the system sends automated emails for:

- ✅ New user registration (welcome email)
- 💸 Successful transaction confirmation (credit/debit receipt)
- 🔔 Account status changes

Gmail App Passwords (or OAuth2 tokens) are used to authenticate the mailer service securely.

---

## System Integrity Controls

A **System User** (a privileged internal account) is used to:

- Seed initial funds into the system (e.g., simulating a central bank).
- Authorize deposits that originate from outside the system boundary.
- Ensure that total debits across the system always balance against total credits.

This account is created at startup if it doesn't exist, using credentials defined in environment variables. It is protected from normal user operations.

---

## License

This project is licensed under the **MIT License**.

---

<div align="center">
  Built with 💻 by <a href="https://github.com/yaxxhsri7444">Yash Srivastava</a>
</div>
