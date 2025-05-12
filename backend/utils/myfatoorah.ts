// MyFatoorah API integration utilities
// Store your API key in an environment variable for security

const MYFATOORAH_API_KEY = process.env.MYFATOORAH_API_KEY || "";
const BASE_URL = "https://api.myfatoorah.com/v2"; // Use /v2 for production, /v2 for test

export async function createSubscriptionInvoice({
  customerName,
  customerEmail,
  customerMobile,
  userId,
  amount = 4.99,
  currency = "USD",
  callbackUrl,
  errorUrl,
}: {
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  userId: string;
  amount?: number;
  currency?: string;
  callbackUrl: string;
  errorUrl: string;
}) {
  const body = {
    CustomerName: customerName,
    NotificationOption: "Lnk", // Send payment link
    InvoiceValue: amount,
    CustomerEmail: customerEmail,
    CallBackUrl: callbackUrl,
    ErrorUrl: errorUrl,
    MobileCountryCode: "+965",
    CustomerMobile: customerMobile,
    Language: "EN",
    UserDefinedField: userId,
    RecurringModel: {
      Type: "Custom",
      IntervalDays: 30,
      Repetitions: 0, // 0 = infinite
    },
    DisplayCurrencyIso: currency,
  };

  const res = await fetch(`${BASE_URL}/SendPayment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MYFATOORAH_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`MyFatoorah error: ${error}`);
  }
  return await res.json();
}

// Add more helpers as needed (e.g., verify payment, handle webhooks)
