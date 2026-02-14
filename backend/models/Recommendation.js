const mongoose = require("mongoose");

const RecommendationSchema = new mongoose.Schema(
    {
        assessment_id: { type: mongoose.Schema.Types.ObjectId, ref: "MotivationAssessment", required: true },
        teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
        suggestion: { type: String, required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Recommendation", RecommendationSchema);
