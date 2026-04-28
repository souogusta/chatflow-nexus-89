import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCRM } from "@/store/crm-store";
import { Agent, MODEL_OPTIONS } from "@/lib/mock-data";
import { Bot, Plus, Copy, Trash2, Pencil, Sparkles, Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const emptyAgent: Omit<Agent, "id" | "conversations" | "updatedAt"> = {
  name: "", description: "", prompt: "", model: "balanced", temperature: 0.7, active: true,
  channel: "WhatsApp Principal", triggerTags: [], blockWords: [], handoffMessage: "Vou te transferir para um especialista.",
};

export default function Agentes() {
  const { agents, setAgents } = useCRM();
  const [editing, setEditing] = useState<Agent | null>(null);
  const [open, setOpen] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");

  const openNew = () => { setEditing({ ...emptyAgent, id: "new", conversations: 0, updatedAt: new Date().toISOString() } as Agent); setOpen(true); };
  const openEdit = (a: Agent) => { setEditing(a); setOpen(true); };

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Nome do agente é obrigatório");
    if (editing.id === "new") {
      setAgents(prev => [...prev, { ...editing, id: `a${Date.now()}`, updatedAt: new Date().toISOString() }]);
      toast.success("Agente criado!");
    } else {
      setAgents(prev => prev.map(a => a.id === editing.id ? { ...editing, updatedAt: new Date().toISOString() } : a));
      toast.success("Agente atualizado!");
    }
    setOpen(false);
  };

  const duplicate = (a: Agent) => {
    setAgents(prev => [...prev, { ...a, id: `a${Date.now()}`, name: `${a.name} (cópia)`, conversations: 0 }]);
    toast.success("Agente duplicado");
  };
  const remove = (id: string) => { setAgents(prev => prev.filter(a => a.id !== id)); toast.success("Agente removido"); };
  const toggle = (id: string) => setAgents(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));

  const runTest = () => {
    if (!testInput.trim()) return;
    setTestOutput("Pensando...");
    setTimeout(() => {
      const m = MODEL_OPTIONS.find(o => o.id === editing?.model);
      setTestOutput(`Olá! Que ótimo ter você por aqui 👋\n\nEntendi sua mensagem: "${testInput}".\n\nPosso te ajudar agora mesmo. Me conta um pouco mais sobre o que você está buscando para que eu possa te direcionar da melhor forma?\n\n[Resposta gerada pelo modelo ${m?.model}]`);
    }, 700);
  };

  return (
    <AppLayout title="Agentes de IA" subtitle="Piloto automático para suas conversas">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-muted-foreground">{agents.length} agentes configurados · {agents.filter(a => a.active).length} ativos</div>
        <Button onClick={openNew} className="bg-gradient-primary gap-2"><Plus className="w-4 h-4" /> Criar novo agente</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map(a => {
          const model = MODEL_OPTIONS.find(o => o.id === a.model);
          return (
            <div key={a.id} className="card-elevated p-5 hover:shadow-soft transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <Switch checked={a.active} onCheckedChange={() => toggle(a.id)} />
              </div>
              <h3 className="font-display font-bold text-base mb-1">{a.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{a.description}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold",
                  a.active ? "bg-success-soft text-success" : "bg-muted text-muted-foreground")}>
                  {a.active ? "● Ativo" : "○ Inativo"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-soft text-primary font-semibold">{model?.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">{a.conversations} conversas</span>
              </div>

              <div className="text-[10px] text-muted-foreground mb-3">Atualizado {formatDistanceToNow(new Date(a.updatedAt), { locale: ptBR, addSuffix: true })}</div>

              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openEdit(a)}><Pencil className="w-3 h-3" /> Editar</Button>
                <Button size="icon" variant="outline" onClick={() => duplicate(a)}><Copy className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="outline" onClick={() => remove(a.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> {editing?.id === "new" ? "Criar novo agente" : "Editar agente"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <Tabs defaultValue="config">
              <TabsList className="grid grid-cols-5 w-full bg-secondary">
                <TabsTrigger value="config">Configuração</TabsTrigger>
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                <TabsTrigger value="rules">Regras</TabsTrigger>
                <TabsTrigger value="test">Teste</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="config" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nome do agente *</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
                  <div><Label>Canal vinculado</Label><Input value={editing.channel} onChange={e => setEditing({ ...editing, channel: e.target.value })} /></div>
                </div>
                <div><Label>Descrição interna</Label><Textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={2} /></div>

                <div>
                  <Label className="mb-2 block">Modelo de IA</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {MODEL_OPTIONS.map(m => (
                      <button key={m.id} type="button" onClick={() => setEditing({ ...editing, model: m.id })}
                        className={cn("p-3 rounded-xl border-2 text-left transition-all",
                          editing.model === m.id ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-primary/40")}>
                        <div className="font-semibold text-sm">{m.label}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{m.model}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Temperatura: {editing.temperature.toFixed(1)}</Label>
                  <Slider value={[editing.temperature]} min={0} max={1} step={0.1} onValueChange={(v) => setEditing({ ...editing, temperature: v[0] })} className="mt-2" />
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                  <div><div className="font-semibold text-sm">Agente ativo</div><div className="text-xs text-muted-foreground">Responde automaticamente</div></div>
                  <Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                </div>
              </TabsContent>

              <TabsContent value="prompt" className="space-y-4 mt-4">
                <div><Label>Prompt / configuração do agente</Label>
                  <Textarea value={editing.prompt} onChange={e => setEditing({ ...editing, prompt: e.target.value })} rows={10} className="font-mono text-xs" /></div>
                <div><Label>Mensagem de transferência para humano</Label>
                  <Input value={editing.handoffMessage} onChange={e => setEditing({ ...editing, handoffMessage: e.target.value })} /></div>
              </TabsContent>

              <TabsContent value="rules" className="space-y-4 mt-4">
                <div><Label>Tags que ativam o agente (separadas por vírgula)</Label>
                  <Input value={editing.triggerTags.join(", ")} onChange={e => setEditing({ ...editing, triggerTags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} /></div>
                <div><Label>Palavras que bloqueiam o agente</Label>
                  <Input value={editing.blockWords.join(", ")} onChange={e => setEditing({ ...editing, blockWords: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} /></div>
                <div><Label>Limite de mensagens automáticas por conversa</Label><Input type="number" defaultValue={10} /></div>
                <div><Label>Horário de funcionamento</Label>
                  <div className="flex gap-2"><Input type="time" defaultValue="08:00" /><Input type="time" defaultValue="18:00" /></div>
                </div>
              </TabsContent>

              <TabsContent value="test" className="space-y-3 mt-4">
                <div className="text-xs text-muted-foreground bg-info-soft text-info p-3 rounded-xl">
                  Modelo em uso: <strong>{MODEL_OPTIONS.find(m => m.id === editing.model)?.model}</strong>
                </div>
                <div><Label>Mensagem do cliente</Label>
                  <Textarea value={testInput} onChange={e => setTestInput(e.target.value)} rows={3} placeholder="Digite uma mensagem para testar..." /></div>
                <Button onClick={runTest} className="bg-gradient-primary gap-2"><Send className="w-4 h-4" /> Testar agente</Button>
                {testOutput && (
                  <div className="p-4 bg-secondary rounded-xl">
                    <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Bot className="w-3 h-3" /> Resposta gerada</div>
                    <div className="text-sm whitespace-pre-wrap">{testOutput}</div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <div className="text-sm">Histórico de conversas atendidas pelo agente aparecerá aqui.</div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-gradient-primary">Salvar agente</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
