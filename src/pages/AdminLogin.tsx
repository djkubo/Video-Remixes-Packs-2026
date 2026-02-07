import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Loader2, Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminLogin() {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if already authenticated and is admin
  useEffect(() => {
    const checkExistingAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user is admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        if (adminData) {
          navigate("/admin/music");
          return;
        }
      }
      setCheckingAuth(false);
    };

    checkExistingAuth();
  }, [navigate]);

  const getAuthErrorMessage = (err: unknown): string => {
    const msg =
      err && typeof err === "object" && "message" in err
        ? String((err as { message?: unknown }).message ?? "")
        : "";
    const lower = msg.toLowerCase();

    if (lower.includes("invalid login credentials")) {
      return language === "es"
        ? "Email o contraseña incorrectos"
        : "Incorrect email or password";
    }

    if (lower.includes("email not confirmed")) {
      return language === "es"
        ? "Confirma tu email antes de ingresar"
        : "Please confirm your email before signing in";
    }

    if (lower.includes("too many requests")) {
      return language === "es"
        ? "Demasiados intentos. Intenta de nuevo en unos minutos."
        : "Too many attempts. Please try again in a few minutes.";
    }

    return language === "es"
      ? "No se pudo iniciar sesión. Verifica tus datos e intenta de nuevo."
      : "Unable to sign in. Check your details and try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "Ingresa email y contraseña" : "Enter email and password",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description:
          language === "es"
            ? "La contraseña debe tener al menos 6 caracteres"
            : "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("No se pudo iniciar sesión");
      }

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .single();

      if (adminError || !adminData) {
        // Sign out if not admin
        await supabase.auth.signOut();
        toast({
          title: language === "es" ? "Acceso denegado" : "Access denied",
          description: language === "es" ? "No tienes permisos de administrador" : "You don't have admin access",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: language === "es" ? "Bienvenido" : "Welcome",
        description: language === "es" ? "Sesión iniciada correctamente" : "Signed in successfully",
      });
      navigate("/admin/music");
      
    } catch (error: unknown) {
      console.error("Auth error:", error);
      toast({
        title: language === "es" ? "Error" : "Error",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Music className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">
              {language === "es" ? "Panel de Admin" : "Admin Panel"}
            </h1>
            <p className="text-muted-foreground">
              {language === "es"
                ? "Acceso restringido a administradores"
                : "Restricted admin access"}
            </p>
          </div>

          {/* Security notice */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border mb-6">
            <ShieldAlert className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {language === "es"
                ? "Solo usuarios autorizados pueden acceder"
                : "Only authorized users can access"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ejemplo.com"
                className="mt-1"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">
                {language === "es" ? "Contraseña" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === "es" ? "Verificando..." : "Checking..."}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {language === "es" ? "Ingresar" : "Sign in"}
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
