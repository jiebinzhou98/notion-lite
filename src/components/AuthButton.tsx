import React from "react";
import { useAuth } from "@/hook/useAuth";

export default function AuthButton() {
    const {isLoggedIn, login, logout} = useAuth();

    return (
        <button onClick={isLoggedIn ? logout : login}>
            {isLoggedIn ? "Logout" : "Login"}
        </button>
    )
}