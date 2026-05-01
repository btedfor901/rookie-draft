"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@/types/database";

interface NavItem {
  label: string;
  href: string;
  badge?: number;
  isLive?: boolean;
  icon: React.ReactNode;
}

const NAV_ICONS = {
  dashboard: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0v7.5c0 .414.336.75.75.75h11.5a.75.75 0 00.75-.75v-7.5a.75.75 0 00-.75-.75H4.25a.75.75 0 00-.75.75z" clipRule="evenodd" />
    </svg>
  ),
  roster: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
    </svg>
  ),
  bank: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0zM1.75 14.5a.75.75 0 000 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 00-1.5 0v.784a.272.272 0 01-.35.25A49.043 49.043 0 001.75 14.5z" clipRule="evenodd" />
    </svg>
  ),
  league: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M.99 5.24A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25l.01 9.5A2.25 2.25 0 0116.76 17H3.26A2.272 2.272 0 011 14.74l-.01-9.5zm8.26 9.52v-.625a.75.75 0 00-.75-.75H3.25a.75.75 0 000 1.5H8.5v-.125zm1.5 0H16.75a.75.75 0 000-1.5H10.75v.125a.75.75 0 000 1.375zm-8.26-7.5a.75.75 0 00.75.75h13.5a.75.75 0 000-1.5H2.25a.75.75 0 00-.75.75z" clipRule="evenodd" />
    </svg>
  ),
  draftBoard: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1V10zm0 5.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01z" clipRule="evenodd" />
    </svg>
  ),
  draftRoom: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M16.364 3.636a.75.75 0 00-1.06 1.06 7.5 7.5 0 010 10.607.75.75 0 001.06 1.061 9 9 0 000-12.728zM4.697 4.697a.75.75 0 00-1.061-1.06 9 9 0 000 12.727.75.75 0 001.06-1.06 7.5 7.5 0 010-10.607zM12.475 6.525a.75.75 0 10-1.06 1.06 3.5 3.5 0 010 4.95.75.75 0 101.06 1.06 5 5 0 000-7.07zM7.525 7.585a.75.75 0 00-1.06-1.06 5 5 0 000 7.07.75.75 0 001.06-1.06 3.5 3.5 0 010-4.95zM10 9a1 1 0 100 2 1 1 0 000-2z" />
    </svg>
  ),
  watchlist: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  admin: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M8.34 1.804A1 1 0 019.32 1h1.36a1 1 0 01.98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 011.262.125l.962.962a1 1 0 01.125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 01.804.98v1.361a1 1 0 01-.804.98l-1.473.295a6.95 6.95 0 01-.587 1.416l.834 1.25a1 1 0 01-.125 1.262l-.962.962a1 1 0 01-1.262.125l-1.25-.834a6.953 6.953 0 01-1.416.587l-.294 1.473a1 1 0 01-.98.804H9.32a1 1 0 01-.98-.804l-.295-1.473a6.957 6.957 0 01-1.416-.587l-1.25.834a1 1 0 01-1.262-.125l-.962-.962a1 1 0 01-.125-1.262l.834-1.25a6.957 6.957 0 01-.587-1.416l-1.473-.294A1 1 0 011 10.68V9.32a1 1 0 01.804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 01.125-1.262l.962-.962A1 1 0 015.38 3.03l1.25.834a6.957 6.957 0 011.416-.587l.294-1.473zM13 10a3 3 0 11-6 0 3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  ),
};

interface SidebarProps {
  user: User;
  teamName?: string;
  watchlistCount?: number;
  isDraftLive?: boolean;
}

export default function Sidebar({ user, teamName, watchlistCount = 0, isDraftLive = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const managerNav: NavItem[] = [
    { label: "Dashboard",      href: "/dashboard",              icon: NAV_ICONS.dashboard },
    { label: "League Rosters", href: "/dashboard/league",       icon: NAV_ICONS.league },
    { label: "My Roster",      href: "/dashboard/roster",       icon: NAV_ICONS.roster },
    { label: "Bank",           href: "/dashboard/bank",         icon: NAV_ICONS.bank },
    { label: "Draft Board",    href: "/dashboard/draft-board",  icon: NAV_ICONS.draftBoard },
    { label: "Draft Room",     href: "/dashboard/draft-room",   icon: NAV_ICONS.draftRoom, isLive: isDraftLive },
    { label: "Watchlist",      href: "/dashboard/watchlist",    icon: NAV_ICONS.watchlist, badge: watchlistCount || undefined },
  ];

  const commissionerNav: NavItem[] = [
    { label: "Admin Panel", href: "/admin", icon: NAV_ICONS.admin },
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function NavLink({ item, isCommish }: { item: NavItem; isCommish?: boolean }) {
    const isActive =
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(item.href);

    const activeClass = isCommish
      ? "bg-yellow-900/20 text-yellow-300 border border-yellow-800"
      : "bg-brand/15 text-brand-light border border-brand/20";

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isActive ? activeClass : "text-gray-400 hover:text-gray-200 hover:bg-surface-2"
        )}
      >
        <span className={isActive ? (isCommish ? "text-yellow-400" : "text-brand-light") : "text-gray-500"}>
          {item.icon}
        </span>
        <span className="flex-1">{item.label}</span>
        {item.isLive && (
          <span className="flex items-center gap-1 text-xs font-bold text-accent-green">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            LIVE
          </span>
        )}
        {item.badge !== undefined && item.badge > 0 && (
          <span className={cn(
            "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold",
            isActive ? "bg-brand text-white" : "bg-yellow-900/60 text-yellow-300"
          )}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-surface-1 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-brand-light">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-bold text-gray-100 text-sm">Rookie Draft</div>
            {teamName && <div className="text-xs text-gray-400 truncate">{teamName}</div>}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 pt-2 pb-1">
          My Team
        </p>
        {managerNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {user.role === "commissioner" && (
          <>
            <div className="border-t border-gray-800 my-3" />
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 pb-1">
              Commissioner
            </p>
            {commissionerNav.map((item) => (
              <NavLink key={item.href} item={item} isCommish />
            ))}
          </>
        )}
      </nav>

      {/* User / sign out */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-light">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-200 truncate">{user.full_name}</div>
            <div className="text-xs text-gray-500 capitalize">{user.role}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-gray-600 hover:text-gray-300 transition-colors"
            title="Sign out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
