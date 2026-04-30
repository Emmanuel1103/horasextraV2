/**
 * AuthContext.tsx — contexto global de autenticación
 *
 * gestiona el estado de la sesión del usuario, la integración con microsoft entra id
 * y el almacenamiento persistente del token de acceso en sessionStorage.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { toast } from "sonner";
import { User } from "../types";
import { getMyProfile } from "../services/usersService";

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    user: User | null;
    login: () => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * proveedor que envuelve la aplicación para disponibilizar los datos de usuario y métodos de auth.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(sessionStorage.getItem("authToken"));
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(!!sessionStorage.getItem("authToken"));
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // procesa el retorno desde el backend tras la autenticación sso
        const params = new URLSearchParams(location.search);
        const urlToken = params.get("token");
        const error = params.get("error");

        if (urlToken) {
            setToken(urlToken);
            sessionStorage.setItem("authToken", urlToken);
            // limpia la url para eliminar el token expuesto en la barra de direcciones
            navigate(location.pathname, { replace: true });
            toast.success("sesión iniciada correctamente");
        } else if (error) {
            toast.error(`error de inicio de sesión: ${error}`);
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    useEffect(() => {
        /**
         * carga el perfil detallado del usuario desde el backend usando el token actual.
         */
        const loadUser = async () => {
            setIsLoading(true);
            if (token) {
                try {
                    const profile = await getMyProfile();
                    setUser(profile);
                } catch (error) {
                    console.error("error al cargar perfil", error);
                    // opcional: manejar expiración de token
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        };
        loadUser();
    }, [token]);

    /**
     * redirige al portal de inicio de sesión de microsoft.
     */
    const login = () => {
        window.location.href = `${API_BASE_URL}/auth/login`;
    };

    /**
     * cierra la sesión activa y limpia el almacenamiento local.
     */
    const logout = () => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem("authToken");
        navigate("/");
        toast.info("sesión cerrada");
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!token, token, user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * hook personalizado para acceder al estado de autenticación de forma sencilla.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
    }
    return context;
};

