import { supabase } from "@/integrations/supabase/client";

export type CheckoutProvider = "stripe" | "paypal";

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function createStripeCheckoutUrl(args: {
  leadId: string;
  product: string;
  sourcePage?: string;
}): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("stripe-checkout", {
    body: { leadId: args.leadId, product: args.product, sourcePage: args.sourcePage },
  });

  if (error) return null;

  return getString((data as { url?: unknown } | null)?.url);
}

export async function createPayPalCheckoutUrl(args: {
  leadId: string;
  product: string;
  sourcePage?: string;
}): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("paypal-checkout", {
    body: { action: "create", leadId: args.leadId, product: args.product, sourcePage: args.sourcePage },
  });

  if (error) return null;

  return getString((data as { approveUrl?: unknown } | null)?.approveUrl);
}

export async function createBestCheckoutUrl(args: {
  leadId: string;
  product: string;
  sourcePage?: string;
  prefer?: CheckoutProvider;
}): Promise<{ provider: CheckoutProvider | null; url: string | null }> {
  const prefer = args.prefer;
  const tryStripeFirst = prefer !== "paypal";

  if (tryStripeFirst) {
    const stripeUrl = await createStripeCheckoutUrl(args);
    if (stripeUrl) return { provider: "stripe", url: stripeUrl };
  }

  const paypalUrl = await createPayPalCheckoutUrl(args);
  if (paypalUrl) return { provider: "paypal", url: paypalUrl };

  if (!tryStripeFirst) {
    const stripeUrl = await createStripeCheckoutUrl(args);
    if (stripeUrl) return { provider: "stripe", url: stripeUrl };
  }

  return { provider: null, url: null };
}

