import React, { useState, useEffect } from "react";
import "./App.css";
import NotesApp from "./NotesApp";

// PUBLIC_INTERFACE
function App() {
  // Light/dark theme toggle
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className="App">
      {/* Floating theme toggler */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
      {/* Main notes app */}
      <NotesApp />
    </div>
  );
}

export default App;
