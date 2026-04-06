import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getInstitutionById } from "../config/institutions";
import { resolveApiUrl } from "../lib/api";

function toInputValue(value) {
    if (value === undefined || value === null) return "";
    return String(value);
}

function buildEditForm(record) {
    return {
        studentName: toInputValue(record.studentName),
        department: toInputValue(record.department),
        semester: toInputValue(record.semester),
        studentClass: toInputValue(record.studentClass),
        section: toInputValue(record.section),
        studyHours: toInputValue(record.studyHours),
        sleepHours: toInputValue(record.sleepHours),
        cgpa: toInputValue(record.cgpa),
        attendanceLevel: toInputValue(record.attendanceLevel),
        assignmentStatus: toInputValue(record.assignmentStatus),
        extracurricularLevel: toInputValue(record.extracurricularLevel),
        parentSupportLevel: toInputValue(record.parentSupportLevel),
        stressLevelText: toInputValue(record.stressLevelText),
        studyGoal: toInputValue(record.studyGoal)
    };
}

function getRiskMeta(record) {
    const score = Number(record?.motivationScore || 0);
    const stress = String(record?.stressLevelText || "").toLowerCase();
    if (score < 50 || stress === "high") return { label: "High Risk", className: "risk-high", weight: 3 };
    if (score < 70 || stress === "moderate") return { label: "Watchlist", className: "risk-mid", weight: 2 };
    return { label: "Stable", className: "risk-low", weight: 1 };
}

function Dashboard() {
    const navigate = useNavigate();
    const { token, institutionId, institutionName, logout } = useAuth();
    const institution = getInstitutionById(institutionId);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [selectedRecordId, setSelectedRecordId] = useState("");
    const [editForm, setEditForm] = useState(buildEditForm({}));
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadRecords = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage("");
            if (!token) {
                setErrorMessage("Session expired. Please login again.");
                navigate("/login");
                return;
            }

            const res = await fetch(resolveApiUrl("/api/records"), {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (!res.ok) {
                setErrorMessage(data.message || "Unable to load dashboard.");
                return;
            }

            setRecords(data);
            if (data.length > 0) {
                const active = selectedRecordId ? data.find((item) => item._id === selectedRecordId) : data[0];
                const nextRecord = active || data[0];
                setSelectedRecordId(nextRecord._id);
                setEditForm(buildEditForm(nextRecord));
            } else {
                setSelectedRecordId("");
                setEditForm(buildEditForm({}));
            }
        } catch (error) {
            setErrorMessage("Unable to connect to server.");
        } finally {
            setLoading(false);
        }
    }, [navigate, selectedRecordId, token]);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    const totalStudents = records.length;
    const averageScore = totalStudents
        ? Math.round(records.reduce((sum, item) => sum + (Number(item.motivationScore) || 0), 0) / totalStudents)
        : 0;
    const highMotivationCount = records.filter((item) => (item.motivationLevel || "").toLowerCase() === "high").length;
    const lowMotivationCount = records.filter((item) => (item.motivationLevel || "").toLowerCase() === "low").length;
    const latestRecords = records.slice(0, 5);
    const selectedRecord = records.find((item) => item._id === selectedRecordId) || records[0];
    const selectedPrediction = selectedRecord?.predictedScoreBand;
    const selectedRisk = getRiskMeta(selectedRecord || {});

    const focusCount = records.reduce((acc, item) => {
        (item.topFocusAreas || []).forEach((focus) => {
            const key = focus?.title || "General Focus";
            acc[key] = (acc[key] || 0) + 1;
        });
        return acc;
    }, {});
    const focusRadar = Object.entries(focusCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

    const actionQueue = [...records]
        .map((record) => ({ record, risk: getRiskMeta(record) }))
        .sort((a, b) => b.risk.weight - a.risk.weight || (Number(a.record.motivationScore || 0) - Number(b.record.motivationScore || 0)))
        .slice(0, 4);

    const formatValue = (value) => {
        if (value === undefined || value === null || value === "") return "Not provided";
        return value;
    };

    const handleSelectRecord = (record) => {
        setStatusMessage("");
        setSelectedRecordId(record._id);
        setEditForm(buildEditForm(record));
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedRecordId) return;

        try {
            setIsSaving(true);
            setStatusMessage("");
            const res = await fetch(resolveApiUrl(`/api/records/${selectedRecordId}`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (!res.ok) {
                setStatusMessage(data.message || "Failed to update record.");
                return;
            }

            const updated = data.record;
            setRecords((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
            setEditForm(buildEditForm(updated));
            setStatusMessage("Record updated successfully.");
        } catch (error) {
            setStatusMessage("Unable to update record right now.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedRecordId) return;
        if (!window.confirm("Delete this record permanently?")) return;

        try {
            setIsDeleting(true);
            setStatusMessage("");
            const res = await fetch(resolveApiUrl(`/api/records/${selectedRecordId}`), {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (!res.ok) {
                setStatusMessage(data.message || "Failed to delete record.");
                return;
            }

            const remaining = records.filter((item) => item._id !== selectedRecordId);
            setRecords(remaining);
            if (remaining.length > 0) {
                setSelectedRecordId(remaining[0]._id);
                setEditForm(buildEditForm(remaining[0]));
            } else {
                setSelectedRecordId("");
                setEditForm(buildEditForm({}));
            }
            setStatusMessage("Record deleted successfully.");
        } catch (error) {
            setStatusMessage("Unable to delete record right now.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <main className="page app-shell">
            <section className="container dashboard-shell">
                <aside className="dashboard-sidebar">
                    <div className="dashboard-sidebar-logo">SM</div>
                    <p className="dashboard-sidebar-title">Faculty Panel</p>
                    <nav className="dashboard-sidebar-nav">
                        <span className="active">Overview</span>
                        <span>Students</span>
                        <span>Insights</span>
                        <span>Feedback</span>
                    </nav>
                </aside>

                <section className="dashboard-main">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center" }}>
                        <button type="button" className="btn btn-secondary" onClick={loadRecords}>Refresh</button>
                        <button type="button" className="btn btn-secondary" onClick={handleLogout}>Logout</button>
                    </div>
                    <header className="dashboard-welcome">
                        <p>{institutionName || institution.shortName} Command Center</p>
                        <h1>Teacher Dashboard</h1>
                        <span>Monitor readiness, prioritize intervention, and drive weekly score movement inside {institutionName || institution.name}.</span>
                    </header>

                    {loading && <p style={{ color: "#ffffff", margin: 0 }}>Loading records...</p>}
                    {errorMessage && <p style={{ color: "#ffe4ef", margin: 0 }}>{errorMessage}</p>}
                    {!loading && !errorMessage && records.length === 0 && <p style={{ color: "#ffffff", margin: 0 }}>No records yet.</p>}

                    {!loading && !errorMessage && records.length > 0 && (
                        <>
                            <section className="dashboard-stat-grid">
                                <article className="dashboard-stat-card">
                                    <span>Total Students</span>
                                    <strong>{totalStudents}</strong>
                                </article>
                                <article className="dashboard-stat-card">
                                    <span>Average Readiness</span>
                                    <strong>{averageScore}/100</strong>
                                </article>
                                <article className="dashboard-stat-card">
                                    <span>High Readiness</span>
                                    <strong>{highMotivationCount}</strong>
                                </article>
                            </section>

                            <section className="dashboard-kpi-ribbon">
                                <div className="dashboard-kpi-chip">
                                    <span>At-Risk Students</span>
                                    <strong>{lowMotivationCount}</strong>
                                </div>
                                <div className="dashboard-kpi-chip">
                                    <span>Selected Forecast</span>
                                    <strong>
                                        {selectedPrediction
                                            ? `${selectedPrediction.rangeLow}-${selectedPrediction.rangeHigh}/${selectedPrediction.maxMarks}`
                                            : "Not available"}
                                    </strong>
                                </div>
                                <div className="dashboard-kpi-chip">
                                    <span>Forecast Confidence</span>
                                    <strong>{selectedPrediction?.confidence || "Not available"}</strong>
                                </div>
                            </section>

                            <section className="dashboard-content-grid">
                                <article className="dashboard-panel">
                                    <h3>Recent Students</h3>
                                    <div className="dashboard-student-list">
                                        {latestRecords.map((record) => (
                                            <button
                                                key={record._id}
                                                type="button"
                                                onClick={() => handleSelectRecord(record)}
                                                className="dashboard-student-row"
                                                style={{
                                                    width: "100%",
                                                    textAlign: "left",
                                                    border: selectedRecordId === record._id ? "1px solid #3D52A0" : "1px solid transparent",
                                                    background: "transparent",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                <div>
                                                    <strong>{formatValue(record.studentName)}</strong>
                                                    <p>{formatValue(record.department)} / {formatValue(record.semester)}</p>
                                                </div>
                                                <div className="dashboard-row-right">
                                                    <span>{formatValue(record.motivationScore)}/100</span>
                                                    <small className={`dashboard-risk-pill ${getRiskMeta(record).className}`}>{getRiskMeta(record).label}</small>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </article>

                                <article className="dashboard-panel">
                                    <h3>Selected Record</h3>
                                    <div className="dashboard-selected-top">
                                        <div
                                            className="dashboard-score-ring"
                                            style={{ "--ring-angle": `${Math.round((Number(selectedRecord?.motivationScore || 0) / 100) * 360)}deg` }}
                                        >
                                            <div className="dashboard-score-ring-core">
                                                <span>Readiness</span>
                                                <strong>{formatValue(selectedRecord?.motivationScore)}/100</strong>
                                            </div>
                                        </div>
                                        <div className="dashboard-detail-list">
                                            <p><strong>Student:</strong> {formatValue(selectedRecord?.studentName)}</p>
                                            <p><strong>Class:</strong> {formatValue(selectedRecord?.studentClass)} / {formatValue(selectedRecord?.section)}</p>
                                            <p><strong>Risk:</strong> <span className={`dashboard-risk-pill ${selectedRisk.className}`}>{selectedRisk.label}</span></p>
                                            <p><strong>Top Priorities:</strong>{" "}
                                                {(selectedRecord?.topFocusAreas || []).slice(0, 3).map((item) => item.title).join(" | ") || "Not provided"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="dashboard-detail-list" style={{ marginTop: "10px" }}>
                                        <p>
                                            <strong>Predicted Band:</strong>{" "}
                                            {selectedPrediction
                                                ? `${selectedPrediction.rangeLow}-${selectedPrediction.rangeHigh}/${selectedPrediction.maxMarks}`
                                                : "Not provided"}
                                        </p>
                                        <p><strong>Created:</strong> {selectedRecord?.createdAt ? new Date(selectedRecord.createdAt).toLocaleString() : "Not provided"}</p>
                                        <p><strong>Line:</strong> {formatValue(selectedRecord?.motivationalLine)}</p>
                                    </div>
                                </article>
                            </section>

                            <section className="dashboard-content-grid">
                                <article className="dashboard-panel">
                                    <h3>Intervention Queue</h3>
                                    <div className="dashboard-student-list">
                                        {actionQueue.map(({ record, risk }) => (
                                            <div key={`queue-${record._id}`} className="dashboard-student-row">
                                                <div>
                                                    <strong>{formatValue(record.studentName)}</strong>
                                                    <p>{(record.topFocusAreas || [])[0]?.title || "Review latest report and assign next task."}</p>
                                                </div>
                                                <small className={`dashboard-risk-pill ${risk.className}`}>{risk.label}</small>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                                <article className="dashboard-panel">
                                    <h3>Forecast Deck</h3>
                                    <div className="dashboard-forecast-deck">
                                        <p><strong>Band Label:</strong> {formatValue(selectedPrediction?.bandLabel)}</p>
                                        <p><strong>Confidence:</strong> {formatValue(selectedPrediction?.confidence)}</p>
                                        <p><strong>Hint:</strong> {formatValue(selectedPrediction?.strategyHint)}</p>
                                    </div>
                                </article>
                            </section>

                            <section className="dashboard-content-grid">
                                <article className="dashboard-panel">
                                    <h3>Focus Radar</h3>
                                    <ul className="list">
                                        {focusRadar.length === 0 && <li>No focus data available yet.</li>}
                                        {focusRadar.map(([title, count]) => (
                                            <li key={title}>
                                                <strong>{title}:</strong> {count} student{count > 1 ? "s" : ""}
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                                <article className="dashboard-panel">
                                    <h3>Recommendations</h3>
                                    <ul className="list">
                                        {(selectedRecord?.feedback || []).map((item, index) => (
                                            <li key={`${selectedRecord?._id || "record"}-${index}`}>{item}</li>
                                        ))}
                                    </ul>
                                </article>
                            </section>

                            <article className="dashboard-panel" style={{ marginTop: "12px" }}>
                                <h3>Edit Record (Update/Delete)</h3>
                                <form onSubmit={handleUpdate} className="stack" style={{ marginTop: "10px" }}>
                                    <input className="input" name="studentName" value={editForm.studentName} onChange={handleEditChange} placeholder="Student Name" required />
                                    <input className="input" name="department" value={editForm.department} onChange={handleEditChange} placeholder="Department" />
                                    <input className="input" name="semester" value={editForm.semester} onChange={handleEditChange} placeholder="Semester" />
                                    <input className="input" name="studentClass" value={editForm.studentClass} onChange={handleEditChange} placeholder="Class" />
                                    <input className="input" name="section" value={editForm.section} onChange={handleEditChange} placeholder="Section" />
                                    <input className="input" name="studyGoal" value={editForm.studyGoal} onChange={handleEditChange} placeholder="Study Goal" />
                                    <input className="input" name="studyHours" value={editForm.studyHours} onChange={handleEditChange} type="number" min="0" max="12" placeholder="Study Hours" required />
                                    <input className="input" name="sleepHours" value={editForm.sleepHours} onChange={handleEditChange} type="number" min="0" max="12" placeholder="Sleep Hours" required />
                                    <input className="input" name="cgpa" value={editForm.cgpa} onChange={handleEditChange} type="number" min="0" max="10" step="0.1" placeholder="CGPA" />

                                    <select className="input" name="attendanceLevel" value={editForm.attendanceLevel} onChange={handleEditChange}>
                                        <option value="">Attendance Level</option>
                                        <option value="excellent">Excellent</option>
                                        <option value="good">Good</option>
                                        <option value="average">Average</option>
                                        <option value="poor">Poor</option>
                                    </select>
                                    <select className="input" name="assignmentStatus" value={editForm.assignmentStatus} onChange={handleEditChange}>
                                        <option value="">Assignment Status</option>
                                        <option value="on_track">On Track</option>
                                        <option value="needs_improvement">Needs Improvement</option>
                                        <option value="lagging">Lagging</option>
                                    </select>
                                    <select className="input" name="extracurricularLevel" value={editForm.extracurricularLevel} onChange={handleEditChange}>
                                        <option value="">Extracurricular Involvement</option>
                                        <option value="active">Active</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="minimal">Minimal</option>
                                    </select>
                                    <select className="input" name="parentSupportLevel" value={editForm.parentSupportLevel} onChange={handleEditChange}>
                                        <option value="">Parent Support</option>
                                        <option value="high">High</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="low">Low</option>
                                    </select>
                                    <select className="input" name="stressLevelText" value={editForm.stressLevelText} onChange={handleEditChange}>
                                        <option value="">Stress Level</option>
                                        <option value="low">Low</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="high">High</option>
                                    </select>

                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button type="submit" className="btn btn-primary" disabled={isSaving || isDeleting}>
                                            {isSaving ? "Saving..." : "Update"}
                                        </button>
                                        <button type="button" className="btn btn-secondary" onClick={handleDelete} disabled={isSaving || isDeleting}>
                                            {isDeleting ? "Deleting..." : "Delete"}
                                        </button>
                                    </div>
                                    {statusMessage && <p style={{ margin: 0, color: "#ffffff" }}>{statusMessage}</p>}
                                </form>
                            </article>

                            <article className="dashboard-panel">
                                <h3>Daily Battle Plan</h3>
                                <ul className="list">
                                    <li><strong>Must Do:</strong> {formatValue(selectedRecord?.dailyBattlePlan?.mustDo)}</li>
                                    <li><strong>Should Do:</strong> {formatValue(selectedRecord?.dailyBattlePlan?.shouldDo)}</li>
                                    <li><strong>If Time:</strong> {formatValue(selectedRecord?.dailyBattlePlan?.ifTime)}</li>
                                </ul>
                            </article>
                        </>
                    )}
                </section>
            </section>
        </main>
    );
}

export default Dashboard;
