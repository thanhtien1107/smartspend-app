# Auth Module

This module handles authentication, session management, and user profiles.

## Architecture
- **authRoutes.js**: Express routing for auth endpoints.
- **authController.js**: Handlers for login, register, OAuth, profile management, and password recovery with Gmail OTP.
- **authUtils.js** (in `src/utils`): Utility functions for auth (e.g. rate limiting, normalization).
- **emailService.js** (in `src/utils`): Zero-dependency Gmail SMTP client using Node.js built-in `tls` module. Sends OTP verification emails. Falls back to dev-mode console logging when GMAIL_USER/GMAIL_APP_PASSWORD are not configured.

## Important Interfaces
- Data is provided directly from `loadData()` and persisted via `saveData()`.
- Controllers do not talk to other modules, following the Open/Close principle.
- `emailService` is injected via `dependencies` — interface: `{ sendOtpEmail(to, code), isConfigured() }`.

## Password Recovery Flow (3-step)
1. **POST /password-recovery/request** — User enters email; OTP generated and sent via `emailService.sendOtpEmail()`.
2. **POST /password-recovery/verify** — User enters 6-digit OTP; verified against in-memory `recoveryCodes` Map (10 min TTL).
3. **POST /password-recovery/reset** — User sets new password after successful OTP verification.

## Environment Variables Required
- `GMAIL_USER` — Gmail address used to send OTP emails.
- `GMAIL_APP_PASSWORD` — Gmail App Password (created at myaccount.google.com/apppasswords).
- When not set, `emailService` operates in dev mode: logs OTP to console and returns `devCode` in response.
