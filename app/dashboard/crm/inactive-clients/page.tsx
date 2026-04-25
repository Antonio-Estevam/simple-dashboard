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
import {
  Users, CalendarClock, UserCheck, Clock, CheckCheck, Calendar, AlertCircle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InactiveClient {
  id: number;
  name: string;
  whatsapp: string;
  email: string | null;
  plan: string | null;
  exitDate: string | null;
  exitReason: string | null;
  recontactDate: string | null;
  recontactStatus: string | null;
}

type RecontactStatus = "pending" | "attempted" | "scheduled";
type InactiveFilter = "ALL" | "DUE_RECONTACT";

// ─── Config ──────────────────────────────────────────────────────────────────

const RECONTACT_CONFIG: Record<RecontactStatus, { label: string; icon: React.ElementType; badgeClass: string; iconClass: string }> = {
  pending:   { label: "Pendente",  icon: Clock,      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",  iconClass: "text-amber-500"  },
  attempted: { label: "Tentado",   icon: CheckCheck, badgeClass: "bg-blue-100 text-blue-700 border-blue-200",    iconClass: "text-blue-500"   },
  scheduled: { label: "Agendado",  icon: Calendar,   badgeClass: "bg-green-100 text-green-700 border-green-200", iconClass: "text-green-500"  },
};

const ALL_RECONTACT_STATUSES: RecontactStatus[] = ["pending", "attempted", "scheduled"];

const PLAN_LABEL: Record<string, string> = {
  BASIC: "Básico", INTERMEDIATE: "Intermediário", PREMIUM: "Premium",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RecontactBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-sm text-muted-foreground">—</span>;
  const cfg = RECONTACT_CONFIG[status as RecontactStatus];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  const { icon: Icon, label, badgeClass } = cfg;
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

// ─── Page ─────────────────────────────────────────────────────────────────────

const MotionTr = motion(TableRow);

export default function InactiveClientsPage() {
  const [clients,     setClients]     = useState<InactiveClient[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState<string | null>(null);
  const [activeFilter,setActiveFilter]= useState<InactiveFilter>("ALL");

  // Multi-select
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Reactivate confirmation
  const [reactivatingId,   setReactivatingId]   = useState<number | null>(null);
  const [reactivateName,   setReactivateName]   = useState("");
  const [reactivating,     setReactivating]     = useState(false);

  // Recontact status update
  const [recontactClientId,   setRecontactClientId]   = useState<number | null>(null);
  const [recontactNewStatus,  setRecontactNewStatus]  = useState<RecontactStatus>("pending");
  const [recontactSubmitting, setRecontactSubmitting] = useState(false);
  const [recontactError,      setRecontactError]      = useState<string | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────

  function loadClients() {
    setLoading(true);
    setLoadError(null);
    const url = activeFilter === "DUE_RECONTACT"
      ? "/api/inactive-clients/due-recontact"
      : "/api/inactive-clients";
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error("Falha ao carregar clientes inativos"); return r.json(); })
      .then((data) => { setClients(Array.isArray(data) ? data : []); setSelected(new Set()); setLoading(false); })
      .catch((err: Error) => { setLoadError(err.message); setLoading(false); });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadClients(); }, [activeFilter]);

  // ── Selection ─────────────────────────────────────────────────────────────

  const allSelected = clients.length > 0 && selected.size === clients.length;
  function toggleAll() { setSelected(allSelected ? new Set() : new Set(clients.map((c) => c.id))); }
  function toggleOne(id: number) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleReactivate() {
    if (!reactivatingId) return;
    setReactivating(true);
    try {
      const res = await fetch(`/api/inactive-clients/${reactivatingId}/reactivate`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao reativar cliente");
      setReactivatingId(null);
      loadClients();
    } finally {
      setReactivating(false);
    }
  }

  function openRecontactUpdate(client: InactiveClient) {
    setRecontactClientId(client.id);
    setRecontactNewStatus((client.recontactStatus as RecontactStatus) ?? "pending");
    setRecontactError(null);
  }

  async function handleRecontactUpdate() {
    if (!recontactClientId) return;
    setRecontactSubmitting(true);
    try {
      const res = await fetch(`/api/inactive-clients/${recontactClientId}/recontact-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recontactStatus: recontactNewStatus }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status de recontato");
      setRecontactClientId(null);
      loadClients();
    } catch (e) {
      setRecontactError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setRecontactSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clientes Inativos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe e reative seus clientes inativos</p>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as InactiveFilter)}>
          <SelectTrigger className="w-52">
            <SelectValue>
              <span className="flex items-center gap-2">
                {activeFilter === "DUE_RECONTACT"
                  ? <CalendarClock className="h-4 w-4 text-orange-500" />
                  : <Users className="h-4 w-4 text-muted-foreground" />}
                <span>{activeFilter === "DUE_RECONTACT" ? "Recontato pendente" : "Todos os inativos"}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              <span className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span>Todos os inativos</span></span>
            </SelectItem>
            <SelectItem value="DUE_RECONTACT">
              <span className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-orange-500" /><span>Recontato pendente</span></span>
            </SelectItem>
          </SelectContent>
        </Select>

        {!loading && (
          <p className="text-sm text-muted-foreground">
            {clients.length} {clients.length === 1 ? "cliente" : "clientes"} encontrado{clients.length !== 1 ? "s" : ""}
          </p>
        )}
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
              <TableHead>Data de Saída</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Recontato em</TableHead>
              <TableHead>Status Recontato</TableHead>
              <TableHead className="w-32" />
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
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                  Nenhum cliente inativo encontrado
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence mode="popLayout">
                {clients.map((client, i) => (
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
                    <TableCell className="text-sm">{client.plan ? (PLAN_LABEL[client.plan] ?? client.plan) : "—"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatDate(client.exitDate)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate" title={client.exitReason ?? ""}>
                      {client.exitReason || "—"}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatDate(client.recontactDate)}</TableCell>
                    <TableCell>
                      <button
                        className="cursor-pointer"
                        onClick={() => openRecontactUpdate(client)}
                        title="Clique para atualizar status"
                      >
                        <RecontactBadge status={client.recontactStatus} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                          onClick={() => { setReactivatingId(client.id); setReactivateName(client.name); }}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Reativar
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

      {/* ── Reactivate AlertDialog ── */}
      <AlertDialog open={reactivatingId !== null} onOpenChange={(o) => { if (!o) setReactivatingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reativar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar reativação de <strong>{reactivateName}</strong>?{" "}
              O cliente voltará ao status de ativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              disabled={reactivating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {reactivating ? "Reativando..." : "Reativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Recontact Status Dialog ── */}
      <Dialog open={recontactClientId !== null} onOpenChange={(o) => { if (!o) { setRecontactClientId(null); setRecontactError(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Atualizar status de recontato</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {recontactError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{recontactError}</p>
            )}
            <Label>Novo status</Label>
            <Select value={recontactNewStatus} onValueChange={(v) => setRecontactNewStatus(v as RecontactStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_RECONTACT_STATUSES.map((s) => {
                  const { icon: Icon, label, iconClass } = RECONTACT_CONFIG[s];
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
            <Button variant="outline" onClick={() => setRecontactClientId(null)}>Cancelar</Button>
            <Button onClick={handleRecontactUpdate} disabled={recontactSubmitting}>
              {recontactSubmitting ? "Salvando..." : "Aplicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
