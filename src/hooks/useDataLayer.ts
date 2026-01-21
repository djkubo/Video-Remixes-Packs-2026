// Declare dataLayer on window
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// Ensure dataLayer exists
if (typeof window !== "undefined" && !window.dataLayer) {
  window.dataLayer = [];
}

export const useDataLayer = () => {
  const trackClick = (buttonText: string) => {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "generic_click",
        button_text: buttonText,
        page_location: window.location.href,
      });
    }
  };

  const trackFormSubmit = (formId: string) => {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "form_submit",
        form_id: formId,
      });
    }
  };

  const trackPurchase = (value: number, currency: string = "USD") => {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "purchase",
        value: value,
        currency: currency,
      });
    }
  };

  const trackEvent = (eventName: string, data?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...data,
      });
    }
  };

  return { trackClick, trackFormSubmit, trackPurchase, trackEvent };
};
