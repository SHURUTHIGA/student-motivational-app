const mongoose = require("mongoose");

const MotivationAssessmentSchema = new mongoose.Schema(
    {
        student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
        motivation_score: { type: Number, required: true },
        motivation_level: { type: String, required: true },
        sleep_hours: { type: Number, required: true },
        motivational_line: { type: String, required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("MotivationAssessment", MotivationAssessmentSchema);
