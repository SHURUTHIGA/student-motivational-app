import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { getInstitutionById } from "../config/institutions";

function Navbar() {
    const navigate = useNavigate();
    const { isLoggedIn, userRole: role, userEmail: email, institutionId, institutionName, logout } = useAuth();
    const institution = getInstitutionById(institutionId);

    const getMaskedEmail = (value) => {
        if (!value || !value.includes("@")) return value || "";
        const [name, domain] = value.split("@");
        if (name.length <= 3) return `${name[0] || ""}***@${domain}`;
        return `${name.slice(0, 3)}****@${domain}`;
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="brand">
                    <Logo size={36} />
                    <span>{institutionName || institution.name}</span>
                </Link>

                <nav className="nav-links">
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/about" className="nav-link">About</Link>
                    {!isLoggedIn && <Link to="/register" className="nav-link">Register</Link>}
                    {!isLoggedIn && <Link to="/login" className="nav-link">Login</Link>}
                    {isLoggedIn && role === "student" && <Link to="/tracker" className="nav-link">Tracker</Link>}
                    {isLoggedIn && role === "teacher" && <Link to="/dashboard" className="nav-link">Dashboard</Link>}
                    {isLoggedIn && email && (
                        <span className="profile-pill" title={email}>
                            {getMaskedEmail(email)}
                        </span>
                    )}
                    <span className="profile-pill" title={institution.name}>
                        {institutionName || institution.shortName}
                    </span>
                    {isLoggedIn && (
                        <button
                            onClick={handleLogout}
                            className="nav-link"
                            style={{ border: "1px solid rgba(255, 255, 255, 0.45)", background: "rgba(255, 255, 255, 0.16)", cursor: "pointer" }}
                        >
                            Logout
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Navbar;




