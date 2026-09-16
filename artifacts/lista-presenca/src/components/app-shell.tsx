import { CalendarDays, LogOut, Menu, ShieldCheck, Sparkles, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import { ThemeToggle } from '@/components/theme-toggle';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-4" data-testid="link-brand-home">
      <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground shadow-sm transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105">
        <span className="serif text-2xl font-medium leading-none">L</span>
      </span>
      {!compact && (
        <span className="leading-none text-primary">
          <span className="block text-[13px] font-medium uppercase tracking-[0.1em] opacity-80">Lista de</span>
          <span className="serif block text-[22px] italic tracking-tight">Presença</span>
        </span>
      )}
    </Link>
  );
}

export function SiteHeader() {
  const { isSignedIn } = useUser();
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10 lg:px-12 lg:py-8">
      <BrandMark />
      <nav className="hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Navegação principal">
        <a href="#como-funciona" className="text-primary/70 transition-colors hover:text-primary" data-testid="link-how-it-works">Como funciona</a>
        <a href="#evento" className="text-primary/70 transition-colors hover:text-primary" data-testid="link-event-details">O encontro</a>
        <ThemeToggle compact />
        {isSignedIn ? (
          <Link href="/user-portal" className="rounded-full border border-primary/20 px-5 py-2.5 text-primary transition-all hover:border-primary/50 hover:bg-primary/5" data-testid="link-header-portal">Meu convite</Link>
        ) : (
          <Link href="/sign-in" className="rounded-full border border-primary/20 px-5 py-2.5 text-primary transition-all hover:border-primary/50 hover:bg-primary/5" data-testid="link-header-sign-in">Entrar</Link>
        )}
      </nav>
      <div className="flex items-center gap-2 md:hidden">
        <ThemeToggle compact />
        <MobileMenu isSignedIn={Boolean(isSignedIn)} />
      </div>
    </header>
  );
}

function MobileMenu({ isSignedIn }: { isSignedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="grid size-12 place-items-center rounded-full border border-primary/15 bg-background shadow-sm transition-colors hover:bg-secondary" aria-label={open ? 'Fechar menu' : 'Abrir menu'} data-testid="button-open-mobile-menu">
        {open ? <X size={20} className="text-primary" /> : <Menu size={20} className="text-primary" />}
      </button>
      {open && (
        <div className="absolute right-0 top-16 z-30 w-[min(16rem,calc(100vw-3rem))] rounded-2xl border border-border bg-card p-3 shadow-xl animate-fade-in-up">
          <a href="#como-funciona" onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-xl px-4 text-sm font-medium text-primary hover:bg-secondary transition-colors" data-testid="link-mobile-how-it-works">Como funciona</a>
          <a href="#evento" onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-xl px-4 text-sm font-medium text-primary hover:bg-secondary transition-colors" data-testid="link-mobile-event-details">O encontro</a>
          <div className="my-1 border-t border-border" />
          <Link href={isSignedIn ? "/user-portal" : "/sign-in"} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-xl px-4 text-sm font-medium text-accent hover:bg-accent/10 transition-colors" data-testid="link-mobile-auth">{isSignedIn ? 'Meu convite' : 'Entrar'}</Link>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [navOpen, setNavOpen] = useState(false);
  const name = user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Convidado';
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="paper-grain min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-sidebar-border bg-sidebar px-6 py-8 text-sidebar-foreground transition-transform duration-500 cubic-bezier(0.16,1,0.3,1) lg:translate-x-0 ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <BrandMark />
          <button type="button" className="grid size-10 place-items-center rounded-full text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden" onClick={() => setNavOpen(false)} aria-label="Fechar menu" data-testid="button-close-sidebar"><X size={20} /></button>
        </div>

        <div className="mt-16">
          <p className="mono mb-4 px-3 text-[11px] font-medium uppercase tracking-[0.15em] text-sidebar-foreground/50">Espaço Privado</p>
          <nav className="space-y-1.5" aria-label="Navegação do espaço">
            <Link href="/user-portal" className={`flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-medium transition-all ${!admin ? 'bg-sidebar-accent text-sidebar-foreground shadow-sm' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`} data-testid="link-sidebar-portal">
              <Sparkles size={18} className={!admin ? 'text-accent' : 'opacity-70'} />
              Meu convite
            </Link>
            {admin && (
              <Link href="/admin" className={`flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-medium transition-all ${admin ? 'bg-sidebar-accent text-sidebar-foreground shadow-sm' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`} data-testid="link-sidebar-admin">
                <ShieldCheck size={18} className={admin ? 'text-accent' : 'opacity-70'} />
                Visão do anfitrião
              </Link>
            )}
          </nav>
        </div>

        <div className="mt-auto pt-8">
          <div className="mb-5 px-2">
            <ThemeToggle />
          </div>
          <div className="editorial-rule mb-6" />
          <div className="flex items-center gap-4 px-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sidebar-primary font-serif font-medium text-sidebar-primary-foreground shadow-sm">{initials}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" data-testid="text-sidebar-user">{name}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">Convidado Especial</p>
            </div>
          </div>
          <button type="button" onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' })} className="mt-6 flex w-full items-center gap-3.5 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:border-sidebar-border hover:bg-sidebar-accent/30 hover:text-sidebar-foreground" data-testid="button-sign-out">
            <LogOut size={18} className="opacity-70" /> Sair
          </button>
        </div>
      </aside>

      {navOpen && <button type="button" className="fixed inset-0 z-30 bg-primary/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden" onClick={() => setNavOpen(false)} aria-label="Fechar navegação" data-testid="button-close-nav-overlay" />}

      <main className="min-h-[100dvh] lg:pl-[280px]">
        <div className="mx-auto max-w-[1200px] px-6 py-6 sm:px-10 lg:px-16 lg:py-12">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <BrandMark compact />
            <div className="flex items-center gap-2">
              <ThemeToggle compact />
              <button type="button" className="grid size-12 place-items-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-secondary" onClick={() => setNavOpen(true)} aria-label="Abrir navegação" data-testid="button-open-sidebar">
                <Menu size={20} className="text-primary" />
              </button>
            </div>
          </div>
          <div className="mb-10 hidden items-center gap-2.5 text-sm font-medium text-muted-foreground lg:flex">
            <CalendarDays size={16} /> Seu espaço de presença
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
