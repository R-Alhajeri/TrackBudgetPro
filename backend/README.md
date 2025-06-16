# Backend Server Implementation

## Overview

The server for the Budget Tracker Pro app is built using Express.js and TypeScript. It provides APIs for receipt processing and subscription management with Firebase integration.

## Architecture

- **Express.js:** Core framework for the server
- **TypeScript:** Type-safe code with improved maintainability
- **Firebase:** Authentication and database for user data
- **Modular Design:** Separation of concerns with dedicated files for specific functionality

## Directory Structure

```
backend/
├─ api/
│  ├─ middleware/
│  │  └─ auth.ts          # Authentication middleware
│  └─ routes/
│     ├─ index.ts         # API route definitions
│     ├─ payments.ts      # Subscription/payment endpoints
│     └─ receipt.ts       # Receipt processing endpoints
├─ express.ts             # Express app configuration & middleware setup
├─ server.ts              # Server entry point & process management
└─ tsconfig.json          # TypeScript configuration
```

## API Endpoints

### Health Check

- `GET /api` - Check if API is working

### Receipt Processing

- `POST /api/receipts/process` - Process receipt images

### Payments & Subscriptions

- `POST /api/payments/validate` - Validate in-app purchases
- `GET /api/payments/subscription-status` - Get user subscription status

## Running the Server

### Development

```bash
npm run start-backend
```

### Production

```bash
npm run build-backend
npm run start-backend:prod
```

## Environment Variables

See `.env.example` for required environment variables.
