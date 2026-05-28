# Auth Module

This module handles authentication, session management, and user profiles.

## Architecture
- **authRoutes.js**: Express routing for auth endpoints.
- **authController.js**: Handlers for login, register, OAuth, and profile management.
- **authUtils.js** (in `src/utils`): Utility functions for auth (e.g. rate limiting, normalization).

## Important Interfaces
- Data is provided directly from `loadData()` and persisted via `saveData()`.
- Controllers do not talk to other modules, following the Open/Close principle.
