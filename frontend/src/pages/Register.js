import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_INSTITUTION_ID, INSTITUTIONS } from "../config/institutions";
import { resolveApiUrl } from "../lib/api";

function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [institutionId, setInstitutionId] = useState(DEFAULT_INSTITUTION_ID);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!email || !password || !confirmPassword || !institutionId) {
            setMessage("Please fill all fields.");
            return;
        }
        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }
        if (password.length < 8) {
            setMessage("Password must be at least 8 characters.");
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await fetch(resolveApiUrl("/api/auth/register"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, institutionId })
            });
            const raw = await res.text();
            let data = {};
            try {
                data = raw ? JSON.parse(raw) : {};
            } catch (parseError) {
                data = {};
            }

            if (res.ok) {
                setMessage(data.message || "Registration completed.");
            } else if (data.message) {
                setMessage(data.message);
            } else if (res.status === 404) {
                setMessage("Register API not found. Start backend on port 5000 or set REACT_APP_API_BASE_URL.");
            } else {
                setMessage(`Registration failed (HTTP ${res.status}).`);
            }

            if (res.ok) {
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                setInstitutionId(DEFAULT_INSTITUTION_ID);
                setTimeout(() => navigate("/login"), 700);
            }
        } catch (error) {
            setMessage("Unable to connect to backend. Start backend server on port 5000.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="page app-shell">
            <section className="container" style={{ maxWidth: "420px" }}>
                <div className="github-doc-banner">
                    <h1>CREATE YOUR ACCOUNT</h1>
                    <span className="github-doc-icon" aria-hidden="true">-&gt;</span>
                </div>
                <form onSubmit={handleRegister} className="card card-pad stack">
                    <h2 className="title">Register</h2>
                    <p className="subtext">Create your profile for a specific institution and begin the motivation journey.</p>
                    <select value={institutionId} onChange={(e) => setInstitutionId(e.target.value)} className="input">
                        {INSTITUTIONS.map((institution) => (
                            <option key={institution.id} value={institution.id}>
                                {institution.name}
                            </option>
                        ))}
                    </select>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
                    <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" />
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: "100%" }}>
                        {isSubmitting ? "Registering..." : "Register"}
                    </button>
                    {message && <p style={{ margin: 0, color: "#ffffff" }}>{message}</p>}
                </form>
            </section>
        </main>
    );
}

export default Register;
