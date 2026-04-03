import { API_BASE_URL } from "../config/api";
import { User, UserRole } from "../types";

const getHeaders = () => {
    const token = sessionStorage.getItem("authToken");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

export const getMyProfile = async (): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch profile");
    return response.json();
};

export const getAllUsers = async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch users");
    return response.json();
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ role })
    });
    if (!response.ok) throw new Error("Failed to update role");
    return response.json();
};
