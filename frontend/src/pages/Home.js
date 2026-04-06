import React from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { getInstitutionById, DEFAULT_INSTITUTION_ID } from "../config/institutions";

function Home() {
    const institution = getInstitutionById(DEFAULT_INSTITUTION_ID);

    return (
        <main className="page app-shell portal-page">
            <section className="container">
                <article className="portal-hero fade-up">
                    <div className="portal-copy">
                        <p className="portal-kicker">{institution.name}</p>
                        <h1 className="portal-title">{institution.heroTitle}</h1>
                        <p className="portal-description">
                            {institution.heroTagline}
                        </p>
                        <div className="hero-actions">
                            <Link to="/register" className="btn btn-primary">Apply Now</Link>
                            <Link to="/login" className="btn btn-secondary">Login</Link>
                        </div>
                    </div>

                    <div className="portal-visual">
                        <div className="student-visual-card">
                            <div className="student-logo">
                                <Logo size={70} />
                            </div>
                            <div className="student-screen">{institution.shortName} Insight Console</div>
                            <p>Institution-specific support for students and faculty</p>
                        </div>
                    </div>
                </article>

                <section className="portal-highlights fade-up" style={{ animationDelay: "0.08s" }}>
                    <article className="portal-highlight-item">
                        <strong>Quick Analysis</strong>
                        <span>Get your score in minutes</span>
                    </article>
                    <article className="portal-highlight-item">
                        <strong>Clear Guidance</strong>
                        <span>Simple suggestions to follow</span>
                    </article>
                    <article className="portal-highlight-item">
                        <strong>Teacher Ready</strong>
                        <span>Filtered by institution and cohort</span>
                    </article>
                </section>
            </section>
        </main>
    );
}

export default Home;
