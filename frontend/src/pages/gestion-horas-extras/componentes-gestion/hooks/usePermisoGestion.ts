import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const usePermisoGestion = () => {
  const navigate = useNavigate();
  const { token, user, isLoading: authLoading } = useAuth();
  const legacyGestionAuth = sessionStorage.getItem("gestionAuth") === "true";

  // Usa usuario de AuthContext; si no existe pero hay sesion local, habilita acceso de gestion.
  const usuario = useMemo(() => {
    if (user) return user;
    if (legacyGestionAuth) {
      return { role: "NOMINA" };
    }
    return null;
  }, [user, legacyGestionAuth]);

  const estaAutenticado = !!token || legacyGestionAuth;

  // No redirigir durante carga para evitar saltos al recargar.
  useEffect(() => {
    if (authLoading) return;
    if (!estaAutenticado) {
      navigate("/", { replace: true });
      return;
    }
  }, [authLoading, estaAutenticado, navigate]);

  useEffect(() => {
    if (!authLoading && estaAutenticado && usuario) {
      if (usuario.role !== "NOMINA" && usuario.role !== "DEV") {
        navigate("/reporte-horas-extras", { replace: true });
        toast.error("No tienes permisos para acceder a esta sección");
      }
    }
  }, [authLoading, estaAutenticado, usuario, navigate]);

  return {
    usuario,
    estaAutenticado,
    authLoading,
  };
};