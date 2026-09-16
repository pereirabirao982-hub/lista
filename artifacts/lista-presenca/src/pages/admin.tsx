import { Check, CircleAlert, Clock3, Gift, Mail, RefreshCcw, Search, ShieldCheck, UsersRound, X } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { getGetAdminSummaryQueryKey, getListAdminParticipationsQueryKey, useGetAdminSummary, useListAdminParticipations } from '@workspace/api-client-react';

export default function AdminPage() {
  const client = useQueryClient();
  const summaryQuery = useGetAdminSummary({ query: { queryKey: getGetAdminSummaryQueryKey() } });
  const guestsQuery = useListAdminParticipations({ query: { queryKey: getListAdminParticipationsQueryKey() } });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'yes' | 'no'>('all');

  const errorStatus = (summaryQuery.error as { status?: number } | null)?.status || (guestsQuery.error as { status?: number } | null)?.status;

  if (summaryQuery.isLoading || guestsQuery.isLoading) return <AppShell admin><AdminSkeleton /></AppShell>;
  if (errorStatus === 403) return <AppShell admin><AccessDenied /></AppShell>;
  if (summaryQuery.isError || guestsQuery.isError || !summaryQuery.data) return <AppShell admin><AdminError retry={() => { summaryQuery.refetch(); guestsQuery.refetch(); }} /></AppShell>;

  const summary = summaryQuery.data;
  const guests = guestsQuery.data || [];

  const filtered = guests.filter((guest) => {
    const matchesSearch = `${guest.guestName} ${guest.guestEmail} ${guest.giftNames.join(' ')}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'yes' ? guest.attending : !guest.attending);
    return matchesSearch && matchesFilter;
  });

  const refresh = async () => Promise.all([
    client.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() }),
    client.invalidateQueries({ queryKey: getListAdminParticipationsQueryKey() })
  ]);

  return (
    <AppShell admin>
      <div className="animate-fade-in-up">
        <div className="flex flex-col gap-6 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Visão do anfitrião</p>
            <h1 className="serif mt-4 text-5xl tracking-tight text-primary" data-testid="heading-admin">Tudo em seu lugar.</h1>
            <p className="mt-4 text-lg text-muted-foreground">Um retrato tranquilo de quem vem e do que está levando.</p>
          </div>
          <button type="button" onClick={refresh} className="flex items-center justify-center gap-3 self-start rounded-full border border-border bg-card px-6 py-3.5 text-sm font-medium text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow md:self-auto" data-testid="button-refresh-admin">
            <RefreshCcw size={16} /> Atualizar lista
          </button>
        </div>

        <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Confirmados', value: summary.attendingCount, detail: `${summary.plusOneCount} com acompanhante`, icon: <Check size={20} />, accent: true, id: 'attending' },
            { label: 'Aguardando resposta', value: summary.pendingCount, detail: `${summary.totalGuests} convites enviados`, icon: <Clock3 size={20} />, id: 'pending' },
            { label: 'Presentes reservados', value: summary.reservedGifts, detail: `${summary.availableGifts} ainda disponíveis`, icon: <Gift size={20} />, id: 'gifts' },
            { label: 'Não vêm', value: summary.declinedCount, detail: 'respostas recebidas', icon: <X size={20} />, id: 'declined' },
          ].map((metric, index) => (
            <div key={metric.id} className={`rounded-3xl border p-6 transition-transform duration-300 hover:-translate-y-1 shadow-sm ${metric.accent ? 'border-primary bg-primary text-primary-foreground shadow-primary/10' : 'border-border bg-card'}`} style={{ animationDelay: `${index * 70}ms` }} data-testid={`metric-${metric.id}`}>
              <div className="flex items-center justify-between">
                <span className={`font-medium ${metric.accent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{metric.label}</span>
                <span className={`grid size-10 place-items-center rounded-full ${metric.accent ? 'bg-primary-foreground/10 text-accent' : 'bg-secondary text-primary'}`}>
                  {metric.icon}
                </span>
              </div>
              <p className="serif mt-8 text-5xl">{metric.value}</p>
              <div className={`mt-6 pt-4 border-t ${metric.accent ? 'border-primary-foreground/10' : 'border-border'}`}>
                <p className={`text-sm ${metric.accent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{metric.detail}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-12 rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex flex-col gap-5 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 bg-background/50">
            <div>
              <h2 className="serif text-3xl text-primary">Lista de convidados</h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground" data-testid="text-guest-count">{filtered.length} respostas exibidas</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar convidado ou e-mail..." className="w-full rounded-full border border-input bg-background py-3 pl-11 pr-5 text-sm font-medium outline-none transition-shadow focus:border-accent focus:ring-1 focus:ring-accent shadow-sm" data-testid="input-search-guests" />
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto border-b border-border px-6 py-4 sm:px-8 bg-card">
            {[['all', 'Todos'], ['yes', 'Confirmados'], ['no', 'Não vêm']].map(([key, label]) => (
              <button
                type="button"
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${filter === key ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary'}`}
                data-testid={`button-filter-${key}`}
              >
                {label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="p-16 text-center bg-card">
              <div className="grid size-16 mx-auto place-items-center rounded-full bg-secondary text-muted-foreground/60">
                <UsersRound size={28} />
              </div>
              <p className="mt-6 text-lg font-medium text-primary">Nenhuma resposta encontrada</p>
              <p className="mt-2 text-base text-muted-foreground">Ajuste a busca ou aguarde novas confirmações.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-card">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="border-b border-border text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground bg-secondary/30">
                    <th className="px-8 py-5">Convidado</th>
                    <th className="px-6 py-5">Resposta</th>
                    <th className="px-6 py-5">Acompanhante</th>
                    <th className="px-6 py-5">Presentes</th>
                    <th className="px-8 py-5">Atualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((guest) => (
                    <tr key={guest.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-secondary/40" data-testid={`row-guest-${guest.id}`}>
                      <td className="px-8 py-6">
                        <p className="font-medium text-base text-primary">{guest.guestName}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Mail size={14} /> {guest.guestEmail}</p>
                        {guest.note && (
                          <div className="mt-3 rounded-xl bg-secondary/80 p-3 border border-border/50">
                            <p className="text-sm italic text-primary/80">“{guest.note}”</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-6">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border ${guest.attending ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-border bg-secondary text-muted-foreground'}`}>
                          {guest.attending ? <Check size={14} /> : <X size={14} />}
                          {guest.attending ? 'Confirmado' : 'Não vem'}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-sm text-primary">{guest.plusOne ? <span className="font-medium">Sim</span> : <span className="text-muted-foreground">Não</span>}</td>
                      <td className="px-6 py-6 text-sm">
                        {guest.giftNames.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {guest.giftNames.map(name => (
                              <span key={name} className="inline-block rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent border border-accent/20">{name}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Nenhum</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-sm text-muted-foreground">{formatUpdatedAt(guest.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-8 flex items-center justify-between text-sm text-muted-foreground bg-secondary/50 p-4 rounded-2xl border border-border/60">
          <span className="flex items-center gap-2 font-medium">
            <ShieldCheck size={16} className="text-accent" />
            Dados visíveis apenas para o anfitrião.
          </span>
          <span data-testid="text-last-updated">Atualizado {summary.lastUpdatedAt ? formatUpdatedAt(summary.lastUpdatedAt) : 'agora'}</span>
        </div>
      </div>
    </AppShell>
  );
}

function formatUpdatedAt(date: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
  } catch {
    return 'recentemente';
  }
}

function AdminSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="space-y-4">
        <div className="h-5 w-32 rounded bg-secondary" />
        <div className="h-12 w-80 rounded bg-secondary" />
      </div>
      <div className="grid gap-5 sm:grid-cols-4 mt-8">
        {[1,2,3,4].map((item) => <div key={item} className="h-44 rounded-3xl bg-secondary" />)}
      </div>
      <div className="h-[600px] rounded-3xl bg-secondary" />
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-6 animate-fade-in-up">
      <div className="grid size-20 place-items-center rounded-3xl bg-destructive/10 text-destructive shadow-sm">
        <ShieldCheck size={36} />
      </div>
      <h1 className="serif mt-8 text-4xl text-primary">Este espaço é reservado.</h1>
      <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">A visão do anfitrião só pode ser acessada pela pessoa responsável por este encontro.</p>
      <span className="mt-8 rounded-full bg-secondary border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground shadow-sm" data-testid="status-access-denied">
        Acesso não autorizado
      </span>
    </div>
  );
}

function AdminError({ retry }: { retry: () => void }) {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center text-center px-6 animate-fade-in-up">
      <div className="grid size-20 place-items-center rounded-full bg-accent/10 text-accent">
        <CircleAlert size={36} />
      </div>
      <h1 className="serif mt-8 text-4xl text-primary">Não conseguimos abrir o painel.</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-md">Os dados do encontro não chegaram completos.</p>
      <button type="button" onClick={retry} className="mt-8 flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5" data-testid="button-retry-admin">
        <RefreshCcw size={18} /> Tentar novamente
      </button>
    </div>
  );
}
