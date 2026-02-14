const mongoose = require("mongoose");

const PerformanceSchema = new mongoose.Schema(
    {
        student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
        attendance_id: { type: mongoose.Schema.Types.ObjectId, ref: "Attendance" },
        marks: { type: Number, required: true },
        subject: { type: String, default: "General" },
        study_hours: { type: Number, required: true },
        assignment_completion: { type: Number, required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Performance", PerformanceSchema);
