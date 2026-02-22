// Central API client — all requests go through apiRequest() below.
// Set VITE_API_URL in your frontend .env to override the default.
const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:3001/api";

// Sanity-check at module load: catch obvious mis-configurations.
if (!API_BASE_URL.startsWith("http://") && !API_BASE_URL.startsWith("https://")) {
  console.error(`❌ VITE_API_URL is misconfigured: "${API_BASE_URL}". It must start with http:// or https://.`);
}

// Get auth token from localStorage
function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

// Set auth token
export function setAuthToken(token: string) {
  localStorage.setItem("auth_token", token);
}

// Remove auth token
export function clearAuthToken() {
  localStorage.removeItem("auth_token");
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Always include JWT token if available (required for authenticated endpoints)
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn(`[API Request] No auth token found in localStorage for ${endpoint}`);
  }

  // Ensure endpoint starts with / to avoid double slashes
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_BASE_URL}${cleanEndpoint}`;

  console.log(`[API Request] ${options.method || "GET"} ${fullUrl}${token ? " (authenticated)" : " (no token)"}`);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      console.error(`[API Error] ${options.method || "GET"} ${fullUrl}: ${response.status} - ${error.error || "Unknown error"}`);
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    // Network errors (CORS, connection refused, etc.)
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      console.error(`[API Network Error] Failed to reach ${fullUrl}. Check CORS and backend server.`);
      throw new Error(`Failed to connect to backend. Is the server running on ${API_BASE_URL}?`);
    }
    throw error;
  }
}

// Auth API
export const authAPI = {
  // Private-app bootstrap: transparently creates or reuses the main user
  // and stores a long-lived JWT in localStorage.
  bootstrap: async (data?: { name?: string }) => {
    const result = await apiRequest<{ user: any; token: string }>("/auth/bootstrap", {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
    setAuthToken(result.token);
    return result;
  },
  register: async (data: { name: string; phone?: string; role?: "self" | "partner" }) => {
    const result = await apiRequest<{ user: any; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setAuthToken(result.token);
    return result;
  },
  login: async (data: { phone?: string; name?: string }) => {
    const result = await apiRequest<{ user: any; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setAuthToken(result.token);
    return result;
  },
  getMe: async () => {
    return apiRequest<{ user: any }>("/auth/me");
  },
  linkPartner: async (data: { partnerPhone: string; partnerName?: string }) => {
    return apiRequest<{ partner: any }>("/auth/link-partner", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Dreams API
export const dreamsAPI = {
  getAll: async () => {
    return apiRequest<{ dreams: any[] }>("/dreams");
  },
  getOne: async (id: string) => {
    return apiRequest<{ dream: any }>(`/dreams/${id}`);
  },
  create: async (data: {
    title?: string;
    content: string;
    mood?: string;
    shared?: boolean;
    targets?: any[];
  }) => {
    return apiRequest<{ dream: any }>("/dreams", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: Partial<any>) => {
    return apiRequest<{ dream: any }>(`/dreams/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string) => {
    console.log(`[dreamsAPI.delete] Called with id: "${id}"`);
    console.log(`[dreamsAPI.delete] Full URL will be: ${API_BASE_URL}/dreams/${id}`);
    return apiRequest<{ success: boolean }>(`/dreams/${id}`, {
      method: "DELETE",
    });
  },
};

// Thoughts API
export const thoughtsAPI = {
  getAll: async () => {
    return apiRequest<{ thoughts: any[] }>("/thoughts");
  },
  create: async (data: { content: string; mood?: string; shared?: boolean }) => {
    return apiRequest<{ thought: any }>("/thoughts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: Partial<any>) => {
    return apiRequest<{ thought: any }>(`/thoughts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/thoughts/${id}`, {
      method: "DELETE",
    });
  },
};

// Letters API
export const lettersAPI = {
  getAll: async () => {
    return apiRequest<{ letters: any[] }>("/letters");
  },
  create: async (data: {
    content: string;
    unlockDate?: string;
    shared?: boolean;
    sealed?: boolean;
  }) => {
    return apiRequest<{ letter: any }>("/letters", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: Partial<any>) => {
    return apiRequest<{ letter: any }>(`/letters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/letters/${id}`, {
      method: "DELETE",
    });
  },
};

// Moods API
export const moodsAPI = {
  getHistory: async () => {
    return apiRequest<{ moods: any[] }>("/moods/history");
  },
  getToday: async () => {
    return apiRequest<{ mood: any }>("/moods/today");
  },
  log: async (data: { mood: string; shared?: boolean }) => {
    return apiRequest<{ mood: any }>("/moods/log", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Settings API
export const settingsAPI = {
  get: async () => {
    return apiRequest<{ settings: any }>("/settings");
  },
  update: async (data: Partial<any>) => {
    return apiRequest<{ settings: any }>("/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  activateNotifications: async (data: { userPhone: string; partnerPhone: string; userName?: string; partnerName?: string }) => {
    return apiRequest<{ success: boolean }>("/settings/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

};

// Self-care API
export const selfCareAPI = {
  getByDate: async (date: string) => {
    return apiRequest<{ items: any[] }>(`/self-care/${date}`);
  },
  create: async (items: any[]) => {
    return apiRequest<{ items: any[] }>("/self-care", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  },
  update: async (id: string, data: { checked: boolean }) => {
    return apiRequest<{ item: any }>(`/self-care/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// Shared content API (for partners)
export const sharedAPI = {
  getAll: async () => {
    return apiRequest<{
      dreams: any[];
      thoughts: any[];
      letters: any[];
      moods: any[];
    }>("/shared");
  },
};

// Type mapping helpers
export function mapMoodToDB(mood: string): string {
  const mapping: Record<string, string> = {
    "😊": "HAPPY",
    "😌": "CALM",
    "🌸": "BLOSSOM",
    "💭": "THOUGHTFUL",
    "🌙": "DREAMY",
    "✨": "SPARKLE",
    "💪": "STRONG",
    "🥺": "TENDER",
    "😴": "TIRED",
    "🌈": "RAINBOW",
  };
  return mapping[mood] || "BLOSSOM";
}

export function mapMoodFromDB(mood: string): string {
  const mapping: Record<string, string> = {
    HAPPY: "😊",
    CALM: "😌",
    BLOSSOM: "🌸",
    THOUGHTFUL: "💭",
    DREAMY: "🌙",
    SPARKLE: "✨",
    STRONG: "💪",
    TENDER: "🥺",
    TIRED: "😴",
    RAINBOW: "🌈",
  };
  return mapping[mood] || "🌸";
}

export function mapVisitMoodToDB(mood: string): string {
  const mapping: Record<string, string> = {
    "😊": "HAPPY",
    "😔": "LOW",
    "😌": "CALM",
    "😟": "ANXIOUS",
    "😴": "TIRED",
    "💗": "SOFT",
    "😤": "OVERWHELMED",
  };
  return mapping[mood] || "CALM";
}

export function mapVisitMoodFromDB(mood: string): string {
  const mapping: Record<string, string> = {
    HAPPY: "😊",
    LOW: "😔",
    CALM: "😌",
    ANXIOUS: "😟",
    TIRED: "😴",
    SOFT: "💗",
    OVERWHELMED: "😤",
  };
  return mapping[mood] || "😌";
}

export function mapTargetStateToDB(state: string): string {
  const mapping: Record<string, string> = {
    starting: "STARTING",
    "in-progress": "IN_PROGRESS",
    "feels-good": "FEELS_GOOD",
    resting: "RESTING",
  };
  return mapping[state] || "STARTING";
}

export function mapTargetStateFromDB(state: string): string {
  const mapping: Record<string, string> = {
    STARTING: "starting",
    IN_PROGRESS: "in-progress",
    FEELS_GOOD: "feels-good",
    RESTING: "resting",
  };
  return mapping[state] || "starting";
}

export function mapCurrentNeedToDB(need: string): string {
  const mapping: Record<string, string> = {
    rest: "REST",
    motivation: "MOTIVATION",
    space: "SPACE",
    support: "SUPPORT",
    silence: "SILENCE",
    "gentle-reminders": "GENTLE_REMINDERS",
  };
  return mapping[need] || "GENTLE_REMINDERS";
}

export function mapCurrentNeedFromDB(need: string): string {
  const mapping: Record<string, string> = {
    REST: "rest",
    MOTIVATION: "motivation",
    SPACE: "space",
    SUPPORT: "support",
    SILENCE: "silence",
    GENTLE_REMINDERS: "gentle-reminders",
  };
  return mapping[need] || "gentle-reminders";
}

export function mapSelfCareCategoryToDB(category: string): string {
  const mapping: Record<string, string> = {
    water: "WATER",
    skincare: "SKINCARE",
    rest: "REST",
    period: "PERIOD",
  };
  return mapping[category] || "WATER";
}

export function mapSelfCareCategoryFromDB(category: string): string {
  const mapping: Record<string, string> = {
    WATER: "water",
    SKINCARE: "skincare",
    REST: "rest",
    PERIOD: "period",
  };
  return mapping[category] || "water";
}
