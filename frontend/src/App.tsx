/**
 * app.tsx — componente raíz y configurador de proveedores
 *
 * este componente centraliza la configuración de la aplicación, incluyendo:
 *  - gestión de estado con react query.
 *  - proveedores de contexto para autenticación y textos.
 *  - sistema de enrutamiento para la navegación entre páginas.
 *  - componentes globales de interfaz como notificaciones (toasts).
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ReporteHorasExtras from "./pages/ReporteHorasExtras";
import GestionHorasExtras from "./pages/GestionHorasExtras";
import { AprobarHorasLink } from "./pages/AprobarHorasLink";
import NotFound from "./pages/NotFound";
import { TextLabelsProvider } from "@/contexts/TextLabelsContext";
import { AuthProvider } from "@/contexts/AuthContext";

// cliente para la gestión de caché y peticiones asíncronas
const queryClient = new QueryClient();

/**
 * componente principal app: define la jerarquía de proveedores
 * y la estructura de rutas del aplicativo.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TextLabelsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* redirección inicial al formulario de reporte */}
              <Route path="/" element={<Navigate to="/reporte-horas-extras" replace />} />
              
              {/* rutas principales del sistema */}
              <Route path="/reporte-horas-extras" element={<ReporteHorasExtras />} />
              <Route path="/gestion-horas-extras" element={<GestionHorasExtras />} />
              <Route path="/aprobar-horas/:token" element={<AprobarHorasLink />} />
              
              {/* manejo de rutas no encontradas */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TextLabelsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

