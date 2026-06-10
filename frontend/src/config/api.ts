// API Configuration for Spring Boot Backend
import { Platform } from "react-native";
import Constants from "expo-constants";
import { storage, STORAGE_KEYS } from "../services/storage";

// API timeout (60 seconds) - increased for tunnel stability
export const API_TIMEOUT = 60000;

const getBaseURL = () => {
  // If we're in development
  if (__DEV__) {
    const computerIp = "10.181.236.116";

    // 1. Check for Android Emulator
    if (Platform.OS === "android" && !Constants.expoConfig?.hostUri) {
      return "http://10.0.2.2:8080/api";
    }

    // 2. Try to get the host from Expo Constants
    const hostUri = Constants.expoConfig?.hostUri;
    
    if (hostUri) {
      const ip = hostUri.split(":")[0];
      // If it's a local IP (starts with 192.168 or 10. or 172.), use it
      if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
        return `http://${ip}:8080/api`;
      }
      // If it's a tunnel URL (like .exp.direct), we can't use it for the backend
      // because the backend isn't tunneled. Fallback to computerIp.
    }

    // 3. Fallback to your manual IP
    return `http://${computerIp}:8080/api`;
  }

  // Production
  return "https://your-backend-url.com/api";
};

export const API_BASE_URL = getBaseURL();
console.log("[API] Base URL:", API_BASE_URL);

// Helper function to get authorization header
export const getAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

// Helper function to make authenticated API calls
export const authenticatedFetch = async (
  endpoint: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeader(token),
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
};

// Helper function for handling API errors
export const handleAPIError = async (response: Response): Promise<never> => {
  let errorMessage = "An error occurred";

  try {
    const errorData = await response.json();
    errorMessage = errorData.error || errorData.message || errorMessage;
  } catch {
    errorMessage = `Server error: ${response.status}`;
  }

  throw new Error(errorMessage);
};

// Helper function to make API call with error handling
export const apiCall = async <T>(
  endpoint: string,
  method: string = "GET",
  body?: any,
): Promise<T> => {
  const token = await storage.getRaw(STORAGE_KEYS.AUTH_TOKEN);

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      await handleAPIError(response);
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
};
