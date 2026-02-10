import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { detectCountryCodeFromTimezone } from "@/lib/country";

interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number;
  name: string;
}

interface CurrencyContextType {
  currency: CurrencyInfo;
  currencies: CurrencyInfo[];
  setCurrency: (code: string) => void;
  convertPrice: (usdPrice: number) => string;
  loading: boolean;
}

const defaultCurrencies: CurrencyInfo[] = [
  { code: "USD", symbol: "$", rate: 1, name: "US Dollar" },
  { code: "MXN", symbol: "$", rate: 17.5, name: "Mexican Peso" },
  { code: "EUR", symbol: "€", rate: 0.92, name: "Euro" },
  { code: "GBP", symbol: "£", rate: 0.79, name: "British Pound" },
  { code: "COP", symbol: "$", rate: 4000, name: "Colombian Peso" },
  { code: "ARS", symbol: "$", rate: 850, name: "Argentine Peso" },
  { code: "CLP", symbol: "$", rate: 880, name: "Chilean Peso" },
  { code: "PEN", symbol: "S/", rate: 3.7, name: "Peruvian Sol" },
  { code: "BRL", symbol: "R$", rate: 4.9, name: "Brazilian Real" },
];

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>(defaultCurrencies);
  const [currency, setCurrencyState] = useState<CurrencyInfo>(defaultCurrencies[0]);
  const [loading, setLoading] = useState(true);

  // Fetch exchange rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Using free exchangerate API
        const response = await fetch(
          "https://api.exchangerate-api.com/v4/latest/USD"
        );
        if (response.ok) {
          const data = await response.json();
          const rates = data.rates;
          
          const updatedCurrencies = defaultCurrencies.map((curr) => ({
            ...curr,
            rate: rates[curr.code] || curr.rate,
          }));
          
          setCurrencies(updatedCurrencies);
          
          // Try to detect user's country
          detectUserCurrency(updatedCurrencies);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.log("Using default exchange rates");
        detectUserCurrency(defaultCurrencies);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const detectUserCurrency = async (availableCurrencies: CurrencyInfo[]) => {
    // Check if user has a saved preference
    const savedCurrency = localStorage.getItem("vrp-currency");
    if (savedCurrency) {
      const found = availableCurrencies.find((c) => c.code === savedCurrency);
      if (found) {
        setCurrencyState(found);
        return;
      }
    }

    // Try to detect from timezone/locale (no network to avoid CORS failures).
    const countryToCurrency: { [key: string]: string } = {
      MX: "MXN",
      US: "USD",
      CO: "COP",
      AR: "ARS",
      CL: "CLP",
      PE: "PEN",
      BR: "BRL",
      GB: "GBP",
      ES: "EUR",
      FR: "EUR",
      DE: "EUR",
      IT: "EUR",
    };

    const tzCountry = detectCountryCodeFromTimezone();
    const localeCountry = (() => {
      const lang = navigator.language || "";
      const parts = lang.split("-");
      const cc = parts.length >= 2 ? parts[1] : "";
      return cc.toUpperCase() || null;
    })();

    const countryCode = tzCountry || localeCountry || "US";
    const currencyCode = countryToCurrency[countryCode] || "USD";
    const found = availableCurrencies.find((c) => c.code === currencyCode);
    if (found) {
      setCurrencyState(found);
      localStorage.setItem("vrp-currency", found.code);
    }
  };

  const setCurrency = (code: string) => {
    const found = currencies.find((c) => c.code === code);
    if (found) {
      setCurrencyState(found);
      localStorage.setItem("vrp-currency", code);
    }
  };

  const convertPrice = (usdPrice: number): string => {
    const converted = usdPrice * currency.rate;
    
    // Format based on currency
    if (currency.code === "USD" || currency.code === "EUR" || currency.code === "GBP") {
      return `${currency.symbol}${converted.toFixed(0)}`;
    }
    
    // For currencies with large values, use thousands separator
    if (converted >= 1000) {
      return `${currency.symbol}${converted.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    }
    
    return `${currency.symbol}${converted.toFixed(0)}`;
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, currencies, setCurrency, convertPrice, loading }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
