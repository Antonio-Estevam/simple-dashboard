"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, CalendarClock, Plus, Trash2, Pencil, AlertCircle,
  Clock, ArrowRightCircle, CheckCircle2, XCircle,
  Snowflake, RefreshCcw, Search, CheckCheck, MessageSquareOff, Ban, RectangleEllipsis,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FollowUp {
  id: number;
  personId: number;
  name: string;
  whatsapp: string;
  email: string | null;
  type: FollowUpType;
  status: FollowUpStatus;
  observations: string | null;
  nextActionDate: string | null;
  lastAttemptDate: string | null;
  createdAt: string | null;
}

interface PersonSearchResult {
  id: number;
  name: string;
  whatsapp: string;
  email: string | null;
  state: string;
}

type FollowUpStatus = "WAITING" | "IN_PROGRESS" | "CONVERTED" | "DISCARDED";
type FollowUpType   = "UNANSWERED_PROPOSAL" | "COLD_LEAD"| "RENEWAL_PENDING"| "INACTIVE"| "OTHER" ;
type FollowUpFilter = "ALL" | "DUE_TODAY" | FollowUpStatus | FollowUpType;

interface ScratchForm {
  name: string; whatsapp: string; email: string;
  birthDate: string; source: string;
  type: FollowUpType | ""; observations: string;
  nextActionDate: string; lastAttemptDate: string;
}

interface LinkForm {
  type: FollowUpType | ""; observations: string;
  nextActionDate: string; lastAttemptDate: string;
}

interface EditForm {
  type: FollowUpType | ""; status: FollowUpStatus | "";
  observations: string; nextActionDate: string; lastAttemptDate: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<FollowUpStatus, { label: string; icon: React.ElementType; badgeClass: string; iconClass: string }> = {
  WAITING:     { label: "Aguardando",   icon: Clock,            badgeClass: "bg-amber-100 text-amber-700 border-amber-200",   iconClass: "text-amber-500"   },
  IN_PROGRESS: { label: "Em Andamento", icon: ArrowRightCircle, badgeClass: "bg-blue-100 text-blue-700 border-blue-200",      iconClass: "text-blue-500"    },
  CONVERTED:   { label: "Convertido",   icon: CheckCircle2,     badgeClass: "bg-green-100 text-green-700 border-green-200",   iconClass: "text-green-500"   },
  DISCARDED:   { label: "Descartado",   icon: XCircle,          badgeClass: "bg-red-100 text-red-700 border-red-200",         iconClass: "text-red-500"     },
};

const TYPE_CONFIG: Record<FollowUpType, { label: string; icon: React.ElementType; badgeClass: string; iconClass: string }> = {
  COLD_LEAD:             { label: "Lead Frio",  icon: Snowflake,  badgeClass: "bg-sky-100 text-sky-700 border-sky-200",          iconClass: "text-sky-500"     },
  UNANSWERED_PROPOSAL: { label: "Proposta não respondida", icon: MessageSquareOff, badgeClass: "bg-orange-100 text-orange-700 border-orange-200", iconClass: "text-orange-500"  },
  RENEWAL_PENDING: { label: "Renovação pendente", icon: RefreshCcw, badgeClass: "bg-violet-100 text-violet-700 border-violet-200", iconClass: "text-violet-500"  },
  INACTIVE: { label: "Inativo", icon: Ban, badgeClass: "bg-red-100 text-red-700 border-red-200", iconClass: "text-red-500"  },
  OTHER: { label: "Outros", icon: RectangleEllipsis, badgeClass: "bg-blue-100 text-blue-700 border-blue-200", iconClass: "text-blue-500"  },
};

const ALL_STATUSES: FollowUpStatus[] = ["WAITING", "IN_PROGRESS", "CONVERTED", "DISCARDED"];
const ALL_TYPES: FollowUpType[]      = [ "COLD_LEAD" , "UNANSWERED_PROPOSAL", "RENEWAL_PENDING", "INACTIVE", "OTHER"];

const SOURCE_OPTIONS = [
  { value: "INSTAGRAM",            label: "Instagram"            },
  { value: "REFERRAL",             label: "Indicação"            },
  { value: "IN_PERSON_ASSESSMENT", label: "Avaliação presencial" },
  { value: "OTHER",                label: "Outro"                },
];

const EMPTY_SCRATCH: ScratchForm = {
  name: "", whatsapp: "", email: "", birthDate: "", source: "",
  type: "", observations: "", nextActionDate: "", lastAttemptDate: "",
};

const EMPTY_LINK: LinkForm = { type: "", observations: "", nextActionDate: "", lastAttemptDate: "" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function maskWhatsApp(input: string): string {
  const isIntl = input.startsWith("+");
  const digits = input.replace(/\D/g, "").slice(0, 13);
  if (!digits) return isIntl ? "+" : "";
  if (isIntl) {
    if (digits.length <= 2) return `+${digits}`;
    if (digits.length <= 4) return `+${digits.slice(0, 2)} (${digits.slice(2)}`;
    if (digits.length <= 9) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  } else {
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
}

function fetchUrl(filter: FollowUpFilter): string {
  if (filter === "DUE_TODAY") return "/api/follow-up/due-today";
  if (filter === "ALL") return "/api/follow-up";
  if (ALL_STATUSES.includes(filter as FollowUpStatus)) return `/api/follow-up?status=${filter}`;
  return `/api/follow-up?type=${filter}`;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function nullEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]));
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];  
}

function getFilterDisplay(filter: FollowUpFilter): { icon: React.ElementType; iconClass: string; label: string } {
  if (filter === "ALL")       return { icon: Users,        iconClass: "text-muted-foreground", label: "Todos os follow-ups" };
  if (filter === "DUE_TODAY") return { icon: CalendarClock, iconClass: "text-orange-500",      label: "Ação para hoje"      };
  if (ALL_STATUSES.includes(filter as FollowUpStatus)) {
    const c = STATUS_CONFIG[filter as FollowUpStatus];
    if (c) return { icon: c.icon, iconClass: c.iconClass, label: c.label };
  }
  const c = TYPE_CONFIG[filter as FollowUpType];
  if (c) return { icon: c.icon, iconClass: c.iconClass, label: c.label };
  return { icon: Users, iconClass: "text-muted-foreground", label: filter };
}

function validateScratch(f: ScratchForm): Record<string, string> {
  const e: Record<string, string> = {};
  const today = todayStr();
  if (!f.name.trim()) e.name = "Nome é obrigatório";
  else if (f.name.trim().length < 2) e.name = "Mínimo 2 caracteres";
  if (!f.email.trim()) e.email = "E-mail é obrigatório";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "E-mail inválido";
  if (!f.whatsapp.trim()) e.whatsapp = "WhatsApp é obrigatório";
  else if (f.whatsapp.replace(/\D/g, "").length < 10) e.whatsapp = "Número inválido (mínimo 10 dígitos)";
  if (!f.birthDate) e.birthDate = "Nascimento é obrigatório";
  if (!f.source) e.source = "Selecione a fonte";
  if (!f.type) e.type = "Selecione o tipo";
  if (!f.nextActionDate) e.nextActionDate = "Próximo contato é obrigatório";
  else if (f.nextActionDate <= today) e.nextActionDate = "Próximo contato deve ser uma data futura";
  if (f.lastAttemptDate && f.lastAttemptDate >= today) e.lastAttemptDate = "Último contato deve ser uma data passada";
  return e;
}

function validateLink(f: LinkForm): Record<string, string> {
  const e: Record<string, string> = {};
  const today = todayStr();  
  if (!f.type) e.type = "Selecione o tipo";
  if (!f.nextActionDate) e.nextActionDate = "Próximo contato é obrigatório";
  else if (f.nextActionDate <= today) e.nextActionDate = "Próximo contato deve ser uma data futura";
  if (f.lastAttemptDate && f.lastAttemptDate >= today) e.lastAttemptDate = "Último contato deve ser uma data passada";
  return e;
}

function validateEdit(f: EditForm): Record<string, string> {
  const e: Record<string, string> = {};
  const today = todayStr();
  if (!f.type) e.type = "Selecione o tipo";
  if (!f.nextActionDate) e.nextActionDate = "Próximo contato é obrigatório";
  else if /*(f.nextActionDate <= today) e.nextActionDate = "Próximo contato deve ser uma data futura";
  if*/ (f.lastAttemptDate && f.lastAttemptDate >= today) e.lastAttemptDate = "Último contato deve ser uma data passada";
  return e;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as FollowUpStatus];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  const { icon: Icon, label, badgeClass } = cfg;
  return (
    <Badge variant="default" className={`gap-1 ${badgeClass}`}>
      <Icon className="h-3 w-3" />{label}
    </Badge>
  );
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type as FollowUpType];
  if (!cfg) return <Badge variant="outline">{type}</Badge>;
  const { icon: Icon, label, badgeClass } = cfg;
  return (
    <Badge variant="outline" className={`gap-1 ${badgeClass}`}>
      <Icon className="h-3 w-3" />{label}
    </Badge>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="h-3 w-3 shrink-0" />{msg}
    </p>
  );
}

function FollowUpContextFields({
  type, observations, nextActionDate, lastAttemptDate, errors, showStatus, status, onChange,
}: {
  type: FollowUpType | ""; observations: string; nextActionDate: string; lastAttemptDate: string;
  errors: Record<string, string>; showStatus?: boolean; status?: FollowUpStatus | "";
  onChange: (patch: Partial<EditForm>) => void;
}) {
  return (
    <>
      <div className={cn("grid gap-4", showStatus ? "grid-cols-1 sm:grid-cols-2" : "")}>
        <div className="space-y-1">
          <Label>Tipo <span className="text-destructive">*</span></Label>
          <Select value={type} onValueChange={(v) => onChange({ type: v as FollowUpType })}>
            <SelectTrigger className={cn(errors.type && "border-destructive")}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {ALL_TYPES.map((t) => {
                const { icon: Icon, label, iconClass } = TYPE_CONFIG[t];
                return (
                  <SelectItem key={t} value={t}>
                    <span className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${iconClass}`} /><span>{label}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <FieldError msg={errors.type} />
        </div>

        {showStatus && (
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status ?? ""} onValueChange={(v) => onChange({ status: v as FollowUpStatus })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => {
                  const { icon: Icon, label, iconClass } = STATUS_CONFIG[s];
                  return (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${iconClass}`} /><span>{label}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Próximo contato <span className="text-destructive">*</span></Label>
          <Input type="date" value={nextActionDate} onChange={(e) => onChange({ nextActionDate: e.target.value })}
            className={cn(errors.nextActionDate && "border-destructive focus-visible:ring-destructive")} />
          <FieldError msg={errors.nextActionDate} />
        </div>
        <div className="space-y-1">
          <Label>Último contato</Label>
          <Input type="date" value={lastAttemptDate} onChange={(e) => onChange({ lastAttemptDate: e.target.value })}
            className={cn(errors.lastAttemptDate && "border-destructive focus-visible:ring-destructive")} />
          <FieldError msg={errors.lastAttemptDate} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Observações</Label>
        <Textarea value={observations} onChange={(e) => onChange({ observations: e.target.value })} rows={3} />
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const MotionTr = motion(TableRow);

export default function FollowUpPage() {
  const [records,     setRecords]     = useState<FollowUp[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState<string | null>(null);
  const [activeFilter,setActiveFilter]= useState<FollowUpFilter>("ALL");

  // Multi-select
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Create dialog
  const [createOpen,       setCreateOpen]       = useState(false);
  const [createTab,        setCreateTab]        = useState<"scratch" | "link">("scratch");
  const [scratchForm,      setScratchForm]      = useState<ScratchForm>(EMPTY_SCRATCH);
  const [scratchErrors,    setScratchErrors]    = useState<Record<string, string>>({});
  const [linkForm,         setLinkForm]         = useState<LinkForm>(EMPTY_LINK);
  const [linkErrors,       setLinkErrors]       = useState<Record<string, string>>({});
  const [searchQuery,      setSearchQuery]      = useState("");
  const [searchResults,    setSearchResults]    = useState<PersonSearchResult[]>([]);
  const [searchLoading,    setSearchLoading]    = useState(false);
  const [selectedPerson,   setSelectedPerson]   = useState<PersonSearchResult | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Edit dialog
  const [editingRecord, setEditingRecord] = useState<FollowUp | null>(null);
  const [editForm,      setEditForm]      = useState<EditForm>({ type: "", status: "", observations: "", nextActionDate: "", lastAttemptDate: "" });
  const [editErrors,    setEditErrors]    = useState<Record<string, string>>({});
  const [editSubmitting,setEditSubmitting]= useState(false);

  // Delete
  const [deleteIds,        setDeleteIds]        = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Inline status change
  const [pendingStatus, setPendingStatus] = useState<{ id: number; status: FollowUpStatus } | null>(null);

  // Bulk status edit
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkStatus,   setBulkStatus]   = useState<FollowUpStatus>("WAITING");

  // Convert confirmation
  const [convertingId,   setConvertingId]   = useState<number | null>(null);
  const [convertingName, setConvertingName] = useState("");
  const [converting,     setConverting]     = useState(false);
  const [convertError,   setConvertError]   = useState<string | null>(null);

  // Discard confirmation
  const [discardingId,   setDiscardingId]   = useState<number | null>(null);
  const [discardingName, setDiscardingName] = useState("");
  const [discarding,     setDiscarding]     = useState(false);
  const [discardError,   setDiscardError]   = useState<string | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────

  function loadRecords() {
    setLoading(true);
    setLoadError(null);
    fetch(fetchUrl(activeFilter))
      .then((r) => { if (!r.ok) throw new Error("Falha ao carregar follow-ups"); return r.json(); })
      .then((data) => { setRecords(Array.isArray(data) ? data : []); setSelected(new Set()); setLoading(false); })
      .catch((err: Error) => { setLoadError(err.message); setLoading(false); });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadRecords(); }, [activeFilter]);

  // ── Person search (debounced) ─────────────────────────────────────────────

  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      setSearchLoading(true);
      fetch(`/api/follow-up/persons/search?name=${encodeURIComponent(searchQuery.trim())}`)
        .then((r) => r.json())
        .then((data) => { setSearchResults(Array.isArray(data) ? data : []); setSearchLoading(false); })
        .catch(() => { setSearchResults([]); setSearchLoading(false); });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Selection ─────────────────────────────────────────────────────────────

  const allSelected = records.length > 0 && selected.size === records.length;
  function toggleAll() { setSelected(allSelected ? new Set() : new Set(records.map((r) => r.id))); }
  function toggleOne(id: number) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  // ── Openers ───────────────────────────────────────────────────────────────

  function openCreate() {
    setScratchForm(EMPTY_SCRATCH);
    setScratchErrors({});
    setLinkForm(EMPTY_LINK);
    setLinkErrors({});
    setSearchQuery("");
    setSearchResults([]);
    setSelectedPerson(null);
    setCreateTab("scratch");
    setCreateOpen(true);
  }

  function openEdit(record: FollowUp) {
    setEditingRecord(record);
    setEditForm({
      type:            record.type,
      status:          record.status,
      observations:           record.observations ?? "",
      nextActionDate: record.nextActionDate?.split("T")[0] ?? "",
      lastAttemptDate: record.lastAttemptDate?.split("T")[0] ?? "",
    });
    setEditErrors({});
  }

  function confirmDelete(ids: number[]) { setDeleteIds(ids); setDeleteDialogOpen(true); }

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleCreateScratch() {
    const errors = validateScratch(scratchForm);
    if (Object.keys(errors).length > 0) { setScratchErrors(errors); return; }
    setCreateSubmitting(true);
    try {
      const body = nullEmpty(scratchForm as unknown as Record<string, unknown>);
      const res = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar follow-up");
      setCreateOpen(false);
      loadRecords();
    } catch (e) {
      setScratchErrors({ _general: e instanceof Error ? e.message : "Erro desconhecido" });
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleCreateLink() {
    if (!selectedPerson) { setLinkErrors({ _general: "Selecione uma pessoa para vincular" }); return; }
    const errors = validateLink(linkForm);
    if (Object.keys(errors).length > 0) { setLinkErrors(errors); return; }
    setCreateSubmitting(true);
    try {
      const body = nullEmpty({ ...linkForm, personId: selectedPerson.id } as unknown as Record<string, unknown>);
      const res = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao vincular pessoa ao follow-up");
      setCreateOpen(false);
      loadRecords();
    } catch (e) {
      setLinkErrors({ _general: e instanceof Error ? e.message : "Erro desconhecido" });
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleEdit() {
    const errors = validateEdit(editForm);
    if (Object.keys(errors).length > 0) { setEditErrors(errors); return; }
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/follow-up/${editingRecord!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nullEmpty(editForm as unknown as Record<string, unknown>)),
      });
      if (!res.ok) throw new Error("Erro ao atualizar follow-up");
      setEditingRecord(null);
      loadRecords();
    } catch (e) {
      setEditErrors({ _general: e instanceof Error ? e.message : "Erro desconhecido" });
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete() {
    await Promise.all(deleteIds.map((id) => fetch(`/api/follow-up/${id}`, { method: "DELETE" })));
    setDeleteDialogOpen(false);
    setDeleteIds([]);
    loadRecords();
  }

  async function handleInlineStatus() {
    if (!pendingStatus) return;
    await fetch(`/api/follow-up/${pendingStatus.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: pendingStatus.status }),
    });
    setPendingStatus(null);
    loadRecords();
  }

  async function handleBulkEdit() {
    await Promise.all(Array.from(selected).map((id) =>
      fetch(`/api/follow-up/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: bulkStatus }),
      })
    ));
    setBulkEditOpen(false);
    loadRecords();
  }

  async function handleConvert() {
    if (!convertingId) return;
    setConverting(true);
    setConvertError(null);
    try {
      const res = await fetch(`/api/follow-up/${convertingId}/convert`, { method: "PATCH" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao converter follow-up");
      setConvertingId(null);
      loadRecords();
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setConverting(false);
    }
  }

  async function handleDiscard() {
    if (!discardingId) return;
    setDiscarding(true);
    setDiscardError(null);
    try {
      const res = await fetch(`/api/follow-up/${discardingId}/discard`, { method: "PATCH" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao descartar follow-up");
      setDiscardingId(null);
      loadRecords();
    } catch (e) {
      setDiscardError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setDiscarding(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const filterDisplay = getFilterDisplay(activeFilter);
  const FilterIcon = filterDisplay.icon;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Follow-up</h1>
        <p className="text-sm text-muted-foreground">Gerencie leads frios e inativos em processo de reativação</p>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as FollowUpFilter)}>
          <SelectTrigger className="w-56">
            <SelectValue>
              <span className="flex items-center gap-2">
                <FilterIcon className={`h-4 w-4 ${filterDisplay.iconClass}`} />
                <span>{filterDisplay.label}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              <span className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span>Todos os follow-ups</span></span>
            </SelectItem>
            <SelectItem value="DUE_TODAY">
              <span className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-orange-500" /><span>Ação para hoje</span></span>
            </SelectItem>

            <div className="px-2 pt-2 pb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
            </div>
            {ALL_STATUSES.map((s) => {
              const { icon: Icon, label, iconClass } = STATUS_CONFIG[s];
              return (
                <SelectItem key={s} value={s}>
                  <span className="flex items-center gap-2"><Icon className={`h-4 w-4 ${iconClass}`} /><span>{label}</span></span>
                </SelectItem>
              );
            })}

            <div className="px-2 pt-2 pb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo</p>
            </div>
            {ALL_TYPES.map((t) => {
              const { icon: Icon, label, iconClass } = TYPE_CONFIG[t];
              return (
                <SelectItem key={t} value={t}>
                  <span className="flex items-center gap-2"><Icon className={`h-4 w-4 ${iconClass}`} /><span>{label}</span></span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {!loading && (
          <p className="text-sm text-muted-foreground">
            {records.length} {records.length === 1 ? "registro" : "registros"} encontrado{records.length !== 1 ? "s" : ""}
          </p>
        )}

        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => { setBulkStatus("WAITING"); setBulkEditOpen(true); }} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Editar {selected.size}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => confirmDelete(Array.from(selected))}className="gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                Excluir {selected.size}
              </Button>
            </>
          )}
          <Button variant="default" size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo Follow-up
          </Button>
        </div>
      </div>

      {loadError && <p className="text-sm text-destructive">{loadError}</p>}

      {/* ── Table ── */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Selecionar todos" />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Próx. Contato</TableHead>
              <TableHead>Último Contato</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="w-36" />
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
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                  Nenhum follow-up encontrado
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence mode="popLayout">
                {records.map((record, i) => (
                  <MotionTr
                    key={record.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, delay: i * 0.03 }}
                    data-selected={selected.has(record.id)}
                    className="group data-[selected=true]:bg-muted/50"
                  >
                    <TableCell>
                      <Checkbox checked={selected.has(record.id)} onCheckedChange={() => toggleOne(record.id)} />
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{record.name}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{record.whatsapp}</TableCell>
                    <TableCell><TypeBadge type={record.type} /></TableCell>
                    <TableCell>
                      <Select
                        value={record.status}
                        onValueChange={(v) => setPendingStatus({ id: record.id, status: v as FollowUpStatus })}
                      >
                        <SelectTrigger className="h-7 w-auto border-0 px-0 shadow-none focus:ring-0 bg-transparent">
                          <StatusBadge status={record.status} />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_STATUSES.map((s) => {
                            const { icon: Icon, label, iconClass } = STATUS_CONFIG[s];
                            return (
                              <SelectItem key={s} value={s}>
                                <span className="flex items-center gap-2">
                                  <Icon className={`h-4 w-4 ${iconClass}`} /><span>{label}</span>
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatDate(record.nextActionDate)}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatDate(record.lastAttemptDate)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate" title={record.observations ?? ""}>
                      {record.observations || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(record)} aria-label="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {record.status !== "CONVERTED" && record.status !== "DISCARDED" && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={() => { setConvertingId(record.id); setConvertingName(record.name); setConvertError(null); }}
                            aria-label="Converter"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {record.status !== "DISCARDED" && record.status !== "CONVERTED" && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => { setDiscardingId(record.id); setDiscardingName(record.name); setDiscardError(null); }}
                            aria-label="Descartar"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDelete([record.id])} aria-label="Excluir"
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

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setScratchErrors({}); setLinkErrors({}); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Follow-up</DialogTitle>
          </DialogHeader>

          <Tabs value={createTab} onValueChange={(v) => setCreateTab(v as "scratch" | "link")}>
            <TabsList className="w-full">
              <TabsTrigger value="scratch" className="flex-1">Novo do zero</TabsTrigger>
              <TabsTrigger value="link" className="flex-1">Vincular pessoa</TabsTrigger>
            </TabsList>

            {/* ── Tab: from scratch ── */}
            <TabsContent value="scratch" className="mt-0">
              <div className="grid gap-4 py-3">
                {scratchErrors._general && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{scratchErrors._general}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Nome <span className="text-destructive">*</span></Label>
                    <Input
                      value={scratchForm.name}
                      onChange={(e) => setScratchForm((f) => ({ ...f, name: e.target.value }))}
                      className={cn(scratchErrors.name && "border-destructive focus-visible:ring-destructive")}
                    />
                    <FieldError msg={scratchErrors.name} />
                  </div>
                  <div className="space-y-1">
                    <Label>WhatsApp <span className="text-destructive">*</span></Label>
                    <Input
                      value={scratchForm.whatsapp}
                      onChange={(e) => setScratchForm((f) => ({ ...f, whatsapp: maskWhatsApp(e.target.value) }))}
                      placeholder="+55 (11) 99999-9999"
                      className={cn(scratchErrors.whatsapp && "border-destructive focus-visible:ring-destructive")}
                    />
                    <FieldError msg={scratchErrors.whatsapp} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>E-mail <span className="text-destructive">*</span></Label>
                  <Input
                    type="email" value={scratchForm.email}
                    onChange={(e) => setScratchForm((f) => ({ ...f, email: e.target.value }))}
                    className={cn(scratchErrors.email && "border-destructive focus-visible:ring-destructive")}
                  />
                  <FieldError msg={scratchErrors.email} />
                </div>

                <div className="space-y-1">
                  <Label>Nascimento <span className="text-destructive">*</span></Label>
                  <Input
                    type="date" value={scratchForm.birthDate}
                    onChange={(e) => setScratchForm((f) => ({ ...f, birthDate: e.target.value }))}
                    className={cn(scratchErrors.birthDate && "border-destructive focus-visible:ring-destructive")}
                  />
                  <FieldError msg={scratchErrors.birthDate} />
                </div>

                <div className="space-y-1">
                  <Label>Fonte <span className="text-destructive">*</span></Label>
                  <Select value={scratchForm.source} onValueChange={(v) => setScratchForm((f) => ({ ...f, source: v }))}>
                    <SelectTrigger className={cn(scratchErrors.source && "border-destructive")}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError msg={scratchErrors.source} />
                </div>

                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Contexto do follow-up</p>
                  <div className="grid gap-4">
                    <FollowUpContextFields
                      type={scratchForm.type}
                      observations={scratchForm.observations}
                      nextActionDate={scratchForm.nextActionDate}
                      lastAttemptDate={scratchForm.lastAttemptDate}
                      errors={scratchErrors}
                      onChange={(patch) => setScratchForm((f) => ({ ...f, ...patch }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateScratch} disabled={createSubmitting}>
                  {createSubmitting ? "Criando..." : "Criar Follow-up"}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* ── Tab: link existing person ── */}
            <TabsContent value="link" className="mt-0">
              <div className="grid gap-4 py-3">
                {linkErrors._general && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{linkErrors._general}</p>
                )}

                <div className="space-y-2">
                  <Label>Buscar lead ou inativo</Label>
                  {selectedPerson ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/40">
                      <CheckCheck className="h-4 w-4 text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedPerson.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedPerson.whatsapp}
                          {selectedPerson.state ? ` · ${selectedPerson.state}` : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => { setSelectedPerson(null); setSearchQuery(""); setSearchResults([]); }}
                      >
                        Trocar
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-8"
                          placeholder="Digite o nome (mín. 2 caracteres)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      {searchLoading && <p className="text-xs text-muted-foreground pl-1">Buscando...</p>}
                      {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                        <p className="text-xs text-muted-foreground pl-1">Nenhum lead ou inativo encontrado</p>
                      )}
                      {searchResults.length > 0 && (
                        <div className="border rounded-md divide-y max-h-44 overflow-y-auto">
                          {searchResults.map((p) => (
                            <button
                              key={p.id}
                              className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors"
                              onClick={() => { setSelectedPerson(p); setSearchResults([]); }}
                            >
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {p.whatsapp}
                                {p.email ? ` · ${p.email}` : ""}
                                {p.state ? ` · ${p.state}` : ""}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {selectedPerson && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Contexto do follow-up</p>
                    <div className="grid gap-4">
                      <FollowUpContextFields
                        type={linkForm.type}
                        observations={linkForm.observations}
                        nextActionDate={linkForm.nextActionDate}
                        lastAttemptDate={linkForm.lastAttemptDate}
                        errors={linkErrors}
                        onChange={(patch) => setLinkForm((f) => ({ ...f, ...patch }))}
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateLink} disabled={createSubmitting || !selectedPerson}>
                  {createSubmitting ? "Vinculando..." : "Vincular ao Follow-up"}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editingRecord} onOpenChange={(o) => { if (!o) { setEditingRecord(null); setEditErrors({}); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Follow-up — {editingRecord?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {editErrors._general && (
              <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{editErrors._general}</p>
            )}
            <FollowUpContextFields
              type={editForm.type}
              status={editForm.status}
              observations={editForm.observations}
              nextActionDate={editForm.nextActionDate}
              lastAttemptDate={editForm.lastAttemptDate}
              errors={editErrors}
              showStatus
              onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecord(null)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={editSubmitting}>
              {editSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete AlertDialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {deleteIds.length === 1 ? "follow-up" : `${deleteIds.length} follow-ups`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteIds.length === 1
                ? "Você tem certeza que deseja excluir este follow-up? A pessoa não será removida."
                : `Você tem certeza que deseja excluir ${deleteIds.length} follow-ups? As pessoas não serão removidas.`}{" "}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Status Edit Dialog ── */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar {selected.size} {selected.size === 1 ? "follow-up" : "follow-ups"}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Alterar status para</Label>
            <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as FollowUpStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => {
                  const { icon: Icon, label, iconClass } = STATUS_CONFIG[s];
                  return (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${iconClass}`} /><span>{label}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>Cancelar</Button>
            <Button variant="outline" onClick={handleBulkEdit}>Aplicar a todos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Inline Status AlertDialog ── */}
      <AlertDialog open={!!pendingStatus} onOpenChange={(o) => !o && setPendingStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar status</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus && (
                <>Confirmar alteração para <strong>{STATUS_CONFIG[pendingStatus.status].label}</strong>?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleInlineStatus}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Convert AlertDialog ── */}
      <AlertDialog open={convertingId !== null} onOpenChange={(o) => { if (!o) { setConvertingId(null); setConvertError(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Converter follow-up</AlertDialogTitle>
            <AlertDialogDescription>
              Marcar <strong>{convertingName}</strong> como convertido?{" "}
              Este follow-up ficará como <strong>Convertido</strong> e a pessoa poderá ser cadastrada como cliente ativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {convertError && <p className="text-sm text-destructive px-1">{convertError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvert}
              disabled={converting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {converting ? "Convertendo..." : "Confirmar Conversão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Discard AlertDialog ── */}
      <AlertDialog open={discardingId !== null} onOpenChange={(o) => { if (!o) { setDiscardingId(null); setDiscardError(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar follow-up</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja descartar o follow-up de <strong>{discardingName}</strong>?{" "}
              O registro ficará marcado como descartado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {discardError && <p className="text-sm text-destructive px-1">{discardError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              disabled={discarding}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {discarding ? "Descartando..." : "Descartar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}