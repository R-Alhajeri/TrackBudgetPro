import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

export default publicProcedure
  .input(z.object({ imageUri: z.string() }))
  .mutation(({ input }) => {
    // IMPORTANT NOTE: This is a placeholder for real OCR processing.
    // Real OCR functionality cannot be implemented directly in Expo without ejecting to bare React Native
    // or using an external backend service. To achieve real OCR, you would need to:
    // 1. Set up an external server or use a third-party API (e.g., Google Cloud Vision API, AWS Textract,
    //    Microsoft Azure Computer Vision) to process the image.
    // 2. Send the image data (or a reference to it) from this backend to the OCR service.
    // 3. Return the extracted data to the app.
    // Currently, this endpoint simulates OCR by returning mock data.
    // To integrate real OCR, replace this logic with an API call to your chosen OCR service.
    
    return {
      success: true,
      data: {
        merchant: generateMockMerchant(),
        date: new Date().toISOString(),
        total: generateMockTotal(),
        items: generateMockItems(),
      },
    };
  });

// Helper functions to generate realistic mock data
function generateMockMerchant() {
  const merchants = [
    "SuperMart", "Grocery Haven", "QuickShop", "City Electronics", "Fashion Outlet",
    "Cafe Delight", "Tech World", "Healthy Foods", "Urban Diner", "Book Nook"
  ];
  return merchants[Math.floor(Math.random() * merchants.length)];
}

function generateMockTotal() {
  // Generate a total between $5 and $200 for realism
  return Math.round((Math.random() * 195 + 5) * 100) / 100;
}

function generateMockItems() {
  const itemCount = Math.floor(Math.random() * 5) + 1; // 1 to 5 items
  const items = [];
  const itemNames = [
    "Milk", "Bread", "Eggs", "Cheese", "Apples", "Laptop Charger", "Headphones",
    "T-Shirt", "Coffee", "Book", "Snacks", "Juice", "Shampoo", "Soap", "Toothpaste"
  ];
  
  for (let i = 0; i < itemCount; i++) {
    const price = Math.round((Math.random() * 20 + 1) * 100) / 100; // $1 to $21
    const quantity = Math.floor(Math.random() * 3) + 1; // 1 to 3
    items.push({
      name: itemNames[Math.floor(Math.random() * itemNames.length)],
      price,
      quantity,
    });
  }
  return items;
}