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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TextLabelsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/reporte-horas-extras" replace />} />
              <Route path="/reporte-horas-extras" element={<ReporteHorasExtras />} />
              <Route path="/gestion-horas-extras" element={<GestionHorasExtras />} />
              <Route path="/aprobar-horas/:token" element={<AprobarHorasLink />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TextLabelsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
