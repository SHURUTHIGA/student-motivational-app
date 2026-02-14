const mongoose = require("mongoose");

const TeacherSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        department: { type: String, default: "" },
        email: { type: String, default: "" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Teacher", TeacherSchema);
