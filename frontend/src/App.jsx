import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const AUTH_URL = import.meta.env.VITE_AUTH_URL;
const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  // Get students from backend
  async function getStudents() {
    try {
      const response = await fetch(API_URL, { credentials: "include" });

      if (!response.ok) {
        throw new Error("Could not fetch students");
      }

      const data = await response.json();
      setStudents(data);
    } catch (error) {
      setError(error.message);
    }
  }

  // Delete a student
  async function deleteStudent(id) {
    setError("");

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete student");
      }

      setStudents((previous) =>
        previous.filter((student) => student._id !== id),
      );
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    getStudents();
  }, []);

  function validateForm() {
    const errors = {};
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (cleanName.length < 2) {
      errors.name = "Name must contain at least 2 characters";
    }

    if (!cleanEmail) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Enter a valid email address";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  // Add a new student or update an existing student in the backend
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    const isEditing = editingId !== null;

    const url = isEditing ? `${API_URL}/${editingId}` : API_URL;

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Operation failed");
      }

      if (isEditing) {
        setStudents((previous) =>
          previous.map((student) =>
            student._id === editingId ? data : student,
          ),
        );
      } else {
        setStudents((previous) => [...previous, data]);
      }

      // Reset the form
      setName("");
      setEmail("");
      setEditingId(null);
      setFieldErrors({});
      setError("");
    } catch (error) {
      setError(error.message);
    }
  }

  const filteredStudents = students.filter((student) => {
    const query = search.trim().toLowerCase();

    return (
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const startIndex = (currentPage - 1) * studentsPerPage;

  const currentStudents = filteredStudents.slice(
    startIndex,
    startIndex + studentsPerPage,
  );

  useEffect(() => {
    if (currentPage > Math.max(1, totalPages)) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  async function handleLogout() {
    try {
      await fetch(`${import.meta.env.VITE_AUTH_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.replace("/login");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-6 transition-colors duration-300 dark:bg-slate-950 sm:px-4 sm:py-10 md:py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex w-full min-w-0 items-center justify-between gap-2 sm:mb-8 sm:gap-4">
          <h1 className="min-w-0 text-xl font-bold leading-tight text-slate-800 dark:text-white sm:text-3xl">
            Student Manager
          </h1>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <button
              type="button"
              onClick={handleLogout}
              className="whitespace-nowrap rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 sm:px-4"
            >
              Logout
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 rounded-xl bg-white p-4 shadow dark:bg-slate-800 sm:p-6"
        >
          <input
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400"
            type="text"
            placeholder="Student name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setFieldErrors((prev) => ({ ...prev, name: "" }));
            }}
            required
            minLength={2}
          />

          {fieldErrors.name && (
            <p className="text-sm text-red-600">{fieldErrors.name}</p>
          )}

          <input
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400"
            type="email"
            placeholder="Student email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldErrors((prev) => ({ ...prev, email: "" }));
            }}
            required
          />

          {fieldErrors.email && (
            <p className="text-sm text-red-600">{fieldErrors.email}</p>
          )}

          <button
            className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700"
            type="submit"
          >
            {editingId ? "Update Student" : "Add Student"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setName("");
                setEmail("");
                setEditingId(null);
                setFieldErrors({});
                setError("");
              }}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancel Edit
            </button>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              Students ({filteredStudents.length})
            </h2>

            <input
              type="search"
              placeholder="Search name or email..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white sm:max-w-xs"
            />
          </div>

          {filteredStudents.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">
              No students added yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {currentStudents.map((student) => (
                <li
                  key={student._id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/students/${student._id}`}
                      className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {student.name}
                    </Link>

                    <p className="break-all text-sm text-slate-500 dark:text-slate-300">
                      {student.email}
                    </p>
                  </div>

                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setName(student.name);
                        setEmail(student.email);
                        setEditingId(student._id);
                        setError("");
                      }}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 sm:px-3"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteStudent(student._id)}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 sm:px-3"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}

              {totalPages > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page - 1)}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              )}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
