import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const AUTH_URL = import.meta.env.VITE_AUTH_URL;

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${AUTH_URL}/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset failed");
      }

      setMessage(data.message);
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400";

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-lg transition-colors duration-300 dark:bg-slate-800"
      >
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Reset password
        </h1>

        <input
          className={inputClass}
          type="password"
          placeholder="New password (at least 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          autoComplete="new-password"
          required
        />

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {message && (
          <p className="text-sm text-green-700 dark:text-green-400">
            {message}
          </p>
        )}

        {!message && (
          <button
            className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700"
            type="submit"
          >
            Reset password
          </button>
        )}

        <Link
          to="/login"
          className="block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          Back to login
        </Link>
      </form>
    </main>
  );
}
