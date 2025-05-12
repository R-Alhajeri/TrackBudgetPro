# Elegant Budget Tracker

A mobile budget tracking application with receipt scanning capabilities.

## Backend Server Setup

The application requires a backend server to be running for all functionality to work correctly. Follow these steps to run the backend:

1. Install dependencies:

   ```bash
   npm install
   npm install -g tsx # For running TypeScript server directly
   ```

2. Start the backend server:

   ```bash
   npm run server
   ```

   This will start the server at http://localhost:3000

3. In a separate terminal, start the frontend:
   ```bash
   npm start
   ```

## Device Testing Notes

When testing on different devices:

- **iOS Simulator** or **Android Emulator**: The app will connect to the backend automatically.
- **Physical Device**: You need to modify `lib/trpc.ts` to use your computer's LAN IP address instead of localhost.

To find your computer's IP address:

```bash
# On macOS
ipconfig getifaddr en0
```

Then update the LAN_IP variable in `lib/trpc.ts`:

```typescript
// Set your Mac's LAN IP here for testing on physical devices
const LAN_IP = "192.168.x.x"; // Your actual IP address
```

## Testing Connectivity

The app includes a TRPC test component on the dashboard to verify connectivity to the backend. Use this to ensure your connection is working correctly.

You can also run a standalone test:

```bash
npm run test-trpc
```

## Troubleshooting Connection Issues

If you encounter "Network request failed" errors:

1. Ensure the backend server is running with `npm run server`
2. Check if you can access the API with: `curl http://localhost:3000/api`
3. For physical devices: Edit `lib/trpc.ts` and uncomment the appropriate line for your device type to use the LAN IP
4. Check that your device and computer are on the same network
5. Ensure no firewall is blocking the connection

## Development Notes

- The backend is built with Hono and tRPC
- All API routes are available at `/api/trpc/*`
- The server logs TRPC requests in the terminal window
- The client logs TRPC requests in the developer console
