import React from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Tracker from "./pages/Tracker";
import Dashboard from "./pages/Dashboard.js";
import { useAuth } from "./context/AuthContext";

function StudentRoute({ children }) {
  const { isLoggedIn, userRole, token } = useAuth();
  return isLoggedIn && userRole === "student" && token ? children : <Navigate to="/login" replace />;
}

function TeacherRoute({ children }) {
  const { isLoggedIn, userRole, token } = useAuth();
  return isLoggedIn && userRole === "teacher" && token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tracker" element={<StudentRoute><Tracker /></StudentRoute>} />
        <Route path="/dashboard" element={<TeacherRoute><Dashboard /></TeacherRoute>} />
      </Routes>

    </BrowserRouter>
  );
}

export default App;
