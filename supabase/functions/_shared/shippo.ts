export type ShippoAddress = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
};

export type ShippoParcel = {
  length: string;
  width: string;
  height: string;
  distance_unit: "in" | "cm";
  weight: string;
  mass_unit: "lb" | "oz" | "g" | "kg";
};

function safeJsonParse<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

export function getShippoToken(): string | null {
  const token = Deno.env.get("SHIPPO_TOKEN") || Deno.env.get("SHIPPO_API_TOKEN");
  return token && token.trim() ? token.trim() : null;
}

export function getShippoFromAddress(): ShippoAddress | null {
  const raw = Deno.env.get("SHIPPO_FROM_ADDRESS_JSON");
  if (!raw) return null;
  const parsed = safeJsonParse<ShippoAddress>(raw);
  if (!parsed) return null;

  // Minimal required fields
  if (
    !parsed.name ||
    !parsed.street1 ||
    !parsed.city ||
    !parsed.state ||
    !parsed.zip ||
    !parsed.country
  ) {
    return null;
  }
  return parsed;
}

export function getShippoParcelDefault(): ShippoParcel {
  const raw = Deno.env.get("SHIPPO_PARCEL_JSON");
  const parsed = raw ? safeJsonParse<ShippoParcel>(raw) : null;
  if (
    parsed &&
    parsed.length &&
    parsed.width &&
    parsed.height &&
    parsed.weight &&
    parsed.distance_unit &&
    parsed.mass_unit
  ) {
    return parsed;
  }

  // Safe-ish default parcel for a small USB package.
  return {
    length: "6",
    width: "4",
    height: "2",
    distance_unit: "in",
    weight: "0.4",
    mass_unit: "lb",
  };
}

export async function createShippoLabel(args: {
  token: string;
  fromAddress: ShippoAddress;
  toAddress: ShippoAddress;
  parcel?: ShippoParcel;
  labelFileType?: "PDF" | "PNG";
  metadata?: Record<string, string>;
}): Promise<{
  transactionId: string;
  trackingNumber: string;
  labelUrl: string;
  trackingUrlProvider?: string;
  carrier?: string;
  servicelevel?: string;
}> {
  const baseUrl = "https://api.goshippo.com";
  const parcel = args.parcel || getShippoParcelDefault();
  const labelFileType = args.labelFileType || "PDF";

  // 1) Create shipment (sync) to get rates.
  const shipmentRes = await fetch(`${baseUrl}/shipments/`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${args.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address_from: args.fromAddress,
      address_to: args.toAddress,
      parcels: [parcel],
      async: false,
      metadata: args.metadata ? JSON.stringify(args.metadata) : undefined,
    }),
  });

  const shipmentJson = (await shipmentRes.json().catch(() => ({}))) as Record<string, unknown>;
  if (!shipmentRes.ok) {
    console.error("[Shippo] Shipment creation failed");
    throw new Error("Shippo shipment creation failed");
  }

  const rates = Array.isArray(shipmentJson.rates) ? (shipmentJson.rates as unknown[]) : [];
  if (!rates.length) {
    console.error("[Shippo] No rates returned");
    throw new Error("Shippo returned no rates");
  }

  // Choose the cheapest rate by amount.
  const parsedRates = rates
    .map((r) => r as Record<string, unknown>)
    .map((r) => {
      const amountStr = typeof r.amount === "string" ? r.amount : "";
      const amount = amountStr ? Number.parseFloat(amountStr) : Number.NaN;
      return {
        raw: r,
        objectId: typeof r.object_id === "string" ? r.object_id : "",
        amount,
      };
    })
    .filter((r) => r.objectId && Number.isFinite(r.amount));

  parsedRates.sort((a, b) => a.amount - b.amount);
  const chosen = parsedRates[0];
  if (!chosen) {
    console.error("[Shippo] Could not parse rates");
    throw new Error("Shippo rates parse failed");
  }

  // 2) Buy label (transaction).
  const txnRes = await fetch(`${baseUrl}/transactions/`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${args.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rate: chosen.objectId,
      label_file_type: labelFileType,
      async: false,
      metadata: args.metadata ? JSON.stringify(args.metadata) : undefined,
    }),
  });

  const txnJson = (await txnRes.json().catch(() => ({}))) as Record<string, unknown>;
  if (!txnRes.ok) {
    console.error("[Shippo] Transaction failed");
    throw new Error("Shippo transaction failed");
  }

  const transactionId = typeof txnJson.object_id === "string" ? txnJson.object_id : "";
  const trackingNumber =
    typeof txnJson.tracking_number === "string" ? txnJson.tracking_number : "";
  const labelUrl = typeof txnJson.label_url === "string" ? txnJson.label_url : "";
  const trackingUrlProvider =
    typeof txnJson.tracking_url_provider === "string"
      ? txnJson.tracking_url_provider
      : undefined;

  const rate = typeof txnJson.rate === "object" && txnJson.rate
    ? (txnJson.rate as Record<string, unknown>)
    : null;
  const carrier = rate && typeof rate.provider === "string" ? rate.provider : undefined;
  const servicelevel = (() => {
    const sl = rate && typeof rate.servicelevel === "object" && rate.servicelevel
      ? (rate.servicelevel as Record<string, unknown>)
      : null;
    return sl && typeof sl.name === "string" ? sl.name : undefined;
  })();

  if (!transactionId || !trackingNumber || !labelUrl) {
    console.error("[Shippo] Missing label/tracking in response");
    throw new Error("Shippo response missing label/tracking");
  }

  return {
    transactionId,
    trackingNumber,
    labelUrl,
    trackingUrlProvider,
    carrier,
    servicelevel,
  };
}
