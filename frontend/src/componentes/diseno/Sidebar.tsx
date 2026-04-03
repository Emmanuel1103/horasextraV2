import type { ReactNode } from "react";
import { Settings, LogOut, FileText, Clock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  /** Opciones de navegación principal */
  opciones: Array<{
    id: string;
    label: string;
    activo: boolean;
    onClick: () => void;
    badge?: number;
  }>;
  /** Callback para cerrar sesión */
  onCerrarSesion: () => void;
}

const Sidebar = ({ opciones, onCerrarSesion }: SidebarProps) => {
  const { user } = useAuth();

  // Obtener iniciales para el avatar
  const getIniciales = (nombre: string) => {
    if (!nombre) return "U";
    return nombre
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <aside className={styles.sidebar}>
      {/* Navegación principal */}
      <nav className={styles.navegacion}>
        {opciones.map((opcion) => (
          <button
            key={opcion.id}
            className={opcion.activo ? styles.opcionActiva : styles.opcion}
            onClick={opcion.onClick}
          >
            {opcion.id === "pendientes" && <Clock className={styles.icono} />}
            {opcion.id === "reportes" && <FileText className={styles.icono} />}
            {opcion.id === "configuracion" && <Settings className={styles.icono} />}
            <span className={styles.label}>{opcion.label}</span>
            {opcion.badge !== undefined && opcion.badge > 0 && (
              <span className={styles.badge}>{opcion.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Acciones en la parte inferior */}
      <div className={styles.acciones}>
        {user && (
          <div className={styles.usuarioFooter}>
            <div className={styles.usuarioContenedor}>
              <div className={styles.avatar}>
                {getIniciales(user.name)}
              </div>
              <div className={styles.usuarioInfo}>
                <span className={styles.nombreUsuario}>{user.name}</span>
                <span className={styles.rolUsuario}>{user.role}</span>
              </div>
            </div>
            <button 
              className={styles.botonCerrarSesion} 
              onClick={onCerrarSesion}
              title="Cerrar sesión"
            >
              <LogOut className={styles.iconoLogout} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
