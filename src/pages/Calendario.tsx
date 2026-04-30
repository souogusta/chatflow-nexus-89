import { DragEvent, FormEvent, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, ChevronLeft, ChevronRight, Clock, Edit3, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Appointment, AppointmentType, useCRM } from "@/store/crm-store";
import { cn } from "@/lib/utils";

type CalendarView = "day" | "week" | "month";

const HOURS = Array.from({ length: 12 }, (_, index) => index + 8);
const HOUR_HEIGHT = 64;

const APPOINTMENT_TYPES: { value: AppointmentType; label: string; className: string }[] = [
  { value: "ligacao", label: "Ligação", className: "bg-info-soft text-info border-info/20" },
  { value: "reuniao", label: "Reunião", className: "bg-primary-soft text-primary border-primary/20" },
  { value: "follow-up", label: "Follow-up", className: "bg-warning-soft text-warning border-warning/20" },
  { value: "demonstracao", label: "Demonstração", className: "bg-success-soft text-success border-success/20" },
  { value: "retorno-comercial", label: "Retorno comercial", className: "bg-destructive-soft text-destructive border-destructive/20" },
  { value: "outro", label: "Outro", className: "bg-secondary text-foreground border-border" },
];

const toDateKey = (date: Date) => format(date, "yyyy-MM-dd");
const fromDateKey = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const minutesFromTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
const timeFromMinutes = (totalMinutes: number) =>
  `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
const formatDateTime = (appointment: Appointment) => `${format(fromDateKey(appointment.date), "dd/MM/yyyy")} às ${appointment.startTime}`;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const emptyForm = (dealId: string, sellerId: string, date = toDateKey(new Date()), startTime = "09:00") => ({
  title: "",
  dealId,
  date,
  startTime,
  endTime: "09:30",
  sellerId,
  description: "",
  type: "follow-up" as AppointmentType,
});

export default function Calendario() {
  const { appointments, addAppointment, updateAppointment, removeAppointment, deals, teamUsers, currentUser, isAdmin, canViewDeal } = useCRM();
  const [view, setView] = useState<CalendarView>("week");
  const [cursor, setCursor] = useState(new Date(2026, 3, 30));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const selectableDeals = useMemo(() => deals.filter(canViewDeal), [canViewDeal, deals]);
  const sellerOptions = useMemo(() => teamUsers.filter(user => user.active && user.role !== "Administrador"), [teamUsers]);
  const defaultSellerId = isAdmin ? sellerOptions[0]?.id || "" : currentUser?.id || "";
  const [form, setForm] = useState(() => emptyForm(selectableDeals[0]?.id || "", defaultSellerId));
  const [draggingAppointmentId, setDraggingAppointmentId] = useState<string | null>(null);

  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)),
    [appointments],
  );

  const visibleTitle = useMemo(() => {
    if (view === "day") return format(cursor, "dd 'de' MMMM, yyyy", { locale: ptBR });
    if (view === "month") return format(cursor, "MMMM yyyy", { locale: ptBR });
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    return `${format(start, "dd MMM", { locale: ptBR })} - ${format(end, "dd MMM, yyyy", { locale: ptBR })}`;
  }, [cursor, view]);

  const openCreate = (date = toDateKey(cursor), startTime = "09:00") => {
    const start = minutesFromTime(startTime);
    const end = `${String(Math.floor((start + 30) / 60)).padStart(2, "0")}:${String((start + 30) % 60).padStart(2, "0")}`;
    setEditing(null);
    setForm({ ...emptyForm(selectableDeals[0]?.id || "", defaultSellerId, date, startTime), endTime: end });
    setModalOpen(true);
  };

  const openEdit = (appointment: Appointment) => {
    if (!isAdmin && appointment.sellerId !== currentUser?.id) {
      toast.info("Este agendamento é de outra vendedora e fica disponível apenas para consulta.");
      return;
    }
    setEditing(appointment);
    setForm({
      title: appointment.title,
      dealId: appointment.dealId,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      sellerId: appointment.sellerId,
      description: appointment.description,
      type: appointment.type,
    });
    setModalOpen(true);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.dealId || !form.sellerId) {
      toast.error("Preencha título, lead e responsável");
      return;
    }
    if (minutesFromTime(form.endTime) <= minutesFromTime(form.startTime)) {
      toast.error("Horário final deve ser depois do inicial");
      return;
    }
    const hasConflict = appointments.some(appointment => {
      if (editing?.id === appointment.id || appointment.date !== form.date) return false;
      return minutesFromTime(form.startTime) < minutesFromTime(appointment.endTime)
        && minutesFromTime(form.endTime) > minutesFromTime(appointment.startTime);
    });

    if (hasConflict) {
      toast.error("Já existe agendamento neste horário. Escolha outro intervalo para evitar conflito entre vendedoras.");
      return;
    }

    const payload = { ...form, sellerId: isAdmin ? form.sellerId : currentUser?.id || form.sellerId, title: form.title.trim() };

    if (editing) {
      updateAppointment(editing.id, payload);
      toast.success("Agendamento atualizado");
    } else {
      addAppointment({ ...payload, id: `appt-${Date.now()}` });
      toast.success("Agendamento criado");
    }
    setModalOpen(false);
  };

  const startAppointmentDrag = (event: DragEvent<HTMLElement>, appointmentId: string) => {
    const appointment = appointments.find(item => item.id === appointmentId);
    if (!appointment || (!isAdmin && appointment.sellerId !== currentUser?.id)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", appointmentId);
    setDraggingAppointmentId(appointmentId);
  };

  const moveAppointment = (appointmentId: string, date: string, startTime?: string) => {
    const appointment = appointments.find(item => item.id === appointmentId);
    if (!appointment) return;

    const patch: Partial<Appointment> = { date };
    if (startTime) {
      const duration = Math.max(15, minutesFromTime(appointment.endTime) - minutesFromTime(appointment.startTime));
      patch.startTime = startTime;
      patch.endTime = timeFromMinutes(minutesFromTime(startTime) + duration);
    }
    const nextStart = patch.startTime || appointment.startTime;
    const nextEnd = patch.endTime || appointment.endTime;
    const hasConflict = appointments.some(item => item.id !== appointment.id && item.date === date
      && minutesFromTime(nextStart) < minutesFromTime(item.endTime)
      && minutesFromTime(nextEnd) > minutesFromTime(item.startTime));

    if (hasConflict) {
      setDraggingAppointmentId(null);
      toast.error("Já existe agendamento neste horário.");
      return;
    }

    updateAppointment(appointment.id, patch);
    setDraggingAppointmentId(null);
    toast.success("Agendamento reagendado");
  };

  const handleAppointmentDrop = (event: DragEvent<HTMLElement>, date: string, startTime?: string) => {
    event.preventDefault();
    const appointmentId = event.dataTransfer.getData("text/plain") || draggingAppointmentId;
    if (!appointmentId) return;
    moveAppointment(appointmentId, date, startTime);
  };

  const handleTimedAppointmentDrop = (event: DragEvent<HTMLDivElement>, date: string) => {
    event.preventDefault();
    const appointmentId = event.dataTransfer.getData("text/plain") || draggingAppointmentId;
    if (!appointmentId) return;
    const appointment = appointments.find(item => item.id === appointmentId);
    if (!appointment) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const minutesFromStart = (clamp(event.clientY - rect.top, 0, rect.height) / HOUR_HEIGHT) * 60;
    const duration = Math.max(15, minutesFromTime(appointment.endTime) - minutesFromTime(appointment.startTime));
    const dayStart = HOURS[0] * 60;
    const dayEnd = dayStart + HOURS.length * 60;
    const snappedMinutes = Math.round(minutesFromStart / 15) * 15;
    const startTime = timeFromMinutes(clamp(dayStart + snappedMinutes, dayStart, dayEnd - duration));

    moveAppointment(appointmentId, date, startTime);
  };

  const goPrevious = () => {
    if (view === "day") setCursor(prev => addDays(prev, -1));
    if (view === "week") setCursor(prev => subWeeks(prev, 1));
    if (view === "month") setCursor(prev => subMonths(prev, 1));
  };

  const goNext = () => {
    if (view === "day") setCursor(prev => addDays(prev, 1));
    if (view === "week") setCursor(prev => addWeeks(prev, 1));
    if (view === "month") setCursor(prev => addMonths(prev, 1));
  };

  const appointmentsForDate = (date: Date) => sortedAppointments.filter(appointment => appointment.date === toDateKey(date));

  const renderTimedEvents = (date: Date) => (
    <div className="absolute inset-x-1 top-0 bottom-0">
      {appointmentsForDate(date).map(appointment => {
        const start = minutesFromTime(appointment.startTime);
        const end = minutesFromTime(appointment.endTime);
        const top = ((start - HOURS[0] * 60) / 60) * HOUR_HEIGHT;
        const height = Math.max(((end - start) / 60) * HOUR_HEIGHT, 34);
        const typeStyle = APPOINTMENT_TYPES.find(type => type.value === appointment.type)?.className;

        return (
          <button
            key={appointment.id}
            type="button"
            draggable={isAdmin || appointment.sellerId === currentUser?.id}
            onDragStart={event => startAppointmentDrag(event, appointment.id)}
            onDragEnd={() => setDraggingAppointmentId(null)}
            onClick={event => {
              event.stopPropagation();
              openEdit(appointment);
            }}
            className={cn(
              "pointer-events-auto absolute z-10 w-[calc(100%-8px)] cursor-grab rounded-md border px-2 py-1 text-left text-[11px] shadow-sm transition hover:shadow-md active:cursor-grabbing",
              draggingAppointmentId === appointment.id && "opacity-60",
              typeStyle,
            )}
            style={{ top, height }}
            title={`${appointment.title} - ${appointment.startTime}`}
          >
            <div className="truncate font-semibold">{appointment.title}</div>
            <div className="truncate opacity-80">{appointment.startTime} - {appointment.endTime}</div>
          </button>
        );
      })}
    </div>
  );

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [cursor]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  return (
    <AppLayout title="Calendário" subtitle="Agendamentos comerciais integrados ao CRM">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={goPrevious} title="Anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" onClick={() => setCursor(new Date())}>Hoje</Button>
            <Button type="button" variant="outline" size="icon" onClick={goNext} title="Próximo">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="ml-2 min-w-0 font-display text-lg font-bold capitalize">{visibleTitle}</div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="grid grid-cols-3 rounded-lg border border-border bg-secondary/60 p-1 text-sm">
              {(["day", "week", "month"] as CalendarView[]).map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setView(item)}
                  className={cn("rounded-md px-3 py-1.5 font-medium transition", view === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  {item === "day" ? "Dia" : item === "week" ? "Semana" : "Mês"}
                </button>
              ))}
            </div>
            <Button type="button" className="gap-2 bg-gradient-primary" onClick={() => openCreate()}>
              <Plus className="h-4 w-4" /> Novo agendamento
            </Button>
          </div>
        </div>

        {view === "month" ? (
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <div className="grid grid-cols-7 border-b border-border bg-secondary/40 text-center text-xs font-semibold uppercase text-muted-foreground">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map(day => <div key={day} className="p-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-7">
              {monthDays.map(day => {
                const dayAppointments = appointmentsForDate(day);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => openCreate(toDateKey(day), "09:00")}
                    onDragOver={event => event.preventDefault()}
                    onDrop={event => handleAppointmentDrop(event, toDateKey(day))}
                    className={cn(
                      "min-h-28 border-b border-r border-border/60 bg-card p-2 text-left transition hover:bg-secondary/50",
                      !isSameMonth(day, cursor) && "bg-secondary/30 text-muted-foreground",
                    )}
                  >
                    <div className={cn("mb-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold", isSameDay(day, new Date()) && "bg-primary text-primary-foreground")}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map(appointment => {
                        const typeStyle = APPOINTMENT_TYPES.find(type => type.value === appointment.type)?.className;
                        return (
                          <span
                            key={appointment.id}
                            role="button"
                            tabIndex={0}
                            draggable={isAdmin || appointment.sellerId === currentUser?.id}
                            onDragStart={event => startAppointmentDrag(event, appointment.id)}
                            onDragEnd={() => setDraggingAppointmentId(null)}
                            onClick={event => {
                              event.stopPropagation();
                              openEdit(appointment);
                            }}
                            className={cn("block cursor-grab truncate rounded border px-2 py-1 text-[11px] font-medium active:cursor-grabbing", draggingAppointmentId === appointment.id && "opacity-60", typeStyle)}
                          >
                            {appointment.startTime} {appointment.title}
                          </span>
                        );
                      })}
                      {dayAppointments.length > 3 && <div className="text-[11px] text-muted-foreground">+{dayAppointments.length - 3} agendamentos</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm scrollbar-thin">
            <div className="min-w-[760px]">
              <div
                className="grid"
                style={{ gridTemplateColumns: `72px repeat(${view === "day" ? 1 : 7}, minmax(120px, 1fr))` }}
              >
                <div className="border-b border-r border-border bg-secondary/40 p-3" />
                {(view === "day" ? [cursor] : weekDays).map(day => (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setCursor(day)}
                    className="border-b border-r border-border bg-secondary/40 p-3 text-left hover:bg-secondary"
                  >
                    <div className="text-xs font-semibold uppercase text-muted-foreground">{format(day, "EEE", { locale: ptBR })}</div>
                    <div className={cn("mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold", isSameDay(day, new Date()) && "bg-primary text-primary-foreground")}>
                      {format(day, "d")}
                    </div>
                  </button>
                ))}
              </div>

              <div
                className="grid"
                style={{ gridTemplateColumns: `72px repeat(${view === "day" ? 1 : 7}, minmax(120px, 1fr))` }}
              >
                <div className="border-r border-border">
                  {HOURS.map(hour => (
                    <div key={hour} className="h-16 border-b border-border/70 px-3 pt-2 text-right text-xs font-medium text-muted-foreground">
                      {String(hour).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>

                {(view === "day" ? [cursor] : weekDays).map(day => (
                  <div
                    key={day.toISOString()}
                    className="relative border-r border-border/70"
                    onDragOver={event => event.preventDefault()}
                    onDrop={event => handleTimedAppointmentDrop(event, toDateKey(day))}
                    style={{ height: HOURS.length * HOUR_HEIGHT }}
                  >
                    {HOURS.map(hour => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => openCreate(toDateKey(day), `${String(hour).padStart(2, "0")}:00`)}
                      className="block h-16 w-full border-b border-border/70 bg-card text-left hover:bg-secondary/40"
                    />
                  ))}
                    {renderTimedEvents(day)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-3">
          {sortedAppointments.slice(0, 6).map(appointment => {
            const deal = deals.find(item => item.id === appointment.dealId);
            const seller = teamUsers.find(item => item.id === appointment.sellerId);
            return (
              <button
                key={appointment.id}
                type="button"
                onClick={() => openEdit(appointment)}
                className="rounded-xl border border-border/70 bg-card p-4 text-left shadow-sm transition hover:border-primary/25 hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{appointment.title}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateTime(appointment)}
                    </div>
                  </div>
                  <Edit3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5" />
                  <span className="truncate">{deal?.customer}</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  <span className="truncate">{seller?.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              {editing ? "Detalhes do agendamento" : "Novo agendamento"}
            </DialogTitle>
            <DialogDescription>Associe o compromisso a um lead existente no CRM.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="appointment-title">Título do agendamento</Label>
                <Input id="appointment-title" value={form.title} onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))} />
              </div>
              <div>
                <Label>Lead/cliente relacionado</Label>
                <Select value={form.dealId} onValueChange={dealId => setForm(prev => ({ ...prev, dealId }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {selectableDeals.map(deal => <SelectItem key={deal.id} value={deal.id}>{deal.customer}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsável/vendedora</Label>
                <Select value={isAdmin ? form.sellerId : currentUser?.id || form.sellerId} onValueChange={sellerId => setForm(prev => ({ ...prev, sellerId }))} disabled={!isAdmin}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sellerOptions.map(seller => <SelectItem key={seller.id} value={seller.id}>{seller.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="appointment-date">Data</Label>
                <Input id="appointment-date" type="date" value={form.date} onChange={event => setForm(prev => ({ ...prev, date: event.target.value }))} />
              </div>
              <div>
                <Label>Tipo de compromisso</Label>
                <Select value={form.type} onValueChange={(type: AppointmentType) => setForm(prev => ({ ...prev, type }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="appointment-start">Horário inicial</Label>
                <Input id="appointment-start" type="time" value={form.startTime} onChange={event => setForm(prev => ({ ...prev, startTime: event.target.value }))} />
              </div>
              <div>
                <Label htmlFor="appointment-end">Horário final</Label>
                <Input id="appointment-end" type="time" value={form.endTime} onChange={event => setForm(prev => ({ ...prev, endTime: event.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="appointment-description">Descrição/observações</Label>
                <Textarea id="appointment-description" rows={4} value={form.description} onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))} />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-between sm:space-x-0">
              <div>
                {editing && (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => {
                      removeAppointment(editing.id);
                      setModalOpen(false);
                      toast.success("Agendamento excluído");
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </Button>
                )}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-gradient-primary">{editing ? "Salvar alterações" : "Criar agendamento"}</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
