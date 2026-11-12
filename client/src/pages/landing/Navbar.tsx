import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Home, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import { NAV_ANCHORS } from './data';
import { scrollToSection } from './scroll';

function LandingBrand({ onClick }: { onClick: () => void }) {
  return (
    <a
      href="#top"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="flex items-center gap-3 rounded-2xl focus-visible:outline-none"
    >
      <div className="clay-btn grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white">
        <Home className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg font-extrabold text-ink">HostelDesk</div>
        <div className="text-xs font-medium text-slate-600">Complaints &amp; rooms</div>
      </div>
    </a>
  );
}

export default function Navbar() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }, 30);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusables = [...drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )];
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      menuBtnRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  function handleBrandClick() {
    setOpen(false);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    if (window.location.hash) {
      window.history.pushState(null, '', window.location.pathname);
    }
  }

  function handleAnchor(id: string) {
    setOpen(false);
    scrollToSection(id);
  }

  const desktopAuth = loading ? (
    <div className="flex items-center gap-2" aria-label="Checking session" role="status">
      <span className="h-11 w-[88px] animate-pulse rounded-2xl bg-white/70 ring-1 ring-white" />
      <span className="h-11 w-[142px] animate-pulse rounded-2xl bg-indigo-200/70 ring-1 ring-white" />
    </div>
  ) : user ? (
    <Button onClick={() => navigate('/dashboard')} icon={<ArrowRight className="h-4 w-4" />}>
      Open your dashboard
    </Button>
  ) : (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={() => navigate('/login')}>
        Sign in
      </Button>
      <Button onClick={() => navigate('/register')}>
        Create account
      </Button>
    </div>
  );

  const mobileAuth = loading ? (
    <div className="space-y-2.5" aria-label="Checking session" role="status">
      <div className="h-11 w-full animate-pulse rounded-2xl bg-white/70 ring-1 ring-white" />
      <div className="h-11 w-full animate-pulse rounded-2xl bg-indigo-200/70 ring-1 ring-white" />
    </div>
  ) : user ? (
    <Button
      className="w-full"
      onClick={() => {
        setOpen(false);
        navigate('/dashboard');
      }}
      icon={<ArrowRight className="h-4 w-4" />}
    >
      Open your dashboard
    </Button>
  ) : (
    <div className="space-y-2.5">
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          setOpen(false);
          navigate('/login');
        }}
      >
        Sign in
      </Button>
      <Button
        className="w-full"
        onClick={() => {
          setOpen(false);
          navigate('/register');
        }}
      >
        Create account
      </Button>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6 lg:px-8">
        <div
          className={clsx(
            'mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-3xl border px-4 py-3 transition-all duration-200 sm:px-5',
            scrolled
              ? 'border-white bg-white/85 backdrop-blur-2xl shadow-[0_18px_40px_-16px_rgba(79,70,229,0.28)]'
              : 'border-white/70 bg-white/60 backdrop-blur-xl shadow-[0_10px_28px_-14px_rgba(79,70,229,0.18)]',
          )}
        >
          <LandingBrand onClick={handleBrandClick} />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_ANCHORS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleAnchor(item.id);
                }}
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">{desktopAuth}</div>

          <button
            ref={menuBtnRef}
            type="button"
            onClick={() => setOpen(true)}
            className="soft-btn rounded-2xl p-2.5 text-ink md:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="landing-mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
            className="fixed inset-0 z-50 md:hidden"
            id="landing-mobile-menu"
          >
            <motion.div
              className="fixed inset-0 bg-indigo-950/20 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.16 } }}
              onClick={() => setOpen(false)}
              data-testid="mobile-menu-backdrop"
            />
            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              className="glass-strong fixed inset-y-3 right-3 flex w-[calc(100%-1.5rem)] max-w-xs flex-col justify-between p-5"
              initial={{ x: 340 }}
              animate={{ x: 0 }}
              exit={{ x: 340, transition: { duration: 0.16, ease: 'easeIn' } }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-4">
                  <LandingBrand onClick={handleBrandClick} />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ink"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-2 flex flex-col gap-1" aria-label="Mobile navigation">
                  {NAV_ANCHORS.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleAnchor(item.id);
                      }}
                      className="rounded-2xl px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-white/80 hover:text-ink"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="border-t border-slate-200/70 pt-4">{mobileAuth}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

