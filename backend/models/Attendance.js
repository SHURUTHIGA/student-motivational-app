const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
    {
        student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
        attendance_percentage: { type: Number, required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);
