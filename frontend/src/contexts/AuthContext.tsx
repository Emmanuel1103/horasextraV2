
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(sessionStorage.getItem("authToken"));
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(!!sessionStorage.getItem("authToken"));
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Check for token in URL query params (callback from backend)
        const params = new URLSearchParams(location.search);
        const urlToken = params.get("token");
        const error = params.get("error");

        if (urlToken) {
            setToken(urlToken);
            sessionStorage.setItem("authToken", urlToken);
            // Clean URL
            navigate(location.pathname, { replace: true });
            toast.success("Sesión iniciada correctamente");
        } else if (error) {
            toast.error(`Error de inicio de sesión: ${error}`);
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    useEffect(() => {
        const loadUser = async () => {
            setIsLoading(true); // Establishes loading state immediately
            if (token) {
                try {
                    const profile = await getMyProfile();
                    setUser(profile);
                } catch (error) {
                    console.error("Error loading profile", error);
                    // Invalid token?
                    // setToken(null);
                    // sessionStorage.removeItem("authToken");
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        };
        loadUser();
    }, [token]);

    const login = () => {
        window.location.href = `${API_BASE_URL}/auth/login`;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem("authToken");
        navigate("/");
        toast.info("Sesión cerrada");
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!token, token, user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
