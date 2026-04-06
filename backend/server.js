require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");
const User = require("./models/User");
const Student = require("./models/Student");
const Attendance = require("./models/Attendance");
const Performance = require("./models/Performance");
const Feedback = require("./models/Feedback");
const MotivationAssessment = require("./models/MotivationAssessment");
const Recommendation = require("./models/Recommendation");
const Teacher = require("./models/Teacher");
const { authenticateToken, authorizeRoles } = require("./middleware/auth");
const { INSTITUTIONS, DEFAULT_INSTITUTION, findInstitutionById } = require("./config/institutions");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

connectDB();

app.disable("x-powered-by");
app.use(cors(allowedOrigins.length
    ? {
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        }
    }
    : undefined));
app.use(helmet());
app.use(express.json());
app.set("trust proxy", 1);

const localUsersFile = path.join(__dirname, "data", "users.json");
const localRecordsFile = path.join(__dirname, "data", "records.json");
const errorLogFile = path.join(__dirname, "logs", "error.log");
const API_PREFIX = "/api";
const JWT_SECRET = process.env.JWT_SECRET || "change_this_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

process.on("unhandledRejection", (reason) => {
    logServerError("unhandledRejection", reason instanceof Error ? reason : new Error(String(reason)));
});

process.on("uncaughtException", (error) => {
    logServerError("uncaughtException", error);
});

function readLocalUsers() {
    try {
        if (!fs.existsSync(localUsersFile)) return [];
        const content = fs.readFileSync(localUsersFile, "utf8");
        return JSON.parse(content || "[]");
    } catch (error) {
        return [];
    }
}

function writeLocalUsers(users) {
    const dir = path.dirname(localUsersFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(localUsersFile, JSON.stringify(users, null, 2), "utf8");
}

function readLocalRecords() {
    try {
        if (!fs.existsSync(localRecordsFile)) return [];
        const content = fs.readFileSync(localRecordsFile, "utf8");
        return JSON.parse(content || "[]");
    } catch (error) {
        return [];
    }
}

function writeLocalRecords(records) {
    const dir = path.dirname(localRecordsFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(localRecordsFile, JSON.stringify(records, null, 2), "utf8");
}

function isDbConnected() {
    return mongoose.connection.readyState === 1;
}

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
}

function signAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

const TEACHER_EMAIL = (process.env.TEACHER_EMAIL || "teacher@gmail.com").toLowerCase();
const TEACHER_EMAIL_ALIASES = [
    TEACHER_EMAIL,
    "teacher@school.com",
    "teacher@gmail.com",
    "kamala@gmail.com",
    "komala@gmail.com",
    "varun@gmail.com",
    "karthick@gmail.com"
].map((email) => email.toLowerCase());
const TEACHER_PASSWORD_ALIASES = [
    process.env.TEACHER_PASSWORD || "teacher123",
    "8901234567",
    "varun@123",
    "karthick@123"
];

function normalizeInstitutionId(institutionId) {
    return String(institutionId || "").trim().toLowerCase();
}

function resolveInstitution(institutionId) {
    return findInstitutionById(institutionId) || DEFAULT_INSTITUTION;
}

function validateInstitutionId(institutionId) {
    if (!findInstitutionById(institutionId)) {
        return `institutionId must be one of: ${INSTITUTIONS.map((item) => item.id).join(", ")}`;
    }
    return null;
}

function getInstitutionScope(req) {
    const institutionId = normalizeInstitutionId(req.user?.institutionId);
    return institutionId || DEFAULT_INSTITUTION.id;
}

function recordMatchesInstitution(record, institutionId) {
    const normalizedRecordInstitution = normalizeInstitutionId(record?.institutionId);
    const fallbackFromDepartment = normalizeInstitutionId(record?.department);
    return normalizedRecordInstitution === institutionId || (!normalizedRecordInstitution && fallbackFromDepartment === institutionId);
}

const motivationalLines = {
    High: "Excellent consistency. Keep pushing to reach your highest potential.",
    Moderate: "You are on the right path. A little more consistency will create big results.",
    Low: "Do not give up. Start with small daily goals and build momentum step by step."
};

function buildReport(data) {
    return {
        institutionId: data.institutionId,
        institutionName: data.institutionName,
        studentName: data.studentName,
        age: data.age,
        gender: data.gender,
        studentClass: data.studentClass,
        section: data.section,
        department: data.department,
        semester: data.semester,
        cgpa: data.cgpa,
        studyGoal: data.studyGoal,
        attendanceLevel: data.attendanceLevel,
        assignmentStatus: data.assignmentStatus,
        extracurricularLevel: data.extracurricularLevel,
        parentSupportLevel: data.parentSupportLevel,
        stressLevelText: data.stressLevelText,
        extracurricularHours: data.extracurricularHours,
        parentSupport: data.parentSupport,
        studyHours: data.studyHours,
        attendance: data.attendance,
        assignmentCompletion: data.assignmentCompletion,
        sleepHours: data.sleepHours,
        stressLevel: data.stressLevel,
        motivationScore: data.motivationScore,
        motivationLevel: data.motivationLevel,
        feedback: data.feedback,
        predictedScoreBand: data.predictedScoreBand,
        topFocusAreas: data.topFocusAreas,
        dailyBattlePlan: data.dailyBattlePlan,
        motivationalLine: data.motivationalLine,
        generatedAt: data.generatedAt
    };
}

function deriveInterestLevel(result) {
    const interestScore = Math.round((result.assignmentCompletion + (result.extracurricularHours * 20)) / 2);
    return Math.max(0, Math.min(100, interestScore));
}

function buildTopFocusAreas({ studyScore, attendance, assignmentCompletion, sleepScore, stressScore, cgpaScore }) {
    const priorities = [
        {
            title: "Revision Consistency",
            priority: Math.round(Math.max(0, 78 - studyScore)),
            reason: "Focused study consistency is below target.",
            action: "Block two deep-work sessions daily and finish one revision loop before sleep."
        },
        {
            title: "Class & Test Attendance",
            priority: Math.round(Math.max(0, 82 - attendance)),
            reason: "Attendance is affecting learning continuity.",
            action: "Maintain full attendance this week and make same-day recap notes."
        },
        {
            title: "Mock Practice Completion",
            priority: Math.round(Math.max(0, 82 - assignmentCompletion)),
            reason: "Practice completion is limiting exam readiness.",
            action: "Complete pending DPP/mock tasks first and review errors immediately."
        },
        {
            title: "Concept Clarity",
            priority: Math.round(Math.max(0, 72 - cgpaScore)),
            reason: "Current confidence indicates concept reinforcement is needed.",
            action: "Pick two weak chapters and complete concept revision plus solved examples."
        },
        {
            title: "Recovery & Stress Balance",
            priority: Math.round(Math.max(0, 70 - ((sleepScore + stressScore) / 2))),
            reason: "Sleep/stress balance is impacting performance quality.",
            action: "Target 7+ hours sleep and include short recovery breaks in study blocks."
        }
    ];

    return priorities
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3);
}

function buildPredictedScoreBand({ examType, motivationScore, assignmentCompletion, studyScore, attendance, stressScore }) {
    const normalizedExam = String(examType || "").toLowerCase();
    let examLabel = "General";
    let maxMarks = 100;
    if (normalizedExam.includes("neet")) {
        examLabel = "NEET";
        maxMarks = 720;
    } else if (normalizedExam.includes("advanced")) {
        examLabel = "JEE Advanced";
        maxMarks = 360;
    } else if (normalizedExam.includes("jee")) {
        examLabel = "JEE Main";
        maxMarks = 300;
    }

    const readiness = Math.max(0, Math.min(100, toNumber(motivationScore)));
    const accuracy = Math.max(0, Math.min(100, toNumber(assignmentCompletion)));
    const consistency = Math.max(0, Math.min(100, Math.round((toNumber(studyScore) + toNumber(attendance)) / 2)));
    const composite = (readiness * 0.45) + (accuracy * 0.35) + (consistency * 0.2);

    const center = Math.round(maxMarks * (0.3 + (0.62 * composite) / 100));
    const lowStressPenalty = stressScore < 55 ? 0.03 : 0;
    const spreadRatio = Math.max(0.08, Math.min(0.2, 0.16 - (consistency / 100) * 0.07 + lowStressPenalty));
    const halfSpread = Math.round((maxMarks * spreadRatio) / 2);

    const rangeLow = Math.max(0, center - halfSpread);
    const rangeHigh = Math.min(maxMarks, center + halfSpread);

    let confidence = "Medium";
    if (consistency >= 75 && stressScore >= 60) confidence = "High";
    if (consistency < 55 || stressScore < 45) confidence = "Low";

    let bandLabel = "Steady Climb Zone";
    if (composite >= 75) bandLabel = "Breakthrough Zone";
    else if (composite < 50) bandLabel = "Foundation Rebuild Zone";

    const weakest = [
        { key: "readiness", value: readiness },
        { key: "accuracy", value: accuracy },
        { key: "consistency", value: consistency }
    ].sort((a, b) => a.value - b.value)[0]?.key;

    let strategyHint = "Keep your daily plan stable and increase mock difficulty gradually.";
    if (weakest === "accuracy") {
        strategyHint = "Prioritize timed mock analysis and error correction before adding new chapters.";
    } else if (weakest === "consistency") {
        strategyHint = "Protect a fixed study timetable this week; consistency will lift your band fastest.";
    } else if (weakest === "readiness") {
        strategyHint = "Strengthen weak concepts first, then retest with chapter-wise practice.";
    }

    return {
        examLabel,
        maxMarks,
        rangeLow,
        rangeHigh,
        confidence,
        bandLabel,
        strategyHint
    };
}

function buildDailyBattlePlan({ studyHours, attendance, assignmentCompletion, sleepHours, stressLevel, motivationLevel }) {
    let mustDo = "Complete two 45-minute focused study blocks and one 30-minute revision block today.";
    if (attendance < 75) {
        mustDo = "Attend every class today and write a same-day recap of all key points.";
    } else if (assignmentCompletion < 80) {
        mustDo = "Close pending assignments first with a 60-minute deadline-focused sprint.";
    } else if (studyHours >= 3) {
        mustDo = "Protect your focused study routine with at least one deep-work session today.";
    }

    let shouldDo = "Review yesterday's mistakes for 20 minutes and update your short error list.";
    if (sleepHours < 7 || stressLevel > 6) {
        shouldDo = "Take two short recovery breaks and target 7+ hours of sleep tonight.";
    } else if (motivationLevel === "High") {
        shouldDo = "Attempt one timed practice set and analyze accuracy immediately after.";
    }

    let ifTime = "Preview one upcoming topic for 20 minutes to reduce next-day workload.";
    if (assignmentCompletion < 80) {
        ifTime = "Organize tomorrow's tasks by priority and pre-plan the first task.";
    } else if (studyHours >= 3 && attendance >= 80) {
        ifTime = "Solve an extra challenge set and note the top three learnings.";
    }

    return { mustDo, shouldDo, ifTime };
}

function analyzeStudentData(payload) {
    const studyHours = toNumber(payload.studyHours);
    const attendanceMap = { excellent: 95, good: 82, average: 68, poor: 48 };
    const assignmentMap = { on_track: 90, needs_improvement: 72, lagging: 50 };
    const stressMap = { low: 3, moderate: 6, high: 9 };
    const activityMap = { active: 4, moderate: 2, minimal: 0.5 };
    const supportMap = { high: 9, moderate: 6, low: 3 };

    const attendance = toNumber(payload.attendance, attendanceMap[payload.attendanceLevel] || 60);
    const assignmentCompletion = toNumber(payload.assignmentCompletion, assignmentMap[payload.assignmentStatus] || 60);
    const sleepHours = toNumber(payload.sleepHours);
    const stressLevel = toNumber(payload.stressLevel, stressMap[payload.stressLevelText] || 6);

    const studyScore = Math.min((studyHours / 6) * 100, 100);
    const sleepScore = Math.min((sleepHours / 8) * 100, 100);
    const stressScore = Math.max(0, 100 - stressLevel * 10);
    const cgpa = toNumber(payload.cgpa, 0);
    const extracurricularHours = toNumber(payload.extracurricularHours, activityMap[payload.extracurricularLevel] || 1);
    const parentSupport = toNumber(payload.parentSupport, supportMap[payload.parentSupportLevel] || 5);
    const cgpaScore = Math.min((cgpa / 10) * 100, 100);
    const activityScore = Math.min((extracurricularHours / 4) * 100, 100);
    const supportScore = Math.min((parentSupport / 10) * 100, 100);

    const motivationScore = Math.round(
        studyScore * 0.2 +
        attendance * 0.2 +
        assignmentCompletion * 0.18 +
        sleepScore * 0.12 +
        stressScore * 0.12 +
        cgpaScore * 0.08 +
        activityScore * 0.05 +
        supportScore * 0.05
    );

    let motivationLevel = "Low";
    if (motivationScore >= 75) motivationLevel = "High";
    else if (motivationScore >= 50) motivationLevel = "Moderate";

    const feedback = [];
    if (studyHours < 2) feedback.push("Increase focused study time to at least 2-3 hours daily.");
    if (attendance < 75) feedback.push("Improve attendance by planning your weekly class schedule.");
    if (assignmentCompletion < 80) feedback.push("Break assignments into smaller tasks and track deadlines.");
    if (sleepHours < 7) feedback.push("Sleep at least 7 hours for better focus and memory.");
    if (stressLevel > 6) feedback.push("Use short breaks, breathing exercises, or walks to reduce stress.");
    if (cgpa > 0 && cgpa < 6) feedback.push("Focus on core subjects and ask teachers for concept clarification.");
    if (extracurricularHours < 1) feedback.push("Add at least 1 hour of activity weekly to stay energized.");
    if (parentSupport > 0 && parentSupport < 5) feedback.push("Discuss your study plan with family for better support.");
    if (!feedback.length) feedback.push("Great progress. Keep your daily consistency strong.");

    const topFocusAreas = buildTopFocusAreas({
        studyScore,
        attendance,
        assignmentCompletion,
        sleepScore,
        stressScore,
        cgpaScore
    });
    const predictedScoreBand = buildPredictedScoreBand({
        examType: payload.studentClass,
        motivationScore,
        assignmentCompletion,
        studyScore,
        attendance,
        stressScore
    });

    const dailyBattlePlan = buildDailyBattlePlan({
        studyHours,
        attendance,
        assignmentCompletion,
        sleepHours,
        stressLevel,
        motivationLevel
    });

    return {
        attendance,
        assignmentCompletion,
        stressLevel,
        extracurricularHours,
        parentSupport,
        motivationScore,
        motivationLevel,
        feedback,
        predictedScoreBand,
        topFocusAreas,
        dailyBattlePlan,
        motivationalLine: motivationalLines[motivationLevel]
    };
}

function validateRequiredFields(body, required) {
    const missing = required.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
    return missing;
}

function appendErrorLog(entry) {
    const dir = path.dirname(errorLogFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(errorLogFile, `${entry}\n`, "utf8");
}

function logServerError(context, error, req) {
    const base = {
        timestamp: new Date().toISOString(),
        context,
        method: req?.method,
        path: req?.originalUrl,
        message: error?.message || "Unknown error"
    };
    const stack = error?.stack ? `\n${error.stack}` : "";
    const formatted = `${JSON.stringify(base)}${stack}`;
    console.error(formatted);
    appendErrorLog(formatted);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function validateAuthPayload({ email, password }, { minPasswordLength = 6 } = {}) {
    if (!isValidEmail(email)) return "A valid email is required";
    if (typeof password !== "string" || password.length < minPasswordLength) {
        return `Password must be at least ${minPasswordLength} characters`;
    }
    return null;
}

function validateAnalysisPayload(payload, { partial = false } = {}) {
    const enumRules = {
        attendanceLevel: ["excellent", "good", "average", "poor"],
        assignmentStatus: ["on_track", "needs_improvement", "lagging"],
        extracurricularLevel: ["active", "moderate", "minimal"],
        parentSupportLevel: ["high", "moderate", "low"],
        stressLevelText: ["low", "moderate", "high"]
    };

    const numericRules = [
        { key: "studyHours", min: 0, max: 12 },
        { key: "sleepHours", min: 0, max: 12 },
        { key: "cgpa", min: 0, max: 10 },
        { key: "age", min: 10, max: 35 }
    ];

    if (!partial) {
        const missing = validateRequiredFields(payload, ["studentName", "studyHours", "sleepHours"]);
        if (missing.length) return `Missing required fields: ${missing.join(", ")}`;
    }

    if (payload.studentName !== undefined && String(payload.studentName).trim().length < 2) {
        return "Student name must be at least 2 characters";
    }

    for (const rule of numericRules) {
        if (payload[rule.key] !== undefined && payload[rule.key] !== "") {
            const num = Number(payload[rule.key]);
            if (Number.isNaN(num) || num < rule.min || num > rule.max) {
                return `${rule.key} must be between ${rule.min} and ${rule.max}`;
            }
        }
    }

    for (const [field, allowedValues] of Object.entries(enumRules)) {
        if (payload[field] !== undefined && payload[field] !== "" && !allowedValues.includes(payload[field])) {
            return `${field} must be one of: ${allowedValues.join(", ")}`;
        }
    }

    return null;
}

async function mapAssessmentToRecord(assessment) {
    const studentDoc = assessment.student_id;
    const studentId = studentDoc?._id;

    const [attendanceDoc, performanceDoc, latestFeedback, recommendations] = await Promise.all([
        Attendance.findOne({ student_id: studentId }).sort({ createdAt: -1 }),
        Performance.findOne({ student_id: studentId }).sort({ createdAt: -1 }),
        Feedback.findOne({ student_id: studentId }).sort({ createdAt: -1 }),
        Recommendation.find({ assessment_id: assessment._id }).sort({ createdAt: 1 })
    ]);

    const computedInsights = analyzeStudentData({
        studentClass: studentDoc?.studentClass,
        cgpa: studentDoc?.cgpa,
        extracurricularHours: undefined,
        parentSupport: undefined,
        attendanceLevel: studentDoc?.attendanceLevel,
        assignmentStatus: studentDoc?.assignmentStatus,
        extracurricularLevel: studentDoc?.extracurricularLevel,
        parentSupportLevel: studentDoc?.parentSupportLevel,
        stressLevelText: studentDoc?.stressLevelText,
        studyHours: performanceDoc?.study_hours,
        attendance: attendanceDoc?.attendance_percentage,
        assignmentCompletion: performanceDoc?.assignment_completion,
        sleepHours: assessment.sleep_hours,
        stressLevel: latestFeedback?.stress_level
    });

    return {
        _id: String(assessment._id),
        institutionId: studentDoc?.institutionId || DEFAULT_INSTITUTION.id,
        institutionName: studentDoc?.institutionName || DEFAULT_INSTITUTION.name,
        studentName: studentDoc?.name || "Student",
        age: studentDoc?.age,
        gender: studentDoc?.gender || "",
        studentClass: studentDoc?.studentClass || "",
        section: studentDoc?.section || "",
        department: studentDoc?.department || "",
        semester: studentDoc?.semester || studentDoc?.year || "",
        cgpa: studentDoc?.cgpa,
        studyGoal: studentDoc?.studyGoal || "",
        attendanceLevel: studentDoc?.attendanceLevel || "",
        assignmentStatus: studentDoc?.assignmentStatus || "",
        extracurricularLevel: studentDoc?.extracurricularLevel || "",
        parentSupportLevel: studentDoc?.parentSupportLevel || "",
        stressLevelText: studentDoc?.stressLevelText || "",
        extracurricularHours: latestFeedback ? Math.round((latestFeedback.interest_level / 100) * 4) : undefined,
        parentSupport: undefined,
        studyHours: performanceDoc?.study_hours,
        attendance: attendanceDoc?.attendance_percentage,
        assignmentCompletion: performanceDoc?.assignment_completion,
        sleepHours: assessment.sleep_hours,
        stressLevel: latestFeedback?.stress_level,
        motivationScore: assessment.motivation_score,
        motivationLevel: assessment.motivation_level,
        feedback: recommendations.map((item) => item.suggestion),
        predictedScoreBand: computedInsights.predictedScoreBand,
        topFocusAreas: computedInsights.topFocusAreas,
        dailyBattlePlan: computedInsights.dailyBattlePlan,
        motivationalLine: assessment.motivational_line,
        createdAt: assessment.createdAt
    };
}

async function registerHandler(req, res) {
    try {
        const { email, password, institutionId } = req.body;
        const missing = validateRequiredFields(req.body, ["email", "password", "institutionId"]);
        if (missing.length) {
            return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
        }

        const authValidationError = validateAuthPayload({ email, password }, { minPasswordLength: 8 });
        if (authValidationError) {
            return res.status(400).json({ message: authValidationError });
        }
        const institutionValidationError = validateInstitutionId(institutionId);
        if (institutionValidationError) {
            return res.status(400).json({ message: institutionValidationError });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const institution = resolveInstitution(institutionId);
        const passwordHash = await bcrypt.hash(String(password), 10);

        if (isDbConnected()) {
            try {
                const existingUser = await User.findOne({ email: normalizedEmail, institutionId: institution.id });
                if (existingUser) {
                    return res.status(409).json({ message: "Email already registered for this institution" });
                }

                const newUser = new User({
                    email: normalizedEmail,
                    password: passwordHash,
                    institutionId: institution.id,
                    institutionName: institution.name
                });
                await newUser.save();
                const token = signAccessToken({
                    userId: String(newUser._id),
                    email: newUser.email,
                    role: "student",
                    institutionId: institution.id,
                    institutionName: institution.name
                });

                return res.status(201).json({
                    message: "User registered successfully",
                    token,
                    user: {
                        id: String(newUser._id),
                        email: newUser.email,
                        role: "student",
                        institutionId: institution.id,
                        institutionName: institution.name
                    }
                });
            } catch (dbError) {
                // Duplicate email from DB-level unique index race or legacy data
                if (dbError?.code === 11000) {
                    return res.status(409).json({ message: "Email already registered" });
                }

                // If DB is unstable, continue with local file mode instead of failing registration.
                logServerError("registerHandler_dbFallback", dbError, req);
            }
        }

        const users = readLocalUsers();
        const existing = users.find((u) =>
            String(u.email).trim().toLowerCase() === normalizedEmail &&
            normalizeInstitutionId(u.institutionId || DEFAULT_INSTITUTION.id) === institution.id
        );
        if (existing) {
            return res.status(409).json({ message: "Email already registered for this institution" });
        }

        const localUserId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        users.push({
            id: localUserId,
            email: normalizedEmail,
            passwordHash,
            institutionId: institution.id,
            institutionName: institution.name,
            createdAt: new Date().toISOString()
        });
        writeLocalUsers(users);

        const token = signAccessToken({
            userId: localUserId,
            email: normalizedEmail,
            role: "student",
            institutionId: institution.id,
            institutionName: institution.name
        });

        return res.status(201).json({
            message: "User registered successfully",
            mode: "local",
            token,
            user: {
                id: localUserId,
                email: normalizedEmail,
                role: "student",
                institutionId: institution.id,
                institutionName: institution.name
            }
        });
    } catch (error) {
        logServerError("registerHandler", error, req);
        return res.status(500).json({ message: "Registration failed" });
    }
}

async function loginHandler(req, res) {
    try {
        const { email, password, role, institutionId } = req.body;
        const institutionValidationError = validateInstitutionId(institutionId);
        if (institutionValidationError) {
            return res.status(400).json({ message: institutionValidationError });
        }
        const institution = resolveInstitution(institutionId);

        if (role === "teacher") {
            const authValidationError = validateAuthPayload({ email, password }, { minPasswordLength: 1 });
            if (authValidationError) {
                return res.status(400).json({ message: authValidationError });
            }
            const normalizedEmail = String(email || "").trim().toLowerCase();
            const isKnownTeacherEmail = TEACHER_EMAIL_ALIASES.includes(normalizedEmail);
            const isKnownTeacherPassword = TEACHER_PASSWORD_ALIASES.includes(String(password || ""));
            if (isKnownTeacherEmail && isKnownTeacherPassword) {
                const token = signAccessToken({
                    userId: "teacher-default",
                    email: normalizedEmail,
                    role: "teacher",
                    institutionId: institution.id,
                    institutionName: institution.name
                });
                return res.json({
                    message: "Teacher login successful",
                    token,
                    user: {
                        id: "teacher-default",
                        email: normalizedEmail,
                        role: "teacher",
                        institutionId: institution.id,
                        institutionName: institution.name
                    }
                });
            }
            return res.status(401).json({ message: "Invalid teacher credentials" });
        }

        const missing = validateRequiredFields(req.body, ["email", "password"]);
        if (missing.length) {
            return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
        }

        const authValidationError = validateAuthPayload({ email, password }, { minPasswordLength: 1 });
        if (authValidationError) {
            return res.status(400).json({ message: authValidationError });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        if (isDbConnected()) {
            const user = await User.findOne({ email: normalizedEmail, institutionId: institution.id });
            const isValid = user ? await bcrypt.compare(String(password), user.password) : false;
            if (isValid) {
                const token = signAccessToken({
                    userId: String(user._id),
                    email: user.email,
                    role: "student",
                    institutionId: user.institutionId || institution.id,
                    institutionName: user.institutionName || institution.name
                });

                return res.json({
                    message: "Student login successful",
                    token,
                    user: {
                        id: String(user._id),
                        email: user.email,
                        role: "student",
                        institutionId: user.institutionId || institution.id,
                        institutionName: user.institutionName || institution.name
                    }
                });
            }
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const users = readLocalUsers();
        const userIndex = users.findIndex((u) =>
            String(u.email).trim().toLowerCase() === normalizedEmail &&
            normalizeInstitutionId(u.institutionId || DEFAULT_INSTITUTION.id) === institution.id
        );
        const user = userIndex >= 0 ? users[userIndex] : null;

        if (user) {
            let isValid = false;

            if (user.passwordHash) {
                isValid = await bcrypt.compare(String(password), user.passwordHash);
            } else if (user.password) {
                isValid = user.password === password;
                if (isValid) {
                    user.passwordHash = await bcrypt.hash(String(password), 10);
                    delete user.password;
                    users[userIndex] = user;
                    writeLocalUsers(users);
                }
            }

            if (isValid) {
                const userId = user.id || `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
                if (!user.id) {
                    user.id = userId;
                    users[userIndex] = user;
                    writeLocalUsers(users);
                }

                const token = signAccessToken({
                    userId,
                    email: normalizedEmail,
                    role: "student",
                    institutionId: user.institutionId || institution.id,
                    institutionName: user.institutionName || institution.name
                });

                return res.json({
                    message: "Student login successful",
                    mode: "local",
                    token,
                    user: {
                        id: userId,
                        email: normalizedEmail,
                        role: "student",
                        institutionId: user.institutionId || institution.id,
                        institutionName: user.institutionName || institution.name
                    }
                });
            }
        }

        return res.status(401).json({ message: "Invalid credentials" });
    } catch (error) {
        logServerError("loginHandler", error, req);
        return res.status(500).json({ message: "Login failed" });
    }
}

async function createAnalysisHandler(req, res) {
    try {
        const scopedInstitutionId = getInstitutionScope(req);
        const institution = resolveInstitution(scopedInstitutionId);
        const {
            studentName,
            age,
            gender,
            studentClass,
            section,
            department,
            semester,
            cgpa,
            studyGoal,
            attendanceLevel,
            assignmentStatus,
            extracurricularLevel,
            parentSupportLevel,
            stressLevelText,
            extracurricularHours,
            parentSupport,
            studyHours,
            attendance,
            assignmentCompletion,
            sleepHours,
            stressLevel
        } = req.body;

        const payloadValidationError = validateAnalysisPayload(req.body);
        if (payloadValidationError) {
            return res.status(400).json({ message: payloadValidationError });
        }

        const result = analyzeStudentData({
            studentClass,
            cgpa,
            extracurricularHours,
            parentSupport,
            attendanceLevel,
            assignmentStatus,
            extracurricularLevel,
            parentSupportLevel,
            stressLevelText,
            studyHours,
            attendance,
            assignmentCompletion,
            sleepHours,
            stressLevel
        });

        if (isDbConnected()) {
            const studentDoc = await Student.findOneAndUpdate(
                {
                    name: studentName || "Student",
                    institutionId: institution.id,
                    department: department || "",
                    year: semester || ""
                },
                {
                    name: studentName || "Student",
                    institutionId: institution.id,
                    institutionName: institution.name,
                    department: department || "",
                    year: semester || "",
                    age: age ? Number(age) : undefined,
                    gender: gender || "",
                    studentClass: studentClass || "",
                    section: section || "",
                    semester: semester || "",
                    cgpa: cgpa ? Number(cgpa) : undefined,
                    studyGoal: studyGoal || "",
                    attendanceLevel: attendanceLevel || "",
                    assignmentStatus: assignmentStatus || "",
                    extracurricularLevel: extracurricularLevel || "",
                    parentSupportLevel: parentSupportLevel || "",
                    stressLevelText: stressLevelText || ""
                },
                { new: true, upsert: true }
            );

            const attendanceDoc = await Attendance.create({
                student_id: studentDoc._id,
                attendance_percentage: result.attendance
            });

            await Performance.create({
                student_id: studentDoc._id,
                attendance_id: attendanceDoc._id,
                marks: result.assignmentCompletion,
                subject: studentClass || "General",
                study_hours: Number(studyHours),
                assignment_completion: result.assignmentCompletion
            });

            await Feedback.create({
                student_id: studentDoc._id,
                stress_level: result.stressLevel,
                interest_level: deriveInterestLevel(result)
            });

            const assessmentDoc = await MotivationAssessment.create({
                student_id: studentDoc._id,
                motivation_score: result.motivationScore,
                motivation_level: result.motivationLevel,
                sleep_hours: Number(sleepHours),
                motivational_line: result.motivationalLine
            });

            const teacherDoc = await Teacher.findOneAndUpdate(
                { email: TEACHER_EMAIL, institutionId: institution.id },
                {
                    name: "Default Teacher",
                    email: TEACHER_EMAIL,
                    department: department || "",
                    institutionId: institution.id,
                    institutionName: institution.name
                },
                { new: true, upsert: true }
            );

            await Recommendation.insertMany(result.feedback.map((item) => ({
                assessment_id: assessmentDoc._id,
                teacher_id: teacherDoc._id,
                suggestion: item
            })));

            return res.status(201).json({
                message: "Analysis completed",
                report: buildReport({
                    institutionId: studentDoc.institutionId || institution.id,
                    institutionName: studentDoc.institutionName || institution.name,
                    studentName: studentDoc.name,
                    age: studentDoc.age,
                    gender: studentDoc.gender,
                    studentClass: studentDoc.studentClass,
                    section: studentDoc.section,
                    department: studentDoc.department,
                    semester: studentDoc.semester || studentDoc.year,
                    cgpa: studentDoc.cgpa,
                    studyGoal: studentDoc.studyGoal,
                    attendanceLevel: studentDoc.attendanceLevel,
                    assignmentStatus: studentDoc.assignmentStatus,
                    extracurricularLevel: studentDoc.extracurricularLevel,
                    parentSupportLevel: studentDoc.parentSupportLevel,
                    stressLevelText: studentDoc.stressLevelText,
                    extracurricularHours: result.extracurricularHours,
                    parentSupport: result.parentSupport,
                    studyHours: toNumber(studyHours),
                    attendance: result.attendance,
                    assignmentCompletion: result.assignmentCompletion,
                    sleepHours: toNumber(sleepHours),
                    stressLevel: result.stressLevel,
                    motivationScore: assessmentDoc.motivation_score,
                    motivationLevel: assessmentDoc.motivation_level,
                    feedback: result.feedback,
                    predictedScoreBand: result.predictedScoreBand,
                    topFocusAreas: result.topFocusAreas,
                    dailyBattlePlan: result.dailyBattlePlan,
                    motivationalLine: assessmentDoc.motivational_line,
                    generatedAt: assessmentDoc.createdAt
                })
            });
        }

        const localRecord = {
            _id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            institutionId: institution.id,
            institutionName: institution.name,
            studentName: studentName || "Student",
            age: age ? Number(age) : undefined,
            gender,
            studentClass,
            section,
            department,
            semester,
            cgpa: cgpa ? Number(cgpa) : undefined,
            studyGoal,
            attendanceLevel,
            assignmentStatus,
            extracurricularLevel,
            parentSupportLevel,
            stressLevelText,
            extracurricularHours: result.extracurricularHours,
            parentSupport: result.parentSupport,
            studyHours: Number(studyHours),
            attendance: result.attendance,
            assignmentCompletion: result.assignmentCompletion,
            sleepHours: Number(sleepHours),
            stressLevel: result.stressLevel,
            motivationScore: result.motivationScore,
            motivationLevel: result.motivationLevel,
            feedback: result.feedback,
            predictedScoreBand: result.predictedScoreBand,
            topFocusAreas: result.topFocusAreas,
            dailyBattlePlan: result.dailyBattlePlan,
            motivationalLine: result.motivationalLine,
            createdAt: new Date().toISOString()
        };

        const records = readLocalRecords();
        records.unshift(localRecord);
        writeLocalRecords(records);

        return res.status(201).json({
            message: "Analysis completed",
            mode: "local",
            report: buildReport({
                institutionId: localRecord.institutionId,
                institutionName: localRecord.institutionName,
                studentName: localRecord.studentName,
                age: localRecord.age,
                gender: localRecord.gender,
                studentClass: localRecord.studentClass,
                section: localRecord.section,
                department: localRecord.department,
                semester: localRecord.semester,
                cgpa: localRecord.cgpa,
                studyGoal: localRecord.studyGoal,
                attendanceLevel: localRecord.attendanceLevel,
                assignmentStatus: localRecord.assignmentStatus,
                extracurricularLevel: localRecord.extracurricularLevel,
                parentSupportLevel: localRecord.parentSupportLevel,
                stressLevelText: localRecord.stressLevelText,
                extracurricularHours: localRecord.extracurricularHours,
                parentSupport: localRecord.parentSupport,
                studyHours: localRecord.studyHours,
                attendance: localRecord.attendance,
                assignmentCompletion: localRecord.assignmentCompletion,
                sleepHours: localRecord.sleepHours,
                stressLevel: localRecord.stressLevel,
                motivationScore: localRecord.motivationScore,
                motivationLevel: localRecord.motivationLevel,
                feedback: localRecord.feedback,
                predictedScoreBand: localRecord.predictedScoreBand,
                topFocusAreas: localRecord.topFocusAreas,
                dailyBattlePlan: localRecord.dailyBattlePlan,
                motivationalLine: localRecord.motivationalLine,
                generatedAt: localRecord.createdAt
            })
        });
    } catch (error) {
        logServerError("createAnalysisHandler", error, req);
        return res.status(500).json({ message: "Unable to analyze student details" });
    }
}

async function listRecordsHandler(req, res) {
    try {
        const institutionId = getInstitutionScope(req);
        if (isDbConnected()) {
            const assessments = await MotivationAssessment.find()
                .populate("student_id")
                .sort({ createdAt: -1 });

            const records = await Promise.all(assessments.map((assessment) => mapAssessmentToRecord(assessment)));
            return res.json(records.filter((record) => recordMatchesInstitution(record, institutionId)));
        }

        const records = readLocalRecords().filter((record) => recordMatchesInstitution(record, institutionId));
        return res.json(records);
    } catch (error) {
        logServerError("listRecordsHandler", error, req);
        return res.status(500).json({ message: "Unable to fetch records" });
    }
}

async function teacherSummaryHandler(req, res) {
    try {
        const institutionId = getInstitutionScope(req);
        if (isDbConnected()) {
            const assessments = await MotivationAssessment.find({}, "motivation_score motivation_level student_id")
                .populate("student_id", "institutionId department");
            const filteredAssessments = assessments.filter((assessment) => recordMatchesInstitution(assessment.student_id || {}, institutionId));
            const totalRecords = filteredAssessments.length;
            const totalScore = filteredAssessments.reduce((sum, item) => sum + toNumber(item.motivation_score), 0);
            const averageMotivationScore = totalRecords ? Math.round(totalScore / totalRecords) : 0;
            const motivationLevels = filteredAssessments.reduce((acc, item) => {
                const level = String(item.motivation_level || "Unknown");
                acc[level] = (acc[level] || 0) + 1;
                return acc;
            }, {});

            return res.json({
                totalRecords,
                averageMotivationScore,
                motivationLevels
            });
        }

        const records = readLocalRecords().filter((record) => recordMatchesInstitution(record, institutionId));
        const totalRecords = records.length;
        const totalScore = records.reduce((sum, item) => sum + toNumber(item.motivationScore), 0);
        const averageMotivationScore = totalRecords ? Math.round(totalScore / totalRecords) : 0;
        const motivationLevels = records.reduce((acc, item) => {
            const level = String(item.motivationLevel || "Unknown");
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});

        return res.json({
            totalRecords,
            averageMotivationScore,
            motivationLevels
        });
    } catch (error) {
        logServerError("teacherSummaryHandler", error, req);
        return res.status(500).json({ message: "Unable to fetch teacher summary" });
    }
}

async function getRecordByIdHandler(req, res) {
    try {
        const institutionId = getInstitutionScope(req);
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Record id is required" });
        }

        if (isDbConnected()) {
            const assessment = await MotivationAssessment.findById(id).populate("student_id");
            if (!assessment) {
                return res.status(404).json({ message: "Record not found" });
            }
            const record = await mapAssessmentToRecord(assessment);
            if (!recordMatchesInstitution(record, institutionId)) {
                return res.status(404).json({ message: "Record not found" });
            }
            return res.json(record);
        }

        const records = readLocalRecords();
        const record = records.find((item) => item._id === id);
        if (!record || !recordMatchesInstitution(record, institutionId)) {
            return res.status(404).json({ message: "Record not found" });
        }
        return res.json(record);
    } catch (error) {
        logServerError("getRecordByIdHandler", error, req);
        return res.status(500).json({ message: "Unable to fetch record" });
    }
}

async function updateRecordHandler(req, res) {
    try {
        const institutionId = getInstitutionScope(req);
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Record id is required" });
        }

        const payloadValidationError = validateAnalysisPayload(req.body, { partial: true });
        if (payloadValidationError) {
            return res.status(400).json({ message: payloadValidationError });
        }

        if (isDbConnected()) {
            const assessment = await MotivationAssessment.findById(id).populate("student_id");
            if (!assessment) {
                return res.status(404).json({ message: "Record not found" });
            }

            const existingRecord = await mapAssessmentToRecord(assessment);
            if (!recordMatchesInstitution(existingRecord, institutionId)) {
                return res.status(404).json({ message: "Record not found" });
            }
            const merged = { ...existingRecord, ...req.body };

            const result = analyzeStudentData({
                studentClass: merged.studentClass,
                cgpa: merged.cgpa,
                extracurricularHours: merged.extracurricularHours,
                parentSupport: merged.parentSupport,
                attendanceLevel: merged.attendanceLevel,
                assignmentStatus: merged.assignmentStatus,
                extracurricularLevel: merged.extracurricularLevel,
                parentSupportLevel: merged.parentSupportLevel,
                stressLevelText: merged.stressLevelText,
                studyHours: merged.studyHours,
                attendance: merged.attendance,
                assignmentCompletion: merged.assignmentCompletion,
                sleepHours: merged.sleepHours,
                stressLevel: merged.stressLevel
            });

            const studentDoc = assessment.student_id;
            await Student.findByIdAndUpdate(studentDoc._id, {
                name: merged.studentName || studentDoc.name,
                institutionId: studentDoc.institutionId || merged.institutionId || institutionId,
                institutionName: studentDoc.institutionName || merged.institutionName || resolveInstitution(institutionId).name,
                age: merged.age !== undefined ? Number(merged.age) : studentDoc.age,
                gender: merged.gender ?? studentDoc.gender,
                studentClass: merged.studentClass ?? studentDoc.studentClass,
                section: merged.section ?? studentDoc.section,
                department: merged.department ?? studentDoc.department,
                semester: merged.semester ?? studentDoc.semester,
                year: merged.semester ?? studentDoc.year,
                cgpa: merged.cgpa !== undefined ? Number(merged.cgpa) : studentDoc.cgpa,
                studyGoal: merged.studyGoal ?? studentDoc.studyGoal,
                attendanceLevel: merged.attendanceLevel ?? studentDoc.attendanceLevel,
                assignmentStatus: merged.assignmentStatus ?? studentDoc.assignmentStatus,
                extracurricularLevel: merged.extracurricularLevel ?? studentDoc.extracurricularLevel,
                parentSupportLevel: merged.parentSupportLevel ?? studentDoc.parentSupportLevel,
                stressLevelText: merged.stressLevelText ?? studentDoc.stressLevelText
            });

            const [attendanceDoc, performanceDoc, feedbackDoc] = await Promise.all([
                Attendance.findOne({ student_id: studentDoc._id }).sort({ createdAt: -1 }),
                Performance.findOne({ student_id: studentDoc._id }).sort({ createdAt: -1 }),
                Feedback.findOne({ student_id: studentDoc._id }).sort({ createdAt: -1 })
            ]);

            if (attendanceDoc) {
                attendanceDoc.attendance_percentage = result.attendance;
                await attendanceDoc.save();
            } else {
                await Attendance.create({ student_id: studentDoc._id, attendance_percentage: result.attendance });
            }

            if (performanceDoc) {
                performanceDoc.marks = result.assignmentCompletion;
                performanceDoc.subject = merged.studentClass || "General";
                performanceDoc.study_hours = toNumber(merged.studyHours);
                performanceDoc.assignment_completion = result.assignmentCompletion;
                await performanceDoc.save();
            } else {
                await Performance.create({
                    student_id: studentDoc._id,
                    marks: result.assignmentCompletion,
                    subject: merged.studentClass || "General",
                    study_hours: toNumber(merged.studyHours),
                    assignment_completion: result.assignmentCompletion
                });
            }

            if (feedbackDoc) {
                feedbackDoc.stress_level = result.stressLevel;
                feedbackDoc.interest_level = deriveInterestLevel(result);
                await feedbackDoc.save();
            } else {
                await Feedback.create({
                    student_id: studentDoc._id,
                    stress_level: result.stressLevel,
                    interest_level: deriveInterestLevel(result)
                });
            }

            assessment.motivation_score = result.motivationScore;
            assessment.motivation_level = result.motivationLevel;
            assessment.sleep_hours = toNumber(merged.sleepHours);
            assessment.motivational_line = result.motivationalLine;
            await assessment.save();

            await Recommendation.deleteMany({ assessment_id: assessment._id });
            const teacherDoc = await Teacher.findOne({ email: TEACHER_EMAIL, institutionId });
            await Recommendation.insertMany(result.feedback.map((item) => ({
                assessment_id: assessment._id,
                teacher_id: teacherDoc?._id,
                suggestion: item
            })));

            const updatedAssessment = await MotivationAssessment.findById(assessment._id).populate("student_id");
            const updatedRecord = await mapAssessmentToRecord(updatedAssessment);
            return res.json({ message: "Record updated successfully", record: updatedRecord });
        }

        const records = readLocalRecords();
        const index = records.findIndex((item) => item._id === id);
        if (index === -1 || !recordMatchesInstitution(records[index], institutionId)) {
            return res.status(404).json({ message: "Record not found" });
        }

        const merged = { ...records[index], ...req.body };
        const result = analyzeStudentData({
            studentClass: merged.studentClass,
            cgpa: merged.cgpa,
            extracurricularHours: merged.extracurricularHours,
            parentSupport: merged.parentSupport,
            attendanceLevel: merged.attendanceLevel,
            assignmentStatus: merged.assignmentStatus,
            extracurricularLevel: merged.extracurricularLevel,
            parentSupportLevel: merged.parentSupportLevel,
            stressLevelText: merged.stressLevelText,
            studyHours: merged.studyHours,
            attendance: merged.attendance,
            assignmentCompletion: merged.assignmentCompletion,
            sleepHours: merged.sleepHours,
            stressLevel: merged.stressLevel
        });

        records[index] = {
            ...merged,
            institutionId: merged.institutionId || records[index].institutionId || institutionId,
            institutionName: merged.institutionName || records[index].institutionName || resolveInstitution(institutionId).name,
            age: merged.age !== undefined && merged.age !== "" ? Number(merged.age) : undefined,
            cgpa: merged.cgpa !== undefined && merged.cgpa !== "" ? Number(merged.cgpa) : undefined,
            studyHours: toNumber(merged.studyHours),
            sleepHours: toNumber(merged.sleepHours),
            attendance: result.attendance,
            assignmentCompletion: result.assignmentCompletion,
            stressLevel: result.stressLevel,
            extracurricularHours: result.extracurricularHours,
            parentSupport: result.parentSupport,
            motivationScore: result.motivationScore,
            motivationLevel: result.motivationLevel,
            feedback: result.feedback,
            predictedScoreBand: result.predictedScoreBand,
            topFocusAreas: result.topFocusAreas,
            dailyBattlePlan: result.dailyBattlePlan,
            motivationalLine: result.motivationalLine
        };

        writeLocalRecords(records);
        return res.json({ message: "Record updated successfully", record: records[index] });
    } catch (error) {
        logServerError("updateRecordHandler", error, req);
        return res.status(500).json({ message: "Unable to update record" });
    }
}

async function deleteRecordHandler(req, res) {
    try {
        const institutionId = getInstitutionScope(req);
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Record id is required" });
        }

        if (isDbConnected()) {
            const assessment = await MotivationAssessment.findById(id).populate("student_id");
            if (!assessment) {
                return res.status(404).json({ message: "Record not found" });
            }
            const record = await mapAssessmentToRecord(assessment);
            if (!recordMatchesInstitution(record, institutionId)) {
                return res.status(404).json({ message: "Record not found" });
            }

            const studentId = assessment.student_id?._id;

            await Recommendation.deleteMany({ assessment_id: assessment._id });
            await MotivationAssessment.findByIdAndDelete(assessment._id);

            if (studentId) {
                const remainingAssessments = await MotivationAssessment.countDocuments({
                    student_id: studentId,
                    _id: { $ne: assessment._id }
                });

                if (remainingAssessments === 0) {
                    await Promise.all([
                        Attendance.deleteMany({ student_id: studentId }),
                        Performance.deleteMany({ student_id: studentId }),
                        Feedback.deleteMany({ student_id: studentId }),
                        Student.findByIdAndDelete(studentId)
                    ]);
                }
            }

            return res.json({ message: "Record deleted successfully" });
        }

        const records = readLocalRecords();
        const existingRecord = records.find((item) => item._id === id);
        if (!existingRecord || !recordMatchesInstitution(existingRecord, institutionId)) {
            return res.status(404).json({ message: "Record not found" });
        }
        const filtered = records.filter((item) => item._id !== id);
        if (filtered.length === records.length) {
            return res.status(404).json({ message: "Record not found" });
        }
        writeLocalRecords(filtered);
        return res.json({ message: "Record deleted successfully" });
    } catch (error) {
        logServerError("deleteRecordHandler", error, req);
        return res.status(500).json({ message: "Unable to delete record" });
    }
}

app.get("/", (req, res) => {
    res.send("Backend Server Running");
});

app.get(`${API_PREFIX}/health`, (req, res) => {
    const mongoReadyState = mongoose.connection.readyState;
    const dbMode = mongoReadyState === 1 ? "mongo" : "local";
    res.json({ status: "ok", dbMode, timestamp: new Date().toISOString(), institutions: INSTITUTIONS });
});

app.post(`${API_PREFIX}/auth/register`, registerHandler);
app.post(`${API_PREFIX}/auth/login`, loginHandler);
app.get(`${API_PREFIX}/auth/me`, authenticateToken, (req, res) => {
    return res.json({ user: req.user });
});
app.post(`${API_PREFIX}/analyses`, authenticateToken, authorizeRoles("student", "teacher"), createAnalysisHandler);
app.get(`${API_PREFIX}/records`, authenticateToken, authorizeRoles("teacher"), listRecordsHandler);
app.get(`${API_PREFIX}/records/summary`, authenticateToken, authorizeRoles("teacher"), teacherSummaryHandler);
app.get(`${API_PREFIX}/records/:id`, authenticateToken, authorizeRoles("teacher"), getRecordByIdHandler);
app.put(`${API_PREFIX}/records/:id`, authenticateToken, authorizeRoles("teacher"), updateRecordHandler);
app.delete(`${API_PREFIX}/records/:id`, authenticateToken, authorizeRoles("teacher"), deleteRecordHandler);

// Legacy routes kept for frontend compatibility
app.post("/register", registerHandler);
app.post("/login", loginHandler);
app.post("/analyze", createAnalysisHandler);
app.get("/dashboard/records", listRecordsHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
