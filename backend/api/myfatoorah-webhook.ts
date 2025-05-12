// MyFatoorah webhook endpoint for payment status updates
import { Hono } from "hono";
import { users } from "@/backend/trpc/routes/auth/route";

const app = new Hono();

// This endpoint should be set as the callback URL in MyFatoorah dashboard
app.post("/api/myfatoorah-callback", async (c) => {
  const body = await c.req.json();
  // Example: { InvoiceId, InvoiceStatus, CustomerReference, UserDefinedField, ... }
  const { InvoiceId, InvoiceStatus, UserDefinedField } = body;
  // UserDefinedField is userId (set in createSubscriptionInvoice)
  if (!UserDefinedField) return c.json({ ok: false, error: "No userId" }, 400);
  // Find user and update subscription status (in-memory for now)
  const user = users.find((u) => u.id === UserDefinedField);
  if (user) {
    user.subscription = {
      status: InvoiceStatus,
      invoiceId: InvoiceId,
      lastUpdated: new Date().toISOString(),
    };
  }
  return c.json({ ok: true });
});

export default app;
