import React from "react";
import { getInstitutionById, DEFAULT_INSTITUTION_ID } from "../config/institutions";

function About() {
    const institution = getInstitutionById(DEFAULT_INSTITUTION_ID);

    return (
        <main className="page app-shell">
            <section className="container" style={{ display: "grid", gap: "16px" }}>
                <article className="card card-pad">
                    <span className="badge">About The Project</span>
                    <h1 className="title" style={{ marginTop: "10px" }}>{institution.shortName} Student Motivation Analyzer</h1>
                    <p className="subtext">
                        The app transforms daily academic behavior into motivation intelligence so students can improve with purpose,
                        and teachers can support the right learners inside {institution.name}.
                    </p>
                </article>

                <div className="grid-2">
                    <article className="card card-pad">
                        <img
                            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
                            alt="Students studying together"
                            style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "10px", marginBottom: "12px" }}
                        />
                        <h2 className="title">Problem It Solves</h2>
                        <p className="subtext" style={{ marginBottom: "10px" }}>
                            Motivation decreases before academic performance does. This system identifies early warning signals
                            from routine learning patterns and helps institutions reduce late interventions.
                        </p>
                        <ul className="list">
                            <li>Early detection of motivation decline.</li>
                            <li>Action-focused insights for students and mentors.</li>
                            <li>Support for retention and burnout prevention.</li>
                        </ul>
                    </article>

                    <article className="card card-pad">
                        <img
                            src="https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=900&q=80"
                            alt="Teacher reviewing student data"
                            style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "10px", marginBottom: "12px" }}
                        />
                        <h2 className="title">How The Model Works</h2>
                        <p className="subtext" style={{ marginBottom: "10px" }}>
                            The motivation score blends study routine, attendance consistency, assignment momentum,
                            wellbeing indicators, and engagement behavior into one interpretable index.
                        </p>
                        <ul className="list">
                            <li>80-100: Highly Motivated</li>
                            <li>60-79: Moderately Motivated</li>
                            <li>40-59: At Risk</li>
                            <li>Below 40: Critical Motivation Drop</li>
                        </ul>
                    </article>
                </div>

                <div className="grid-2">
                    <article className="card card-pad">
                        <h2 className="title">Why It Is Intelligent</h2>
                        <ul className="list">
                            <li>Pattern recognition across behavior and academic signals.</li>
                            <li>Dynamic scoring that adapts to new student inputs.</li>
                            <li>Personalized recommendation generation for improvement.</li>
                            <li>Teacher-friendly visibility into institution-specific student momentum.</li>
                        </ul>
                    </article>

                    <article className="card card-pad">
                        <h2 className="title">Innovation Vision</h2>
                        <ul className="list">
                            <li>Trend timeline for motivation movement over weeks.</li>
                            <li>Early-risk alerts for mentors and class advisors.</li>
                            <li>Personal learning action plans for each student.</li>
                            <li>Gamified progress loops for consistency building.</li>
                        </ul>
                    </article>
                </div>

                <article className="card card-pad center">
                    <img
                        src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1400&q=80"
                        alt="Motivational learning environment"
                        style={{ width: "100%", maxHeight: "260px", objectFit: "cover", borderRadius: "12px", marginBottom: "12px" }}
                    />
                    <p className="subtext" style={{ fontWeight: 600 }}>
                        "Predict motivation early, act quickly, and protect academic momentum."
                    </p>
                </article>

                <div className="center">
                    <span className="badge">Predictive Analytics | Early Detection | Data-Driven Insights</span>
                </div>
            </section>
        </main>
    );
}

export default About;
