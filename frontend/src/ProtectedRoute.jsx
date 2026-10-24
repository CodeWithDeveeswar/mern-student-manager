import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

const AUTH_URL = import.meta.env.VITE_AUTH_URL;

export default function ProtectedRoute() {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    let active = true;

    fetch(`${AUTH_URL}/me`, {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Not authenticated");
        }
        return response.json();
      })
      .then(() => {
        if (active) setAuthenticated(true);
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (authenticated === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
        Checking session...
      </main>
    );
  }

  return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
