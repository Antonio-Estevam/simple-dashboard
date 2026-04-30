"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserCheck, UserX, UserRoundPlus, RefreshCcw,
  TrendingUp, AlertTriangle, Clock, ArrowRight,
  CalendarClock, CheckCircle2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MrrData { totalClients: number; totalEur: number; totalBrl: number; }

interface SummaryFollowUp {
  id: number;
  personName: string;
  scheduledDate?: string;
  status: string;
  type: string;
}

interface SummaryInactive {
  id: number;
  personName: string;
  recontactDate?: string;
  recontactStatus: string;
}

interface SummaryBilling {
  id: number;
  personName: string;
  amount: number;
  currency: string;
  month: number;
  year: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR  = now.getFullYear();

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "sem data";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function formatAmount(amount: number, currency: string) {
  return currency === "EUR" ? `€${amount.toFixed(2)}` : `R$${amount.toFixed(2)}`;
}

function formatMonthYear(month: number, year: number) {
  return `${MONTH_SHORT[month - 1]}/${year}`;
}

const FOLLOW_UP_TYPE_LABEL: Record<string, string> = {
  COLD_LEAD: "Lead frio",
  INACTIVE_REACTIVATION: "Reativação",
};

const FOLLOW_UP_STATUS_LABEL: Record<string, string> = {
  WAITING: "Aguardando",
  IN_PROGRESS: "Em andamento",
  CONVERTED: "Convertido",
  DISCARDED: "Descartado",
};

const RECONTACT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  CONTACTED: "Contactado",
  SCHEDULED: "Agendado",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  title, value, icon: Icon, iconClass, href, loading, color,
}: {
  title: string; value: number; icon: React.ElementType; iconClass: string;
  href: string; loading: boolean; color: string;
}) {
  return (
    <Link href={href} className="block group">
      <Card className={`transition-all group-hover:shadow-md group-hover:-translate-y-0.5 active:translate-y-0 border-l-4 ${color}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${iconClass}`} />
        </CardHeader>
        <CardContent>
          {loading
            ? <Skeleton className="h-8 w-16" />
            : <p className="text-3xl font-bold">{value}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

function MetricCard({
  title, icon: Icon, iconClass, loading, children,
}: {
  title: string; icon: React.ElementType; iconClass: string; loading: boolean; children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-28" /> : children}
      </CardContent>
    </Card>
  );
}

function AlertPanel({
  title, icon: Icon, iconClass, href, count, loading, emptyMsg, children,
}: {
  title: string; icon: React.ElementType; iconClass: string; href: string;
  count: number; loading: boolean; emptyMsg: string; children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconClass}`} />
          {title}
          {!loading && count > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">{count}</Badge>
          )}
        </CardTitle>
        <Link
          href={href}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Ver todos <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : count === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            {emptyMsg}
          </div>
        ) : children}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CrmSummaryPage() {

  // People
  const [clientCount,   setClientCount]   = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [leadCount,     setLeadCount]     = useState(0);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [loadingPeople, setLoadingPeople] = useState(true);

  // Financial
  const [mrr,          setMrr]          = useState<MrrData | null>(null);
  const [loadingMrr,   setLoadingMrr]   = useState(true);

  // Alert panels
  const [dueTodayFu,    setDueTodayFu]    = useState<SummaryFollowUp[]>([]);
  const [dueRecontact,  setDueRecontact]  = useState<SummaryInactive[]>([]);
  const [overdueList,   setOverdueList]   = useState<SummaryBilling[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()).catch(() => []),
      fetch("/api/inactive-clients").then((r) => r.json()).catch(() => []),
      fetch("/api/leads").then((r) => r.json()).catch(() => []),
      fetch("/api/follow-up").then((r) => r.json()).catch(() => []),
    ]).then(([clients, inactive, leads, followUps]) => {
      setClientCount(Array.isArray(clients) ? clients.length : 0);
      setInactiveCount(Array.isArray(inactive) ? inactive.length : 0);
      setLeadCount(Array.isArray(leads) ? leads.length : 0);
      setFollowUpCount(Array.isArray(followUps) ? followUps.length : 0);
    }).finally(() => setLoadingPeople(false));
  }, []);

  useEffect(() => {
    fetch(`/api/billing/mrr?month=${CURRENT_MONTH}&year=${CURRENT_YEAR}`)
      .then((r) => r.json())
      .then((data) => setMrr(data))
      .catch(() => {})
      .finally(() => setLoadingMrr(false));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/follow-up/due-today").then((r) => r.json()).catch(() => []),
      fetch("/api/inactive-clients/due-recontact").then((r) => r.json()).catch(() => []),
      fetch("/api/billing/overdue").then((r) => r.json()).catch(() => []),
    ]).then(([dueFu, dueRec, overdue]) => {
      setDueTodayFu(Array.isArray(dueFu) ? dueFu : []);
      setDueRecontact(Array.isArray(dueRec) ? dueRec : []);
      setOverdueList(Array.isArray(overdue) ? overdue : []);
    }).finally(() => setLoadingAlerts(false));
  }, []);

  const PANEL_LIMIT = 5;

  return (
    <div className="p-6 space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-semibold">Resumo CRM</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do negócio · {MONTH_SHORT[CURRENT_MONTH - 1]}/{CURRENT_YEAR}
        </p>
      </div>

      {/* ── Pessoas ── */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Pessoas</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Clientes Ativos"
            value={clientCount}
            icon={UserCheck}
            iconClass="text-green-500"
            href="/dashboard/crm/clients"
            loading={loadingPeople}
            color="border-l-green-500"
          />
          <KpiCard
            title="Clientes Inativos"
            value={inactiveCount}
            icon={UserX}
            iconClass="text-red-500"
            href="/dashboard/crm/inactive-clients"
            loading={loadingPeople}
            color="border-l-red-400"
          />
          <KpiCard
            title="Leads"
            value={leadCount}
            icon={UserRoundPlus}
            iconClass="text-blue-500"
            href="/dashboard/crm/leads"
            loading={loadingPeople}
            color="border-l-blue-500"
          />
          <KpiCard
            title="Follow-ups"
            value={followUpCount}
            icon={RefreshCcw}
            iconClass="text-purple-500"
            href="/dashboard/crm/follow-up"
            loading={loadingPeople}
            color="border-l-purple-500"
          />
        </div>
      </section>

      {/* ── Financeiro ── */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Financeiro — {MONTH_SHORT[CURRENT_MONTH - 1]}/{CURRENT_YEAR}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="MRR (EUR)" icon={TrendingUp} iconClass="text-blue-500" loading={loadingMrr}>
            <p className="text-2xl font-bold">€{(mrr?.totalEur ?? 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">receita recorrente</p>
          </MetricCard>

          <MetricCard title="MRR (BRL)" icon={TrendingUp} iconClass="text-emerald-500" loading={loadingMrr}>
            <p className="text-2xl font-bold">R${(mrr?.totalBrl ?? 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">receita recorrente</p>
          </MetricCard>

          <MetricCard title="Clientes Pagantes" icon={UserCheck} iconClass="text-green-500" loading={loadingMrr}>
            <p className="text-2xl font-bold">{mrr?.totalClients ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">pagamentos confirmados</p>
          </MetricCard>

          <MetricCard title="Cobranças Vencidas" icon={AlertTriangle} iconClass="text-red-500" loading={loadingAlerts}>
            <p className="text-2xl font-bold text-red-600">{overdueList.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">requerem atenção</p>
          </MetricCard>
        </div>
      </section>

      {/* ── Atenção necessária ── */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Atenção necessária</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Follow-ups de hoje */}
          <AlertPanel
            title="Follow-ups de Hoje"
            icon={CalendarClock}
            iconClass="text-purple-500"
            href="/dashboard/crm/follow-up"
            count={dueTodayFu.length}
            loading={loadingAlerts}
            emptyMsg="Nenhum follow-up para hoje"
          >
            <div className="space-y-2">
              {dueTodayFu.slice(0, PANEL_LIMIT).map((fu) => (
                <div key={fu.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{fu.personName}</p>
                    <p className="text-xs text-muted-foreground">
                      {FOLLOW_UP_TYPE_LABEL[fu.type] ?? fu.type}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 ml-2">
                    {FOLLOW_UP_STATUS_LABEL[fu.status] ?? fu.status}
                  </Badge>
                </div>
              ))}
              {dueTodayFu.length > PANEL_LIMIT && (
                <p className="text-xs text-center text-muted-foreground pt-1">
                  +{dueTodayFu.length - PANEL_LIMIT} mais
                </p>
              )}
            </div>
          </AlertPanel>

          {/* Inativos para recontar */}
          <AlertPanel
            title="Para Recontar"
            icon={Clock}
            iconClass="text-amber-500"
            href="/dashboard/crm/inactive-clients"
            count={dueRecontact.length}
            loading={loadingAlerts}
            emptyMsg="Nenhum cliente para recontar"
          >
            <div className="space-y-2">
              {dueRecontact.slice(0, PANEL_LIMIT).map((ic) => (
                <div key={ic.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ic.personName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(ic.recontactDate)}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 ml-2">
                    {RECONTACT_STATUS_LABEL[ic.recontactStatus] ?? ic.recontactStatus}
                  </Badge>
                </div>
              ))}
              {dueRecontact.length > PANEL_LIMIT && (
                <p className="text-xs text-center text-muted-foreground pt-1">
                  +{dueRecontact.length - PANEL_LIMIT} mais
                </p>
              )}
            </div>
          </AlertPanel>

          {/* Cobranças vencidas */}
          <AlertPanel
            title="Cobranças Vencidas"
            icon={AlertTriangle}
            iconClass="text-red-500"
            href="/dashboard/crm/financial"
            count={overdueList.length}
            loading={loadingAlerts}
            emptyMsg="Nenhuma cobrança vencida"
          >
            <div className="space-y-2">
              {overdueList.slice(0, PANEL_LIMIT).map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{b.personName}</p>
                    <p className="text-xs text-muted-foreground">{formatMonthYear(b.month, b.year)}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600 shrink-0 ml-2">
                    {formatAmount(b.amount, b.currency)}
                  </span>
                </div>
              ))}
              {overdueList.length > PANEL_LIMIT && (
                <p className="text-xs text-center text-muted-foreground pt-1">
                  +{overdueList.length - PANEL_LIMIT} mais
                </p>
              )}
            </div>
          </AlertPanel>

        </div>
      </section>

    </div>
  );
}
