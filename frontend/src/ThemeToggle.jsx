import { useTheme } from "./ThemeContext";

function ThemeToggle() {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
    >
      {darkMode ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}

export default ThemeToggle;
