"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  rookie: { id: string; full_name: string; position: string };
  existingNote: string | null;
  noteId: string | null;
  onClose: () => void;
  onSaved: (note: string, id: string) => void;
}

export default function QuickNoteModal({ userId, rookie, existingNote, noteId, onClose, onSaved }: Props) {
  const [note, setNote] = useState(existingNote ?? "");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSave() {
    if (!note.trim()) return;
    setSaving(true);
    const supabase = createClient();

    if (noteId) {
      const { data } = await supabase
        .from("rookie_notes")
        .update({ note: note.trim(), updated_at: new Date().toISOString() })
        .eq("id", noteId)
        .select("id")
        .single();
      onSaved(note.trim(), data?.id ?? noteId);
    } else {
      const { data } = await supabase
        .from("rookie_notes")
        .insert({ user_id: userId, rookie_player_id: rookie.id, note: note.trim() })
        .select("id")
        .single();
      if (data) onSaved(note.trim(), data.id);
    }

    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!noteId) return;
    const supabase = createClient();
    await supabase.from("rookie_notes").delete().eq("id", noteId);
    onSaved("", "");
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-1 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="p-5 border-b border-gray-800">
          <h3 className="font-semibold text-gray-100">Notes — {rookie.full_name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Private to you · Cmd+Enter to save</p>
        </div>
        <div className="p-5">
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={6}
            placeholder="Target bid, draft priority, injury concerns, scheme fit..."
            className="input resize-y text-sm leading-relaxed w-full"
          />
          <div className="flex items-center justify-between mt-3">
            <div>
              {noteId && (
                <button onClick={handleDelete} className="text-xs text-gray-600 hover:text-accent-red transition-colors">
                  Delete note
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving || !note.trim()} className="btn-primary text-sm">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
