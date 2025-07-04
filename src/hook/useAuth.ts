import { useState, useEffect } from "react";

export function useAuth() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    useEffect(() => {
        const stored = localStorage.getItem("isLoggedIn");
        setIsLoggedIn(stored === "true");
    }, []);

    const login = () => {
        localStorage.setItem("isLoggedIn", "true");
        setIsLoggedIn(true);    
    }

    const logout = () => {
        localStorage.setItem("isLoggedIn", "false");
        setIsLoggedIn(false);
    }

    return { isLoggedIn, login, logout};
}