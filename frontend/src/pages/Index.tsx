import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTextLabels } from "@/contexts/TextLabelsContext";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { textLabels } = useTextLabels();
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleReporteClick = () => {
    navigate("/reporte-horas-extras");
  };

  const handleGestionClick = () => {
    const authorizedUsers = JSON.parse(localStorage.getItem("authorizedUsers") || "[]");
    if (authorizedUsers.length === 0) {
      // Crear usuarios por defecto si no existen
      const defaultUsers = [
        { email: "lcueto@fsd.org", password: "1" },
        { email: "nomina@fundacionsantodomingo.org", password: "1" },
      ];
      localStorage.setItem("authorizedUsers", JSON.stringify(defaultUsers));
    }
    setLoginOpen(true);
  };

  const handleLogin = () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast.error("Por favor ingresa correo y contraseña");
      return;
    }
    
    const authorizedUsers = JSON.parse(localStorage.getItem("authorizedUsers") || "[]");
    const emailNormalized = loginEmail.trim().toLowerCase();
    const user = authorizedUsers.find(
      (u: any) => (u.email || "").toLowerCase() === emailNormalized && u.password === loginPassword
    );

    if (user) {
      sessionStorage.setItem("gestionAuth", "true");
      setLoginEmail("");
      setLoginPassword("");
      setLoginOpen(false);
      navigate("/gestion-horas-extras");
      toast.success("Acceso concedido");
    } else {
      toast.error("Correo o contraseña incorrectos");
    }
  };

  return (
    <div className="w-full h-full">
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        gap: "2rem",
        padding: "2rem"
      }}>
        <h1 style={{
          fontSize: "2rem",
          fontWeight: "bold",
          color: "#224d24",
          marginBottom: "1rem"
        }}>
          Sistema de gestión de horas extras
        </h1>
        
        <div style={{
          display: "flex",
          gap: "2rem",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "900px"
        }}>
          <div style={{
            flex: "1",
            minWidth: "320px",
            maxWidth: "400px",
            border: "2px solid #e2e8f0",
            borderRadius: "12px",
            padding: "2rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
            backgroundColor: "#fff"
          }}
          onClick={handleReporteClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#224d24";
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
          >
            <div style={{ textAlign: "center" }}>
              <FileText style={{ width: "4rem", height: "4rem", color: "#224d24", margin: "0 auto 1rem" }} />
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                {textLabels.MODULE_OVERTIME || "Reporte de horas extras"}
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.9375rem" }}>
                Para colaboradores que necesitan registrar sus horas extras
              </p>
            </div>
          </div>

          <div style={{
            flex: "1",
            minWidth: "320px",
            maxWidth: "400px",
            border: "2px solid #e2e8f0",
            borderRadius: "12px",
            padding: "2rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
            backgroundColor: "#fff"
          }}
          onClick={handleGestionClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#224d24";
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
          >
            <div style={{ textAlign: "center" }}>
              <Bell style={{ width: "4rem", height: "4rem", color: "#224d24", margin: "0 auto 1rem" }} />
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                {textLabels.MODULE_NOMINA || "Gestión de horas extras"}
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.9375rem" }}>
                Para el equipo de nómina que gestiona y aprueba registros
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de Login */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Acceso a Gestión de horas extras</DialogTitle>
            <DialogDescription>
              Ingresa tu correo electrónico y contraseña para acceder al módulo de gestión
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Correo electrónico</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="admin@fundacionsantodomingo.org"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setLoginOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleLogin}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                Acceder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
