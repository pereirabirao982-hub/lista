import { ArrowRight, CalendarDays, Check, Clock3, MapPin, UsersRound, Heart } from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'wouter';
import { useGetEvent, getGetEventQueryKey } from '@workspace/api-client-react';
import { BrandMark, SiteHeader } from '@/components/app-shell';

function EventSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-32 text-center">
      <div className="mx-auto h-4 w-32 animate-pulse rounded bg-secondary" />
      <div className="mx-auto h-24 w-full max-w-3xl animate-pulse rounded-2xl bg-secondary" />
      <div className="mx-auto h-6 w-96 animate-pulse rounded bg-secondary" />
    </div>
  );
}

export default function HomePage() {
  const eventQuery = useGetEvent({ query: { queryKey: getGetEventQueryKey() } });
  const event = eventQuery.data;

  if (eventQuery.isLoading) return <div className="min-h-[100dvh] bg-background paper-grain"><SiteHeader /><EventSkeleton /></div>;

  if (eventQuery.isError || !event) return (
    <div className="min-h-[100dvh] bg-background paper-grain">
      <SiteHeader />
      <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-6 text-center animate-fade-in-up">
        <p className="mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Convite indisponível</p>
        <h1 className="serif mt-6 text-4xl sm:text-5xl">Não conseguimos abrir este encontro.</h1>
        <p className="mt-6 text-lg text-muted-foreground">Tente novamente em instantes. Se o problema continuar, fale com quem enviou o convite.</p>
        <button type="button" onClick={() => eventQuery.refetch()} className="mt-10 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5" data-testid="button-retry-event">Tentar de novo</button>
      </div>
    </div>
  );

  return (
    <div className="paper-grain min-h-[100dvh] overflow-hidden bg-background">
      <SiteHeader />
      <main>
        <section className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-10 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-12 lg:pb-32 lg:pt-20">
          <div className="relative z-10 animate-fade-in-up">
            <div className="mb-8 flex items-center gap-4">
              <span className="h-px w-16 bg-accent opacity-60" />
              <span className="mono text-[11px] font-medium uppercase tracking-[0.2em] text-primary/70">Um convite para estar</span>
            </div>
            <h1 className="serif text-[clamp(3.5rem,8vw,6.5rem)] leading-[0.95] text-primary">
              A melhor parte<br />
              <em className="font-medium text-accent block mt-2">é você vir.</em>
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-primary/80 sm:text-xl font-light" data-testid="text-event-subtitle">
              {event.subtitle}
            </p>
            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Link href="/sign-up" className="group flex min-h-14 items-center justify-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:bg-primary/90" data-testid="link-guest-sign-up">
                Confirmar presença
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
              <Link href="/sign-in" className="flex min-h-14 items-center justify-center rounded-full border border-primary/20 bg-card px-8 py-4 text-sm font-medium text-primary transition-all duration-300 hover:border-primary/50 hover:bg-secondary" data-testid="link-guest-sign-in">
                Já tenho acesso
              </Link>
            </div>
            <p className="mt-6 text-sm text-primary/50 font-medium">Leva menos de dois minutos. E você escolhe um presente especial.</p>
          </div>

          <div className="relative min-h-[400px] animate-fade-in-up delay-200 sm:min-h-[550px] lg:mt-0 mt-8">
            <div className="absolute left-[5%] top-[5%] size-[80%] rounded-full bg-secondary/80 mix-blend-multiply blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute right-[5%] bottom-[5%] size-[60%] rounded-full bg-accent/10 mix-blend-multiply blur-3xl animate-pulse" style={{ animationDuration: '12s' }} />

            <div className="absolute right-0 top-4 w-[90%] max-w-[440px] rounded-[2.5rem] border border-border/60 bg-card/90 p-8 shadow-2xl backdrop-blur-sm sm:p-12">
              <div className="flex items-start justify-between">
                <span className="mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">O encontro</span>
                <span className="grid size-10 place-items-center rounded-full bg-accent/15 text-accent"><CalendarDays size={18} /></span>
              </div>
               <p className="serif mt-12 text-3xl leading-[1.1] text-primary sm:mt-16 sm:text-4xl" data-testid="text-event-title">{event.title}</p>
               <div className="editorial-rule mt-10" />
               <div className="mt-8 space-y-6 text-sm sm:mt-10">
                <div className="flex gap-4">
                  <CalendarDays size={20} className="mt-0.5 shrink-0 text-accent" />
                  <div>
                    <p className="font-medium text-primary text-base" data-testid="text-event-date">{event.dateLabel}</p>
                    <p className="mt-1 text-muted-foreground">Uma data para guardar</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <MapPin size={20} className="mt-0.5 shrink-0 text-accent" />
                  <div>
                    <p className="font-medium text-primary text-base" data-testid="text-event-location">{event.location}</p>
                    <p className="mt-1 text-muted-foreground">{event.address}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 left-0 flex w-[55%] max-w-[240px] -rotate-3 flex-col gap-4 rounded-[2rem] bg-accent p-6 text-accent-foreground shadow-2xl sm:p-8 hover:rotate-0 transition-transform duration-500">
              <span className="grid size-10 place-items-center rounded-full border border-accent-foreground/30 bg-accent-foreground/10">
                <Heart size={18} className="fill-current" />
              </span>
              <p className="serif text-3xl leading-tight">Vem com<br />calma.</p>
            </div>
          </div>
        </section>

        <section id="evento" className="border-y border-border bg-secondary/50">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-3 sm:px-10 lg:px-12 lg:py-24">
            <Detail icon={<Clock3 size={22} />} label="Confirme até" value={event.rsvpDeadline} />
            <Detail icon={<UsersRound size={22} />} label="Quem recebe" value={event.hostName} />
            <Detail icon={<MapPin size={22} />} label="Onde acontece" value={event.location} />
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-12 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <div className="animate-fade-in-up">
              <p className="mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Com carinho, sem complicação</p>
              <h2 className="serif mt-6 max-w-md text-5xl leading-[1.05] sm:text-6xl">Presença é<br/>o presente.</h2>
              <p className="mt-8 max-w-sm text-lg leading-relaxed text-muted-foreground">
                Este espaço existe para deixar o combinado fácil — e o momento, mais presente. Um fluxo simples para confirmar sua vinda.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:gap-10">
              <Step number="01" title="Entre no convite" text="Crie seu acesso em poucos segundos, com segurança. Seu espaço é privado." delay="delay-100" />
              <Step number="02" title="Diga se vem" text="Avise o anfitrião e conte se chega acompanhado. Tudo muito rápido." delay="delay-200" />
              <Step number="03" title="Escolha um gesto" text="Reserve um presente da lista. Um por pessoa. Atualizado em tempo real." delay="delay-300" />
            </div>
          </div>
        </section>

        <footer className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-border px-6 py-10 text-sm text-primary/60 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-12">
          <BrandMark compact />
          <span className="font-medium">Um espaço privado para celebrar junto.</span>
          <span className="mono text-[10px] font-medium uppercase tracking-[0.2em] opacity-60">Feito para este encontro</span>
        </footer>
      </main>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-5">
      <span className="mt-1 text-accent">{icon}</span>
      <div>
        <p className="mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-lg font-medium text-primary" data-testid={`text-detail-${label}`}>{value}</p>
      </div>
    </div>
  );
}

function Step({ number, title, text, delay }: { number: string; title: string; text: string; delay: string }) {
  return (
    <div className={`border-t border-primary/20 pt-6 animate-fade-in-up ${delay}`}>
      <span className="mono text-[13px] font-medium text-accent">{number}</span>
      <h3 className="serif mt-6 text-2xl text-primary">{title}</h3>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
