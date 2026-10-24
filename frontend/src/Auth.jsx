import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const AUTH_URL = import.meta.env.VITE_AUTH_URL;

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const endpoint = {
      login: "login",
      register: "register",
      forgot: "forgot-password",
    }[mode];

    try {
      const response = await fetch(`${AUTH_URL}/${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          mode === "forgot"
            ? { email }
            : mode === "register"
              ? { name, email, password }
              : { email, password },
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      if (mode === "login") {
        navigate("/");
        return;
      }

      setMessage(data.message);

      if (mode === "register") {
        setMode("login");
        setPassword("");
      }
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
          {mode === "login"
            ? "Login"
            : mode === "register"
              ? "Create account"
              : "Forgot password"}
        </h1>

        {mode === "register" && (
          <input
            className={inputClass}
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            required
          />
        )}

        <input
          className={inputClass}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {mode !== "forgot" && (
          <input
            className={inputClass}
            type="password"
            placeholder="Password (at least 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
          />
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {message && (
          <p className="text-sm text-green-700 dark:text-green-400">
            {message}
          </p>
        )}

        <button
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700"
          type="submit"
        >
          {mode === "login"
            ? "Login"
            : mode === "register"
              ? "Register"
              : "Send reset link"}
        </button>

        <div className="flex flex-wrap justify-between gap-3 text-sm">
          {mode !== "login" && (
            <button
              type="button"
              className="text-blue-600 hover:underline dark:text-blue-400"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
            >
              Back to login
            </button>
          )}

          {mode === "login" && (
            <>
              <button
                type="button"
                className="text-blue-600 hover:underline dark:text-blue-400"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                  setMessage("");
                }}
              >
                Forgot password?
              </button>

              <button
                type="button"
                className="text-blue-600 hover:underline dark:text-blue-400"
                onClick={() => {
                  setMode("register");
                  setError("");
                  setMessage("");
                }}
              >
                Create account
              </button>
            </>
          )}
        </div>
      </form>
    </main>
  );
}
