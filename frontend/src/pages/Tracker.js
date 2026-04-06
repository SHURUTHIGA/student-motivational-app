import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getInstitutionById } from "../config/institutions";
import { resolveApiUrl } from "../lib/api";

const ANALYSIS_HISTORY_KEY = "sma_analysis_history";

function Tracker() {
    const navigate = useNavigate();
    const { token, institutionId, institutionName, logout } = useAuth();
    const institution = getInstitutionById(institutionId);
    const [formData, setFormData] = useState({
        studentName: "",
        studentClass: "",
        section: "",
        department: "",
        semester: "",
        confidenceLevel: "",
        studyGoal: "",
        studyHours: "",
        attendance: "",
        attendanceLevel: "",
        assignmentCompletion: "",
        assignmentStatus: "",
        sleepHours: "",
        stressLevelText: ""
    });
    const [report, setReport] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        try {
            setIsSubmitting(true);
            if (!token) {
                setErrorMessage("Session expired. Please login again.");
                navigate("/login");
                return;
            }

            const res = await fetch(resolveApiUrl("/api/analyses"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    cgpa: formData.confidenceLevel ? Number(formData.confidenceLevel) * 2 : undefined,
                    assignmentCompletion: formData.assignmentCompletion ? Number(formData.assignmentCompletion) * 20 : undefined
                })
            });
            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.message || "Unable to analyze now.");
                return;
            }

            setReport(data.report);
            try {
                const rawHistory = localStorage.getItem(ANALYSIS_HISTORY_KEY);
                const parsedHistory = rawHistory ? JSON.parse(rawHistory) : [];
                const safeHistory = Array.isArray(parsedHistory) ? parsedHistory : [];
                const nextHistory = [data.report, ...safeHistory].slice(0, 20);
                localStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(nextHistory));
                window.dispatchEvent(new Event("analysis-history-updated"));
            } catch (storageError) {
                // Non-blocking: report UI still works even if local storage is unavailable.
            }
        } catch (error) {
            setErrorMessage("Unable to connect to server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <main className="page app-shell">
            <section className="container grid-2">
                <div className="card card-pad">
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
                        <button type="button" className="btn btn-secondary" onClick={handleLogout}>Logout</button>
                    </div>
                    <h2 className="title">{institutionName || institution.shortName} Aspirant Tracker</h2>
                    <p className="subtext">Enter prep details for {institutionName || institution.name} and get readiness feedback with a daily action plan.</p>

                    <form onSubmit={handleSubmit} className="stack" style={{ marginTop: "12px" }}>
                        <section className="tracker-section">
                            <h3 className="tracker-section-title">Aspirant Profile</h3>
                            <div className="stack">
                                <input name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Aspirant Name" className="input" />
                            </div>
                        </section>

                        <section className="tracker-section">
                            <h3 className="tracker-section-title">Exam Context</h3>
                            <div className="stack">
                                <input value={institutionName || institution.name} className="input" disabled />
                                <select name="studentClass" value={formData.studentClass} onChange={handleChange} className="input">
                                    <option value="">Target Exam</option>
                                    <option value="NEET">NEET</option>
                                    <option value="JEE Main">JEE Main</option>
                                    <option value="JEE Advanced">JEE Advanced</option>
                                </select>
                                <input name="section" value={formData.section} onChange={handleChange} placeholder="Attempt Year (e.g., 2026)" className="input" />
                                <input name="department" value={formData.department} onChange={handleChange} placeholder="Department / Program" className="input" />
                                <input name="semester" value={formData.semester} onChange={handleChange} placeholder="Batch / Session (e.g., Morning Batch)" className="input" />
                                <select name="confidenceLevel" value={formData.confidenceLevel} onChange={handleChange} className="input">
                                    <option value="">Confidence Level (1-5)</option>
                                    <option value="1">1 - Very Low</option>
                                    <option value="2">2 - Low</option>
                                    <option value="3">3 - Moderate</option>
                                    <option value="4">4 - Good</option>
                                    <option value="5">5 - High</option>
                                </select>
                                <input name="studyGoal" value={formData.studyGoal} onChange={handleChange} placeholder="Target Score / Rank" className="input" />
                            </div>
                        </section>

                        <section className="tracker-section">
                            <h3 className="tracker-section-title">Prep Metrics</h3>
                            <div className="stack">
                                <select name="attendanceLevel" value={formData.attendanceLevel} onChange={handleChange} className="input" required>
                                    <option value="">Class/Test Attendance Consistency</option>
                                    <option value="excellent">Excellent (90%+)</option>
                                    <option value="good">Good (75-89%)</option>
                                    <option value="average">Average (60-74%)</option>
                                    <option value="poor">Poor (&lt;60%)</option>
                                </select>
                                <input name="attendance" type="number" min="0" max="100" value={formData.attendance} onChange={handleChange} placeholder="Attendance Percentage (optional)" className="input" />
                                <select name="assignmentStatus" value={formData.assignmentStatus} onChange={handleChange} className="input" required>
                                    <option value="">Mock Test / DPP Completion</option>
                                    <option value="on_track">On Track</option>
                                    <option value="needs_improvement">Needs Improvement</option>
                                    <option value="lagging">Lagging</option>
                                </select>
                                <select name="assignmentCompletion" value={formData.assignmentCompletion} onChange={handleChange} className="input">
                                    <option value="">Mock/Practice Completion Rating (1-5)</option>
                                    <option value="1">1 - Very Low</option>
                                    <option value="2">2 - Low</option>
                                    <option value="3">3 - Moderate</option>
                                    <option value="4">4 - Good</option>
                                    <option value="5">5 - Excellent</option>
                                </select>
                                <input name="studyHours" type="number" min="0" max="12" value={formData.studyHours} onChange={handleChange} placeholder="Focused Study Hours per Day" className="input" required />
                            </div>
                        </section>

                        <section className="tracker-section">
                            <h3 className="tracker-section-title">Wellbeing</h3>
                            <div className="stack">
                                <input name="sleepHours" type="number" min="0" max="12" value={formData.sleepHours} onChange={handleChange} placeholder="Sleep Hours per Night" className="input" required />
                                <select name="stressLevelText" value={formData.stressLevelText} onChange={handleChange} className="input" required>
                                    <option value="">Exam Stress Level</option>
                                    <option value="low">Low</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </section>

                        <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: "100%" }}>
                            {isSubmitting ? "Analyzing..." : "Analyze & Save"}
                        </button>
                        {errorMessage && <p style={{ color: "#b91c1c", margin: 0 }}>{errorMessage}</p>}
                    </form>
                </div>

                <div className="card card-pad">
                    <h2 className="title">Report</h2>
                    {!report && <p className="subtext">Your report will appear here after analysis.</p>}

                    {report && (
                        <div className="stack" style={{ gap: "6px" }}>
                            <p><strong>Student:</strong> {report.studentName}</p>
                            <p><strong>Target Exam / Attempt Year:</strong> {report.studentClass || "-"} / {report.section || "-"}</p>
                            <p><strong>Target Score / Rank:</strong> {report.studyGoal || "-"}</p>
                            <p><strong>Readiness Score:</strong> {report.motivationScore}/100</p>
                            <div className="tracker-forecast-card">
                                <h4 style={{ margin: "0 0 6px" }}>Predicted Score Band</h4>
                                <p style={{ margin: "0 0 4px", fontWeight: 700 }}>
                                    {report.predictedScoreBand
                                        ? `${report.predictedScoreBand.rangeLow} - ${report.predictedScoreBand.rangeHigh} / ${report.predictedScoreBand.maxMarks} (${report.predictedScoreBand.examLabel})`
                                        : "Not available yet"}
                                </p>
                                <p style={{ margin: "0 0 4px" }}>
                                    <strong>Band:</strong> {report.predictedScoreBand?.bandLabel || "-"} | <strong>Confidence:</strong> {report.predictedScoreBand?.confidence || "-"}
                                </p>
                                <p style={{ margin: 0 }}>
                                    <strong>Strategy Hint:</strong> {report.predictedScoreBand?.strategyHint || "Submit analysis to generate your predicted score path."}
                                </p>
                            </div>
                            <p>
                                <strong>Top Priorities This Week:</strong>{" "}
                                {(report.topFocusAreas || []).slice(0, 3).map((item) => item.title).join(" | ") || "Not available"}
                            </p>
                            <p><strong>Generated:</strong> {new Date(report.generatedAt).toLocaleString()}</p>

                            <details className="tracker-details">
                                <summary>View Detailed Metrics</summary>
                                <div className="stack" style={{ marginTop: "8px", gap: "6px" }}>
                                    <p><strong>Institution:</strong> {report.institutionName || institutionName || institution.name}</p>
                                    <p><strong>Department / Batch:</strong> {report.department || "-"} / {report.semester || "-"}</p>
                                    <p><strong>Confidence Level:</strong> {report.cgpa ? `${Math.max(1, Math.min(5, Math.round(Number(report.cgpa) / 2)))}/5` : "-"}</p>
                                    <p><strong>Attendance Consistency:</strong> {report.attendanceLevel || "-"}</p>
                                    <p><strong>Mock Completion Status:</strong> {report.assignmentStatus || "-"}</p>
                                    <p><strong>Mock/Practice Completion Rating:</strong> {report.assignmentCompletion ? `${Math.max(1, Math.min(5, Math.round(Number(report.assignmentCompletion) / 20)))}/5` : "-"}</p>
                                    <p><strong>Focused Study Hours:</strong> {report.studyHours}</p>
                                    <p><strong>Sleep Hours:</strong> {report.sleepHours}</p>
                                    <p><strong>Exam Stress Level:</strong> {report.stressLevelText || "-"}</p>
                                </div>
                            </details>

                            <details className="tracker-details">
                                <summary>View Feedback & Focus Areas</summary>
                                <div style={{ marginTop: "8px" }}>
                                    <h4 style={{ margin: "0 0 4px" }}>Feedback</h4>
                                    <ul className="list">
                                        {report.feedback.map((item, index) => (
                                            <li key={`${item}-${index}`}>{item}</li>
                                        ))}
                                    </ul>

                                    <h4 style={{ margin: "10px 0 4px" }}>Top 3 Focus Areas This Week</h4>
                                    <ul className="list">
                                        {(report.topFocusAreas || []).map((item, index) => (
                                            <li key={`${item.title}-${index}`}>
                                                <strong>{item.title}:</strong> {item.action}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </details>

                            <details className="tracker-details">
                                <summary>View Motivation & Daily Plan</summary>
                                <div style={{ marginTop: "8px" }}>
                                    <h4 style={{ margin: "0 0 4px" }}>Motivational Line</h4>
                                    <p style={{ margin: 0, color: "#f8fafc", fontWeight: 700 }}>{report.motivationalLine}</p>

                                    <h4 style={{ margin: "10px 0 4px" }}>Daily Battle Plan</h4>
                                    <ul className="list">
                                        <li><strong>Must Do:</strong> {report.dailyBattlePlan?.mustDo || "Re-run analysis after backend restart to generate this plan."}</li>
                                        <li><strong>Should Do:</strong> {report.dailyBattlePlan?.shouldDo || "Re-run analysis after backend restart to generate this plan."}</li>
                                        <li><strong>If Time:</strong> {report.dailyBattlePlan?.ifTime || "Re-run analysis after backend restart to generate this plan."}</li>
                                    </ul>
                                </div>
                            </details>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

export default Tracker;


