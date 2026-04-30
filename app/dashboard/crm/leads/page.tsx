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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, MessageCircle, Send, CheckCircle2, XCircle,
  Users, CalendarClock, Plus, Trash2, Pencil, AlertCircle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Lead {
  id: number;
  name: string;
  whatsapp: string;
  source: string;
  notes: string;
  planInterest: string;
  goal: string;
  status: Status;
  lossReason: string | null;
  scriptUsed: string;
  firstContactDate: string;
  nextContactDate: string;
}

type Status = "NEW" | "IN_CONVERSATION" | "PROPOSAL_SENT" | "CLOSED" | "LOST";
type Filter = Status | "ALL" | "DUE_TODAY";

interface FormValues {
  name: string;
  whatsapp: string;
  email: string;
  birthDate: string;
  source: string;
  notes: string;
  planInterest: string;
  goal: string;
  status: Status | "";
  scriptUsed: string;
  firstContactDate: string;
  nextContactDate: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; badgeClass: string; iconClass: string }> = {
  NEW:            { label: "Novo",             icon: Sparkles,      badgeClass: "bg-blue-100 text-blue-700 border-blue-200",     iconClass: "text-blue-500"   },
  IN_CONVERSATION:{ label: "Em Conversa",      icon: MessageCircle, badgeClass: "bg-amber-100 text-amber-700 border-amber-200",  iconClass: "text-amber-500"  },
  PROPOSAL_SENT:  { label: "Proposta Enviada", icon: Send,          badgeClass: "bg-purple-100 text-purple-700 border-purple-200",iconClass: "text-purple-500" },
  CLOSED:         { label: "Fechado",          icon: CheckCircle2,  badgeClass: "bg-green-100 text-green-700 border-green-200",  iconClass: "text-green-500"  },
  LOST:           { label: "Perdido",          icon: XCircle,       badgeClass: "bg-red-100 text-red-700 border-red-200",        iconClass: "text-red-500"    },
};

const ALL_STATUSES: Status[] = ["NEW", "IN_CONVERSATION", "PROPOSAL_SENT", "CLOSED", "LOST"];

const SOURCE_OPTIONS = [
  { value: "INSTAGRAM",           label: "Instagram"            },
  { value: "REFERRAL",            label: "Indicação"            },
  { value: "IN_PERSON_ASSESSMENT",label: "Avaliação presencial" },
  { value: "OTHER",               label: "Outro"                },
];

const PLAN_OPTIONS = [
  { value: "BASIC",        label: "Básico"        },
  { value: "INTERMEDIATE", label: "Intermediário" },
  { value: "PREMIUM",      label: "Premium"       },
];

const SOURCE_LABEL: Record<string, string> = Object.fromEntries(SOURCE_OPTIONS.map((o) => [o.value, o.label]));
const PLAN_LABEL:   Record<string, string> = Object.fromEntries(PLAN_OPTIONS.map((o)   => [o.value, o.label]));

const EMPTY_FORM: FormValues = {
  name: "", whatsapp: "", email: "", birthDate: "",
  source: "", notes: "", planInterest: "", goal: "", status: "",
  scriptUsed: "", firstContactDate: "", nextContactDate: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== ""));
}

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

function fetchUrl(filter: Filter): string {
  if (filter === "DUE_TODAY") return "/api/leads/due-today";
  if (filter === "ALL") return "/api/leads";
  return `/api/leads?status=${filter}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function validateForm(form: FormValues, showPersonFields = true): Record<string, string> {
  const e: Record<string, string> = {};
  if (!form.name.trim())              e.name        = "Nome é obrigatório";
  else if (form.name.trim().length < 2) e.name      = "Mínimo 2 caracteres";
  if (!form.whatsapp.trim())          e.whatsapp    = "WhatsApp é obrigatório";
  else if (form.whatsapp.replace(/\D/g, "").length < 10)
                                       e.whatsapp   = "Número inválido (mínimo 10 dígitos)";
  if (!form.source)                   e.source      = "Selecione a fonte";
  if (!form.planInterest)             e.planInterest= "Selecione um plano";
  if (showPersonFields) {
    if (!form.email.trim())           e.email       = "E-mail é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "E-mail inválido";
    if (!form.birthDate)              e.birthDate   = "Nascimento é obrigatório";
  }
  return e;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const { icon: Icon, label, badgeClass } = STATUS_CONFIG[status];
  return (
    <Badge variant="default" className={`gap-1 ${badgeClass}`}>
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

function LeadFormFields({
  form, errors, onChange, showStatus = false, showPersonFields = true,
}: {
  form: FormValues;
  errors: Record<string, string>;
  onChange: (patch: Partial<FormValues>) => void;
  showStatus?: boolean;
  showPersonFields?: boolean;
}) {
  return (
    <div className="grid gap-4 py-2">
      {errors._general && (
        <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{errors._general}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="lf-name">Nome <span className="text-destructive">*</span></Label>
          <Input
            id="lf-name"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError msg={errors.name} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="lf-whatsapp">WhatsApp <span className="text-destructive">*</span></Label>
          <Input
            id="lf-whatsapp"
            value={form.whatsapp}
            onChange={(e) => onChange({ whatsapp: maskWhatsApp(e.target.value) })}
            placeholder="+55 (11) 99999-9999"
            className={cn(errors.whatsapp && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError msg={errors.whatsapp} />
        </div>
      </div>

      {showPersonFields && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="lf-email">E-mail <span className="text-destructive">*</span></Label>
              <Input
                id="lf-email"
                type="email"
                value={form.email}
                onChange={(e) => onChange({ email: e.target.value })}
                className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError msg={errors.email} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lf-birthdate">Nascimento <span className="text-destructive">*</span></Label>
              <Input
                id="lf-birthdate"
                type="date"
                value={form.birthDate}
                onChange={(e) => onChange({ birthDate: e.target.value })}
                className={cn(errors.birthDate && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError msg={errors.birthDate} />
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Fonte <span className="text-destructive">*</span></Label>
          <Select value={form.source} onValueChange={(v) => onChange({ source: v })}>
            <SelectTrigger className={cn(errors.source && "border-destructive")}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError msg={errors.source} />
        </div>

        <div className="space-y-1">
          <Label>Plano de interesse <span className="text-destructive">*</span></Label>
          <Select value={form.planInterest} onValueChange={(v) => onChange({ planInterest: v })}>
            <SelectTrigger className={cn(errors.planInterest && "border-destructive")}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {PLAN_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError msg={errors.planInterest} />
        </div>
      </div>

      {showStatus && (
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => onChange({ status: v as Status })}>
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

      <div className="space-y-1">
        <Label htmlFor="lf-goal">Objetivo</Label>
        <Input
          id="lf-goal"
          value={form.goal}
          onChange={(e) => onChange({ goal: e.target.value })}
          placeholder="Ex: Perda de peso"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="lf-first">Primeiro contato</Label>
          <Input id="lf-first" type="date" value={form.firstContactDate}
            onChange={(e) => onChange({ firstContactDate: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lf-next">Próximo contato</Label>
          <Input id="lf-next" type="date" value={form.nextContactDate}
            onChange={(e) => onChange({ nextContactDate: e.target.value })} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="lf-script">Script utilizado</Label>
        <Input id="lf-script" value={form.scriptUsed}
          onChange={(e) => onChange({ scriptUsed: e.target.value })} placeholder="Ex: Script A" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="lf-notes">Observações</Label>
        <Textarea id="lf-notes" value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })} rows={3} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const MotionTr = motion(TableRow);

export default function LeadsPage() {
  const [leads,       setLeads]       = useState<Lead[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState<string | null>(null);
  const [activeFilter,setActiveFilter]= useState<Filter>("ALL");

  // Multi-select
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Create
  const [createOpen,       setCreateOpen]       = useState(false);
  const [createForm,       setCreateForm]       = useState<FormValues>(EMPTY_FORM);
  const [createErrors,     setCreateErrors]     = useState<Record<string, string>>({});
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Edit
  const [editingLead,    setEditingLead]    = useState<Lead | null>(null);
  const [editForm,       setEditForm]       = useState<FormValues>(EMPTY_FORM);
  const [editErrors,     setEditErrors]     = useState<Record<string, string>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete (single or bulk)
  const [deleteIds,       setDeleteIds]       = useState<number[]>([]);
  const [deleteDialogOpen,setDeleteDialogOpen]= useState(false);

  // Bulk status edit
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkStatus,   setBulkStatus]   = useState<Status>("NEW");

  // Inline status change confirmation
  const [pendingStatus, setPendingStatus] = useState<{ id: number; status: Status } | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────

  function loadLeads() {
    setLoading(true);
    setLoadError(null);
    fetch(fetchUrl(activeFilter))
      .then((r) => { if (!r.ok) throw new Error("Falha ao carregar leads"); return r.json(); })
      .then((data) => { setLeads(Array.isArray(data) ? data : []); setSelected(new Set()); setLoading(false); })
      .catch((err: Error) => { setLoadError(err.message); setLoading(false); });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadLeads(); }, [activeFilter]);

  // ── Selection ─────────────────────────────────────────────────────────────

  const allSelected = leads.length > 0 && selected.size === leads.length;
  function toggleAll() { setSelected(allSelected ? new Set() : new Set(leads.map((l) => l.id))); }
  function toggleOne(id: number) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  // ── Openers ───────────────────────────────────────────────────────────────

  function openCreate() {
    setCreateForm(EMPTY_FORM);
    setCreateErrors({});
    setCreateOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead);
    setEditForm({
      name:            lead.name,
      whatsapp:        lead.whatsapp,
      email:           "",
      birthDate:       "",
      source:          lead.source,
      notes:           lead.notes ?? "",
      planInterest:    lead.planInterest,
      goal:            lead.goal ?? "",
      status:          lead.status,
      scriptUsed:      lead.scriptUsed ?? "",
      firstContactDate:lead.firstContactDate?.split("T")[0] ?? "",
      nextContactDate: lead.nextContactDate?.split("T")[0] ?? "",
    });
    setEditErrors({});
  }

  function confirmDelete(ids: number[]) {
    setDeleteIds(ids);
    setDeleteDialogOpen(true);
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleCreate() {
    const errors = validateForm(createForm);
    if (Object.keys(errors).length > 0) { setCreateErrors(errors); return; }
    setCreateSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) throw new Error("Erro ao criar lead");
      setCreateOpen(false);
      loadLeads();
    } catch (e) {
      setCreateErrors({ _general: e instanceof Error ? e.message : "Erro desconhecido" });
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleEdit() {
    const errors = validateForm(editForm, false);
    if (Object.keys(errors).length > 0) { setEditErrors(errors); return; }
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${editingLead!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stripEmpty(editForm as unknown as Record<string, unknown>)),
      });
      if (!res.ok) throw new Error("Erro ao atualizar lead");
      setEditingLead(null);
      loadLeads();
    } catch (e) {
      setEditErrors({ _general: e instanceof Error ? e.message : "Erro desconhecido" });
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete() {
    await Promise.all(deleteIds.map((id) => fetch(`/api/leads/${id}`, { method: "DELETE" })));
    setDeleteDialogOpen(false);
    setDeleteIds([]);
    loadLeads();
  }

  async function handleInlineStatus() {
    if (!pendingStatus) return;
    await fetch(`/api/leads/${pendingStatus.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: pendingStatus.status }),
    });
    setPendingStatus(null);
    loadLeads();
  }

  async function handleBulkEdit() {
    await Promise.all(Array.from(selected).map((id) =>
      fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: bulkStatus }),
      })
    ));
    setBulkEditOpen(false);
    loadLeads();
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const selectedConfig = activeFilter !== "ALL" && activeFilter !== "DUE_TODAY"
    ? STATUS_CONFIG[activeFilter as Status] : null;
  const SelectedIcon = selectedConfig?.icon;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Leads</h1>
        <p className="text-sm text-muted-foreground">Gerencie e acompanhe seus leads</p>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as Filter)}>
          <SelectTrigger className="w-52">
            <SelectValue>
              <span className="flex items-center gap-2">
                {activeFilter === "DUE_TODAY" ? (
                  <CalendarClock className="h-4 w-4 text-orange-500" />
                ) : SelectedIcon ? (
                  <SelectedIcon className={`h-4 w-4 ${selectedConfig!.iconClass}`} />
                ) : (
                  <Users className="h-4 w-4 text-muted-foreground" />
                )}
                <span>
                  {activeFilter === "ALL" ? "Todos os leads"
                    : activeFilter === "DUE_TODAY" ? "Ação para hoje"
                    : selectedConfig!.label}
                </span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              <span className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span>Todos os leads</span></span>
            </SelectItem>
            <SelectItem value="DUE_TODAY">
              <span className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-orange-500" /><span>Ação para hoje</span></span>
            </SelectItem>
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

        {!loading && (
          <p className="text-sm text-muted-foreground">
            {leads.length} {leads.length === 1 ? "lead" : "leads"} encontrado{leads.length !== 1 ? "s" : ""}
          </p>
        )}

        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => { setBulkStatus("NEW"); setBulkEditOpen(true); }} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Editar {selected.size}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => confirmDelete([...selected])} className="gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                Excluir {selected.size}
              </Button>
            </>
          )}
          <Button variant="default" size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo Lead
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
              <TableHead>Fonte</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Objetivo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Próx. Contato</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                  Nenhum lead encontrado
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence mode="popLayout">
                {leads.map((lead, i) => (
                  <MotionTr
                    key={lead.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, delay: i * 0.03 }}
                    data-selected={selected.has(lead.id)}
                    className="group data-[selected=true]:bg-muted/50"
                  >
                    <TableCell>
                      <Checkbox checked={selected.has(lead.id)} onCheckedChange={() => toggleOne(lead.id)} />
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{lead.name}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{lead.whatsapp}</TableCell>
                    <TableCell className="text-sm">{SOURCE_LABEL[lead.source] ?? lead.source}</TableCell>
                    <TableCell className="text-sm">{PLAN_LABEL[lead.planInterest] ?? lead.planInterest}</TableCell>
                    <TableCell className="text-sm">{lead.goal || "—"}</TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(v) => setPendingStatus({ id: lead.id, status: v as Status })}
                      >
                        <SelectTrigger className="h-7 w-auto border-0 px-0 shadow-none focus:ring-0 bg-transparent">
                          <StatusBadge status={lead.status} />
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
                    <TableCell className="text-sm whitespace-nowrap">{formatDate(lead.nextContactDate)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate" title={lead.notes}>
                      {lead.notes || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => openEdit(lead)} aria-label="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDelete([lead.id])} aria-label="Excluir"
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
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setCreateErrors({}); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
          </DialogHeader>
          <LeadFormFields
            form={createForm}
            errors={createErrors}
            onChange={(patch) => setCreateForm((f) => ({ ...f, ...patch }))}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button variant="default" onClick={handleCreate} disabled={createSubmitting}>
              {createSubmitting ? "Criando..." : "Criar Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editingLead} onOpenChange={(o) => { if (!o) { setEditingLead(null); setEditErrors({}); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
          </DialogHeader>
          <LeadFormFields
            form={editForm}
            errors={editErrors}
            onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
            showStatus
            showPersonFields={false}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLead(null)}>Cancelar</Button>
            <Button variant="default" onClick={handleEdit} disabled={editSubmitting}>
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
              Excluir {deleteIds.length === 1 ? "lead" : `${deleteIds.length} leads`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteIds.length === 1
                ? "Você tem certeza que deseja excluir este lead?"
                : `Você tem certeza que deseja excluir ${deleteIds.length} leads?`}{" "}
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

      {/* ── Bulk Edit Dialog ── */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Editar {selected.size} {selected.size === 1 ? "lead" : "leads"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Alterar status para</Label>
            <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as Status)}>
              <SelectTrigger>
                <SelectValue />
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
    </div>
  );
}
