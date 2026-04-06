import React, { createContext, useContext, useMemo, useState } from "react";
import { DEFAULT_INSTITUTION_ID } from "../config/institutions";

const AuthContext = createContext(null);

function getInitialAuthState() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userEmail = localStorage.getItem("userEmail") || "";
    const userRole = localStorage.getItem("userRole") || "";
    const token = localStorage.getItem("authToken") || "";
    const institutionId = localStorage.getItem("institutionId") || DEFAULT_INSTITUTION_ID;
    const institutionName = localStorage.getItem("institutionName") || "";

    return {
        isLoggedIn: isLoggedIn && Boolean(token),
        userEmail,
        userRole,
        token,
        institutionId,
        institutionName
    };
}

export function AuthProvider({ children }) {
    const [authState, setAuthState] = useState(getInitialAuthState);

    const login = ({ email, role, token, institutionId, institutionName }) => {
        const nextState = {
            isLoggedIn: true,
            userEmail: email,
            userRole: role,
            token,
            institutionId,
            institutionName
        };

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userRole", role);
        localStorage.setItem("authToken", token);
        localStorage.setItem("institutionId", institutionId || DEFAULT_INSTITUTION_ID);
        localStorage.setItem("institutionName", institutionName || "");
        setAuthState(nextState);
    };

    const logout = () => {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        localStorage.removeItem("authToken");
        localStorage.removeItem("institutionId");
        localStorage.removeItem("institutionName");
        setAuthState({
            isLoggedIn: false,
            userEmail: "",
            userRole: "",
            token: "",
            institutionId: DEFAULT_INSTITUTION_ID,
            institutionName: ""
        });
    };

    const value = useMemo(() => ({ ...authState, login, logout }), [authState]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
