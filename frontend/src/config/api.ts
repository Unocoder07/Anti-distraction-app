// API Configuration for Spring Boot Backend
import { Platform } from "react-native";
import Constants from "expo-constants";
import { storage, STORAGE_KEYS } from "../services/storage";

// Keep auth/API failures fast in dev instead of leaving buttons stuck loading.
export const API_TIMEOUT = 10000;

const LAN_HOST_PREFIXES = ["192.168.", "10.", "172."];

const getHostFromUri = (uri?: string | null) => {
  if (!uri) return null;

  const host = uri.split(":")[0];
  return LAN_HOST_PREFIXES.some((prefix) => host.startsWith(prefix)) ? host : null;
};

const getBaseURL = () => {
  const configuredBaseUrl =
    (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) ||
    ((Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined);

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  const localhost = "http://localhost:8083/api";
  const devHost = process.env.EXPO_PUBLIC_DEV_HOST as string | undefined;
  const hostUri = Constants.expoConfig?.hostUri;
  const expoLanHost = getHostFromUri(hostUri);

  if (Platform.OS === "android") {
    if (devHost) {
      return `http://${devHost}:8083/api`;
    }

    if (expoLanHost) {
      return `http://${expoLanHost}:8083/api`;
    }

    if (__DEV__ && !Constants.isDevice) {
      return "http://10.0.2.2:8083/api";
    }

    return localhost;
  }

  if (Platform.OS === "ios") {
    if (devHost) {
      return `http://${devHost}:8083/api`;
    }

    if (expoLanHost && Constants.isDevice) {
      return `http://${expoLanHost}:8083/api`;
    }

    return localhost;
  }

  return localhost;
};

export const API_BASE_URL = getBaseURL();
console.log("[API] Base URL:", API_BASE_URL);

const getFallbackBaseURLs = () => {
  const urls = [API_BASE_URL];

  if (Platform.OS === "android" && __DEV__) {
    const devHost = process.env.EXPO_PUBLIC_DEV_HOST as string | undefined;
    const expoLanHost = getHostFromUri(Constants.expoConfig?.hostUri);

    if (devHost) {
      urls.push(`http://${devHost}:8083/api`);
    }

    if (expoLanHost) {
      urls.push(`http://${expoLanHost}:8083/api`);
    }

    if (!Constants.isDevice) {
      urls.push("http://10.0.2.2:8083/api");
    }

    urls.push("http://127.0.0.1:8083/api");
  }

  return Array.from(new Set(urls));
};

export const API_BASE_URLS = getFallbackBaseURLs();
console.log("[API] Base URL fallbacks:", API_BASE_URLS);

const fetchWithTimeout = async (
  baseUrl: string,
  endpoint: string,
  options: RequestInit,
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    return await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchFromAPI = async (
  endpoint: string,
  options: RequestInit,
): Promise<Response> => {
  let lastError: any;

  for (const baseUrl of API_BASE_URLS) {
    try {
      return await fetchWithTimeout(baseUrl, endpoint, options);
    } catch (error: any) {
      lastError = error;
      console.warn(`[API] Request failed for ${baseUrl}${endpoint}:`, error?.message || error);
    }
  }

  if (lastError?.name === "AbortError") {
    throw new Error("Request timeout");
  }

  throw lastError;
};

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
  return fetchFromAPI(endpoint, {
    ...options,
    headers: {
      ...getAuthHeader(token),
      ...options.headers,
    },
  });
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

  try {
    const response = await fetchFromAPI(endpoint, options);

    if (!response.ok) {
      await handleAPIError(response);
    }

    return response.json();
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
};
