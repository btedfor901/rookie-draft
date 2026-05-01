"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
  rookieId: string;
  isWatchlisted: boolean;
}

export default function WatchlistButton({ userId, rookieId, isWatchlisted: initialState }: Props) {
  const [watchlisted, setWatchlisted] = useState(initialState);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();

    if (watchlisted) {
      await supabase
        .from("watchlists")
        .delete()
        .eq("user_id", userId)
        .eq("rookie_player_id", rookieId);
    } else {
      await supabase
        .from("watchlists")
        .insert({ user_id: userId, rookie_player_id: rookieId });
    }

    setWatchlisted(!watchlisted);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
        watchlisted
          ? "bg-yellow-900/30 text-yellow-300 border-yellow-700 hover:bg-yellow-900/50"
          : "bg-surface-2 text-gray-400 border-gray-700 hover:text-yellow-300 hover:border-yellow-700"
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill={watchlisted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={watchlisted ? 0 : 1.5}
        className="w-4 h-4"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {watchlisted ? "Watchlisted" : "Add to Watchlist"}
    </button>
  );
}
