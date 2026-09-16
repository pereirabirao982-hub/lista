import { Check, ChevronRight, CircleAlert, Gift, Heart, LoaderCircle, LockKeyhole, RefreshCcw, Send, Sparkles, Tags, UserRound } from 'lucide-react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/react';
import { AppShell } from '@/components/app-shell';
import {
  getGetAdminSummaryQueryKey,
  getGetEventQueryKey,
  getGetMyParticipationQueryKey,
  getListAdminParticipationsQueryKey,
  getListGiftsQueryKey,
  type Gift as GiftType,
  type ParticipationInput,
  useGetEvent,
  useGetMyParticipation,
  useListGifts,
  useReleaseMyGift,
  useUpsertMyParticipation,
} from '@workspace/api-client-react';

export default function UserPortalPage() {
  const { user } = useUser();
  const client = useQueryClient();
  const eventQuery = useGetEvent({ query: { queryKey: getGetEventQueryKey() } });
  const participationQuery = useGetMyParticipation({ query: { queryKey: getGetMyParticipationQueryKey() } });
  const giftsQuery = useListGifts({ query: { queryKey: getListGiftsQueryKey() } });
  const upsert = useUpsertMyParticipation();
  const release = useReleaseMyGift();
  const form = useForm<ParticipationInput>({ defaultValues: { attending: true, plusOne: false, note: '', giftIds: [] } });
  const [saved, setSaved] = useState(false);
  const participation = participationQuery.data;
  const participationStatus = (participationQuery.error as { status?: number } | null)?.status;

  useEffect(() => {
    if (participation) {
      form.reset({ attending: participation.attending, plusOne: participation.plusOne, note: participation.note || '', giftIds: participation.giftIds });
    }
  }, [participation]); // initialize the single form context from the server record

  const onSubmit = (values: ParticipationInput) => {
    setSaved(false);
    if (values.attending && values.giftIds.length < 1) {
      form.setError('giftIds', { type: 'min', message: 'Escolha pelo menos um presente.' });
      return;
    }
    const payload = { ...values, giftIds: values.attending ? values.giftIds : [], plusOne: values.attending ? values.plusOne : false, note: values.note?.trim() || null };
    upsert.mutate({ data: payload }, {
      onSuccess: async () => {
        setSaved(true);
        await Promise.all([
          client.invalidateQueries({ queryKey: getGetMyParticipationQueryKey() }),
          client.invalidateQueries({ queryKey: getListGiftsQueryKey() }),
          client.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() }),
          client.invalidateQueries({ queryKey: getListAdminParticipationsQueryKey() }),
          client.invalidateQueries({ queryKey: getGetEventQueryKey() }),
        ]);
      },
    });
  };

  const releaseGift = () => {
    if (!window.confirm('Quer liberar este presente para outra pessoa escolher?')) return;
    release.mutate(undefined, {
      onSuccess: async () => {
        form.setValue('giftIds', [], { shouldDirty: true });
        await Promise.all([client.invalidateQueries({ queryKey: getGetMyParticipationQueryKey() }), client.invalidateQueries({ queryKey: getListGiftsQueryKey() }), client.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() }), client.invalidateQueries({ queryKey: getListAdminParticipationsQueryKey() })]);
      },
    });
  };

  const loading = eventQuery.isLoading || participationQuery.isLoading || giftsQuery.isLoading;
  if (loading) return <AppShell><PortalSkeleton /></AppShell>;
  if (participationQuery.isError && participationStatus !== 404 || giftsQuery.isError || eventQuery.isError || !eventQuery.data) return <AppShell><QueryProblem retry={() => { eventQuery.refetch(); participationQuery.refetch(); giftsQuery.refetch(); }} /></AppShell>;

  const event = eventQuery.data;
  const gifts = giftsQuery.data || [];
  const firstName = user?.firstName || participation?.guestName?.split(' ')[0] || 'você';

  return (
    <AppShell>
      <div className="animate-rise-in">
        <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mono text-[10px] uppercase tracking-[.2em] text-accent">Seu convite</p><h1 className="serif mt-3 text-5xl font-semibold tracking-[-.04em] sm:text-6xl" data-testid="heading-portal">Oi, {firstName}.</h1><p className="mt-3 text-muted-foreground">Que bom ter você por perto para {event.title}.</p></div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-emerald-500" /> Convite pessoal</div>
        </div>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-9 grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-8">
              <AttendanceCard />
              <GiftPicker gifts={gifts} />
              <NoteField />
            </div>
            <aside className="space-y-5">
              <div className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg sm:p-7">
                <div className="flex items-start justify-between"><span className="mono text-[10px] uppercase tracking-[.18em] text-primary-foreground/55">Detalhes</span><Sparkles size={17} className="text-accent" /></div>
                <h2 className="serif mt-10 text-3xl font-semibold leading-tight">{event.title}</h2>
                <div className="mt-7 space-y-4 border-t border-primary-foreground/15 pt-5 text-sm"><p><strong className="block text-primary-foreground/55">Quando</strong><span data-testid="text-portal-event-date">{event.dateLabel}</span></p><p><strong className="block text-primary-foreground/55">Onde</strong><span data-testid="text-portal-event-location">{event.location}</span><span className="block text-primary-foreground/65">{event.address}</span></p><p><strong className="block text-primary-foreground/55">Confirme até</strong><span>{event.rsvpDeadline}</span></p></div>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6"><div className="flex items-center gap-2 text-sm font-bold"><LockKeyhole size={16} className="text-accent" /> Seu acesso é privado</div><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Só você e o anfitrião podem ver esta resposta. Nada é público.</p></div>
              {participation && participation.giftIds.length > 0 && <button type="button" onClick={releaseGift} disabled={release.isPending} className="flex w-full items-center justify-between rounded-2xl border border-destructive/25 px-5 py-4 text-left text-sm font-semibold text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50" data-testid="button-release-gift"><span>{release.isPending ? 'Liberando...' : 'Liberar meus presentes'}</span><RefreshCcw size={16} className={release.isPending ? 'animate-spin' : ''} /></button>}
            </aside>
            <div className="sticky bottom-3 z-20 -mx-2 flex flex-col items-stretch gap-3 rounded-2xl border border-border/80 bg-background/95 p-2 shadow-lg backdrop-blur sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none"><div className="flex items-center gap-3 px-2 sm:px-0">{saved && <span className="flex items-center gap-2 text-sm font-semibold text-emerald-700 animate-rise-in" data-testid="status-rsvp-saved"><Check size={17} /> Resposta salva com carinho</span>}{upsert.isError && <span className="flex items-center gap-2 text-sm font-semibold text-destructive" data-testid="status-rsvp-error"><CircleAlert size={17} /> Não foi possível salvar. Tente novamente.</span>}</div><button type="submit" disabled={upsert.isPending} className="group flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-accent px-7 py-3.5 text-sm font-bold text-primary shadow-md transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:rounded-full" data-testid="button-save-rsvp">{upsert.isPending ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />} {upsert.isPending ? 'Salvando...' : 'Salvar minha resposta'}<ChevronRight size={16} className="transition-transform group-hover:translate-x-1" /></button></div>
          </form>
        </FormProvider>
      </div>
    </AppShell>
  );
}

function AttendanceCard() {
  const { register, watch, setValue } = useFormContext<ParticipationInput>();
  const attending = watch('attending');
  return <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8"><div className="flex items-start justify-between"><div><p className="mono text-[10px] uppercase tracking-[.17em] text-accent">01 / Presença</p><h2 className="serif mt-3 text-3xl font-semibold">Você vem?</h2></div><UserRound size={20} className="text-primary/35" /></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><Choice selected={attending === true} onClick={() => setValue('attending', true, { shouldDirty: true })} title="Sim, estarei lá" detail="Pode contar comigo." testId="choice-attending-yes" /><Choice selected={attending === false} onClick={() => { setValue('attending', false, { shouldDirty: true }); setValue('plusOne', false); setValue('giftIds', []); }} title="Não vou conseguir" detail="Aviso para o anfitrião." testId="choice-attending-no" /></div><input type="hidden" {...register('attending')} /></section>;
}

function Choice({ selected, onClick, title, detail, testId }: { selected: boolean; onClick: () => void; title: string; detail: string; testId: string }) {
  return <button type="button" onClick={onClick} className={`flex min-h-[74px] items-center justify-between rounded-2xl border p-4 text-left transition-all duration-300 ${selected ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border hover:border-primary/40 hover:bg-secondary/40'}`} data-testid={testId}><span><strong className="block text-sm">{title}</strong><span className={`mt-1 block text-xs ${selected ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}>{detail}</span></span><span className={`grid size-8 place-items-center rounded-full border ${selected ? 'border-accent bg-accent text-primary' : 'border-border'}`}>{selected && <Check size={15} />}</span></button>;
}

function GiftPicker({ gifts }: { gifts: GiftType[] }) {
  const { watch, setValue, setError, clearErrors, formState: { errors } } = useFormContext<ParticipationInput>();
  const attending = watch('attending');
  const selectedIds = watch('giftIds') || [];
  const [category, setCategory] = useState('Todas');
  const categories = useMemo(() => ['Todas', ...Array.from(new Set(gifts.map((gift) => gift.categoryLabel)))], [gifts]);
  const visibleGifts = useMemo(() => category === 'Todas' ? gifts : gifts.filter((gift) => gift.categoryLabel === category), [category, gifts]);
  const availableUnits = gifts.reduce((total, gift) => total + Math.max(gift.availableQuantity, 0), 0);
  const toggleGift = (giftId: string) => {
    if (selectedIds.includes(giftId)) {
      setValue('giftIds', selectedIds.filter((id) => id !== giftId), { shouldDirty: true });
      return;
    }
    if (selectedIds.length >= 2) {
      setError('giftIds', { type: 'max', message: 'Você pode escolher no máximo dois presentes.' });
      return;
    }
    clearErrors('giftIds');
    setValue('giftIds', [...selectedIds, giftId], { shouldDirty: true });
  };
  return <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="mono text-[10px] uppercase tracking-[.17em] text-accent">02 / Um gesto</p><h2 className="serif mt-3 text-3xl font-semibold">Escolha seus presentes</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Escolha no mínimo 1 e no máximo 2 itens. A lista atualiza conforme as pessoas reservam.</p></div><div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end"><span className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-bold" data-testid="text-gift-available-count"><Gift size={14} /> {availableUnits} disponíveis</span><span className="text-xs font-semibold text-muted-foreground">{selectedIds.length} de 2 escolhidos</span></div></div>{errors.giftIds?.message && <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{errors.giftIds.message}</p>}{gifts.length === 0 ? <div className="mt-7 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground" data-testid="empty-gifts">A lista está sendo preparada pelo anfitrião.</div> : <><div className={`mt-6 flex gap-2 overflow-x-auto pb-1 ${!attending ? 'pointer-events-none opacity-45' : ''}`} role="tablist" aria-label="Categorias de presentes">{categories.map((item) => <button type="button" key={item} onClick={() => setCategory(item)} disabled={!attending} className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-xs font-bold transition-colors ${category === item ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary'}`} aria-pressed={category === item} data-testid={`button-gift-category-${item}`}><Tags size={13} />{item}</button>)}</div><div className={`mt-4 grid gap-3 sm:grid-cols-2 ${!attending ? 'pointer-events-none opacity-45' : ''}`}>{visibleGifts.map((gift) => { const selected = selectedIds.includes(gift.id); const unavailable = gift.availableQuantity <= 0 && !selected; return <button type="button" key={gift.id} disabled={unavailable || !attending} onClick={() => toggleGift(gift.id)} className={`group flex min-h-[122px] items-start justify-between rounded-2xl border p-4 text-left transition-all duration-300 ${selected ? 'border-accent bg-accent/12 ring-1 ring-accent' : unavailable ? 'cursor-not-allowed border-border bg-secondary/30' : 'border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm'}`} data-testid={`button-gift-${gift.id}`}><span className="min-w-0 pr-3"><span className="mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">{gift.categoryLabel}</span><strong className="mt-2 block break-words text-sm">{gift.name}</strong><span className={`mt-3 block text-xs ${unavailable ? 'font-semibold text-muted-foreground' : selected ? 'font-semibold text-accent-foreground' : 'text-muted-foreground'}`}>{selected ? 'Escolhido por você' : unavailable ? 'Esgotado' : `${gift.availableQuantity} de ${gift.quantity} disponíveis`}</span></span><span className={`grid size-8 shrink-0 place-items-center rounded-full border ${selected ? 'border-accent bg-accent text-primary' : unavailable ? 'border-border text-muted-foreground' : 'border-border text-primary/45'}`}>{selected ? <Check size={15} /> : <Heart size={14} />}</span></button>; })}</div>{visibleGifts.length === 0 && <p className="mt-5 text-sm text-muted-foreground">Nenhum presente nesta categoria.</p>}</>}{!attending && <p className="mt-5 text-xs font-semibold text-muted-foreground">A lista de presentes aparece quando você confirma que virá.</p>}</section>;
}

function NoteField() {
  const { register } = useFormContext<ParticipationInput>();
  const attending = useFormContext<ParticipationInput>().watch('attending');
  return <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8"><p className="mono text-[10px] uppercase tracking-[.17em] text-accent">03 / Mais um detalhe</p><div className="mt-6 grid gap-6 sm:grid-cols-[.8fr_1.2fr] sm:items-start"><label className={`flex min-h-14 items-center justify-between rounded-2xl border border-border p-4 ${!attending ? 'opacity-45' : ''}`}><span><strong className="block text-sm">Vou levar alguém</strong><span className="mt-1 block text-xs text-muted-foreground">Uma pessoa com você</span></span><input type="checkbox" disabled={!attending} {...register('plusOne')} className="size-5 accent-[hsl(var(--accent))]" data-testid="input-plus-one" /></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold">Quer deixar um recado?</span><textarea {...register('note')} maxLength={280} rows={4} placeholder="Alguma restrição, carinho ou observação..." className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/65 focus:border-accent" data-testid="input-rsvp-note" /></label></div><p className="mt-3 text-xs text-muted-foreground">Opcional. O anfitrião vai ler com atenção.</p></section>;
}

function PortalSkeleton() {
  return <div className="space-y-6"><div className="h-8 w-48 animate-pulse rounded bg-secondary" /><div className="h-16 w-96 max-w-full animate-pulse rounded bg-secondary" /><div className="grid gap-6 lg:grid-cols-2"><div className="h-64 animate-pulse rounded-3xl bg-secondary" /><div className="h-64 animate-pulse rounded-3xl bg-secondary" /></div></div>;
}

function QueryProblem({ retry }: { retry: () => void }) {
  return <div className="flex min-h-[60vh] flex-col items-center justify-center text-center"><CircleAlert size={30} className="text-accent" /><h1 className="serif mt-5 text-3xl font-semibold">O convite está descansando.</h1><p className="mt-2 max-w-sm text-sm text-muted-foreground">Não conseguimos carregar todos os detalhes agora.</p><button type="button" onClick={retry} className="mt-6 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground" data-testid="button-retry-portal"><RefreshCcw size={15} /> Tentar novamente</button></div>;
}