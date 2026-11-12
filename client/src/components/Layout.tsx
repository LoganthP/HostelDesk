import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3, BedDouble, Building2, ClipboardList, GraduationCap, Home, LayoutDashboard, LogOut, Menu, PlusCircle, Wrench, X,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABEL } from '../lib/constants';
import type { Role } from '../lib/types';

const NAV: Record<Role, { to: string; label: string; icon: LucideIcon }[]> = {
  student: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/my-room', label: 'My room', icon: BedDouble },
    { to: '/complaints/new', label: 'Report an issue', icon: PlusCircle },
    { to: '/complaints', label: 'My complaints', icon: ClipboardList },
  ],
  warden: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/complaints', label: 'Complaints', icon: ClipboardList },
    { to: '/rooms', label: 'Rooms & beds', icon: Building2 },
    { to: '/students', label: 'Students', icon: GraduationCap },
    { to: '/staff', label: 'Staff', icon: Wrench },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ],
  maintenance: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/complaints', label: 'My jobs', icon: ClipboardList },
  ],
};

export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-[#F4F2FF] via-[#EEF6FF] to-[#FFF4F8]" />
      <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] animate-drift rounded-full bg-violet-300/50 blur-3xl" />
      <div className="absolute -right-24 top-1/4 h-[24rem] w-[24rem] animate-drift-slow rounded-full bg-cyan-200/60 blur-3xl" />
      <div className="absolute bottom-[-8rem] left-1/3 h-[26rem] w-[26rem] animate-drift rounded-full bg-pink-200/50 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-64 w-64 animate-drift-slow rounded-full bg-amber-100/70 blur-3xl" />
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="clay-btn grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white">
        <Home className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg font-extrabold text-ink">HostelDesk</div>
        <div className="text-xs font-medium text-slate-500">Complaints & rooms</div>
      </div>
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  // An explicit sign-out starts fresh: the next person to sign in lands on their own overview,
  // not on the page the previous user had open.
  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };
  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <Brand />
      <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
        {NAV[user.role].map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/complaints'}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                isActive ? 'text-indigo-700' : 'text-slate-600 hover:bg-white/60 hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="nav-active" className="clay-tile absolute inset-0 rounded-2xl bg-white" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                <Icon className="relative h-[18px] w-[18px]" />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="rounded-3xl bg-white/60 p-3 ring-1 ring-white">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-200 to-violet-200 font-display font-bold text-ink">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-ink">{user.name}</div>
            <div className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</div>
          </div>
          <button onClick={() => void signOut()} className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600" title="Sign out" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen">
      <Backdrop />
      <aside className="glass fixed inset-y-3 left-3 z-30 hidden w-64 rounded-[28px] lg:block">
        <Sidebar />
      </aside>

      <header className="glass sticky top-0 z-30 flex items-center justify-between rounded-none rounded-b-3xl px-4 py-3 lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} className="soft-btn rounded-2xl p-2.5" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-indigo-950/20 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="glass-strong fixed inset-y-3 left-3 z-50 w-72 lg:hidden"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <button onClick={() => setOpen(false)} className="absolute right-4 top-5 rounded-xl p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
              <Sidebar onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="px-4 pb-16 pt-6 sm:px-6 lg:pl-[18.5rem] lg:pr-8 lg:pt-8">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mx-auto max-w-6xl">
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
