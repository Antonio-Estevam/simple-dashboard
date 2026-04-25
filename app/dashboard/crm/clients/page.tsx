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
  Users, Plus, Trash2, Pencil, AlertCircle,
  UserMinus, Search, CheckCircle2, Star, Award, Zap, ExternalLink,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Client {
  id: number;
  name: string;
  whatsapp: string;
  email: string | null;
  address: string | null;
  birthDate: string | null;
  source: string | null;
  notes: string | null;
  plan: Plan;
  tier: string | null;
  cycleStart: string | null;
  cycleEnd: string | null;
  mfitLink: string | null;
  lastCycleScore: number | null;
  lastCheckin: string | null;
}

interface PersonSearchResult {
  id: number;
  name: string;
  whatsapp: string;
  email: string | null;
  state: string;
}

type Plan = "BASIC" | "INTERMEDIATE" | "PREMIUM";
type PlanFilter = Plan | "ALL";

interface ScratchForm {
  name: string; whatsapp: string; email: string; address: string;
  birthDate: string; source: string; notes: string;
  plan: Plan | ""; tier: string; cycleStart: string; cycleEnd: string; mfitLink: string;
}

interface ConvertForm {
  plan: Plan | ""; tier: string; cycleStart: string; cycleEnd: string; mfitLink: string;
}

interface EditForm {
  name: string; whatsapp: string; email: string; address: string;
  birthDate: string; source: string; notes: string;
  plan: Plan | ""; tier: string; cycleStart: string; cycleEnd: string; mfitLink: string;
  lastCycleScore: string; lastCheckin: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<Plan, { label: string; icon: React.ElementType; badgeClass: string; iconClass: string }> = {
  BASIC:        { label: "Básico",        icon: Star,  badgeClass: "bg-blue-100 text-blue-700 border-blue-200",      iconClass: "text-blue-500"   },
  INTERMEDIATE: { label: "Intermediário", icon: Award, badgeClass: "bg-purple-100 text-purple-700 border-purple-200", iconClass: "text-purple-500" },
  PREMIUM:      { label: "Premium",       icon: Zap,   badgeClass: "bg-amber-100 text-amber-700 border-amber-200",   iconClass: "text-amber-500"  },
};

const ALL_PLANS: Plan[] = ["BASIC", "INTERMEDIATE", "PREMIUM"];

const SOURCE_OPTIONS = [
  { value: "INSTAGRAM",            label: "Instagram"            },
  { value: "REFERRAL",             label: "Indicação"            },
  { value: "IN_PERSON_ASSESSMENT", label: "Avaliação presencial" },
  { value: "OTHER",                label: "Outro"                },
];

const TIER_OPTIONS = [
  { value: "A", label: "Tier A" },
  { value: "B", label: "Tier B" },
  { value: "C", label: "Tier C" },
];

const EMPTY_SCRATCH: ScratchForm = {
  name: "", whatsapp: "", email: "", address: "", birthDate: "",
  source: "", notes: "", plan: "", tier: "", cycleStart: "", cycleEnd: "", mfitLink: "",
};

const EMPTY_CONVERT: ConvertForm = { plan: "", tier: "", cycleStart: "", cycleEnd: "", mfitLink: "" };

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

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function stripEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== ""));
}

function validateScratch(f: ScratchForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.name.trim()) e.name = "Nome é obrigatório";
  else if (f.name.trim().length < 2) e.name = "Mínimo 2 caracteres";
  if (!f.whatsapp.trim()) e.whatsapp = "WhatsApp é obrigatório";
  else if (f.whatsapp.replace(/\D/g, "").length < 10) e.whatsapp = "Número inválido (mínimo 10 dígitos)";
  if (!f.plan) e.plan = "Selecione um plano";
  return e;
}

function validateConvert(f: ConvertForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.plan) e.plan = "Selecione um plano";
  return e;
}

function validateEdit(f: EditForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.name.trim()) e.name = "Nome é obrigatório";
  else if (f.name.trim().length < 2) e.name = "Mínimo 2 caracteres";
  if (!f.whatsapp.trim()) e.whatsapp = "WhatsApp é obrigatório";
  else if (f.whatsapp.replace(/\D/g, "").length < 10) e.whatsapp = "Número inválido (mínimo 10 dígitos)";
  if (!f.plan) e.plan = "Selecione um plano";
  return e;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: Plan }) {
  const { icon: Icon, label, badgeClass } = PLAN_CONFIG[plan];
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

function PlanSelect({
  value, errors, onChange,
}: {
  value: Plan | "";
  errors: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>Plano <span className="text-destructive">*</span></Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn(errors.plan && "border-destructive")}>
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {ALL_PLANS.map((p) => {
            const { icon: Icon, label, iconClass } = PLAN_CONFIG[p];
            return (
              <SelectItem key={p} value={p}>
                <span className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${iconClass}`} /><span>{label}</span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <FieldError msg={errors.plan} />
    </div>
  );
}

function ClientContextFields({
  plan, tier, cycleStart, cycleEnd, mfitLink, errors, onChange,
}: {
  plan: Plan | ""; tier: string; cycleStart: string; cycleEnd: string; mfitLink: string;
  errors: Record<string, string>;
  onChange: (patch: Partial<ConvertForm>) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <PlanSelect value={plan} errors={errors} onChange={(v) => onChange({ plan: v as Plan })} />
        <div className="space-y-1">
          <Label>Tier</Label>
          <Select value={tier} onValueChange={(v) => onChange({ tier: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {TIER_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Início do ciclo</Label>
          <Input type="date" value={cycleStart} onChange={(e) => onChange({ cycleStart: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Fim do ciclo</Label>
          <Input type="date" value={cycleEnd} onChange={(e) => onChange({ cycleEnd: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Link MFit</Label>
        <Input value={mfitLink} onChange={(e) => onChange({ mfitLink: e.target.value })} placeholder="https://mfit.com.br/..." />
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const MotionTr = motion(TableRow);

export default function ClientsPage() {
  const [clients,    setClients]    = useState<Client[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<PlanFilter>("ALL");

  // Multi-select
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Create dialog
  const [createOpen,       setCreateOpen]       = useState(false);
  const [createTab,        setCreateTab]        = useState<"scratch" | "convert">("scratch");
  const [scratchForm,      setScratchForm]      = useState<ScratchForm>(EMPTY_SCRATCH);
  const [scratchErrors,    setScratchErrors]    = useState<Record<string, string>>({});
  const [convertForm,      setConvertForm]      = useState<ConvertForm>(EMPTY_CONVERT);
  const [convertErrors,    setConvertErrors]    = useState<Record<string, string>>({});
  const [searchQuery,      setSearchQuery]      = useState("");
  const [searchResults,    setSearchResults]    = useState<PersonSearchResult[]>([]);
  const [searchLoading,    setSearchLoading]    = useState(false);
  const [selectedPerson,   setSelectedPerson]   = useState<PersonSearchResult | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Edit dialog
  const [editingClient,  setEditingClient]  = useState<Client | null>(null);
  const [editForm,       setEditForm]       = useState<EditForm>({
    name: "", whatsapp: "", email: "", address: "", birthDate: "", source: "",
    notes: "", plan: "", tier: "", cycleStart: "", cycleEnd: "", mfitLink: "",
    lastCycleScore: "", lastCheckin: "",
  });
  const [editErrors,     setEditErrors]     = useState<Record<string, string>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete
  const [deleteIds,        setDeleteIds]        = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Deactivate
  const [deactivatingId,      setDeactivatingId]      = useState<number | null>(null);
  const [deactivateForm,      setDeactivateForm]      = useState({ exitDate: "", exitReason: "", recontactDate: "" });
  const [deactivateErrors,    setDeactivateErrors]    = useState<Record<string, string>>({});
  const [deactivateSubmitting,setDeactivateSubmitting]= useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────

  function loadClients() {
    setLoading(true);
    setLoadError(null);
    fetch("/api/clients")
      .then((r) => { if (!r.ok) throw new Error("Falha ao carregar clientes"); return r.json(); })
      .then((data) => { setClients(Array.isArray(data) ? data : []); setSelected(new Set()); setLoading(false); })
      .catch((err: Error) => { setLoadError(err.message); setLoading(false); });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadClients(); }, []);

  // ── Person search (debounced) ─────────────────────────────────────────────

  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      setSearchLoading(true);
      fetch(`/api/clients/persons/search?name=${encodeURIComponent(searchQuery.trim())}`)
        .then((r) => r.json())
        .then((data) => { setSearchResults(Array.isArray(data) ? data : []); setSearchLoading(false); })
        .catch(() => { setSearchResults([]); setSearchLoading(false); });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Selection ─────────────────────────────────────────────────────────────

  const displayed = planFilter === "ALL" ? clients : clients.filter((c) => c.plan === planFilter);
  const allSelected = displayed.length > 0 && selected.size === displayed.length;
  function toggleAll() { setSelected(allSelected ? new Set() : new Set(displayed.map((c) => c.id))); }
  function toggleOne(id: number) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  // ── Openers ───────────────────────────────────────────────────────────────

  function openCreate() {
    setScratchForm(EMPTY_SCRATCH);
    setScratchErrors({});
    setConvertForm(EMPTY_CONVERT);
    setConvertErrors({});
    setSearchQuery("");
    setSearchResults([]);
    setSelectedPerson(null);
    setCreateTab("scratch");
    setCreateOpen(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setEditForm({
      name:           client.name,
      whatsapp:       client.whatsapp,
      email:          client.email ?? "",
      address:        client.address ?? "",
      birthDate:      client.birthDate?.split("T")[0] ?? "",
      source:         client.source ?? "",
      notes:          client.notes ?? "",
      plan:           client.plan,
      tier:           client.tier ?? "",
      cycleStart:     client.cycleStart?.split("T")[0] ?? "",
      cycleEnd:       client.cycleEnd?.split("T")[0] ?? "",
      mfitLink:       client.mfitLink ?? "",
      lastCycleScore: client.lastCycleScore != null ? String(client.lastCycleScore) : "",
      lastCheckin:    client.lastCheckin?.split("T")[0] ?? "",
    });
    setEditErrors({});
  }

  function confirmDelete(ids: number[]) { setDeleteIds(ids); setDeleteDialogOpen(true); }

  function openDeactivate(id: number) {
    setDeactivatingId(id);
    setDeactivateForm({ exitDate: "", exitReason: "", recontactDate: "" });
    setDeactivateErrors({});
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleCreateScratch() {
    const errors = validateScratch(scratchForm);
    if (Object.keys(errors).length > 0) { setScratchErrors(errors); return; }
    setCreateSubmitting(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stripEmpty(scratchForm as unknown as Record<string, unknown>)),
      });
      if (!res.ok) throw new Error("Erro ao criar cliente");
      setCreateOpen(false);
      loadClients();
    } catch (e) {
      setScratchErrors({ _general: e instanceof Error ? e.message : "Erro desconhecido" });
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleCreateConvert() {
    if (!selectedPerson) { setConvertErrors({ _general: "Selecione uma pessoa para converter" }); return; }
    const errors = validateConvert(convertForm);
    if (Object.keys(errors).length > 0) { setConvertErrors(errors); return; }
    setCreateSubmitting(true);
    try {
      const res = await fetch(`/api/clients/convert/${selectedPerson.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stripEmpty(convertForm as unknown as Record<string, unknown>)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao converter pessoa para cliente");
      setCreateOpen(false);
      loadClients();
    } catch (e) {
      setConvertErrors({ _general: e instanceof Error ? e.message : "Erro desconhecido" });
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleEdit() {
    const errors = validateEdit(editForm);
    if (Object.keys(errors).length > 0) { setEditErrors(errors); return; }
    setEditSubmitting(true);
    try {
      const body = stripEmpty(editForm as unknown as Record<string, unknown>);
      if (body.lastCycleScore !== undefined) body.lastCycleScore = parseFloat(body.lastCycleScore as string);
      const res = await fetch(`/api/clients/${editingClient!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erro ao atualizar cliente");
      setEditingClient(null);
      loadClients();
    } catch (e) {
      setEditErrors({ _general: e instanceof Error ? e.message : "Erro desconhecido" });
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete() {
    await Promise.all(deleteIds.map((id) => fetch(`/api/clients/${id}`, { method: "DELETE" })));
    setDeleteDialogOpen(false);
    setDeleteIds([]);
    loadClients();
  }

  async function handleDeactivate() {
    const e: Record<string, string> = {};
    if (!deactivateForm.exitDate) e.exitDate = "Data de saída é obrigatória";
    if (!deactivateForm.exitReason.trim()) e.exitReason = "Motivo de saída é obrigatório";
    if (Object.keys(e).length > 0) { setDeactivateErrors(e); return; }
    setDeactivateSubmitting(true);
    try {
      const body: Record<string, string> = { exitDate: deactivateForm.exitDate, exitReason: deactivateForm.exitReason };
      if (deactivateForm.recontactDate) body.recontactDate = deactivateForm.recontactDate;
      const res = await fetch(`/api/inactive-clients/${deactivatingId}/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao desativar cliente");
      setDeactivatingId(null);
      loadClients();
    } catch (e) {
      setDeactivateErrors({ _general: e instanceof Error ? e.message : "Erro desconhecido" });
    } finally {
      setDeactivateSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const selectedPlanCfg = planFilter !== "ALL" ? PLAN_CONFIG[planFilter as Plan] : null;
  const SelectedPlanIcon = selectedPlanCfg?.icon;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clientes Ativos</h1>
        <p className="text-sm text-muted-foreground">Gerencie e acompanhe seus clientes ativos</p>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v as PlanFilter); setSelected(new Set()); }}>
          <SelectTrigger className="w-52">
            <SelectValue>
              <span className="flex items-center gap-2">
                {SelectedPlanIcon
                  ? <SelectedPlanIcon className={`h-4 w-4 ${selectedPlanCfg!.iconClass}`} />
                  : <Users className="h-4 w-4 text-muted-foreground" />}
                <span>{planFilter === "ALL" ? "Todos os clientes" : selectedPlanCfg!.label}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              <span className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span>Todos os clientes</span></span>
            </SelectItem>
            {ALL_PLANS.map((p) => {
              const { icon: Icon, label, iconClass } = PLAN_CONFIG[p];
              return (
                <SelectItem key={p} value={p}>
                  <span className="flex items-center gap-2"><Icon className={`h-4 w-4 ${iconClass}`} /><span>{label}</span></span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {!loading && (
          <p className="text-sm text-muted-foreground">
            {displayed.length} {displayed.length === 1 ? "cliente" : "clientes"} encontrado{displayed.length !== 1 ? "s" : ""}
          </p>
        )}

        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => confirmDelete([...selected])} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Excluir {selected.size}
            </Button>
          )}
          <Button variant="default" size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo Cliente
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
              <TableHead>Plano</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Ciclo</TableHead>
              <TableHead>Último Score</TableHead>
              <TableHead>MFit</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="w-28" />
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
            ) : displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence mode="popLayout">
                {displayed.map((client, i) => (
                  <MotionTr
                    key={client.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, delay: i * 0.03 }}
                    data-selected={selected.has(client.id)}
                    className="group data-[selected=true]:bg-muted/50"
                  >
                    <TableCell>
                      <Checkbox checked={selected.has(client.id)} onCheckedChange={() => toggleOne(client.id)} />
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{client.name}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{client.whatsapp}</TableCell>
                    <TableCell><PlanBadge plan={client.plan} /></TableCell>
                    <TableCell className="text-sm">{client.tier ?? "—"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {client.cycleStart
                        ? `${formatDate(client.cycleStart)} → ${formatDate(client.cycleEnd)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{client.lastCycleScore != null ? client.lastCycleScore : "—"}</TableCell>
                    <TableCell>
                      {client.mfitLink ? (
                        <a href={client.mfitLink} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" />Link
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate" title={client.notes ?? ""}>
                      {client.notes || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(client)} aria-label="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                          onClick={() => openDeactivate(client.id)} aria-label="Desativar"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDelete([client.id])} aria-label="Excluir"
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
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setScratchErrors({}); setConvertErrors({}); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>

          <Tabs value={createTab} onValueChange={(v) => setCreateTab(v as "scratch" | "convert")}>
            <TabsList className="w-full">
              <TabsTrigger value="scratch" className="flex-1">Novo do zero</TabsTrigger>
              <TabsTrigger value="convert" className="flex-1">Converter pessoa</TabsTrigger>
            </TabsList>

            {/* ── Tab: from scratch ── */}
            <TabsContent value="scratch" className="mt-0">
              <div className="grid gap-4 py-3">
                {scratchErrors._general && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{scratchErrors._general}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>E-mail</Label>
                    <Input type="email" value={scratchForm.email}
                      onChange={(e) => setScratchForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Nascimento</Label>
                    <Input type="date" value={scratchForm.birthDate}
                      onChange={(e) => setScratchForm((f) => ({ ...f, birthDate: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Endereço</Label>
                  <Input value={scratchForm.address}
                    onChange={(e) => setScratchForm((f) => ({ ...f, address: e.target.value }))} />
                </div>

                <div className="space-y-1">
                  <Label>Fonte</Label>
                  <Select value={scratchForm.source} onValueChange={(v) => setScratchForm((f) => ({ ...f, source: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Observações</Label>
                  <Textarea value={scratchForm.notes}
                    onChange={(e) => setScratchForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
                </div>

                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Contexto do cliente</p>
                  <div className="grid gap-4">
                    <ClientContextFields
                      plan={scratchForm.plan}
                      tier={scratchForm.tier}
                      cycleStart={scratchForm.cycleStart}
                      cycleEnd={scratchForm.cycleEnd}
                      mfitLink={scratchForm.mfitLink}
                      errors={scratchErrors}
                      onChange={(patch) => setScratchForm((f) => ({ ...f, ...patch }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateScratch} disabled={createSubmitting}>
                  {createSubmitting ? "Criando..." : "Criar Cliente"}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* ── Tab: convert existing person ── */}
            <TabsContent value="convert" className="mt-0">
              <div className="grid gap-4 py-3">
                {convertErrors._general && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{convertErrors._general}</p>
                )}

                <div className="space-y-2">
                  <Label>Buscar pessoa</Label>
                  {selectedPerson ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/40">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedPerson.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedPerson.whatsapp}{selectedPerson.email ? ` · ${selectedPerson.email}` : ""}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedPerson(null); setSearchQuery(""); setSearchResults([]); }}>
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
                      {searchLoading && (
                        <p className="text-xs text-muted-foreground pl-1">Buscando...</p>
                      )}
                      {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                        <p className="text-xs text-muted-foreground pl-1">Nenhuma pessoa disponível encontrada</p>
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
                                {p.whatsapp}{p.email ? ` · ${p.email}` : ""}
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Contexto do cliente</p>
                    <div className="grid gap-4">
                      <ClientContextFields
                        plan={convertForm.plan}
                        tier={convertForm.tier}
                        cycleStart={convertForm.cycleStart}
                        cycleEnd={convertForm.cycleEnd}
                        mfitLink={convertForm.mfitLink}
                        errors={convertErrors}
                        onChange={(patch) => setConvertForm((f) => ({ ...f, ...patch }))}
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateConvert} disabled={createSubmitting || !selectedPerson}>
                  {createSubmitting ? "Convertendo..." : "Converter para Cliente"}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editingClient} onOpenChange={(o) => { if (!o) { setEditingClient(null); setEditErrors({}); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {editErrors._general && (
              <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{editErrors._general}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nome <span className="text-destructive">*</span></Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className={cn(editErrors.name && "border-destructive focus-visible:ring-destructive")}
                />
                <FieldError msg={editErrors.name} />
              </div>
              <div className="space-y-1">
                <Label>WhatsApp <span className="text-destructive">*</span></Label>
                <Input
                  value={editForm.whatsapp}
                  onChange={(e) => setEditForm((f) => ({ ...f, whatsapp: maskWhatsApp(e.target.value) }))}
                  placeholder="+55 (11) 99999-9999"
                  className={cn(editErrors.whatsapp && "border-destructive focus-visible:ring-destructive")}
                />
                <FieldError msg={editErrors.whatsapp} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>E-mail</Label>
                <Input type="email" value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Nascimento</Label>
                <Input type="date" value={editForm.birthDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, birthDate: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Endereço</Label>
              <Input value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <Label>Fonte</Label>
              <Select value={editForm.source} onValueChange={(v) => setEditForm((f) => ({ ...f, source: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Contexto do cliente</p>
              <div className="grid gap-4">
                <ClientContextFields
                  plan={editForm.plan}
                  tier={editForm.tier}
                  cycleStart={editForm.cycleStart}
                  cycleEnd={editForm.cycleEnd}
                  mfitLink={editForm.mfitLink}
                  errors={editErrors}
                  onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Último score do ciclo</Label>
                    <Input
                      type="number" min={0} max={10} step={0.1}
                      value={editForm.lastCycleScore}
                      onChange={(e) => setEditForm((f) => ({ ...f, lastCycleScore: e.target.value }))}
                      placeholder="0.0 – 10.0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Último check-in</Label>
                    <Input type="date" value={editForm.lastCheckin}
                      onChange={(e) => setEditForm((f) => ({ ...f, lastCheckin: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>Cancelar</Button>
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
              Excluir {deleteIds.length === 1 ? "cliente" : `${deleteIds.length} clientes`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteIds.length === 1
                ? "Você tem certeza que deseja excluir este cliente?"
                : `Você tem certeza que deseja excluir ${deleteIds.length} clientes?`}{" "}
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

      {/* ── Deactivate Dialog ── */}
      <Dialog open={deactivatingId !== null} onOpenChange={(o) => { if (!o) { setDeactivatingId(null); setDeactivateErrors({}); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Desativar Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {deactivateErrors._general && (
              <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{deactivateErrors._general}</p>
            )}
            <div className="space-y-1">
              <Label>Data de saída <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={deactivateForm.exitDate}
                onChange={(e) => setDeactivateForm((f) => ({ ...f, exitDate: e.target.value }))}
                className={cn(deactivateErrors.exitDate && "border-destructive")}
              />
              <FieldError msg={deactivateErrors.exitDate} />
            </div>
            <div className="space-y-1">
              <Label>Motivo de saída <span className="text-destructive">*</span></Label>
              <Textarea
                value={deactivateForm.exitReason}
                onChange={(e) => setDeactivateForm((f) => ({ ...f, exitReason: e.target.value }))}
                rows={2}
                placeholder="Ex: Pausa por lesão no joelho"
                className={cn(deactivateErrors.exitReason && "border-destructive")}
              />
              <FieldError msg={deactivateErrors.exitReason} />
            </div>
            <div className="space-y-1">
              <Label>Data de recontato</Label>
              <Input
                type="date"
                value={deactivateForm.recontactDate}
                onChange={(e) => setDeactivateForm((f) => ({ ...f, recontactDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivatingId(null)}>Cancelar</Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleDeactivate}
              disabled={deactivateSubmitting}
            >
              {deactivateSubmitting ? "Desativando..." : "Desativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
