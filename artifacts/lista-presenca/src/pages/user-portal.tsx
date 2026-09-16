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
  }, [participation, form]);

  const onSubmit = (values: ParticipationInput) => {
    setSaved(false);
    if (values.attending && values.giftIds.length < 1) {
      form.setError('giftIds', { type: 'min', message: 'Escolha pelo menos um presente para confirmar.' });
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
        setTimeout(() => setSaved(false), 5000);
      },
    });
  };

  const releaseGift = () => {
    if (!window.confirm('Quer liberar este presente para outra pessoa escolher?')) return;
    release.mutate(undefined, {
      onSuccess: async () => {
        form.setValue('giftIds', [], { shouldDirty: true });
        await Promise.all([
          client.invalidateQueries({ queryKey: getGetMyParticipationQueryKey() }),
          client.invalidateQueries({ queryKey: getListGiftsQueryKey() }),
          client.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() }),
          client.invalidateQueries({ queryKey: getListAdminParticipationsQueryKey() })
        ]);
      },
    });
  };

  const loading = eventQuery.isLoading || participationQuery.isLoading || giftsQuery.isLoading;
  if (loading) return <AppShell><PortalSkeleton /></AppShell>;
  if ((participationQuery.isError && participationStatus !== 404) || giftsQuery.isError || eventQuery.isError || !eventQuery.data) return <AppShell><QueryProblem retry={() => { eventQuery.refetch(); participationQuery.refetch(); giftsQuery.refetch(); }} /></AppShell>;

  const event = eventQuery.data;
  const gifts = giftsQuery.data || [];
  const firstName = user?.firstName || participation?.guestName?.split(' ')[0] || 'você';

  return (
    <AppShell>
      <div className="animate-fade-in-up">
        <div className="flex flex-col gap-6 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Seu convite</p>
            <h1 className="serif mt-4 text-5xl tracking-tight sm:text-6xl text-primary" data-testid="heading-portal">Oi, {firstName}.</h1>
            <p className="mt-4 text-lg text-muted-foreground">Que bom ter você por perto para {event.title}.</p>
          </div>
          <div className="flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-primary shadow-sm">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Convite pessoal
          </div>
        </div>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-12 grid gap-10 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-10">
              <AttendanceCard />
              <GiftPicker gifts={gifts} />
              <NoteField />
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl bg-primary p-8 text-primary-foreground shadow-xl sm:p-10 relative overflow-hidden group">
                <div className="absolute right-0 top-0 size-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 transition-transform duration-700 group-hover:scale-150" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <span className="mono text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground/60">Detalhes</span>
                    <Sparkles size={20} className="text-accent" />
                  </div>
                  <h2 className="serif mt-12 text-4xl leading-[1.1]">{event.title}</h2>
                  <div className="editorial-rule mt-8 opacity-20" />
                  <div className="mt-8 space-y-5 text-sm">
                    <p>
                      <strong className="block text-primary-foreground/60 font-medium mb-1">Quando</strong>
                      <span className="text-base" data-testid="text-portal-event-date">{event.dateLabel}</span>
                    </p>
                    <p>
                      <strong className="block text-primary-foreground/60 font-medium mb-1">Onde</strong>
                      <span className="text-base block" data-testid="text-portal-event-location">{event.location}</span>
                      <span className="block text-primary-foreground/70 mt-0.5">{event.address}</span>
                    </p>
                    <p>
                      <strong className="block text-primary-foreground/60 font-medium mb-1">Confirme até</strong>
                      <span className="text-base">{event.rsvpDeadline}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                <div className="flex items-center gap-3 text-sm font-medium text-primary">
                  <span className="grid size-8 place-items-center rounded-full bg-secondary text-primary">
                    <LockKeyhole size={14} />
                  </span>
                  Seu acesso é privado
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Só você e o anfitrião podem ver esta resposta. Nada é público.</p>
              </div>

              {participation && participation.giftIds.length > 0 && (
                <button type="button" onClick={releaseGift} disabled={release.isPending} className="group flex w-full items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-left text-sm font-medium text-destructive transition-all hover:bg-destructive/10 hover:border-destructive/50 disabled:opacity-50" data-testid="button-release-gift">
                  <span>{release.isPending ? 'Liberando...' : 'Liberar meus presentes'}</span>
                  <RefreshCcw size={18} className={`transition-transform group-hover:rotate-180 ${release.isPending ? 'animate-spin' : ''}`} />
                </button>
              )}
            </aside>

            <div className="sticky bottom-6 z-20 -mx-4 flex flex-col items-stretch gap-4 rounded-3xl border border-border/80 bg-background/90 p-3 shadow-2xl backdrop-blur-md sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
              <div className="flex items-center gap-3 px-3 sm:px-0">
                {saved && <span className="flex items-center gap-2 text-sm font-medium text-emerald-600 animate-fade-in-up" data-testid="status-rsvp-saved"><span className="grid size-6 place-items-center rounded-full bg-emerald-100"><Check size={14} /></span> Resposta salva com carinho</span>}
                {upsert.isError && <span className="flex items-center gap-2 text-sm font-medium text-destructive" data-testid="status-rsvp-error"><CircleAlert size={18} /> Não foi possível salvar. Tente novamente.</span>}
              </div>
              <button type="submit" disabled={upsert.isPending} className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-accent px-8 py-4 text-sm font-medium text-accent-foreground shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:bg-accent/90 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 sm:w-auto sm:rounded-full" data-testid="button-save-rsvp">
                {upsert.isPending ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
                {upsert.isPending ? 'Salvando...' : 'Salvar minha resposta'}
                <ChevronRight size={18} className="transition-transform group-hover:translate-x-1.5" />
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </AppShell>
  );
}

function AttendanceCard() {
  const { register, watch, setValue } = useFormContext<ParticipationInput>();
  const attending = watch('attending');

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">01 / Presença</p>
          <h2 className="serif mt-4 text-3xl sm:text-4xl text-primary">Você vem?</h2>
        </div>
        <div className="grid size-12 place-items-center rounded-full bg-secondary text-primary/60">
          <UserRound size={20} />
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Choice selected={attending === true} onClick={() => setValue('attending', true, { shouldDirty: true })} title="Sim, estarei lá" detail="Pode contar comigo." testId="choice-attending-yes" />
        <Choice selected={attending === false} onClick={() => { setValue('attending', false, { shouldDirty: true }); setValue('plusOne', false); setValue('giftIds', []); }} title="Não vou conseguir" detail="Aviso para o anfitrião." testId="choice-attending-no" />
      </div>
      <input type="hidden" {...register('attending')} />
    </section>
  );
}

function Choice({ selected, onClick, title, detail, testId }: { selected: boolean; onClick: () => void; title: string; detail: string; testId: string }) {
  return (
    <button type="button" onClick={onClick} className={`group relative flex min-h-[90px] items-center justify-between rounded-2xl border p-5 text-left transition-all duration-300 ${selected ? 'border-primary bg-primary text-primary-foreground shadow-lg scale-[1.02]' : 'border-border bg-background hover:border-primary/40 hover:bg-secondary/60'}`} data-testid={testId}>
      <span>
        <strong className="block text-base font-medium">{title}</strong>
        <span className={`mt-1.5 block text-sm ${selected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{detail}</span>
      </span>
      <span className={`grid size-8 place-items-center rounded-full border transition-colors ${selected ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-transparent group-hover:border-primary/30'}`}>
        <Check size={16} className={selected ? 'opacity-100' : 'opacity-0'} />
      </span>
    </button>
  );
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

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div>
          <p className="mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">02 / Um gesto</p>
          <h2 className="serif mt-4 text-3xl sm:text-4xl text-primary">Escolha seus presentes</h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">Escolha no mínimo 1 e no máximo 2 itens. A lista atualiza conforme as pessoas reservam.</p>
        </div>
        <div className="flex shrink-0 flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
          <span className="flex items-center gap-2 rounded-full bg-secondary/80 px-4 py-2.5 text-xs font-medium text-primary shadow-sm border border-border/50" data-testid="text-gift-available-count">
            <Gift size={16} className="text-accent" /> {availableUnits} disponíveis
          </span>
          <span className="text-sm font-medium text-muted-foreground bg-background px-3 py-1 rounded-full border border-border/50">{selectedIds.length} de 2 escolhidos</span>
        </div>
      </div>

      {errors.giftIds?.message && (
        <p className="mt-6 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-medium text-destructive flex items-center gap-2">
          <CircleAlert size={16} />
          {errors.giftIds.message}
        </p>
      )}

      {gifts.length === 0 ? (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-border p-12 text-center text-sm text-muted-foreground" data-testid="empty-gifts">
          <Gift size={32} className="mx-auto text-muted-foreground/40 mb-4" />
          A lista está sendo preparada pelo anfitrião.
        </div>
      ) : (
        <>
          <div className={`mt-8 flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide ${!attending ? 'pointer-events-none opacity-40 grayscale-[50%]' : ''}`} role="tablist" aria-label="Categorias de presentes">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setCategory(item)}
                disabled={!attending}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-all ${category === item ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-secondary/50'}`}
                aria-pressed={category === item}
                data-testid={`button-gift-category-${item}`}
              >
                <Tags size={14} className={category === item ? 'opacity-80' : 'opacity-60'} />
                {item}
              </button>
            ))}
          </div>

          <div className={`mt-6 grid gap-4 sm:grid-cols-2 ${!attending ? 'pointer-events-none opacity-40 grayscale-[50%]' : ''}`}>
            {visibleGifts.map((gift) => {
              const selected = selectedIds.includes(gift.id);
              const unavailable = gift.availableQuantity <= 0 && !selected;
              return (
                <button
                  type="button"
                  key={gift.id}
                  disabled={unavailable || !attending}
                  onClick={() => toggleGift(gift.id)}
                  className={`group relative flex min-h-[130px] items-start justify-between rounded-2xl border p-5 text-left transition-all duration-300 ${selected ? 'border-accent bg-accent/10 ring-1 ring-accent shadow-sm' : unavailable ? 'cursor-not-allowed border-border/50 bg-secondary/30' : 'border-border bg-background hover:-translate-y-1 hover:border-primary/40 hover:shadow-md'}`}
                  data-testid={`button-gift-${gift.id}`}
                >
                  <span className="min-w-0 pr-4">
                    <span className="mono text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">{gift.categoryLabel}</span>
                    <strong className={`mt-2 block break-words text-base font-medium ${unavailable ? 'text-muted-foreground' : 'text-primary'}`}>{gift.name}</strong>
                    <span className={`mt-3 flex items-center gap-1.5 text-sm ${unavailable ? 'font-medium text-muted-foreground' : selected ? 'font-medium text-accent' : 'text-muted-foreground'}`}>
                      {selected ? <><Check size={14} /> Escolhido por você</> : unavailable ? 'Esgotado' : `${gift.availableQuantity} de ${gift.quantity} disponíveis`}
                    </span>
                  </span>
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full border transition-colors ${selected ? 'border-accent bg-accent text-accent-foreground shadow-sm' : unavailable ? 'border-border text-muted-foreground/30 bg-secondary' : 'border-border text-primary/30 bg-background group-hover:border-primary/40 group-hover:text-primary/60'}`}>
                    {selected ? <Check size={16} /> : <Heart size={16} className={unavailable ? '' : 'group-hover:scale-110 transition-transform'} />}
                  </span>
                </button>
              );
            })}
          </div>

          {visibleGifts.length === 0 && <p className="mt-8 text-center text-sm text-muted-foreground italic">Nenhum presente nesta categoria.</p>}
        </>
      )}
      {!attending && <p className="mt-8 text-sm font-medium text-muted-foreground flex items-center gap-2 justify-center bg-secondary/50 py-4 rounded-xl border border-border"><Gift size={16} /> A lista de presentes aparece quando você confirma que virá.</p>}
    </section>
  );
}

function NoteField() {
  const { register } = useFormContext<ParticipationInput>();
  const attending = useFormContext<ParticipationInput>().watch('attending');

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
      <p className="mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">03 / Mais um detalhe</p>

      <div className="mt-8 grid gap-8 sm:grid-cols-[0.9fr_1.1fr] sm:items-start">
        <label className={`group flex min-h-[90px] cursor-pointer items-center justify-between rounded-2xl border border-border bg-background p-5 transition-all hover:border-primary/40 hover:shadow-sm ${!attending ? 'opacity-40 grayscale-[50%] pointer-events-none' : ''}`}>
          <span>
            <strong className="block text-base font-medium">Vou levar alguém</strong>
            <span className="mt-1.5 block text-sm text-muted-foreground">Uma pessoa com você</span>
          </span>
          <div className="relative flex items-center justify-center">
            <input type="checkbox" disabled={!attending} {...register('plusOne')} className="peer sr-only" data-testid="input-plus-one" />
            <div className="h-7 w-12 rounded-full bg-secondary shadow-inner transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"></div>
            <div className="absolute left-1 top-1 size-5 rounded-full bg-background shadow transition-transform peer-checked:translate-x-5"></div>
          </div>
        </label>

        <label className="sm:col-span-2">
          <span className="mb-3 block text-base font-medium">Quer deixar um recado?</span>
          <textarea
            {...register('note')}
            maxLength={280}
            rows={4}
            placeholder="Alguma restrição, carinho ou observação para o anfitrião..."
            className="w-full resize-none rounded-2xl border border-input bg-background px-5 py-4 text-base leading-relaxed text-primary outline-none transition-all placeholder:text-muted-foreground/60 focus:border-accent focus:ring-1 focus:ring-accent shadow-sm"
            data-testid="input-rsvp-note"
          />
        </label>
      </div>
      <p className="mt-4 text-sm text-muted-foreground italic">Opcional. O anfitrião vai ler com atenção.</p>
    </section>
  );
}

function PortalSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-6 w-32 rounded bg-secondary" />
      <div className="h-16 w-80 max-w-full rounded bg-secondary" />
      <div className="h-6 w-96 max-w-full rounded bg-secondary" />
      <div className="grid gap-10 lg:grid-cols-2 mt-12">
        <div className="space-y-8">
          <div className="h-64 rounded-3xl bg-secondary" />
          <div className="h-96 rounded-3xl bg-secondary" />
        </div>
        <div className="h-[500px] rounded-3xl bg-secondary" />
      </div>
    </div>
  );
}

function QueryProblem({ retry }: { retry: () => void }) {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center text-center px-6 animate-fade-in-up">
      <div className="grid size-20 place-items-center rounded-full bg-accent/10">
        <CircleAlert size={36} className="text-accent" />
      </div>
      <h1 className="serif mt-8 text-4xl text-primary">O convite está descansando.</h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">Não conseguimos carregar todos os detalhes agora.</p>
      <button type="button" onClick={retry} className="mt-8 flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5" data-testid="button-retry-portal">
        <RefreshCcw size={18} /> Tentar novamente
      </button>
    </div>
  );
}
