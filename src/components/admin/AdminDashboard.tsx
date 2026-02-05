import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  country_name: string | null;
  source: string | null;
  created_at: string;
  manychat_synced: boolean | null;
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
  const [dateRange, setDateRange] = useState("7");
  const [activeTab, setActiveTab] = useState<"overview" | "sources" | "leads" | "events">("overview");

  const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
  const endDate = endOfDay(new Date());

  // Fetch leads
  const { data: leads, isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
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

  // Fetch analytics summary via RPC (optimized - no raw data download)
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
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
  const { data: dailyTrends } = useQuery({
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
  const { data: eventBreakdown } = useQuery({
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
  const { data: countryBreakdown } = useQuery({
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
  const { data: sourceBreakdown } = useQuery({
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

  const handleRefresh = () => {
    refetchLeads();
    refetchAnalytics();
  };

  const exportLeadsCSV = () => {
    if (!leads?.length) return;
    
    const headers = ["Nombre", "Email", "Teléfono", "País", "Fuente", "Fecha", "ManyChat Sync"];
    const rows = leads.map(lead => [
      lead.name,
      lead.email,
      lead.phone,
      lead.country_name || "",
      lead.source || "",
      format(new Date(lead.created_at), "dd/MM/yyyy HH:mm"),
      lead.manychat_synced ? "Sí" : "No",
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
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
          <h1 className="text-2xl font-bold">Dashboard de Analítica</h1>
          <p className="text-muted-foreground">Métricas de tráfico y conversiones</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="14">Últimos 14 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {[
          { id: "overview", label: "Resumen" },
          { id: "sources", label: "Fuentes" },
          { id: "leads", label: `Leads (${leads?.length || 0})` },
          { id: "events", label: "Eventos" },
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
                  Visitantes Únicos
                </CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? "..." : analytics?.total_visitors.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Páginas Vistas
                </CardTitle>
                <Eye className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? "..." : analytics?.total_page_views.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Clics en CTAs
                </CardTitle>
                <MousePointer className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? "..." : analytics?.total_clicks.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tasa de Conversión
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {analyticsLoading ? "..." : `${analytics?.conversion_rate.toFixed(2)}%`}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Traffic Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Tráfico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrends}>
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
                        name="Visitantes"
                      />
                      <Line
                        type="monotone"
                        dataKey="page_views"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={2}
                        dot={false}
                        name="Páginas Vistas"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Events Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Eventos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventBreakdown} layout="vertical">
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
                <CardTitle>Visitantes por País</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={countryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {countryBreakdown?.map((_, index) => (
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
                <CardTitle>Métricas de Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Scroll Promedio</span>
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
                    <span className="text-muted-foreground">Tiempo Promedio</span>
                    <span className="font-medium">
                      {Math.floor((analytics?.avg_time_on_page || 0) / 60)}m {Math.round((analytics?.avg_time_on_page || 0) % 60)}s
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {analytics?.total_sessions?.toLocaleString() || 0} sesiones totales
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Leads Capturados</span>
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
                  Fuentes de Tráfico (utm_source)
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
                      Sin datos de fuentes
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Traffic Mediums */}
            <Card>
              <CardHeader>
                <CardTitle>Medios (utm_medium)</CardTitle>
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
                <CardTitle>Campañas (utm_campaign)</CardTitle>
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
                          name="Visitantes"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Sin campañas activas. Usa utm_campaign en tus enlaces.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* UTM Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Cómo usar parámetros UTM</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  Agrega estos parámetros a tus enlaces para rastrear de dónde viene el tráfico:
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
                      Origen: whatsapp, instagram, tiktok, email, facebook
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">utm_medium</p>
                    <p className="text-muted-foreground">
                      Medio: social, paid, email, messaging, organic
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">utm_campaign</p>
                    <p className="text-muted-foreground">
                      Nombre de campaña: lanzamiento, promo_navidad, etc.
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
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              {leads?.length || 0} leads en el período seleccionado
            </p>
            <Button variant="outline" onClick={exportLeadsCSV} disabled={!leads?.length}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>ManyChat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : leads?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay leads en este período
                    </TableCell>
                  </TableRow>
                ) : (
                  leads?.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.country_name || "-"}</TableCell>
                      <TableCell>
                        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                          {lead.source || "exit_intent"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(lead.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell>
                        {lead.manychat_synced ? (
                          <span className="text-green-500">✓</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos los Eventos</CardTitle>
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
