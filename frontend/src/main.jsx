import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ThemeProvider } from "./ThemeContext";
import App from "./App.jsx";
import StudentDetails from "./StudentDetails.jsx";
import Auth from "./Auth.jsx";
import ResetPassword from "./ResetPassword.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<App />} />
            <Route path="/students/:id" element={<StudentDetails />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
