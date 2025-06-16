import { Platform } from "react-native";

// TODO: This file is configured for NO-BACKEND approach
// All API functions return mock data instead of making real API calls
// This is suitable for local-only budget tracking apps

// Define types for API responses and requests
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

interface ReceiptData {
  total: number;
  date: string;
  merchant: string;
  items?: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  category?: string;
}

// We'll dynamically import axios to avoid issues with React Native
let axiosInstance: any = null;

// Initialize axios with interceptors
const initializeAxios = async () => {
  if (axiosInstance) return axiosInstance;

  try {
    const axios = (await import("axios")).default;
    let adapter = undefined;
    if (Platform.OS !== "web" && typeof XMLHttpRequest !== "undefined") {
      // Use the built-in XHR adapter for React Native
      adapter = axios.defaults.adapter;
    }

    axiosInstance = axios.create({
      // NOTE: This baseURL is NOT USED in no-backend mode
      // All functions return mock data instead
      baseURL: "https://api.budgettracker.com/v1", // PLACEHOLDER - NOT USED
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(adapter ? { adapter } : {}),
    });

    // Request interceptor
    axiosInstance.interceptors.request.use(
      (config: any) => {
        // You could add auth token here
        // const token = getToken();
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    axiosInstance.interceptors.response.use(
      (response: any) => {
        return response;
      },
      (error: any) => {
        // Handle common errors here
        if (error.response) {
          // Server responded with an error status
          console.error("API Error:", error.response.data);
        } else if (error.request) {
          // Request was made but no response
          console.error("Network Error:", error.request);
        } else {
          // Something else happened
          console.error("Error:", error.message);
        }
        return Promise.reject(error);
      }
    );

    return axiosInstance;
  } catch (error) {
    console.error("Failed to initialize axios:", error);
    throw error;
  }
};

export const processReceipt = async (
  imageUri: string
): Promise<ReceiptData> => {
  try {
    // NO-BACKEND MODE: Return mock data instead of calling API
    // In a real app, you would upload the image to your backend for OCR processing

    // Simulate API call delay for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // If we were making a real API call, it would look like this:
    /*
    const formData = new FormData();
    
    // @ts-ignore - React Native's FormData expects this format for files
    formData.append('receipt', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'receipt.jpg',
    });
    
    const axios = await initializeAxios();
    const response = await axios.post('/receipts/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
    */

    // Return mock data instead of making API call
    return {
      total: 42.99,
      date: new Date().toISOString(),
      merchant: "Grocery Store",
      items: [
        { name: "Milk", price: 3.99, quantity: 1 },
        { name: "Bread", price: 2.49, quantity: 1 },
        { name: "Eggs", price: 4.99, quantity: 1 },
        { name: "Apples", price: 5.99, quantity: 1 },
        { name: "Chicken", price: 12.99, quantity: 1 },
        { name: "Rice", price: 8.99, quantity: 1 },
        { name: "Pasta", price: 3.55, quantity: 1 },
      ],
      category: "Groceries",
    };
  } catch (error) {
    console.error("Error processing receipt:", error);
    throw error;
  }
};

export const getExchangeRates = async (
  baseCurrency: string
): Promise<Record<string, number>> => {
  try {
    // NO-BACKEND MODE: Return mock exchange rates
    // In a real app, you would call an exchange rate API (e.g., exchangerate-api.com)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock exchange rates (relative to USD)
    const mockRates: Record<string, number> = {
      USD: 1,
      EUR: 0.85,
      GBP: 0.75,
      JPY: 110.5,
      CAD: 1.25,
      AUD: 1.35,
      CNY: 6.45,
      INR: 74.5,
      BRL: 5.2,
      ZAR: 14.8,
      SAR: 3.75,
      AED: 3.67,
    };

    // If base currency is not USD, recalculate rates
    if (baseCurrency !== "USD") {
      const baseRate = mockRates[baseCurrency];
      if (!baseRate) throw new Error(`Currency ${baseCurrency} not supported`);

      const result: Record<string, number> = {};
      for (const [currency, rate] of Object.entries(mockRates)) {
        result[currency] = rate / baseRate;
      }
      return result;
    }

    return mockRates;
  } catch (error) {
    console.error("Error getting exchange rates:", error);
    throw error;
  }
};

export const sendFeedback = async (feedback: {
  type: string;
  message: string;
}): Promise<boolean> => {
  try {
    // NO-BACKEND MODE: Just log feedback instead of sending to server
    // In a real app, you would send this to your backend or email service

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Just log the feedback locally
    console.log("Feedback received (no-backend mode):", feedback);

    return true;
  } catch (error) {
    console.error("Error sending feedback:", error);
    throw error;
  }
};
