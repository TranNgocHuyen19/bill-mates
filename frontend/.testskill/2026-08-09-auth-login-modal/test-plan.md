# Auth Login Modal Test Plan

## Acceptance Criteria

- The unauthenticated Navbar shows a login button that opens an in-app Bill Mates modal.
- The modal contains email and password fields, a password visibility control, a submit action, and a close action.
- Opening login does not call `signInWithOAuth`, navigate to Google, or create a browser popup.
- The Google login button and Google OAuth API/query are removed from the login flow.
- Submitting valid credentials calls the existing Supabase password login mutation and keeps the existing success redirect.
- Invalid credentials expose an actionable error through the existing toast flow.
- The modal closes with the close button, Escape, or backdrop click and remains usable at narrow mobile widths.
- The dedicated `/auth/login` page still renders the email/password form as a fallback route.

## Verification

- Run the frontend Vitest suite, TypeScript check, ESLint, and production build.
- Search the auth feature for remaining Google OAuth calls and Google login labels.
- Verify the modal source uses an in-app dialog and has dialog accessibility labels.
