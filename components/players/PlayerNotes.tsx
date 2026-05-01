"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  rookieId: string;
  existingNote: string | null;
  noteId: string | null;
}

type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";

export default function PlayerNotes({ userId, rookieId, existingNote, noteId: initialNoteId }: Props) {
  const [note, setNote] = useState(existingNote ?? "");
  const [noteId, setNoteId] = useState(initialNoteId);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(existingNote ?? "");

  // Debounced auto-save — fires 800ms after the user stops typing
  useEffect(() => {
    if (note === lastSavedRef.current) return;
    setSaveState("unsaved");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSave(note);
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  async function doSave(text: string) {
    setSaveState("saving");
    const supabase = createClient();

    try {
      if (noteId) {
        await supabase
          .from("rookie_notes")
          .update({ note: text, updated_at: new Date().toISOString() })
          .eq("id", noteId);
      } else {
        if (!text.trim()) { setSaveState("idle"); return; }
        const { data } = await supabase
          .from("rookie_notes")
          .insert({ user_id: userId, rookie_player_id: rookieId, note: text })
          .select("id")
          .single();
        if (data) setNoteId(data.id);
      }
      lastSavedRef.current = text;
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
    }
  }

  async function handleDelete() {
    if (!noteId) return;
    const supabase = createClient();
    await supabase.from("rookie_notes").delete().eq("id", noteId);
    setNote("");
    setNoteId(null);
    lastSavedRef.current = "";
    setSaveState("idle");
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={6}
          placeholder="Add your private scouting notes, target bid range, draft priority, injury concerns..."
          className="input resize-y text-sm leading-relaxed w-full pr-24"
        />
        {/* Save state indicator — top-right corner of textarea */}
        <div className="absolute top-3 right-3 text-xs pointer-events-none">
          {saveState === "saving" && (
            <span className="text-gray-500 flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving
            </span>
          )}
          {saveState === "saved" && <span className="text-accent-green">✓ Saved</span>}
          {saveState === "unsaved" && <span className="text-gray-600">Unsaved</span>}
          {saveState === "error" && <span className="text-accent-red">Error</span>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Manual save button — useful if they want to force-save immediately */}
          <button
            onClick={() => { if (debounceRef.current) clearTimeout(debounceRef.current); doSave(note); }}
            disabled={saveState === "saving" || saveState === "saved" || note === lastSavedRef.current}
            className="btn-primary text-sm px-4"
          >
            {saveState === "saving" ? "Saving..." : "Save"}
          </button>
          {noteId && (
            <button
              onClick={handleDelete}
              className="text-xs text-gray-600 hover:text-accent-red transition-colors"
            >
              Delete note
            </button>
          )}
        </div>
        <p className="text-xs text-gray-600">
          Auto-saves as you type · Private to you
        </p>
      </div>
    </div>
  );
}
