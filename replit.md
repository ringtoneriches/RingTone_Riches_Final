# Ringtone Riches Competition Platform

## Overview

Ringtone Riches is a competition platform offering diverse prize draws and instant-win games (Spin, Scratch, Instant Win). Users can purchase entries using wallet balance, ringtone points, or direct payments. The platform features a configurable signup bonus system that automatically credits new users with welcome bonuses (cash and/or points) upon registration, displayed via a celebratory popup with confetti effects. The platform is a full-stack web application with a React frontend, Express backend, and PostgreSQL database, managing user authentication, payment processing, competition logic, ticket allocation, and winner selection. The business vision is to provide an engaging and fair competition experience with a seamless user journey from entry to prize claim.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

*   **Framework**: React with TypeScript and Vite.
*   **Routing**: Wouter for URL query parameter-based tab navigation.
*   **State Management**: TanStack Query for server state.
*   **UI/UX**: Radix UI for accessible components, Tailwind CSS for styling with a dark theme and yellow/gold accents.
*   **Form Handling**: React Hook Form with Zod validation.
*   **Account Management**: Unified tabbed interface at `/wallet` consolidating all user account functionality (Wallet, Orders, Entries, RingTone Points, Referral, Account Settings, Withdrawals, and Address).

### Backend

*   **Framework**: Express.js with Node.js and TypeScript.
*   **API Design**: RESTful API, `/api/` prefixed endpoints.
*   **Authentication**: Custom session-based authentication using `express-session` and PostgreSQL storage; bcrypt for password hashing.
*   **Authorization**: Role-based access control with an `isAdmin` flag.

### Data Storage

*   **Database**: PostgreSQL with Drizzle ORM for type-safe queries and schema management.
*   **Schema**: Includes Users, Competitions (Spin, Scratch, Instant), Tickets, Orders, Transactions, Winners, WithdrawalRequests, and game-specific usage tables. Competitions can include optional `skillQuestion` and Orders can include `skillAnswer`.
*   **Migrations**: Drizzle Kit.

### Payment Processing

*   **Providers**: Cashflows (primary), Stripe (fallback).
*   **Flows**: Wallet top-up, direct competition entry, ringtone points conversion, and multi-method payments.
*   **Transaction Recording**: All financial operations are logged.
*   **Webhook Idempotency**: Cashflows webhooks prevent duplicate processing.

### Game Mechanics

*   **Competition Types**: Spin Wheel, Scratch Card, Instant Win with server-side result determination and fair prize allocation.
*   **Spin Wheel**: Canvas-based, 26-segment wheel with configurable probabilities (up to 2 decimal places) and maxWins limits. Admin-reorderable segments, including a special "R Prize" mystery segment. Server-side result determination. "Reveal All" functionality for batch processing all remaining spins with confirmation dialog. Progress table shows clear win/loss status with colored text (red for losses, green for wins). Button displays "ALL USED" when exhausted and shows alert message when clicked.
*   **Scratch Card**: Server-side prize determination using atomic database transactions, weighted random selection, and maxWins enforcement. Frontend handles animation, backend controls prize allocation. "Reveal All" functionality for batch processing all remaining scratch cards with confirmation dialog. Progress table shows clear win/loss status with colored text. Prevents scratching when all cards used with alert message. Unlimited purchase capability - users can buy any quantity of scratch cards.
*   **R Prize**: Admin-configurable mystery prize on the spin wheel with customizable reward type, value, probability, and win limits.

### Admin Panel

*   Comprehensive management for: Dashboard, Competition (CRUD, display order, mobile-responsive forms, spin wheel segment reordering), Entries (view, filter, search, CSV download), User, Orders, Withdrawal Requests (enhanced details, search, status filter, approval/rejection), Past Winners (CRUD, image upload).
*   **Settings**: Platform-wide configuration including signup bonus system (enable/disable toggle, cash amount, points amount) with live preview and admin account management (username/password changes).

### Design Patterns

*   API request abstraction, consistent query key management, custom hooks, error boundaries, component composition, responsive design (mobile-first), and a unified billing component.

### Billing & Checkout

*   **Unified Billing Component**: Handles all purchase types (competitions, spins, scratch cards) with consistent UX.
*   **Payment Options**: Wallet, Ringtone Points, and Cashflows card payments (any combination).
*   **Smart Routing**: Routes to appropriate payment endpoint based on payment coverage.
*   **Order Flow**: Purchases create a pending order, then redirect to billing pages for payment.

### Email System

*   **Provider**: Resend API (`support@ringtoneriches.co.uk`).
*   **Templates**: Yellow/gold themed HTML emails.
*   **Types**: Welcome emails, order confirmations (including game details, skill questions/answers, ticket numbers, payment breakdowns).
*   **Implementation**: Non-blocking sends with error handling; webhook idempotency for confirmations. Ticket assignment varies based on payment method.

## External Dependencies

*   **Cashflows**: Primary payment gateway.
*   **Stripe**: Secondary payment provider.
*   **PostgreSQL**: Primary database.
*   **Neon Database Serverless**: PostgreSQL driver.
*   **Resend API**: Email service.
*   **Radix UI**: UI primitives.
*   **TanStack Query**: Server state management.
*   **Wouter**: Routing library.
*   **React Hook Form**: Form management.
*   **Zod**: Schema validation.
*   **Tailwind CSS**: Styling framework.
*   **Slick Carousel**: Image carousel.
*   **Vite**: Build tool.
*   **TypeScript**: Language.
*   **Drizzle Kit**: Database migration.
*   **ESBuild**: Backend bundling.