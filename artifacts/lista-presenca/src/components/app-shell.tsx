import { CalendarDays, LogOut, Menu, ShieldCheck, Sparkles, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link } from 'wouter';
import { useClerk, useUser } from '@clerk/react';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" data-testid="link-brand-home">
      <span className="grid size-10 place-items-center rounded-xl bg-accent text-primary shadow-sm transition-transform duration-300 group-hover:-rotate-3">
        <span className="serif text-2xl font-semibold leading-none">L</span>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-bold tracking-[-.02em]">Lista de</span>
          <span className="serif block text-[19px] italic">Presença</span>
        </span>
      )}
    </Link>
  );
}

export function SiteHeader() {
  const { isSignedIn } = useUser();
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10 lg:py-6">
      <BrandMark />
      <nav className="hidden items-center gap-7 text-sm font-semibold md:flex" aria-label="Navegação principal">
        <a href="#como-funciona" className="text-primary/65 transition-colors hover:text-primary" data-testid="link-how-it-works">Como funciona</a>
        <a href="#evento" className="text-primary/65 transition-colors hover:text-primary" data-testid="link-event-details">O encontro</a>
        {isSignedIn ? (
          <Link href="/user-portal" className="rounded-full border border-primary/15 px-4 py-2 text-primary transition-colors hover:border-primary/35" data-testid="link-header-portal">Meu convite</Link>
        ) : (
          <Link href="/sign-in" className="rounded-full border border-primary/15 px-4 py-2 text-primary transition-colors hover:border-primary/35" data-testid="link-header-sign-in">Entrar</Link>
        )}
      </nav>
      <div className="md:hidden">
        <MobileMenu isSignedIn={Boolean(isSignedIn)} />
      </div>
    </header>
  );
}

function MobileMenu({ isSignedIn }: { isSignedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="grid size-11 place-items-center rounded-full border border-primary/15 bg-card/60" aria-label={open ? 'Fechar menu' : 'Abrir menu'} data-testid="button-open-mobile-menu">
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && (
          <div className="absolute right-0 top-14 z-30 w-[min(15rem,calc(100vw-2.5rem))] rounded-2xl border border-border bg-card p-2 shadow-xl animate-rise-in">
          <a href="#como-funciona" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold hover:bg-secondary" data-testid="link-mobile-how-it-works">Como funciona</a>
          <a href="#evento" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold hover:bg-secondary" data-testid="link-mobile-event-details">O encontro</a>
          <Link href={isSignedIn ? "/user-portal" : "/sign-in"} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold hover:bg-secondary" data-testid="link-mobile-auth">{isSignedIn ? 'Meu convite' : 'Entrar'}</Link>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [navOpen, setNavOpen] = useState(false);
  const name = user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'convidado';
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="paper-grain min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-sidebar px-5 py-6 text-sidebar-foreground transition-transform duration-300 lg:translate-x-0 ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <BrandMark />
          <button type="button" className="grid size-9 place-items-center rounded-full text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden" onClick={() => setNavOpen(false)} aria-label="Fechar menu" data-testid="button-close-sidebar"><X size={18} /></button>
        </div>
        <div className="mt-14">
          <p className="mono mb-3 px-2 text-[10px] uppercase tracking-[.2em] text-sidebar-foreground/45">Espaço privado</p>
          <nav className="space-y-1" aria-label="Navegação do espaço">
            <Link href="/user-portal" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${!admin ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent'}`} data-testid="link-sidebar-portal">
              <Sparkles size={17} /> Meu convite
            </Link>
            {admin && (
              <Link href="/admin" className="flex items-center gap-3 rounded-xl bg-sidebar-accent px-3 py-3 text-sm font-semibold" data-testid="link-sidebar-admin">
                <ShieldCheck size={17} /> Visão do anfitrião
              </Link>
            )}
          </nav>
        </div>
        <div className="mt-auto">
          <div className="mb-4 h-px bg-sidebar-border" />
          <div className="flex items-center gap-3 px-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sidebar-primary font-bold text-primary">{initials}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" data-testid="text-sidebar-user">{name}</p>
              <p className="truncate text-xs text-sidebar-foreground/50">Convidado</p>
            </div>
          </div>
          <button type="button" onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' })} className="mt-5 flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground" data-testid="button-sign-out">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>
      {navOpen && <button type="button" className="fixed inset-0 z-30 bg-primary/25 lg:hidden" onClick={() => setNavOpen(false)} aria-label="Fechar navegação" data-testid="button-close-nav-overlay" />}
      <main className="min-h-[100dvh] lg:pl-[248px]">
        <div className="mx-auto max-w-[1440px] px-5 py-5 sm:px-8 lg:px-12 lg:py-8">
          <div className="mb-7 flex items-center justify-between lg:hidden">
            <BrandMark compact />
            <button type="button" className="grid size-10 place-items-center rounded-full border border-border bg-card" onClick={() => setNavOpen(true)} aria-label="Abrir navegação" data-testid="button-open-sidebar"><Menu size={18} /></button>
          </div>
          <div className="mb-8 hidden items-center gap-2 text-xs font-semibold text-muted-foreground lg:flex"><CalendarDays size={14} /> Seu espaço de presença</div>
          {children}
        </div>
      </main>
    </div>
  );
}