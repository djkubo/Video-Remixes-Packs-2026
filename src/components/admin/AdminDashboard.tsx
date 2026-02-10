import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
  Copy,
  Users,
  Eye,
  MousePointer,
  Clock,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  country_name: string | null;
  tags?: string[] | null;
  source: string | null;
  created_at: string;
  manychat_synced: boolean | null;
  manychat_subscriber_id?: string | null;
  payment_provider?: string | null;
  payment_id?: string | null;
  paid_at?: string | null;
  shipping_to?: unknown;
  shipping_label_url?: string | null;
  shipping_tracking_number?: string | null;
  shipping_carrier?: string | null;
  shipping_servicelevel?: string | null;
  shipping_status?: string | null;
}

interface AnalyticsSummary {
  total_visitors: number;
  total_sessions: number;
  total_page_views: number;
  total_clicks: number;
  avg_time_on_page: number;
  avg_scroll_depth: number;
  conversion_rate: number;
}

interface DailyTrend {
  date: string;
  visitors: number;
  page_views: number;
}

interface BreakdownItem {
  name: string;
  value: number;
}

interface SourceBreakdown {
  sources: BreakdownItem[];
  mediums: BreakdownItem[];
  campaigns: BreakdownItem[];
}

export default function AdminDashboard() {
  const { t, language } = useLanguage();
  const dateLocale = language === "es" ? es : enUS;
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState("7");
  const [activeTab, setActiveTab] = useState<"overview" | "sources" | "leads" | "events">("overview");
  const [leadSearch, setLeadSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [resyncingLeadId, setResyncingLeadId] = useState<string | null>(null);

  const { startDate, endDate } = useMemo(() => {
    const days = Math.max(1, Number.parseInt(dateRange, 10) || 7);
    // "Last N days" should include today, so subtract N - 1.
    const start = startOfDay(subDays(new Date(), Math.max(0, days - 1)));
    const end = endOfDay(new Date());
    return { startDate: start, endDate: end };
  }, [dateRange]);

  const fmtInt = (value: number | null | undefined): string => {
    return typeof value === "number" ? value.toLocaleString() : "—";
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: language === "es" ? "Copiado" : "Copied",
        description: language === "es" ? "Se copió al portapapeles." : "Copied to clipboard.",
      });
    } catch {
      toast({
        title: language === "es" ? "No se pudo copiar" : "Copy failed",
        description:
          language === "es"
            ? "No se pudo copiar al portapapeles."
            : "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const resyncManyChat = async (leadId: string) => {
    if (!leadId) return;
    if (resyncingLeadId) return;

    setResyncingLeadId(leadId);
    try {
      const { data, error } = await supabase.functions.invoke("sync-manychat", {
        body: { leadId },
      });

      if (error) throw error;

      const ok = Boolean((data as { success?: unknown } | null)?.success);
      toast({
        title: language === "es" ? "ManyChat" : "ManyChat",
        description: ok
          ? language === "es"
            ? "Sincronización completada."
            : "Sync completed."
          : language === "es"
            ? "No se pudo sincronizar."
            : "Unable to sync.",
        variant: ok ? "default" : "destructive",
      });
    } catch (err) {
      console.error("ManyChat resync error:", err);
      toast({
        title: language === "es" ? "Error" : "Error",
        description:
          language === "es"
            ? "No se pudo sincronizar con ManyChat."
            : "Could not sync with ManyChat.",
        variant: "destructive",
      });
    } finally {
      setResyncingLeadId(null);
    }
  };

  const renderTags = (tags: string[] | null | undefined) => {
    const list = Array.isArray(tags) ? tags : [];
    if (!list.length) return <span className="text-muted-foreground">—</span>;

    const sorted = [...list].sort();
    const visible = sorted.slice(0, 4);
    const extra = sorted.length - visible.length;

    return (
      <div className="flex flex-wrap gap-1 max-w-[260px]">
        {visible.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="border-border/60 bg-card/40 px-2 py-0.5 text-[10px] text-muted-foreground"
          >
            {tag}
          </Badge>
        ))}
        {extra > 0 ? (
          <Badge
            variant="secondary"
            className="px-2 py-0.5 text-[10px]"
          >
            +{extra}
          </Badge>
        ) : null}
      </div>
    );
  };

  const renderPayment = (lead: Lead) => {
    const paidAt = lead.paid_at ? new Date(lead.paid_at) : null;
    const provider = (lead.payment_provider || "").toUpperCase();
    const isPaid = Boolean(paidAt);

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge
            variant={isPaid ? "default" : "outline"}
            className={isPaid ? "bg-green-600 hover:bg-green-600" : ""}
          >
            {isPaid ? (language === "es" ? "PAGADO" : "PAID") : (language === "es" ? "PENDIENTE" : "PENDING")}
          </Badge>
          {provider ? (
            <span className="text-xs text-muted-foreground">{provider}</span>
          ) : null}
        </div>
        {paidAt ? (
          <p className="text-xs text-muted-foreground">
            {format(paidAt, "dd MMM yyyy HH:mm", { locale: dateLocale })}
          </p>
        ) : null}
      </div>
    );
  };

  const renderShipping = (lead: Lead) => {
    const status = (lead.shipping_status || "").trim();
    const tracking = (lead.shipping_tracking_number || "").trim();

    if (!status && !tracking) {
      return <span className="text-muted-foreground">—</span>;
    }

    return (
      <div className="space-y-1">
        {status ? (
          <p className="text-xs font-medium">{status}</p>
        ) : null}
        {tracking ? (
          <p className="text-xs text-muted-foreground">{tracking}</p>
        ) : null}
      </div>
    );
  };

  // Fetch leads
  const {
    data: leads,
    isLoading: leadsLoading,
    isFetching: leadsFetching,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ["admin-leads", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
  });

  const filteredLeads = useMemo(() => {
    const normalize = (value: unknown): string =>
      String(value ?? "").toLowerCase().trim();

    if (!leads?.length) return [];
    const q = normalize(leadSearch);
    if (!q) return leads;

    return leads.filter((lead) => {
      const hay = [
        lead.name,
        lead.email,
        lead.phone,
        lead.country_name || "",
        lead.source || "",
        (lead.tags || []).join(" "),
        lead.payment_provider || "",
        lead.shipping_status || "",
        lead.shipping_tracking_number || "",
      ].map(normalize).join(" | ");

      return hay.includes(q);
    });
  }, [leadSearch, leads]);

  // Fetch analytics summary via RPC (optimized - no raw data download)
  const {
    data: analytics,
    isLoading: analyticsLoading,
    isFetching: analyticsFetching,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ["admin-analytics-rpc", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_analytics_summary", {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;

      const summary = data as {
        total_visitors: number;
        total_sessions: number;
        total_page_views: number;
        total_clicks: number;
        avg_time_on_page: number;
        avg_scroll_depth: number;
      };

      // Calculate conversion rate with leads count
      const conversionRate = summary.total_visitors > 0
        ? ((leads?.length || 0) / summary.total_visitors) * 100
        : 0;

      return {
        ...summary,
        conversion_rate: conversionRate,
      } as AnalyticsSummary;
    },
    enabled: leads !== undefined, // Wait for leads to calculate conversion rate
  });

  // Fetch daily trends via RPC (optimized)
  const { data: dailyTrends, isFetching: trendsFetching, refetch: refetchTrends } = useQuery({
    queryKey: ["admin-trends-rpc", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_daily_trends", {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      return (data as DailyTrend[]) || [];
    },
  });

  // Fetch event breakdown via RPC (optimized)
  const { data: eventBreakdown, isFetching: eventsFetching, refetch: refetchEvents } = useQuery({
    queryKey: ["admin-events-rpc", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_event_breakdown", {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      return (data as BreakdownItem[]) || [];
    },
  });

  // Fetch country breakdown via RPC (optimized)
  const { data: countryBreakdown, isFetching: countriesFetching, refetch: refetchCountries } = useQuery({
    queryKey: ["admin-countries-rpc", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_country_breakdown", {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      return (data as BreakdownItem[]) || [];
    },
  });

  // Fetch traffic sources breakdown via RPC (optimized)
  const { data: sourceBreakdown, isFetching: sourcesFetching, refetch: refetchSources } = useQuery({
    queryKey: ["admin-sources-rpc", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_source_breakdown", {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      return data as unknown as SourceBreakdown;
    },
  });

  const isRefreshing =
    leadsFetching ||
    analyticsFetching ||
    trendsFetching ||
    eventsFetching ||
    countriesFetching ||
    sourcesFetching;

  const dailyTrendsData = dailyTrends ?? [];
  const eventBreakdownData = eventBreakdown ?? [];
  const countryBreakdownData = countryBreakdown ?? [];

  const handleRefresh = () => {
    refetchLeads();
    refetchAnalytics();
    refetchTrends();
    refetchEvents();
    refetchCountries();
    refetchSources();
  };

  const exportLeadsCSV = () => {
    if (!filteredLeads?.length) return;
    
    const headers = [
      t("admin.dashboard.name"),
      t("admin.dashboard.email"),
      t("admin.dashboard.phone"),
      t("admin.dashboard.country"),
      t("admin.dashboard.source"),
      "Tags",
      "Payment Provider",
      "Paid At",
      "Shipping Status",
      "Tracking",
      t("admin.dashboard.date"),
      "ManyChat Sync",
      "ManyChat Subscriber ID",
      "Lead ID",
    ];

    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone,
      lead.country_name || "",
      lead.source || "",
      (lead.tags || []).join("|"),
      lead.payment_provider || "",
      lead.paid_at ? format(new Date(lead.paid_at), "yyyy-MM-dd HH:mm") : "",
      lead.shipping_status || "",
      lead.shipping_tracking_number || "",
      format(new Date(lead.created_at), "dd/MM/yyyy HH:mm"),
      lead.manychat_synced ? t("admin.dashboard.yes") : t("admin.dashboard.no"),
      lead.manychat_subscriber_id || "",
      lead.id,
    ]);

    const sanitizeForSpreadsheet = (value: string): string => {
      // Prevent Excel/Sheets formula injection.
      return /^[=+\-@]/.test(value) ? `'${value}` : value;
    };

    const toCsvCell = (value: unknown): string => {
      const str = sanitizeForSpreadsheet(String(value ?? ""));
      const escaped = str.replace(/"/g, '""');
      const needsQuotes = /[",\n\r]/.test(escaped);
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map(toCsvCell).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("admin.dashboard.subtitle")}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t("admin.dashboard.last7days")}</SelectItem>
              <SelectItem value="14">{t("admin.dashboard.last14days")}</SelectItem>
              <SelectItem value="30">{t("admin.dashboard.last30days")}</SelectItem>
              <SelectItem value="90">{t("admin.dashboard.last90days")}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {[
          { id: "overview", label: t("admin.dashboard.tabOverview") },
          { id: "sources", label: t("admin.dashboard.tabSources") },
          { id: "leads", label: `${t("admin.dashboard.tabLeads")} (${leads?.length || 0})` },
          { id: "events", label: t("admin.dashboard.tabEvents") },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("admin.dashboard.uniqueVisitors")}
                </CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? "..." : fmtInt(analytics?.total_visitors)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("admin.dashboard.pageViews")}
                </CardTitle>
                <Eye className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? "..." : fmtInt(analytics?.total_page_views)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("admin.dashboard.ctaClicks")}
                </CardTitle>
                <MousePointer className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? "..." : fmtInt(analytics?.total_clicks)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("admin.dashboard.conversionRate")}
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {analyticsLoading ? "..." : `${(analytics?.conversion_rate ?? 0).toFixed(2)}%`}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Traffic Trend */}
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.trafficTrend")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="visitors"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        name={t("admin.dashboard.visitors")}
                      />
                      <Line
                        type="monotone"
                        dataKey="page_views"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={2}
                        dot={false}
                        name={t("admin.dashboard.pageViews")}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Events Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.eventsByType")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventBreakdownData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Country Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.visitorsByCountry")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={countryBreakdownData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {countryBreakdownData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.engagementMetrics")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{t("admin.dashboard.avgScroll")}</span>
                    <span className="font-medium">{analytics?.avg_scroll_depth?.toFixed(0) || 0}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${analytics?.avg_scroll_depth || 0}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{t("admin.dashboard.avgTime")}</span>
                    <span className="font-medium">
                      {Math.floor((analytics?.avg_time_on_page || 0) / 60)}m {Math.round((analytics?.avg_time_on_page || 0) % 60)}s
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {analytics?.total_sessions?.toLocaleString() || 0} {t("admin.dashboard.totalSessions")}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t("admin.dashboard.capturedLeads")}</span>
                    <span className="text-2xl font-bold text-green-500">{leads?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Sources Tab */}
      {activeTab === "sources" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  {t("admin.dashboard.trafficSources")} (utm_source)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sourceBreakdown?.sources?.map((source, index) => {
                    const total = sourceBreakdown.sources.reduce((a, b) => a + b.value, 0);
                    const percent = total > 0 ? (source.value / total) * 100 : 0;
                    return (
                      <div key={source.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium capitalize flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            {source.name}
                          </span>
                          <span className="text-muted-foreground">
                            {source.value} ({percent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!sourceBreakdown?.sources?.length && (
                    <p className="text-muted-foreground text-center py-8">
                      {t("admin.dashboard.noSourceData")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Traffic Mediums */}
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.mediums")} (utm_medium)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceBreakdown?.mediums || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sourceBreakdown?.mediums?.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Campaigns */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t("admin.dashboard.campaigns")} (utm_campaign)</CardTitle>
              </CardHeader>
              <CardContent>
                {sourceBreakdown?.campaigns?.length ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sourceBreakdown.campaigns}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="name"
                          className="text-xs"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                          name={t("admin.dashboard.visitors")}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {t("admin.dashboard.noCampaigns")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* UTM Guide */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.dashboard.utmGuideTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  {t("admin.dashboard.utmGuideDesc")}
                </p>
                <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                  <code>
                    https://tudominio.com/?utm_source=instagram&utm_medium=social&utm_campaign=lanzamiento
                  </code>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <p className="font-medium">utm_source</p>
                    <p className="text-muted-foreground">
                      {t("admin.dashboard.utmSource")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">utm_medium</p>
                    <p className="text-muted-foreground">
                      {t("admin.dashboard.utmMedium")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">utm_campaign</p>
                    <p className="text-muted-foreground">
                      {t("admin.dashboard.utmCampaign")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leads Tab */}
      {activeTab === "leads" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground">
                {filteredLeads.length} {t("admin.dashboard.leadsInPeriod")}
              </p>
              {leads?.length ? (
                <p className="text-xs text-muted-foreground">
                  {language === "es"
                    ? `Mostrando ${filteredLeads.length} de ${leads.length}`
                    : `Showing ${filteredLeads.length} of ${leads.length}`}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                placeholder={language === "es" ? "Buscar lead..." : "Search lead..."}
                className="w-full sm:w-72"
              />
              <Button variant="outline" onClick={exportLeadsCSV} disabled={!filteredLeads.length}>
              <Download className="w-4 h-4 mr-2" />
              {t("admin.dashboard.exportCSV")}
            </Button>
          </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.dashboard.name")}</TableHead>
                  <TableHead>{t("admin.dashboard.email")}</TableHead>
                  <TableHead>{t("admin.dashboard.phone")}</TableHead>
                  <TableHead>{t("admin.dashboard.country")}</TableHead>
                  <TableHead>{t("admin.dashboard.source")}</TableHead>
                  <TableHead>{language === "es" ? "Pago" : "Payment"}</TableHead>
                  <TableHead>{language === "es" ? "Envío" : "Shipping"}</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>{t("admin.dashboard.date")}</TableHead>
                  <TableHead>ManyChat</TableHead>
                  <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      {t("admin.dashboard.loading")}
                    </TableCell>
                  </TableRow>
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      {leadSearch
                        ? language === "es"
                          ? "No hay resultados para tu búsqueda."
                          : "No results for your search."
                        : t("admin.dashboard.noLeads")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.country_name || "-"}</TableCell>
                      <TableCell>
                        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                          {lead.source || "exit_intent"}
                        </span>
                      </TableCell>
                      <TableCell>{renderPayment(lead)}</TableCell>
                      <TableCell>{renderShipping(lead)}</TableCell>
                      <TableCell>{renderTags(lead.tags)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(lead.created_at), "dd MMM yyyy HH:mm", { locale: dateLocale })}
                      </TableCell>
                      <TableCell>
                        {lead.manychat_synced ? (
                          <span className="text-green-500">✓</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              void resyncManyChat(lead.id);
                            }}
                            disabled={Boolean(resyncingLeadId)}
                          >
                            {resyncingLeadId === lead.id
                              ? language === "es"
                                ? "Sincronizando..."
                                : "Syncing..."
                              : language === "es"
                                ? "Re-sync"
                                : "Re-sync"}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              void copyToClipboard(lead.id);
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <Dialog open={Boolean(selectedLead)} onOpenChange={(open) => !open && setSelectedLead(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {language === "es" ? "Detalle del lead" : "Lead details"}
                </DialogTitle>
              </DialogHeader>

              {selectedLead ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("admin.dashboard.name")}</p>
                      <p className="font-medium">{selectedLead.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("admin.dashboard.email")}</p>
                      <p className="font-medium break-all">{selectedLead.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("admin.dashboard.phone")}</p>
                      <p className="font-medium">{selectedLead.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("admin.dashboard.country")}</p>
                      <p className="font-medium">{selectedLead.country_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("admin.dashboard.source")}</p>
                      <p className="font-medium">{selectedLead.source || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("admin.dashboard.date")}</p>
                      <p className="font-medium">
                        {format(new Date(selectedLead.created_at), "dd MMM yyyy HH:mm", { locale: dateLocale })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Pago" : "Payment"}
                      </p>
                      {renderPayment(selectedLead)}
                      {selectedLead.payment_id ? (
                        <div className="text-xs text-muted-foreground break-all">
                          {language === "es" ? "ID:" : "ID:"} {selectedLead.payment_id}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Envío" : "Shipping"}
                      </p>
                      {renderShipping(selectedLead)}
                      {selectedLead.shipping_label_url ? (
                        <a
                          href={selectedLead.shipping_label_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline"
                        >
                          {language === "es" ? "Ver etiqueta" : "View label"}
                        </a>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Tags</p>
                      {renderTags(selectedLead.tags)}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">ManyChat</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={selectedLead.manychat_synced ? "default" : "outline"}>
                          {selectedLead.manychat_synced
                            ? language === "es" ? "Sincronizado" : "Synced"
                            : language === "es" ? "No" : "No"}
                        </Badge>
                        {selectedLead.manychat_subscriber_id ? (
                          <span className="text-xs text-muted-foreground break-all">
                            {selectedLead.manychat_subscriber_id}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Button
                        variant="outline"
                        onClick={() => void copyToClipboard(selectedLead.id)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {language === "es" ? "Copiar Lead ID" : "Copy Lead ID"}
                      </Button>
                      <Button
                        onClick={() => void resyncManyChat(selectedLead.id)}
                        disabled={Boolean(resyncingLeadId)}
                      >
                        {resyncingLeadId === selectedLead.id
                          ? language === "es" ? "Sincronizando..." : "Syncing..."
                          : language === "es" ? "Re-sync ManyChat" : "Re-sync ManyChat"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.dashboard.allEvents")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={80} />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
