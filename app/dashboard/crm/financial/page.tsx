"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TrendingUp, Users, AlertTriangle, Clock, CheckCircle2, XCircle,
  Plus, Trash2, Pencil, AlertCircle, Search, CreditCard,
  ChevronDown, ChevronUp, ListChecks,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type PaymentStatus = "PAID" | "PENDING" | "OVERDUE";
type PaymentMethod = "MBWAY" | "BANK_TRANSFER" | "ATM" | "OTHER";
type CurrencyType  = "EUR" | "BRL";

interface BillingResponse {
  id: number;
  personId: number;
  personName: string;
  personWhatsapp: string;
  month: number;
  year: number;
  amount: number;
  currency: CurrencyType;
  dueDay?: number;
  paymentMethod?: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface MrrResponse {
  month: number;
  year: number;
  totalClients: number;
  totalEur: number;
  totalBrl: number;
}

interface MrrYearlyResponse {
  year: number;
  totalEur: number;
  totalBrl: number;
  months: MrrResponse[];
}

interface BatchResultResponse {
  generated: number;
  skipped: number;
  records: BillingResponse[];
}

interface PersonResult {
  id: number;
  name: string;
  whatsapp: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PaymentStatus, { label: string; badgeClass: string }> = {
  PAID:    { label: "Pago",     badgeClass: "bg-green-100 text-green-700 border-green-200"  },
  PENDING: { label: "Pendente", badgeClass: "bg-amber-100 text-amber-700 border-amber-200"  },
  OVERDUE: { label: "Vencido",  badgeClass: "bg-red-100 text-red-700 border-red-200"        },
};

const CURRENCY_CONFIG: Record<CurrencyType, { symbol: string; badgeClass: string }> = {
  EUR: { symbol: "€",  badgeClass: "bg-blue-100 text-blue-700 border-blue-200"       },
  BRL: { symbol: "R$", badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  MBWAY:         "MBWay",
  BANK_TRANSFER: "Transferência",
  ATM:           "ATM",
  OTHER:         "Outro",
};

const MONTH_OPTIONS = [
  { value: "1",  label: "Janeiro"   }, { value: "2",  label: "Fevereiro"  },
  { value: "3",  label: "Março"     }, { value: "4",  label: "Abril"      },
  { value: "5",  label: "Maio"      }, { value: "6",  label: "Junho"      },
  { value: "7",  label: "Julho"     }, { value: "8",  label: "Agosto"     },
  { value: "9",  label: "Setembro"  }, { value: "10", label: "Outubro"    },
  { value: "11", label: "Novembro"  }, { value: "12", label: "Dezembro"   },
];

const MONTH_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: CurrencyType) {
  const { symbol } = CURRENCY_CONFIG[currency];
  return `${symbol}${amount.toFixed(2)}`;
}

function formatMonthYear(month: number, year: number) {
  return `${MONTH_SHORT[month - 1]}/${year}`;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function toISODate(dateStr: string) {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function stripEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v !== null && v !== undefined));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PaymentStatus }) {
  const { label, badgeClass } = STATUS_CONFIG[status] ?? { label: status, badgeClass: "" };
  return <Badge variant="default" className={badgeClass}>{label}</Badge>;
}

function CurrencyBadge({ currency }: { currency: CurrencyType }) {
  const { badgeClass } = CURRENCY_CONFIG[currency] ?? { badgeClass: "" };
  return <Badge variant="outline" className={badgeClass}>{currency}</Badge>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="h-3 w-3 shrink-0" />{msg}
    </p>
  );
}

function SummaryCard({
  title, icon: Icon, iconClass, loading, children,
}: {
  title: string; icon: React.ElementType; iconClass: string;
  loading: boolean; children: React.ReactNode;
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

// Person search used in create + batch modals
function PersonSearch({
  selected, onSelect, onClear, searchEndpoint = "/api/billing/persons/search",
}: {
  selected: PersonResult | null;
  onSelect: (p: PersonResult) => void;
  onClear: () => void;
  searchEndpoint?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      setSearching(true);
      fetch(`${searchEndpoint}?name=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((d) => { setResults(Array.isArray(d) ? d : []); setSearching(false); })
        .catch(() => { setResults([]); setSearching(false); });
    }, 300);
    return () => clearTimeout(t);
  }, [query, searchEndpoint]);

  if (selected) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/40">
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selected.name}</p>
          <p className="text-xs text-muted-foreground">{selected.whatsapp}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>Trocar</Button>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Digite o nome do cliente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {searching && <p className="text-xs text-muted-foreground pl-1">Buscando...</p>}
      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-xs text-muted-foreground pl-1">Nenhum cliente encontrado</p>
      )}
      {results.length > 0 && (
        <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
              onClick={() => { onSelect(p); setQuery(""); setResults([]); }}
            >
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.whatsapp}</p>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const MotionTr = motion(TableRow);

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR  = now.getFullYear();

export default function BillingPage() {
  // ── Data state ────────────────────────────────────────────────────────────
  const [billing,        setBilling]        = useState<BillingResponse[]>([]);
  const [mrr,            setMrr]            = useState<MrrResponse | null>(null);
  const [overdueList,    setOverdueList]    = useState<BillingResponse[]>([]);
  const [annualMrr,      setAnnualMrr]      = useState<MrrYearlyResponse | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading,        setLoading]        = useState(true);
  const [loadError,      setLoadError]      = useState<string | null>(null);
  const [mrrLoading,     setMrrLoading]     = useState(true);
  const [overdueLoading, setOverdueLoading] = useState(true);
  const [selectedMonth,  setSelectedMonth]  = useState(CURRENT_MONTH);
  const [selectedYear,   setSelectedYear]   = useState(CURRENT_YEAR);
  const [statusFilter,   setStatusFilter]   = useState<PaymentStatus | "ALL">("ALL");

  // ── Annual MRR ────────────────────────────────────────────────────────────
  const [annualOpen,    setAnnualOpen]    = useState(false);
  const [annualLoading, setAnnualLoading] = useState(false);
  const [annualError,   setAnnualError]   = useState<string | null>(null);

  // ── Create modal ──────────────────────────────────────────────────────────
  const [createOpen,        setCreateOpen]        = useState(false);
  const [createPerson,      setCreatePerson]      = useState<PersonResult | null>(null);
  const [createForm,        setCreateForm]        = useState({ month: String(CURRENT_MONTH), year: String(CURRENT_YEAR), amount: "", currency: "" as CurrencyType | "", dueDay: "", paymentMethod: "" as PaymentMethod | "", paidAt: "" });
  const [createErrors,      setCreateErrors]      = useState<Record<string, string>>({});
  const [createSubmitting,  setCreateSubmitting]  = useState(false);

  // ── Edit modal ────────────────────────────────────────────────────────────
  const [editingRecord,     setEditingRecord]     = useState<BillingResponse | null>(null);
  const [editForm,          setEditForm]          = useState({ month: "", year: "", amount: "", currency: "" as CurrencyType | "", dueDay: "", paymentMethod: "" as PaymentMethod | "", paidAt: "", status: "" as PaymentStatus | "" });
  const [editErrors,        setEditErrors]        = useState<Record<string, string>>({});
  const [editSubmitting,    setEditSubmitting]    = useState(false);

  // ── Pay modal ─────────────────────────────────────────────────────────────
  const [payingRecord,      setPayingRecord]      = useState<BillingResponse | null>(null);
  const [payForm,           setPayForm]           = useState({ paidAt: "", paymentMethod: "" as PaymentMethod | "" });
  const [payErrors,         setPayErrors]         = useState<Record<string, string>>({});
  const [paySubmitting,     setPaySubmitting]     = useState(false);

  // ── Overdue confirm ───────────────────────────────────────────────────────
  const [overdueConfirmId,  setOverdueConfirmId]  = useState<number | null>(null);
  const [overdueConfirming, setOverdueConfirming] = useState(false);

  // ── Delete ────────────────────────────────────────────────────────────────
  const [deleteId,          setDeleteId]          = useState<number | null>(null);
  const [deleteSubmitting,  setDeleteSubmitting]  = useState(false);

  // ── Batch modal ───────────────────────────────────────────────────────────
  const [batchOpen,          setBatchOpen]          = useState(false);
  const [batchForm,          setBatchForm]          = useState({ month: String(CURRENT_MONTH), year: String(CURRENT_YEAR), amount: "", currency: "" as CurrencyType | "" });
  const [batchErrors,        setBatchErrors]        = useState<Record<string, string>>({});
  const [batchPersons,       setBatchPersons]       = useState<PersonResult[]>([]);
  const [batchSearchQuery,   setBatchSearchQuery]   = useState("");
  const [batchSearchResults, setBatchSearchResults] = useState<PersonResult[]>([]);
  const [batchSearchLoading, setBatchSearchLoading] = useState(false);
  const [batchSubmitting,    setBatchSubmitting]    = useState(false);
  const [batchResult,        setBatchResult]        = useState<BatchResultResponse | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────

  function loadBilling() {
    setLoading(true);
    fetch(`/api/billing?month=${selectedMonth}&year=${selectedYear}`)
      .then((r) => { if (!r.ok) throw new Error("Falha ao carregar cobranças"); return r.json(); })
      .then((data) => { setBilling(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err: Error) => { setLoadError(err.message); setLoading(false); });
  }

  function loadMrr() {
    setMrrLoading(true);
    fetch(`/api/billing/mrr?month=${selectedMonth}&year=${selectedYear}`)
      .then((r) => r.json())
      .then((data) => { setMrr(data); setMrrLoading(false); })
      .catch(() => setMrrLoading(false));
  }

  function loadOverdue() {
    setOverdueLoading(true);
    fetch("/api/billing/overdue")
      .then((r) => r.json())
      .then((data) => { setOverdueList(Array.isArray(data) ? data : []); setOverdueLoading(false); })
      .catch(() => setOverdueLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadBilling(); loadMrr(); }, [selectedMonth, selectedYear]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadOverdue(); }, []);

  // ── Annual MRR ────────────────────────────────────────────────────────────

  function toggleAnnual() {
    if (annualOpen) { setAnnualOpen(false); return; }
    setAnnualOpen(true);
    if (annualMrr?.year === selectedYear) return;
    setAnnualLoading(true);
    setAnnualError(null);
    fetch(`/api/billing/mrr/yearly?year=${selectedYear}`)
      .then((r) => { if (!r.ok) throw new Error("Falha ao carregar MRR anual"); return r.json(); })
      .then((data) => { setAnnualMrr(data); setAnnualLoading(false); })
      .catch((err: Error) => { setAnnualError(err.message); setAnnualLoading(false); });
  }

  // ── Batch persons search ─────────────────────────────────────────────────

  useEffect(() => {
    if (batchSearchQuery.trim().length < 2) { setBatchSearchResults([]); return; }
    const t = setTimeout(() => {
      setBatchSearchLoading(true);
      fetch(`/api/billing/persons/search?name=${encodeURIComponent(batchSearchQuery.trim())}`)
        .then((r) => r.json())
        .then((d) => { setBatchSearchResults(Array.isArray(d) ? d : []); setBatchSearchLoading(false); })
        .catch(() => { setBatchSearchResults([]); setBatchSearchLoading(false); });
    }, 300);
    return () => clearTimeout(t);
  }, [batchSearchQuery]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const displayed = statusFilter === "ALL" ? billing : billing.filter((r) => r.status === statusFilter);
  const pendingCount = billing.filter((r) => r.status === "PENDING").length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openCreate() {
    setCreatePerson(null);
    setCreateForm({ month: String(selectedMonth), year: String(selectedYear), amount: "", currency: "", dueDay: "", paymentMethod: "", paidAt: "" });
    setCreateErrors({});
    setCreateOpen(true);
  }

  function openEdit(record: BillingResponse) {
    setEditingRecord(record);
    setEditForm({
      month:         String(record.month),
      year:          String(record.year),
      amount:        String(record.amount),
      currency:      record.currency,
      dueDay:        record.dueDay != null ? String(record.dueDay) : "",
      paymentMethod: record.paymentMethod ?? "",
      paidAt:        record.paidAt?.split("T")[0] ?? "",
      status:        record.status,
    });
    setEditErrors({});
  }

  function openPay(record: BillingResponse) {
    setPayingRecord(record);
    setPayForm({ paidAt: new Date().toISOString().split("T")[0], paymentMethod: record.paymentMethod ?? "" });
    setPayErrors({});
  }

  function openBatch() {
    setBatchForm({ month: String(selectedMonth), year: String(selectedYear), amount: "", currency: "" });
    setBatchPersons([]);
    setBatchSearchQuery("");
    setBatchSearchResults([]);
    setBatchErrors({});
    setBatchResult(null);
    setBatchOpen(true);
  }

  function toggleBatchPerson(person: PersonResult) {
    setBatchPersons((prev) =>
      prev.find((p) => p.id === person.id)
        ? prev.filter((p) => p.id !== person.id)
        : [...prev, person]
    );
  }

  async function handleCreate() {
    const e: Record<string, string> = {};
    if (!createPerson) e._general = "Selecione um cliente";
    if (!createForm.month) e.month = "Selecione o mês";
    if (!createForm.year || Number(createForm.year) < 2020) e.year = "Ano inválido";
    if (!createForm.amount || Number(createForm.amount) <= 0) e.amount = "Valor inválido";
    if (!createForm.currency) e.currency = "Selecione a moeda";
    if (Object.keys(e).length > 0) { setCreateErrors(e); return; }

    setCreateSubmitting(true);
    try {
      const body = stripEmpty({
        personId:      createPerson!.id,
        month:         Number(createForm.month),
        year:          Number(createForm.year),
        amount:        Number(createForm.amount),
        currency:      createForm.currency,
        dueDay:        createForm.dueDay ? Number(createForm.dueDay) : undefined,
        paymentMethod: createForm.paymentMethod || undefined,
        paidAt:        createForm.paidAt ? toISODate(createForm.paidAt) : undefined,
      });
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar cobrança");
      setCreateOpen(false);
      loadBilling(); loadMrr();
    } catch (err) {
      setCreateErrors({ _general: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleEdit() {
    const e: Record<string, string> = {};
    if (!editForm.amount || Number(editForm.amount) <= 0) e.amount = "Valor inválido";
    if (!editForm.currency) e.currency = "Selecione a moeda";
    if (Object.keys(e).length > 0) { setEditErrors(e); return; }

    setEditSubmitting(true);
    try {
      const body = stripEmpty({
        month:         Number(editForm.month),
        year:          Number(editForm.year),
        amount:        Number(editForm.amount),
        currency:      editForm.currency,
        dueDay:        editForm.dueDay ? Number(editForm.dueDay) : undefined,
        paymentMethod: editForm.paymentMethod || undefined,
        paidAt:        editForm.paidAt ? toISODate(editForm.paidAt) : undefined,
        status:        editForm.status || undefined,
      });
      const res = await fetch(`/api/billing/${editingRecord!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erro ao atualizar cobrança");
      setEditingRecord(null);
      loadBilling(); loadMrr();
    } catch (err) {
      setEditErrors({ _general: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handlePay() {
    const e: Record<string, string> = {};
    if (!payForm.paidAt) e.paidAt = "Informe a data de pagamento";
    if (!payForm.paymentMethod) e.paymentMethod = "Selecione o método";
    if (Object.keys(e).length > 0) { setPayErrors(e); return; }

    setPaySubmitting(true);
    try {
      const res = await fetch(`/api/billing/${payingRecord!.id}/pay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAt: toISODate(payForm.paidAt), paymentMethod: payForm.paymentMethod }),
      });
      if (!res.ok) throw new Error("Erro ao registrar pagamento");
      setPayingRecord(null);
      loadBilling(); loadMrr(); loadOverdue();
    } catch (err) {
      setPayErrors({ _general: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      setPaySubmitting(false);
    }
  }

  async function handleOverdue() {
    if (!overdueConfirmId) return;
    setOverdueConfirming(true);
    try {
      await fetch(`/api/billing/${overdueConfirmId}/overdue`, { method: "PATCH" });
      setOverdueConfirmId(null);
      loadBilling(); loadOverdue();
    } finally {
      setOverdueConfirming(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleteSubmitting(true);
    try {
      await fetch(`/api/billing/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      loadBilling(); loadMrr(); loadOverdue();
    } finally {
      setDeleteSubmitting(false);
    }
  }

  async function handleBatch() {
    const e: Record<string, string> = {};
    if (!batchForm.amount || Number(batchForm.amount) <= 0) e.amount = "Valor padrão inválido";
    if (!batchForm.currency) e.currency = "Selecione a moeda";
    if (Object.keys(e).length > 0) { setBatchErrors(e); return; }

    setBatchSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        month:    Number(batchForm.month),
        year:     Number(batchForm.year),
        amount:   Number(batchForm.amount),
        currency: batchForm.currency,
      };
      if (batchPersons.length > 0) body.personIds = batchPersons.map((p) => p.id);

      const res = await fetch("/api/billing/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: BatchResultResponse = await res.json();
      if (!res.ok) throw new Error((data as unknown as { error?: string }).error ?? "Erro ao gerar cobranças");
      setBatchResult(data);
      loadBilling(); loadMrr();
    } catch (err) {
      setBatchErrors({ _general: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      setBatchSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const FILTER_TABS: { key: PaymentStatus | "ALL"; label: string }[] = [
    { key: "ALL",     label: "Todos"    },
    { key: "PENDING", label: "Pendente" },
    { key: "PAID",    label: "Pago"     },
    { key: "OVERDUE", label: "Vencido"  },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Cobranças</h1>
          <p className="text-sm text-muted-foreground">Gerencie as cobranças mensais dos seus clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openBatch} className="gap-1.5">
            <ListChecks className="h-4 w-4" />
            Gerar Cobranças do Mês
          </Button>
          <Button variant="default" size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nova Cobrança
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="MRR do Mês" icon={TrendingUp} iconClass="text-blue-500" loading={mrrLoading}>
          <div className="space-y-0.5">
            <p className="text-2xl font-bold">€{(mrr?.totalEur ?? 0).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">R${(mrr?.totalBrl ?? 0).toFixed(2)}</p>
          </div>
        </SummaryCard>

        <SummaryCard title="Clientes Pagantes" icon={Users} iconClass="text-green-500" loading={mrrLoading}>
          <p className="text-2xl font-bold">{mrr?.totalClients ?? 0}</p>
        </SummaryCard>

        <SummaryCard title="Cobranças Vencidas" icon={AlertTriangle} iconClass="text-red-500" loading={overdueLoading}>
          <p className="text-2xl font-bold text-red-600">{overdueList.length}</p>
        </SummaryCard>

        <SummaryCard title="Pendentes do Mês" icon={Clock} iconClass="text-amber-500" loading={loading}>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
        </SummaryCard>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Month/Year selector */}
        <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_OPTIONS.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          className="w-24"
          value={selectedYear}
          onChange={(e) => {
            const y = Number(e.target.value);
            if (y >= 2020 && y <= 2099) setSelectedYear(y);
          }}
        />

        {/* Quick filter tabs */}
        <div className="flex items-center gap-1 border rounded-md p-0.5">
          {FILTER_TABS.map(({ key, label }) => (
            <Button
              key={key}
              variant={statusFilter === key ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {!loading && (
          <p className="text-sm text-muted-foreground">
            {displayed.length} {displayed.length === 1 ? "cobrança" : "cobranças"}
          </p>
        )}
      </div>

      {loadError && <p className="text-sm text-destructive">{loadError}</p>}

      {/* ── Table ── */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Mês/Ano</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Moeda</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-48" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                  Nenhuma cobrança encontrada
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence mode="popLayout">
                {displayed.map((record, i) => (
                  <MotionTr
                    key={record.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, delay: i * 0.03 }}
                    className="group"
                  >
                    <TableCell className="font-medium whitespace-nowrap">{record.personName}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{record.personWhatsapp}</TableCell>
                    <TableCell className="text-sm">{formatMonthYear(record.month, record.year)}</TableCell>
                    <TableCell className="text-sm font-medium whitespace-nowrap">
                      {formatCurrency(record.amount, record.currency)}
                    </TableCell>
                    <TableCell><CurrencyBadge currency={record.currency} /></TableCell>
                    <TableCell className="text-sm">{record.dueDay ? `Dia ${record.dueDay}` : "—"}</TableCell>
                    <TableCell className="text-sm">
                      {record.paymentMethod ? (METHOD_LABEL[record.paymentMethod] ?? record.paymentMethod) : "—"}
                    </TableCell>
                    <TableCell><StatusBadge status={record.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(record.status === "PENDING" || record.status === "OVERDUE") && (
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={() => openPay(record)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />Pago
                          </Button>
                        )}
                        {record.status === "PENDING" && (
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => setOverdueConfirmId(record.id)}
                          >
                            <XCircle className="h-3.5 w-3.5" />Vencido
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(record)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(record.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </MotionTr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Annual MRR ── */}
      <div className="rounded-md border">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors"
          onClick={toggleAnnual}
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            MRR Anual — {selectedYear}
          </span>
          {annualOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {annualOpen && (
          <div className="border-t px-4 pb-4">
            {annualLoading ? (
              <div className="space-y-2 pt-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : annualError ? (
              <p className="text-sm text-destructive pt-3">{annualError}</p>
            ) : annualMrr ? (
              <>
                <div className="flex gap-6 pt-3 pb-2 text-sm text-muted-foreground">
                  <span>Total anual EUR: <strong className="text-foreground">€{annualMrr.totalEur.toFixed(2)}</strong></span>
                  <span>Total anual BRL: <strong className="text-foreground">R${annualMrr.totalBrl.toFixed(2)}</strong></span>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead>Clientes</TableHead>
                        <TableHead>EUR</TableHead>
                        <TableHead>BRL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {annualMrr.months.map((m) => (
                        <TableRow key={m.month}>
                          <TableCell className="font-medium">{MONTH_SHORT[m.month - 1]}/{m.year}</TableCell>
                          <TableCell>{m.totalClients}</TableCell>
                          <TableCell>€{m.totalEur.toFixed(2)}</TableCell>
                          <TableCell>R${m.totalBrl.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setCreateErrors({}); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Cobrança</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            {createErrors._general && (
              <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{createErrors._general}</p>
            )}

            <div className="space-y-2">
              <Label>Cliente <span className="text-destructive">*</span></Label>
              <PersonSearch
                selected={createPerson}
                onSelect={setCreatePerson}
                onClear={() => setCreatePerson(null)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Mês <span className="text-destructive">*</span></Label>
                <Select value={createForm.month} onValueChange={(v) => setCreateForm((f) => ({ ...f, month: v }))}>
                  <SelectTrigger className={cn(createErrors.month && "border-destructive")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_OPTIONS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FieldError msg={createErrors.month} />
              </div>
              <div className="space-y-1">
                <Label>Ano <span className="text-destructive">*</span></Label>
                <Input
                  type="number" value={createForm.year}
                  onChange={(e) => setCreateForm((f) => ({ ...f, year: e.target.value }))}
                  className={cn(createErrors.year && "border-destructive")}
                />
                <FieldError msg={createErrors.year} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Valor <span className="text-destructive">*</span></Label>
                <Input
                  type="number" min={0} step={0.01} placeholder="0.00"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))}
                  className={cn(createErrors.amount && "border-destructive")}
                />
                <FieldError msg={createErrors.amount} />
              </div>
              <div className="space-y-1">
                <Label>Moeda <span className="text-destructive">*</span></Label>
                <Select value={createForm.currency} onValueChange={(v) => setCreateForm((f) => ({ ...f, currency: v as CurrencyType }))}>
                  <SelectTrigger className={cn(createErrors.currency && "border-destructive")}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR — Euro</SelectItem>
                    <SelectItem value="BRL">BRL — Real</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError msg={createErrors.currency} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Dia de vencimento</Label>
                <Input
                  type="number" min={1} max={31} placeholder="1 – 31"
                  value={createForm.dueDay}
                  onChange={(e) => setCreateForm((f) => ({ ...f, dueDay: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Método de pagamento</Label>
                <Select value={createForm.paymentMethod} onValueChange={(v) => setCreateForm((f) => ({ ...f, paymentMethod: v as PaymentMethod }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                      <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Data de pagamento</Label>
              <p className="text-xs text-muted-foreground -mt-0.5">Se preenchida, a cobrança entra como Pago</p>
              <Input
                type="date" value={createForm.paidAt}
                onChange={(e) => setCreateForm((f) => ({ ...f, paidAt: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createSubmitting}>
              {createSubmitting ? "Criando..." : "Criar Cobrança"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editingRecord} onOpenChange={(o) => { if (!o) { setEditingRecord(null); setEditErrors({}); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cobrança — {editingRecord?.personName}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {editErrors._general && (
              <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{editErrors._general}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Mês</Label>
                <Select value={editForm.month} onValueChange={(v) => setEditForm((f) => ({ ...f, month: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTH_OPTIONS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Ano</Label>
                <Input type="number" value={editForm.year}
                  onChange={(e) => setEditForm((f) => ({ ...f, year: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Valor <span className="text-destructive">*</span></Label>
                <Input
                  type="number" min={0} step={0.01}
                  value={editForm.amount}
                  onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                  className={cn(editErrors.amount && "border-destructive")}
                />
                <FieldError msg={editErrors.amount} />
              </div>
              <div className="space-y-1">
                <Label>Moeda <span className="text-destructive">*</span></Label>
                <Select value={editForm.currency} onValueChange={(v) => setEditForm((f) => ({ ...f, currency: v as CurrencyType }))}>
                  <SelectTrigger className={cn(editErrors.currency && "border-destructive")}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR — Euro</SelectItem>
                    <SelectItem value="BRL">BRL — Real</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError msg={editErrors.currency} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Dia de vencimento</Label>
                <Input type="number" min={1} max={31} value={editForm.dueDay}
                  onChange={(e) => setEditForm((f) => ({ ...f, dueDay: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Método</Label>
                <Select value={editForm.paymentMethod} onValueChange={(v) => setEditForm((f) => ({ ...f, paymentMethod: v as PaymentMethod }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                      <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v as PaymentStatus }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="PAID">Pago</SelectItem>
                    <SelectItem value="OVERDUE">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Data de pagamento</Label>
                <Input type="date" value={editForm.paidAt}
                  onChange={(e) => setEditForm((f) => ({ ...f, paidAt: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecord(null)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={editSubmitting}>
              {editSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Pay Dialog ── */}
      <Dialog open={!!payingRecord} onOpenChange={(o) => { if (!o) { setPayingRecord(null); setPayErrors({}); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-500" />
              Registrar Pagamento
            </DialogTitle>
          </DialogHeader>
          {payingRecord && (
            <p className="text-sm text-muted-foreground -mt-1">
              {payingRecord.personName} — {formatCurrency(payingRecord.amount, payingRecord.currency)} · {formatMonthYear(payingRecord.month, payingRecord.year)}
            </p>
          )}
          <div className="grid gap-4 py-2">
            {payErrors._general && (
              <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{payErrors._general}</p>
            )}
            <div className="space-y-1">
              <Label>Data de pagamento <span className="text-destructive">*</span></Label>
              <Input
                type="date" value={payForm.paidAt}
                onChange={(e) => setPayForm((f) => ({ ...f, paidAt: e.target.value }))}
                className={cn(payErrors.paidAt && "border-destructive")}
              />
              <FieldError msg={payErrors.paidAt} />
            </div>
            <div className="space-y-1">
              <Label>Método de pagamento <span className="text-destructive">*</span></Label>
              <Select value={payForm.paymentMethod} onValueChange={(v) => setPayForm((f) => ({ ...f, paymentMethod: v as PaymentMethod }))}>
                <SelectTrigger className={cn(payErrors.paymentMethod && "border-destructive")}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError msg={payErrors.paymentMethod} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingRecord(null)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handlePay} disabled={paySubmitting}>
              {paySubmitting ? "Registrando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Overdue AlertDialog ── */}
      <AlertDialog open={overdueConfirmId !== null} onOpenChange={(o) => { if (!o) setOverdueConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como Vencido</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar alteração do status para <strong>Vencido</strong>? Esta ação pode ser revertida editando o registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleOverdue}
              disabled={overdueConfirming}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {overdueConfirming ? "Atualizando..." : "Marcar como Vencido"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete AlertDialog ── */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cobrança</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir esta cobrança? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSubmitting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Batch Dialog ── */}
      <Dialog open={batchOpen} onOpenChange={(o) => { setBatchOpen(o); if (!o) { setBatchErrors({}); setBatchResult(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Gerar Cobranças do Mês
            </DialogTitle>
          </DialogHeader>

          {batchResult ? (
            /* ── Result view ── */
            <div className="py-4 space-y-4">
              <div className="rounded-md bg-muted/50 p-4 space-y-2 text-sm">
                <p>
                  <span className="text-green-600 font-semibold">{batchResult.generated} cobrança{batchResult.generated !== 1 ? "s" : ""} gerada{batchResult.generated !== 1 ? "s" : ""}</span>
                  {batchResult.skipped > 0 && (
                    <span className="text-muted-foreground ml-2">· {batchResult.skipped} ignorada{batchResult.skipped !== 1 ? "s" : ""} (já existiam)</span>
                  )}
                </p>
              </div>
              {batchResult.records.length > 0 && (
                <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                  {batchResult.records.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="font-medium">{r.personName}</span>
                      <span className="text-muted-foreground">{formatCurrency(r.amount, r.currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── Form view ── */
            <div className="grid gap-4 py-2">
              {batchErrors._general && (
                <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{batchErrors._general}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Mês</Label>
                  <Select value={batchForm.month} onValueChange={(v) => setBatchForm((f) => ({ ...f, month: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTH_OPTIONS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Ano</Label>
                  <Input type="number" value={batchForm.year}
                    onChange={(e) => setBatchForm((f) => ({ ...f, year: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Valor padrão <span className="text-destructive">*</span></Label>
                  <Input
                    type="number" min={0} step={0.01} placeholder="0.00"
                    value={batchForm.amount}
                    onChange={(e) => setBatchForm((f) => ({ ...f, amount: e.target.value }))}
                    className={cn(batchErrors.amount && "border-destructive")}
                  />
                  <FieldError msg={batchErrors.amount} />
                </div>
                <div className="space-y-1">
                  <Label>Moeda padrão <span className="text-destructive">*</span></Label>
                  <Select value={batchForm.currency} onValueChange={(v) => setBatchForm((f) => ({ ...f, currency: v as CurrencyType }))}>
                    <SelectTrigger className={cn(batchErrors.currency && "border-destructive")}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR — Euro</SelectItem>
                      <SelectItem value="BRL">BRL — Real</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError msg={batchErrors.currency} />
                </div>
              </div>

              {/* Person selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Clientes específicos</Label>
                  <span className="text-xs text-muted-foreground">
                    {batchPersons.length === 0 ? "Todos os clientes ativos" : `${batchPersons.length} selecionado${batchPersons.length !== 1 ? "s" : ""}`}
                  </span>
                </div>

                {batchPersons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {batchPersons.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-0.5"
                      >
                        {p.name}
                        <button onClick={() => toggleBatchPerson(p)} className="hover:text-destructive ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Buscar cliente para adicionar..."
                    value={batchSearchQuery}
                    onChange={(e) => setBatchSearchQuery(e.target.value)}
                  />
                </div>

                {batchSearchLoading && <p className="text-xs text-muted-foreground pl-1">Buscando...</p>}
                {batchSearchResults.length > 0 && (
                  <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                    {batchSearchResults.map((p) => {
                      const checked = batchPersons.some((bp) => bp.id === p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleBatchPerson(p)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.whatsapp}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {batchResult ? (
              <Button onClick={() => setBatchOpen(false)}>Fechar</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setBatchOpen(false)}>Cancelar</Button>
                <Button onClick={handleBatch} disabled={batchSubmitting}>
                  {batchSubmitting ? "Gerando..." : "Gerar Cobranças"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
