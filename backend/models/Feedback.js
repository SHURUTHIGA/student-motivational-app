const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
    {
        student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
        stress_level: { type: Number, required: true },
        interest_level: { type: Number, required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
