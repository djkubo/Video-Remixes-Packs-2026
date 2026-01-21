import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

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

export const useAnalytics = () => {
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

  useEffect(() => {
    visitorId.current = getVisitorId();
    sessionId.current = getSessionId();
    countryCode.current = detectCountryFromTimezone();
    utmParams.current = getUTMParams();
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || eventQueue.current.length === 0) return;
    
    isProcessing.current = true;
    const events = [...eventQueue.current];
    eventQueue.current = [];

    try {
      const records = events.map((event) => ({
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
      }));

      const { error } = await supabase.from("analytics_events").insert(records);
      
      if (error) {
        console.error("Analytics error:", error);
        // Re-queue failed events
        eventQueue.current = [...events, ...eventQueue.current];
      }
    } catch (err) {
      console.error("Analytics error:", err);
    } finally {
      isProcessing.current = false;
    }
  }, []);

  // Process queue every 2 seconds (batch inserts for performance)
  useEffect(() => {
    const interval = setInterval(processQueue, 2000);
    
    // Process remaining events before page unload
    const handleUnload = () => {
      if (eventQueue.current.length > 0) {
        // Use sendBeacon for reliability on page exit
        const events = eventQueue.current.map((event) => ({
          event_name: event.event_name,
          event_data: event.event_data || {},
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
        }));
        
        // Fallback: try to send synchronously
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics_events`,
          JSON.stringify(events)
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [processQueue]);

  const trackEvent = useCallback((eventName: string, eventData?: Record<string, unknown>) => {
    eventQueue.current.push({
      event_name: eventName,
      event_data: (eventData || {}) as Json,
      page_path: window.location.pathname,
    });
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
