import { supabase } from "@/integrations/supabase/client";

// Facebook Pixel ID
const PIXEL_ID = "592329516660534";

// Generate unique event ID for deduplication between Pixel and CAPI
const generateEventId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Get Facebook browser cookies
const getFbCookies = () => {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return {
    fbc: cookies._fbc || null,
    fbp: cookies._fbp || null,
  };
};

// Initialize Facebook Pixel
export const initFacebookPixel = () => {
  if (typeof window === 'undefined') return;

  // Check if already initialized
  if ((window as any).fbq) return;

  // Facebook Pixel base code
  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  // Initialize with Pixel ID
  (window as any).fbq('init', PIXEL_ID);
  
  // Track PageView
  (window as any).fbq('track', 'PageView');

  console.log('Facebook Pixel initialized:', PIXEL_ID);
};

// Send event to CAPI (server-side)
const sendToCAPI = async (
  eventName: string,
  eventId: string,
  customData?: Record<string, any>,
  userData?: Record<string, any>
) => {
  try {
    const { fbc, fbp } = getFbCookies();

    const payload = {
      event_name: eventName,
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: window.location.href,
      action_source: "website",
      user_data: {
        client_user_agent: navigator.userAgent,
        fbc,
        fbp,
        ...userData,
      },
      custom_data: customData,
    };

    const { data, error } = await supabase.functions.invoke('facebook-capi', {
      body: payload,
    });

    if (error) {
      console.error('CAPI error:', error);
    } else {
      console.log('CAPI event sent:', eventName, data);
    }
  } catch (error) {
    console.error('Error sending to CAPI:', error);
  }
};

// Track standard events
export const fbTrackEvent = (
  eventName: string,
  customData?: Record<string, any>,
  userData?: Record<string, any>
) => {
  const eventId = generateEventId();

  // Client-side (Pixel)
  if ((window as any).fbq) {
    (window as any).fbq('track', eventName, { ...customData, eventID: eventId });
    console.log('Pixel event tracked:', eventName);
  }

  // Server-side (CAPI)
  sendToCAPI(eventName, eventId, customData, userData);
};

// Track custom events
export const fbTrackCustomEvent = (
  eventName: string,
  customData?: Record<string, any>,
  userData?: Record<string, any>
) => {
  const eventId = generateEventId();

  // Client-side (Pixel)
  if ((window as any).fbq) {
    (window as any).fbq('trackCustom', eventName, { ...customData, eventID: eventId });
    console.log('Pixel custom event tracked:', eventName);
  }

  // Server-side (CAPI)
  sendToCAPI(eventName, eventId, customData, userData);
};

// Standard Facebook Events
export const fbEvents = {
  // Page interactions
  PageView: () => fbTrackEvent('PageView'),
  ViewContent: (data?: { content_name?: string; content_category?: string; content_ids?: string[]; value?: number; currency?: string }) => 
    fbTrackEvent('ViewContent', data),
  
  // Lead & Contact
  Lead: (data?: { content_name?: string; value?: number; currency?: string }) => 
    fbTrackEvent('Lead', data),
  Contact: () => fbTrackEvent('Contact'),
  CompleteRegistration: (data?: { content_name?: string; status?: string; value?: number; currency?: string }) => 
    fbTrackEvent('CompleteRegistration', data),
  
  // E-commerce
  AddToCart: (data?: { content_ids?: string[]; content_name?: string; content_type?: string; value?: number; currency?: string }) => 
    fbTrackEvent('AddToCart', data),
  AddToWishlist: (data?: { content_ids?: string[]; content_name?: string; value?: number; currency?: string }) => 
    fbTrackEvent('AddToWishlist', data),
  InitiateCheckout: (data?: { content_ids?: string[]; value?: number; currency?: string; num_items?: number }) => 
    fbTrackEvent('InitiateCheckout', data),
  Purchase: (data: { value: number; currency: string; content_ids?: string[]; content_type?: string; num_items?: number }) => 
    fbTrackEvent('Purchase', data),
  
  // Subscription
  Subscribe: (data?: { value?: number; currency?: string; predicted_ltv?: number }) => 
    fbTrackEvent('Subscribe', data),
  StartTrial: (data?: { value?: number; currency?: string; predicted_ltv?: number }) => 
    fbTrackEvent('StartTrial', data),
  
  // Search
  Search: (data?: { search_string?: string; content_category?: string }) => 
    fbTrackEvent('Search', data),
  
  // Custom events for VideoRemixesPacks
  ClickCTA: (data?: { button_name?: string; section?: string }) => 
    fbTrackCustomEvent('ClickCTA', data),
  ViewPricing: () => fbTrackCustomEvent('ViewPricing'),
  ViewFAQ: () => fbTrackCustomEvent('ViewFAQ'),
  ScrollDepth: (data: { depth: number }) => 
    fbTrackCustomEvent('ScrollDepth', data),
};

// Global click tracking
export const initClickTracking = () => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // Track all button clicks
    const button = target.closest('button, a[href], [role="button"]');
    if (button) {
      const buttonText = button.textContent?.trim().substring(0, 50) || 'Unknown';
      const href = button.getAttribute('href') || '';
      
      fbTrackCustomEvent('ButtonClick', {
        button_text: buttonText,
        button_href: href,
        page_url: window.location.href,
        page_path: window.location.pathname,
      });
    }
  });

  console.log('Click tracking initialized');
};

// Scroll depth tracking
export const initScrollTracking = () => {
  const thresholds = [25, 50, 75, 90, 100];
  const trackedThresholds = new Set<number>();

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    thresholds.forEach((threshold) => {
      if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
        trackedThresholds.add(threshold);
        fbEvents.ScrollDepth({ depth: threshold });
      }
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  console.log('Scroll tracking initialized');
};
