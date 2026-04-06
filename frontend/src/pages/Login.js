import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DEFAULT_INSTITUTION_ID, INSTITUTIONS } from "../config/institutions";
import { resolveApiUrl } from "../lib/api";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const [institutionId, setInstitutionId] = useState(DEFAULT_INSTITUTION_ID);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        try {
            const res = await fetch(resolveApiUrl("/api/auth/login"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role, institutionId })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                const resolvedRole = data.user?.role || role;
                login({
                    email,
                    role: resolvedRole,
                    token: data.token,
                    institutionId: data.user?.institutionId || institutionId,
                    institutionName: data.user?.institutionName || ""
                });
                navigate(resolvedRole === "teacher" ? "/dashboard" : "/tracker");
            } else {
                setMessage(data.message || "Invalid credentials");
            }
        } catch (error) {
            setMessage("Unable to connect to server.");
        }
    };

    return (
        <main className="page app-shell">
            <section className="container" style={{ maxWidth: "560px" }}>
                <form onSubmit={handleLogin} className="card card-pad stack login-card" autoComplete="off">
                    <h2 className="title">Login</h2>
                    <p className="subtext">Choose institution and login type to continue.</p>
                    <select value={institutionId} onChange={(e) => setInstitutionId(e.target.value)} className="input">
                        {INSTITUTIONS.map((institution) => (
                            <option key={institution.id} value={institution.id}>
                                {institution.name}
                            </option>
                        ))}
                    </select>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="input">
                        <option value="student">Student Login</option>
                        <option value="teacher">Teacher Login</option>
                    </select>
                    <input
                        type="email"
                        name="login_email_input"
                        autoComplete="off"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input"
                    />
                    <div className="password-wrap">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="login_password_input"
                            autoComplete="new-password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input password-input"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            title={showPassword ? "Hide password" : "Show password"}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <path
                                    d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zm10 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Login</button>
                    {message && <p className="login-error">{message}</p>}
                </form>
            </section>
        </main>
    );
}

export default Login;
