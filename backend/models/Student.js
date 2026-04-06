const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, default: "" },
        institutionId: { type: String, default: "", trim: true, lowercase: true },
        institutionName: { type: String, default: "" },
        department: { type: String, default: "" },
        year: { type: String, default: "" },
        age: { type: Number },
        gender: { type: String, default: "" },
        studentClass: { type: String, default: "" },
        section: { type: String, default: "" },
        semester: { type: String, default: "" },
        cgpa: { type: Number },
        studyGoal: { type: String, default: "" },
        attendanceLevel: { type: String, default: "" },
        assignmentStatus: { type: String, default: "" },
        extracurricularLevel: { type: String, default: "" },
        parentSupportLevel: { type: String, default: "" },
        stressLevelText: { type: String, default: "" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Student", StudentSchema);
