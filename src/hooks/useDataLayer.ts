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

  /** GA4 / Meta standard: view_item (maps to ViewContent in Meta Pixel) */
  const trackViewContent = (item: {
    item_id: string;
    item_name: string;
    price: number;
    currency?: string;
  }) => {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "view_item",
        ecommerce: {
          currency: item.currency || "USD",
          value: item.price,
          items: [
            {
              item_id: item.item_id,
              item_name: item.item_name,
              price: item.price,
              quantity: 1,
            },
          ],
        },
      });
    }
  };

  /** GA4 / Meta standard: begin_checkout (maps to InitiateCheckout in Meta Pixel) */
  const trackBeginCheckout = (item: {
    item_id: string;
    item_name: string;
    price: number;
    currency?: string;
    cta_id?: string;
  }) => {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "begin_checkout",
        cta_id: item.cta_id || null,
        ecommerce: {
          currency: item.currency || "USD",
          value: item.price,
          items: [
            {
              item_id: item.item_id,
              item_name: item.item_name,
              price: item.price,
              quantity: 1,
            },
          ],
        },
      });
    }
  };

  /** GA4 / Meta standard: purchase (maps to Purchase in Meta Pixel) */
  const trackPurchase = (value: number, currency: string = "USD", transactionId?: string) => {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "purchase",
        ecommerce: {
          transaction_id: transactionId || `txn_${Date.now()}`,
          value: value,
          currency: currency,
          items: [
            {
              item_id: "usb_500gb",
              item_name: "USB 500GB DJ Collection",
              price: value,
              quantity: 1,
            },
          ],
        },
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

  return { trackClick, trackFormSubmit, trackViewContent, trackBeginCheckout, trackPurchase, trackEvent };
};
