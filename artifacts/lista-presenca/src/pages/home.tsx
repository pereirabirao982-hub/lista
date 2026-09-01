import { ArrowDownRight, ArrowRight, CalendarDays, Check, Clock3, MapPin, UsersRound } from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'wouter';
import { useGetEvent, getGetEventQueryKey } from '@workspace/api-client-react';
import { BrandMark, SiteHeader } from '@/components/app-shell';

function EventSkeleton() {
  return <div className="mx-auto max-w-5xl space-y-5 px-6 py-24"><div className="h-4 w-28 animate-pulse rounded bg-secondary" /><div className="h-20 w-full max-w-2xl animate-pulse rounded-2xl bg-secondary" /><div className="h-5 w-80 animate-pulse rounded bg-secondary" /></div>;
}

export default function HomePage() {
  const eventQuery = useGetEvent({ query: { queryKey: getGetEventQueryKey() } });
  const event = eventQuery.data;

  if (eventQuery.isLoading) return <div className="min-h-[100dvh] bg-background"><SiteHeader /><EventSkeleton /></div>;
  if (eventQuery.isError || !event) return (
    <div className="min-h-[100dvh] bg-background"><SiteHeader /><div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-6 text-center"><p className="mono text-xs uppercase tracking-[.18em] text-accent">Convite indisponível</p><h1 className="serif mt-4 text-4xl">Não conseguimos abrir este encontro.</h1><p className="mt-4 text-muted-foreground">Tente novamente em instantes. Se o problema continuar, fale com quem enviou o convite.</p><button type="button" onClick={() => eventQuery.refetch()} className="mt-7 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground" data-testid="button-retry-event">Tentar de novo</button></div></div>
  );

  return (
    <div className="paper-grain min-h-[100dvh] overflow-hidden bg-background">
      <SiteHeader />
      <main>
        <section className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10 lg:pb-32 lg:pt-16">
          <div className="relative z-10 animate-rise-in">
            <div className="mb-8 flex items-center gap-3"><span className="h-px w-12 bg-accent" /><span className="mono text-[10px] font-bold uppercase tracking-[.22em] text-primary/60">Um convite para estar</span></div>
            <h1 className="serif max-w-3xl text-[clamp(3.6rem,8vw,7.6rem)] font-semibold leading-[.91] tracking-[-.06em] text-primary">A melhor parte<br /><em className="font-medium text-accent">é você vir.</em></h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-primary/65" data-testid="text-event-subtitle">{event.subtitle}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className="group flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform duration-300 hover:-translate-y-0.5" data-testid="link-guest-sign-up">Confirmar presença <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
              <Link href="/sign-in" className="rounded-full border border-primary/20 px-6 py-3.5 text-sm font-bold text-primary transition-colors hover:border-primary/50" data-testid="link-guest-sign-in">Já tenho acesso</Link>
            </div>
            <p className="mt-4 text-xs text-primary/45">Leva menos de dois minutos. E você escolhe um presente especial.</p>
          </div>
          <div className="relative min-h-[410px] animate-rise-in delay-2 sm:min-h-[480px]">
            <div className="absolute left-[9%] top-[6%] size-[74%] rounded-[48%_52%_55%_45%/42%_41%_59%_58%] bg-secondary/80 animate-float-slow" />
            <div className="absolute right-0 top-0 w-[80%] max-w-[410px] rounded-[2rem] border border-primary/10 bg-card p-7 shadow-xl sm:p-9">
              <div className="flex items-start justify-between"><span className="mono text-[10px] uppercase tracking-[.18em] text-accent">O encontro</span><span className="grid size-8 place-items-center rounded-full bg-accent/20 text-accent"><CalendarDays size={15} /></span></div>
              <p className="serif mt-14 text-4xl font-semibold leading-[.98]" data-testid="text-event-title">{event.title}</p>
              <div className="mt-12 space-y-5 border-t border-border pt-5 text-sm">
                <div className="flex gap-3"><CalendarDays size={17} className="mt-0.5 shrink-0 text-accent" /><div><p className="font-bold" data-testid="text-event-date">{event.dateLabel}</p><p className="text-muted-foreground">Uma data para guardar</p></div></div>
                <div className="flex gap-3"><MapPin size={17} className="mt-0.5 shrink-0 text-accent" /><div><p className="font-bold" data-testid="text-event-location">{event.location}</p><p className="text-muted-foreground">{event.address}</p></div></div>
              </div>
            </div>
            <div className="absolute bottom-3 left-0 flex w-[48%] max-w-[210px] -rotate-6 flex-col gap-3 rounded-2xl bg-accent p-5 text-primary shadow-lg sm:bottom-5 sm:left-4">
              <span className="grid size-9 place-items-center rounded-full border border-primary/20"><Check size={17} /></span><p className="serif text-2xl font-semibold leading-none">Vem com<br />calma.</p>
            </div>
          </div>
        </section>
        <section id="evento" className="border-y border-primary/10 bg-secondary/45">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-3 sm:px-8 lg:px-10 lg:py-16">
            <Detail icon={<Clock3 size={19} />} label="Confirme até" value={event.rsvpDeadline} />
            <Detail icon={<UsersRound size={19} />} label="Quem recebe" value={event.hostName} />
            <Detail icon={<MapPin size={19} />} label="Onde acontece" value={event.location} />
          </div>
        </section>
        <section id="como-funciona" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
            <div><p className="mono text-[10px] uppercase tracking-[.2em] text-accent">Com carinho, sem complicação</p><h2 className="serif mt-5 max-w-md text-5xl font-semibold leading-[.95] tracking-[-.04em]">Presença é o presente.</h2><p className="mt-6 max-w-sm leading-relaxed text-muted-foreground">Este espaço existe para deixar o combinado fácil — e o momento, mais presente.</p></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Step number="01" title="Entre no convite" text="Crie seu acesso em poucos segundos, com segurança." />
              <Step number="02" title="Diga se vem" text="Avise o anfitrião e conte se chega acompanhado." />
              <Step number="03" title="Escolha um gesto" text="Reserve um presente da lista. Um por pessoa." />
            </div>
          </div>
        </section>
        <footer className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-primary/10 px-5 py-8 text-sm text-primary/55 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><BrandMark compact /><span>Um espaço privado para celebrar junto.</span><span className="mono text-[10px] uppercase tracking-[.14em]">feito para este encontro</span></footer>
      </main>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-4"><span className="text-accent">{icon}</span><div><p className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{label}</p><p className="mt-1 font-semibold" data-testid={`text-detail-${label}`}>{value}</p></div></div>;
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="border-t-2 border-primary pt-4"><span className="mono text-xs text-accent">{number}</span><h3 className="serif mt-8 text-2xl font-semibold leading-tight">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p><ArrowDownRight size={18} className="mt-7 text-primary/40" /></div>;
}