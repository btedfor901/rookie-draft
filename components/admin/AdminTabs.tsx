"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import TeamsTab from "./TeamsTab";
import BankAdminTab from "./BankAdminTab";
import RookiesAdminTab from "./RookiesAdminTab";
import DraftAdminTab from "./DraftAdminTab";
import RosterAdminTab from "./RosterAdminTab";

const TABS = [
  { id: "teams",   label: "Teams & Users" },
  { id: "bank",    label: "Bank" },
  { id: "roster",  label: "Rosters" },
  { id: "rookies", label: "Rookie Pool" },
  { id: "draft",   label: "Draft" },
];

interface Props {
  teams: any[];
  users: any[];
  rookies: any[];
  picks: any[];
  results: any[];
}

export default function AdminTabs({ teams, users, rookies, picks, results }: Props) {
  const [active, setActive] = useState("teams");

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-surface-1 border border-gray-800 rounded-xl p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "tab flex-1 text-sm",
              active === tab.id ? "tab-active" : "tab-inactive"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {active === "teams"   && <TeamsTab teams={teams} users={users} />}
      {active === "bank"    && <BankAdminTab teams={teams} />}
      {active === "roster"  && <RosterAdminTab teams={teams} />}
      {active === "rookies" && <RookiesAdminTab rookies={rookies} teams={teams} />}
      {active === "draft"   && <DraftAdminTab picks={picks} results={results} rookies={rookies} teams={teams} />}
    </div>
  );
}
