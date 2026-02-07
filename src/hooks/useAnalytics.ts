import { useEffect, useRef, useCallback } from "react";
import { supabase, supabaseAnonKey, supabaseUrl } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type AnalyticsErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
};

const ANALYTICS_DISABLED_STORAGE_KEY = "vrp_analytics_disabled";

function shouldDisableAnalyticsForError(error: unknown): boolean {
  const err = (error || {}) as AnalyticsErrorLike;
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message.toLowerCase() : "";
  const details = typeof err.details === "string" ? err.details.toLowerCase() : "";
  const status = typeof err.status === "number" ? err.status : 0;
  const combined = `${message} ${details}`.trim();

  // Explicit HTTP auth failures.
  if (status === 401 || status === 403) return true;

  // Common errors when the DB doesn't have the expected grants / RLS policy.
  if (code === "42501") return true; // insufficient_privilege
  if (combined.includes("row-level security")) return true;
  if (combined.includes("permission denied")) return true;
  if (combined.includes("insufficient_privilege")) return true;

  // Misconfiguration; retrying won't help.
  if (combined.includes("invalid api key")) return true;
  if (combined.includes("jwt") && (combined.includes("expired") || combined.includes("invalid"))) return true;

  return false;
}

function getInitialAnalyticsDisabled(): boolean {
  try {
    return sessionStorage.getItem(ANALYTICS_DISABLED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

// UTM parameter interface
interface UTMParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
}

// Generate a unique visitor ID (persisted in localStorage)
const getVisitorId = (): string => {
  const key = "vrp_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
};

// Generate a session ID (persisted in sessionStorage)
const getSessionId = (): string => {
  const key = "vrp_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
};

// Capture and persist UTM parameters
const getUTMParams = (): UTMParams => {
  const key = "vrp_utm_params";
  
  // Check if we have UTM params in current URL
  const urlParams = new URLSearchParams(window.location.search);
  const currentUTM: UTMParams = {
    utm_source: urlParams.get("utm_source"),
    utm_medium: urlParams.get("utm_medium"),
    utm_campaign: urlParams.get("utm_campaign"),
    utm_term: urlParams.get("utm_term"),
    utm_content: urlParams.get("utm_content"),
  };
  
  // If we have new UTM params, save them
  if (currentUTM.utm_source) {
    sessionStorage.setItem(key, JSON.stringify(currentUTM));
    return currentUTM;
  }
  
  // Otherwise, try to get from session storage (persists during session)
  const stored = sessionStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored) as UTMParams;
    } catch {
      return currentUTM;
    }
  }
  
  // Try to detect source from referrer if no UTM params
  const referrer = document.referrer;
  if (referrer) {
    const ref = new URL(referrer);
    const host = ref.hostname.toLowerCase();
    
    // Map common referrers to sources
    let detectedSource: string | null = null;
    let detectedMedium: string | null = null;
    
    if (host.includes("facebook.com") || host.includes("fb.com")) {
      detectedSource = "facebook";
      detectedMedium = "social";
    } else if (host.includes("instagram.com")) {
      detectedSource = "instagram";
      detectedMedium = "social";
    } else if (host.includes("tiktok.com")) {
      detectedSource = "tiktok";
      detectedMedium = "social";
    } else if (host.includes("twitter.com") || host.includes("x.com")) {
      detectedSource = "twitter";
      detectedMedium = "social";
    } else if (host.includes("youtube.com")) {
      detectedSource = "youtube";
      detectedMedium = "social";
    } else if (host.includes("whatsapp.com") || host.includes("wa.me")) {
      detectedSource = "whatsapp";
      detectedMedium = "messaging";
    } else if (host.includes("t.me") || host.includes("telegram.org")) {
      detectedSource = "telegram";
      detectedMedium = "messaging";
    } else if (host.includes("google.")) {
      detectedSource = "google";
      detectedMedium = "organic";
    } else if (host.includes("bing.com")) {
      detectedSource = "bing";
      detectedMedium = "organic";
    } else if (host.includes("mail.") || host.includes("outlook.") || host.includes("gmail.")) {
      detectedSource = "email";
      detectedMedium = "email";
    } else if (!host.includes(window.location.hostname)) {
      detectedSource = host.replace("www.", "");
      detectedMedium = "referral";
    }
    
    if (detectedSource) {
      const autoUTM: UTMParams = {
        utm_source: detectedSource,
        utm_medium: detectedMedium,
        utm_campaign: null,
        utm_term: null,
        utm_content: null,
      };
      sessionStorage.setItem(key, JSON.stringify(autoUTM));
      return autoUTM;
    }
  }
  
  // Default: direct traffic
  return {
    utm_source: "direct",
    utm_medium: "none",
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
  };
};

// Detect country from timezone (lightweight, no API call)
const detectCountryFromTimezone = (): string => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryMap: Record<string, string> = {
      "America/Mexico_City": "MX",
      "America/New_York": "US",
      "America/Los_Angeles": "US",
      "America/Chicago": "US",
      "America/Bogota": "CO",
      "America/Lima": "PE",
      "America/Santiago": "CL",
      "America/Buenos_Aires": "AR",
      "America/Sao_Paulo": "BR",
      "Europe/Madrid": "ES",
      "Europe/London": "GB",
    };
    return countryMap[timezone] || "XX";
  } catch {
    return "XX";
  }
};

interface AnalyticsEvent {
  event_name: string;
  event_data?: Json;
  page_path?: string;
}

const MAX_QUEUE_SIZE = 500;
const KEEPALIVE_FLUSH_LIMIT = 25;

export const useAnalytics = () => {
  const isDisabled = useRef<boolean>(getInitialAnalyticsDisabled());
  const visitorId = useRef<string>("");
  const sessionId = useRef<string>("");
  const countryCode = useRef<string>("");
  const utmParams = useRef<UTMParams>({
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
  });
  const eventQueue = useRef<AnalyticsEvent[]>([]);
  const isProcessing = useRef(false);
  const consecutiveFailures = useRef(0);
  const nextAttemptAtMs = useRef(0);
  const retryDelayMs = useRef(2000);
  const hasLoggedError = useRef(false);

  useEffect(() => {
    visitorId.current = getVisitorId();
    sessionId.current = getSessionId();
    countryCode.current = detectCountryFromTimezone();
    utmParams.current = getUTMParams();
  }, []);

  const disableAnalytics = useCallback((reason: string) => {
    isDisabled.current = true;
    eventQueue.current = [];

    try {
      sessionStorage.setItem(ANALYTICS_DISABLED_STORAGE_KEY, "1");
    } catch {
      // ignore
    }

    if (import.meta.env.DEV) {
      console.warn("Analytics disabled:", reason);
    }
  }, []);

  const buildRecord = useCallback((event: AnalyticsEvent) => {
    return {
      event_name: event.event_name,
      event_data: (event.event_data || {}) as Json,
      page_path: event.page_path || window.location.pathname,
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      country_code: countryCode.current,
      utm_source: utmParams.current.utm_source,
      utm_medium: utmParams.current.utm_medium,
      utm_campaign: utmParams.current.utm_campaign,
      utm_term: utmParams.current.utm_term,
      utm_content: utmParams.current.utm_content,
    };
  }, []);

  const processQueue = useCallback(async () => {
    if (isDisabled.current) return;
    if (isProcessing.current || eventQueue.current.length === 0) return;
    if (Date.now() < nextAttemptAtMs.current) return;
    
    isProcessing.current = true;
    const events = [...eventQueue.current];
    eventQueue.current = [];

    try {
      const records = events.map(buildRecord);

      const { error } = await supabase.from("analytics_events").insert(records);
      
      if (error) {
        if (shouldDisableAnalyticsForError(error)) {
          disableAnalytics("insert_forbidden");
          return;
        }

        consecutiveFailures.current += 1;
        if (consecutiveFailures.current >= 3) {
          disableAnalytics("insert_failed_repeatedly");
          return;
        }

        // Re-queue failed events and back off to avoid spamming requests/logs.
        eventQueue.current = [...events, ...eventQueue.current];

        const delay = retryDelayMs.current;
        nextAttemptAtMs.current = Date.now() + delay;
        retryDelayMs.current = Math.min(delay * 2, 60_000);

        if (import.meta.env.DEV && !hasLoggedError.current) {
          hasLoggedError.current = true;
          console.warn("Analytics insert failed; will retry with backoff.", error);
        }
        return;
      }

      // Success: reset retry state.
      consecutiveFailures.current = 0;
      nextAttemptAtMs.current = 0;
      retryDelayMs.current = 2000;
      hasLoggedError.current = false;
    } catch (err) {
      if (shouldDisableAnalyticsForError(err)) {
        disableAnalytics("insert_throw_forbidden");
        return;
      }

      consecutiveFailures.current += 1;
      if (consecutiveFailures.current >= 3) {
        disableAnalytics("insert_throw_failed_repeatedly");
        return;
      }

      // Re-queue and back off.
      eventQueue.current = [...events, ...eventQueue.current];

      const delay = retryDelayMs.current;
      nextAttemptAtMs.current = Date.now() + delay;
      retryDelayMs.current = Math.min(delay * 2, 60_000);

      if (import.meta.env.DEV && !hasLoggedError.current) {
        hasLoggedError.current = true;
        console.warn("Analytics insert threw; will retry with backoff.", err);
      }
    } finally {
      isProcessing.current = false;
    }
  }, [buildRecord, disableAnalytics]);

  const flushQueueWithKeepalive = useCallback((events: AnalyticsEvent[]) => {
    if (isDisabled.current) return;
    if (events.length === 0) return;

    const url = `${supabaseUrl}/rest/v1/analytics_events`;
    const anonKey = supabaseAnonKey;
    const records = events.slice(0, KEEPALIVE_FLUSH_LIMIT).map(buildRecord);

    try {
      void fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(records),
        keepalive: true,
      });
    } catch {
      // Best effort on navigation; ignore.
    }
  }, [buildRecord]);

  // Process queue every 2 seconds (batch inserts for performance)
  useEffect(() => {
    if (isDisabled.current) return;
    const interval = setInterval(processQueue, 2000);
    
    // Best-effort flush when the document is being hidden (close, nav, tab switch).
    const flushPending = () => {
      if (eventQueue.current.length === 0) return;
      const pending = [...eventQueue.current];
      eventQueue.current = [];
      flushQueueWithKeepalive(pending);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPending();
      }
    };

    window.addEventListener("pagehide", flushPending);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("pagehide", flushPending);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [processQueue, flushQueueWithKeepalive]);

  const trackEvent = useCallback((eventName: string, eventData?: Record<string, unknown>) => {
    if (isDisabled.current) return;
    eventQueue.current.push({
      event_name: eventName,
      event_data: (eventData || {}) as Json,
      page_path: window.location.pathname,
    });

    const overflow = eventQueue.current.length - MAX_QUEUE_SIZE;
    if (overflow > 0) {
      eventQueue.current.splice(0, overflow);
    }
  }, []);

  const trackPageView = useCallback(() => {
    trackEvent("page_view", {
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [trackEvent]);

  const trackClick = useCallback((buttonText: string) => {
    trackEvent("click", {
      button_text: buttonText,
      page_location: window.location.href,
    });
  }, [trackEvent]);

  const trackFormSubmit = useCallback((formId: string) => {
    trackEvent("form_submit", { form_id: formId });
  }, [trackEvent]);

  const trackScrollDepth = useCallback((percent: number) => {
    trackEvent("scroll_depth", { percent });
  }, [trackEvent]);

  const trackTimeOnPage = useCallback((seconds: number) => {
    trackEvent("time_on_page", { seconds });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackClick,
    trackFormSubmit,
    trackScrollDepth,
    trackTimeOnPage,
  };
};
