const mongoose = require("mongoose");

const TeacherSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        department: { type: String, default: "" },
        email: { type: String, default: "" },
        institutionId: { type: String, default: "", trim: true, lowercase: true },
        institutionName: { type: String, default: "" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Teacher", TeacherSchema);
