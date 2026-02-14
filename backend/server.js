const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Student = require("./models/Student");
const Attendance = require("./models/Attendance");
const Performance = require("./models/Performance");
const Feedback = require("./models/Feedback");
const MotivationAssessment = require("./models/MotivationAssessment");
const Recommendation = require("./models/Recommendation");
const Teacher = require("./models/Teacher");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

const localUsersFile = path.join(__dirname, "data", "users.json");
const localRecordsFile = path.join(__dirname, "data", "records.json");

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

app.get("/", (req, res) => {
    res.send("Backend Server Running");
});

const TEACHER_EMAIL = process.env.TEACHER_EMAIL || "teacher@gmail.com";
const TEACHER_EMAIL_ALIASES = [TEACHER_EMAIL, "teacher@school.com", "teacher@gmail.com"];
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || "teacher123";

const motivationalLines = {
    High: "Excellent consistency. Keep pushing to reach your highest potential.",
    Moderate: "You are on the right path. A little more consistency will create big results.",
    Low: "Do not give up. Start with small daily goals and build momentum step by step."
};

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
}

function buildReport(data) {
    return {
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
        motivationalLine: data.motivationalLine,
        generatedAt: data.generatedAt
    };
}

function deriveInterestLevel(result) {
    const interestScore = Math.round((result.assignmentCompletion + (result.extracurricularHours * 20)) / 2);
    return Math.max(0, Math.min(100, interestScore));
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

    return {
        attendance,
        assignmentCompletion,
        stressLevel,
        extracurricularHours,
        parentSupport,
        motivationScore,
        motivationLevel,
        feedback,
        motivationalLine: motivationalLines[motivationLevel]
    };
}

// REGISTER API
app.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        if (isDbConnected()) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({ message: "Email already registered" });
            }

            const newUser = new User({ email, password });
            await newUser.save();
            return res.json({ message: "User Registered Successfully" });
        }

        const users = readLocalUsers();
        const existing = users.find((u) => u.email === email);
        if (existing) {
            return res.status(409).json({ message: "Email already registered" });
        }

        users.push({ email, password, createdAt: new Date().toISOString() });
        writeLocalUsers(users);
        res.json({ message: "User Registered Successfully (Local Mode)" });
    } catch (error) {
        res.status(500).json({ message: "Registration failed" });
    }
});

// LOGIN API
app.post("/login", async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (role === "teacher") {
            const normalizedEmail = String(email || "").trim().toLowerCase();
            const isKnownTeacherEmail = TEACHER_EMAIL_ALIASES.includes(normalizedEmail);
            if (isKnownTeacherEmail && password === TEACHER_PASSWORD) {
                return res.json({ message: "Teacher Login Successful", role: "teacher" });
            }
            return res.status(401).json({ message: "Invalid Teacher Credentials" });
        }

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        if (isDbConnected()) {
            const user = await User.findOne({ email, password });
            if (user) {
                return res.json({ message: "Student Login Successful", role: "student" });
            }
            return res.status(401).json({ message: "Invalid Credentials" });
        }

        const users = readLocalUsers();
        const user = users.find((u) => u.email === email && u.password === password);
        if (user) {
            res.json({ message: "Student Login Successful", role: "student" });
        } else {
            res.status(401).json({ message: "Invalid Credentials" });
        }
    } catch (error) {
        res.status(500).json({ message: "Login failed" });
    }
});

// ANALYZE + STORE STUDENT DATA
app.post("/analyze", async (req, res) => {
    try {
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

        const result = analyzeStudentData({
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
                    department: department || "",
                    year: semester || ""
                },
                {
                    name: studentName || "Student",
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
                { email: TEACHER_EMAIL },
                {
                    name: "Default Teacher",
                    email: TEACHER_EMAIL,
                    department: department || ""
                },
                { new: true, upsert: true }
            );

            await Recommendation.insertMany(result.feedback.map((item) => ({
                assessment_id: assessmentDoc._id,
                teacher_id: teacherDoc._id,
                suggestion: item
            })));

            return res.json({
                message: "Analysis completed",
                report: buildReport({
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
                    motivationalLine: assessmentDoc.motivational_line,
                    generatedAt: assessmentDoc.createdAt
                })
            });
        }

        const localRecord = {
            _id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
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
            motivationalLine: result.motivationalLine,
            createdAt: new Date().toISOString()
        };

        const records = readLocalRecords();
        records.unshift(localRecord);
        writeLocalRecords(records);

        res.json({
            message: "Analysis completed (Local Mode)",
            report: buildReport({
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
                motivationalLine: localRecord.motivationalLine,
                generatedAt: localRecord.createdAt
            })
        });
    } catch (error) {
        res.status(500).json({ message: "Unable to analyze student details" });
    }
});

// TEACHER DASHBOARD DATA
app.get("/dashboard/records", async (req, res) => {
    try {
        if (isDbConnected()) {
            const assessments = await MotivationAssessment.find()
                .populate("student_id")
                .sort({ createdAt: -1 });

            const records = await Promise.all(assessments.map(async (assessment) => {
                const studentDoc = assessment.student_id;
                const studentId = studentDoc?._id;

                const [attendanceDoc, performanceDoc, latestFeedback, recommendations] = await Promise.all([
                    Attendance.findOne({ student_id: studentId }).sort({ createdAt: -1 }),
                    Performance.findOne({ student_id: studentId }).sort({ createdAt: -1 }),
                    Feedback.findOne({ student_id: studentId }).sort({ createdAt: -1 }),
                    Recommendation.find({ assessment_id: assessment._id }).sort({ createdAt: 1 })
                ]);

                return {
                    _id: String(assessment._id),
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
                    motivationalLine: assessment.motivational_line,
                    createdAt: assessment.createdAt
                };
            }));

            return res.json(records);
        }

        const records = readLocalRecords();
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: "Unable to fetch dashboard records" });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
