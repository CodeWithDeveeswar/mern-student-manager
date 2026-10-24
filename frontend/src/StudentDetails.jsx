import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const API_URL = import.meta.env.VITE_API_URL;

function StudentDetails() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    function syncTheme() {
      setDarkMode(localStorage.getItem("theme") === "dark");
    }

    window.addEventListener("storage", syncTheme);

    return () => {
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  useEffect(() => {
    async function fetchStudent() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/${id}`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not fetch student");
        }

        setStudent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStudent();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-12 text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
        <p>Loading student...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-8 dark:bg-slate-950">
        <p className="mb-4 text-red-600">{error}</p>
        <Link to="/" className="text-blue-600 hover:underline">
          Back to students
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto mb-6 flex max-w-xl justify-end">
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-xl">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          ← Back to students
        </Link>

        <div className="mt-6 rounded-xl bg-white p-6 shadow dark:bg-slate-800">
          <h1 className="mb-6 text-2xl font-bold text-slate-800 dark:text-white">
            Student Details
          </h1>

          <p className="mb-2 text-slate-500 dark:text-slate-400">Name</p>
          <p className="mb-5 font-semibold text-slate-800 dark:text-white">
            {student.name}
          </p>

          <p className="mb-2 text-slate-500 dark:text-slate-400">Email</p>
          <p className="break-all font-semibold text-slate-800 dark:text-white">
            {student.email}
          </p>

          <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
            Student ID: {student._id}
          </p>
        </div>
      </div>
    </main>
  );
}

export default StudentDetails;
