import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

/**
 * Notes Organizer App (with sidebar, top bar, and main area)
 * Modern minimalistic, light theme, CRUD integration with Supabase.
 */

// Helpers for empty note
const EMPTY_NOTE = { id: null, title: "", content: "" };

// PUBLIC_INTERFACE
function NotesApp() {
  // Notes state
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState(EMPTY_NOTE);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  // Fetch notes from Supabase (optionally filtered by search)
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError("");
    let query = supabase
      .from("notes")
      .select("*")
      .order("updated_at", { ascending: false });
    if (search.trim()) {
      query = query.ilike("title", `%${search.trim()}%`);
    }
    const { data, error } = await query;
    if (error) setError(error.message);
    else setNotes(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Select note
  const handleSelect = (note) => {
    setSelected(note.id);
    setEditor(note);
    setEditing(false);
    setError("");
  };

  // New note
  const handleNew = () => {
    setSelected(null);
    setEditor(EMPTY_NOTE);
    setEditing(true);
    setError("");
  };

  // Edit note (button)
  const handleEdit = () => {
    setEditing(true);
  };

  // Cancel editing
  const handleCancel = () => {
    if (selected) {
      setEditor(notes.find((n) => n.id === selected) || EMPTY_NOTE);
      setEditing(false);
    } else {
      setEditor(EMPTY_NOTE);
      setEditing(false);
    }
    setError("");
  };

  // Handle input change
  const handleInput = (e) => {
    setEditor({ ...editor, [e.target.name]: e.target.value });
  };

  // Save note (create or update)
  // PUBLIC_INTERFACE
  const handleSave = async () => {
    setLoading(true);
    setError("");
    if (!editor.title.trim()) {
      setError("Title cannot be empty.");
      setLoading(false);
      return;
    }
    let result;
    const now = new Date().toISOString();
    if (editor.id) {
      // Update
      result = await supabase
        .from("notes")
        .update({ title: editor.title, content: editor.content, updated_at: now })
        .eq("id", editor.id)
        .select()
        .maybeSingle();
    } else {
      // Create
      result = await supabase
        .from("notes")
        .insert([{ title: editor.title, content: editor.content }])
        .select()
        .maybeSingle();
    }
    if (result.error) {
      setError(result.error.message);
    } else {
      await fetchNotes();
      setSelected(result.data?.id || null);
      setEditor(result.data || EMPTY_NOTE);
      setEditing(false);
    }
    setLoading(false);
  };

  // PUBLIC_INTERFACE
  const handleDelete = async () => {
    if (!editor.id) return;
    if (!window.confirm("Delete note? This cannot be undone.")) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.from("notes").delete().eq("id", editor.id);
    if (error) setError(error.message);
    else {
      await fetchNotes();
      setSelected(null);
      setEditor(EMPTY_NOTE);
      setEditing(false);
    }
    setLoading(false);
  };

  // PUBLIC_INTERFACE
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  // UI Components
  return (
    <div style={styles.wrapper}>
      {/* Sidebar (list/search) */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <h2 style={styles.logo}>Notes</h2>
          <button
            style={styles.addBtn}
            onClick={handleNew}
            title="Add new note"
            aria-label="Add note"
          >
            ＋
          </button>
        </div>
        <input
          type="text"
          placeholder="Search notes…"
          value={search}
          onChange={handleSearch}
          style={styles.search}
          disabled={loading}
        />
        <nav style={styles.noteList}>
          {loading && <div style={styles.loading}>Loading…</div>}
          {!loading && notes.length === 0 && (
            <div style={styles.empty}>No notes found</div>
          )}
          {!loading &&
            notes.map((note) => (
              <div
                key={note.id}
                style={
                  note.id === selected
                    ? { ...styles.noteItem, ...styles.noteItemActive }
                    : styles.noteItem
                }
                onClick={() => handleSelect(note)}
                tabIndex={0}
                role="button"
                aria-selected={note.id === selected}
              >
                <strong>{note.title || <em>[no title]</em>}</strong>
                <br />
                <span style={{ fontSize: 12, color: "#888" }}>
                  {note.updated_at?.split("T")[0]}
                </span>
              </div>
            ))}
        </nav>
      </aside>

      {/* Main area */}
      <main style={styles.main}>
        {/* Top Bar */}
        <div style={styles.topbar}>
          {selected && !editing && (
            <>
              <button style={styles.actionBtn} onClick={handleEdit}>Edit</button>
              <button style={{...styles.actionBtn, color: "#e74c3c"}} onClick={handleDelete}>Delete</button>
            </>
          )}
        </div>
        {/* Note editor / viewer */}
        <section style={styles.section}>
          {error && <div style={styles.error}>{error}</div>}
          {(editing || !selected) ? (
            <form
              style={styles.form}
              onSubmit={e => { e.preventDefault(); handleSave(); }}
              autoComplete="off"
            >
              <input
                name="title"
                type="text"
                placeholder="Title"
                value={editor.title}
                onChange={handleInput}
                required
                style={styles.titleInput}
                disabled={loading}
                autoFocus
                maxLength={100}
              />
              <textarea
                name="content"
                placeholder="Type your note here…"
                value={editor.content}
                onChange={handleInput}
                rows={12}
                style={styles.contentInput}
                disabled={loading}
                maxLength={3200}
              />
              <div style={styles.formBtns}>
                <button
                  type="submit"
                  disabled={loading}
                  style={styles.saveBtn}
                >
                  {editor.id ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <article style={styles.viewer}>
              <h2>{editor.title}</h2>
              <hr />
              <pre style={styles.viewerContent}>{editor.content}</pre>
              <small style={styles.viewerMeta}>
                Created: {editor.created_at?.split("T")[0]} | Updated: {editor.updated_at?.split("T")[0]}
              </small>
            </article>
          )}
        </section>
      </main>
    </div>
  );
}

export default NotesApp;

// --- Inline modern/minimal styles for layout ---
const styles = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontFamily: "system-ui, sans-serif",
  },
  sidebar: {
    width: 280,
    background: "var(--bg-secondary)",
    borderRight: "1px solid var(--border-color)",
    padding: "0 0 1rem 0",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    minHeight: "100vh",
    boxSizing: "border-box",
    transition: "background 0.25s",
  },
  sidebarTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontWeight: 700,
    padding: "1rem 1rem 0.5rem 1rem",
  },
  logo: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "1px",
    color: "var(--text-primary)",
    margin: 0,
  },
  addBtn: {
    fontSize: 28,
    color: "var(--button-bg)",
    background: "none",
    border: "none",
    cursor: "pointer",
    lineHeight: 1,
    padding: 0,
    margin: 0,
    width: 40,
    height: 40,
  },
  search: {
    margin: "0.5rem 1rem 0.5rem 1rem",
    padding: "8px 12px",
    width: "calc(100% - 2rem)",
    color: "var(--text-primary)",
    background: "#f1f3f6",
    border: "1px solid var(--border-color)",
    borderRadius: 8,
    outline: "none",
  },
  noteList: {
    flex: "1 1 0",
    overflowY: "auto",
    padding: "0 1rem",
    marginBottom: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  noteItem: {
    padding: "10px 8px",
    borderRadius: "7px",
    marginBottom: "3px",
    cursor: "pointer",
    background: "none",
    border: "none",
    textAlign: "left",
    transition: "background 0.12s",
    outline: "none",
  },
  noteItemActive: {
    background: "#eaf0fd",
  },
  empty: {
    textAlign: "center",
    color: "#bbb",
    padding: "1.7rem 0",
    fontStyle: "italic",
  },
  loading: {
    textAlign: "center",
    color: "#888",
    padding: "1.3rem 0",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "var(--bg-primary)",
    minHeight: "100vh",
  },
  topbar: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    background: "var(--bg-secondary)",
    borderBottom: "1px solid var(--border-color)",
    minHeight: 48,
    padding: "0 1.5rem",
    gap: 6,
  },
  section: {
    flex: 1,
    padding: "2rem 8vw",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    transition: "padding 0.36s",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    maxWidth: 600,
    margin: "0 auto",
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 600,
    padding: "10px",
    borderRadius: 5,
    border: "1px solid var(--border-color)",
    marginBottom: "8px",
    outline: "none",
  },
  contentInput: {
    fontSize: 16,
    borderRadius: 5,
    border: "1px solid var(--border-color)",
    padding: "12px",
    resize: "vertical",
    minHeight: 90,
    fontFamily: "inherit",
    marginBottom: "8px",
    outline: "none",
  },
  saveBtn: {
    background: "var(--button-bg)",
    color: "var(--button-text)",
    border: "none",
    borderRadius: 6,
    padding: "10px 24px",
    fontSize: 16,
    fontWeight: 700,
    marginRight: 8,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  cancelBtn: {
    background: "none",
    color: "#757575",
    border: "none",
    borderRadius: 6,
    padding: "10px 22px",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    marginLeft: 6,
    textDecoration: "underline",
    opacity: 0.8,
  },
  formBtns: {
    display: "flex",
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  error: {
    color: "#e74c3c",
    background: "#fff0f0",
    border: "1px solid #ebcccc",
    borderRadius: 6,
    padding: "8px 12px",
    marginBottom: 18,
    fontWeight: 600,
  },
  viewer: {
    background: "#f7fafe",
    border: "1px solid var(--border-color)",
    borderRadius: 7,
    padding: "1.2rem 1.2rem 0.9rem 1.2rem",
    maxWidth: 680,
    margin: "0 auto",
    minHeight: 220,
    color: "#232323",
    fontSize: 17,
    fontWeight: "normal",
    textAlign: "left",
  },
  viewerContent: {
    whiteSpace: "pre-line",
    margin: 0,
    paddingBottom: 8,
    fontFamily: "inherit",
    fontSize: 17,
  },
  viewerMeta: {
    color: "#888",
    fontSize: 12,
    display: "block",
    marginTop: 6,
  },
  actionBtn: {
    background: "none",
    color: "#1976d2",
    border: "none",
    borderRadius: 6,
    padding: "7px 18px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginLeft: 0,
    textDecoration: "underline",
  }
};
