import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SELLERS } from "@/lib/mock-data";
import { Plus, Trash2, Pencil, Check, X, MessageSquare, Bot, Webhook, FileSpreadsheet, Cable } from "lucide-react";
import { toast } from "sonner";

const ROLES = ["Administrador", "Gerente", "Vendedora", "Suporte"];
const PERMISSIONS = [
  "Ver dashboard", "Ver todos os atendimentos", "Ver apenas próprios atendimentos",
  "Editar kanban", "Finalizar venda", "Criar agentes", "Editar agentes",
  "Ver relatórios", "Exportar dados", "Criar usuários", "Alterar configurações da empresa"
];
const DEFAULT_PERMS: Record<string, boolean[]> = {
  "Administrador": PERMISSIONS.map(() => true),
  "Gerente": PERMISSIONS.map((_, i) => i !== 9 && i !== 10),
  "Vendedora": [true, false, true, true, true, false, false, false, false, false, false],
  "Suporte": [true, true, false, false, false, false, false, true, false, false, false],
};

const INTEGRATIONS = [
  { name: "WhatsApp", desc: "Conecte sua conta Business", icon: MessageSquare, connected: true },
  { name: "OpenAI", desc: "Chave de API para os agentes", icon: Bot, connected: true },
  { name: "Webhooks", desc: "Receba eventos em tempo real", icon: Webhook, connected: false },
  { name: "Planilhas", desc: "Sincronize com Google Sheets", icon: FileSpreadsheet, connected: false },
  { name: "API externa", desc: "Integre com seu ERP/CRM", icon: Cable, connected: false },
];

type TeamUser = {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: string;
  active: boolean;
};

const emptyUser: TeamUser = {
  id: "new",
  name: "",
  avatar: "",
  email: "",
  role: "Vendedora",
  active: true,
};

export default function Configuracoes() {
  const [users, setUsers] = useState<TeamUser[]>(
    SELLERS.map((s, i) => ({
      ...s,
      email: `${s.name.toLowerCase().replace(" ", ".")}@empresa.com`,
      role: i === 0 ? "Administrador" : "Vendedora",
      active: true,
    }))
  );
  const [perms, setPerms] = useState(DEFAULT_PERMS);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamUser>(emptyUser);

  const openNewUser = () => {
    setEditingUser(emptyUser);
    setUserDialogOpen(true);
  };

  const openEditUser = (user: TeamUser) => {
    setEditingUser(user);
    setUserDialogOpen(true);
  };

  const saveUser = () => {
    if (!editingUser.name.trim()) return toast.error("Informe o nome do usuário");
    if (!editingUser.email.trim()) return toast.error("Informe o e-mail do usuário");
    const avatar = editingUser.avatar.trim() || editingUser.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
    if (editingUser.id === "new") {
      setUsers(prev => [...prev, { ...editingUser, id: `u${Date.now()}`, avatar }]);
      toast.success("Usuário criado");
    } else {
      setUsers(prev => prev.map(user => user.id === editingUser.id ? { ...editingUser, avatar } : user));
      toast.success("Usuário atualizado");
    }
    setUserDialogOpen(false);
  };

  const removeUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
    toast.success("Usuário excluído");
  };

  return (
    <AppLayout title="Configurações" subtitle="Gerencie sua conta, equipe e integrações">
      <Tabs defaultValue="account">
        <TabsList className="bg-card border border-border/60 p-1 h-auto flex-wrap">
          <TabsTrigger value="account">Minha conta</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="card-elevated p-6 mt-4 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-20 h-20"><AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl font-bold">AP</AvatarFallback></Avatar>
            <Button variant="outline">Alterar foto</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nome</Label><Input defaultValue="Ana Paula" /></div>
            <div><Label>E-mail</Label><Input defaultValue="ana@empresa.com" /></div>
            <div><Label>Telefone</Label><Input defaultValue="+55 11 98765-4321" /></div>
            <div><Label>Cargo</Label><Input defaultValue="Administradora" disabled /></div>
          </div>
          <Button onClick={() => toast.success("Alterações salvas!")} className="mt-6 bg-gradient-primary">Salvar alterações</Button>
        </TabsContent>

        <TabsContent value="security" className="card-elevated p-6 mt-4 max-w-xl space-y-4">
          <div><Label>Senha atual</Label><Input type="password" /></div>
          <div><Label>Nova senha</Label><Input type="password" /></div>
          <div><Label>Confirmar nova senha</Label><Input type="password" /></div>
          <Button onClick={() => toast.success("Senha alterada!")} className="bg-gradient-primary">Atualizar senha</Button>
          <div className="border-t pt-4 flex items-center justify-between">
            <div><div className="font-semibold text-sm">Autenticação em duas etapas</div><div className="text-xs text-muted-foreground">Adicione uma camada extra de segurança</div></div>
            <Switch />
          </div>
        </TabsContent>

        <TabsContent value="users" className="card-elevated p-6 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold">Usuários da equipe</h3>
            <Button className="bg-gradient-primary gap-2" onClick={openNewUser}><Plus className="w-4 h-4" /> Novo usuário</Button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-muted-foreground border-b">
              <th className="pb-3 font-semibold">Usuário</th><th className="pb-3 font-semibold">E-mail</th>
              <th className="pb-3 font-semibold">Cargo</th><th className="pb-3 font-semibold">Status</th><th></th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-border/40">
                  <td className="py-3"><div className="flex items-center gap-2"><Avatar className="w-8 h-8"><AvatarFallback className="bg-primary-soft text-primary text-xs font-semibold">{u.avatar}</AvatarFallback></Avatar>{u.name}</div></td>
                  <td className="py-3 text-muted-foreground">{u.email}</td>
                  <td className="py-3">{u.role}</td>
                  <td className="py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${u.active ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{u.active ? "Ativo" : "Inativo"}</span></td>
                  <td className="py-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEditUser(u)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Switch checked={u.active} onCheckedChange={() => setUsers(users.map(x => x.id === u.id ? { ...x, active: !x.active } : x))} className="ml-2" />
                    <Button size="icon" variant="ghost" className="text-destructive ml-1" onClick={() => removeUser(u.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="permissions" className="card-elevated p-6 mt-4 overflow-x-auto">
          <h3 className="font-display font-bold mb-4">Permissões por cargo</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-muted-foreground border-b">
              <th className="pb-3 font-semibold">Permissão</th>
              {ROLES.map(r => <th key={r} className="pb-3 font-semibold text-center px-2">{r}</th>)}
            </tr></thead>
            <tbody>
              {PERMISSIONS.map((p, i) => (
                <tr key={p} className="border-b border-border/40">
                  <td className="py-2.5">{p}</td>
                  {ROLES.map(r => (
                    <td key={r} className="text-center">
                      <button onClick={() => { const np = { ...perms }; np[r] = [...np[r]]; np[r][i] = !np[r][i]; setPerms(np); }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto ${perms[r][i] ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>
                        {perms[r][i] ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="company" className="card-elevated p-6 mt-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Nome da empresa</Label><Input defaultValue="Empresa Demo Ltda" /></div>
            <div><Label>CNPJ</Label><Input defaultValue="12.345.678/0001-99" /></div>
            <div><Label>Telefone</Label><Input defaultValue="+55 11 3000-0000" /></div>
            <div className="col-span-2"><Label>Endereço</Label><Input defaultValue="Av. Paulista, 1000 - São Paulo/SP" /></div>
            <div><Label>Abertura</Label><Input type="time" defaultValue="08:00" /></div>
            <div><Label>Fechamento</Label><Input type="time" defaultValue="18:00" /></div>
          </div>
          <Button onClick={() => toast.success("Empresa atualizada!")} className="mt-6 bg-gradient-primary">Salvar</Button>
        </TabsContent>

        <TabsContent value="integrations" className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {INTEGRATIONS.map(i => (
            <div key={i.name} className="card-elevated p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center"><i.icon className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="font-semibold">{i.name}</div>
                <div className="text-xs text-muted-foreground">{i.desc}</div>
              </div>
              <Button variant={i.connected ? "outline" : "default"} className={!i.connected ? "bg-gradient-primary" : ""}>{i.connected ? "Conectado" : "Conectar"}</Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editingUser.id === "new" ? "Novo usuário" : "Editar usuário"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userName">Nome *</Label>
              <Input id="userName" value={editingUser.name} onChange={event => setEditingUser({ ...editingUser, name: event.target.value })} />
            </div>
            <div>
              <Label htmlFor="userEmail">E-mail *</Label>
              <Input id="userEmail" type="email" value={editingUser.email} onChange={event => setEditingUser({ ...editingUser, email: event.target.value })} />
            </div>
            <div>
              <Label>Cargo</Label>
              <Select value={editingUser.role} onValueChange={role => setEditingUser({ ...editingUser, role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="userAvatar">Iniciais</Label>
              <Input id="userAvatar" maxLength={2} value={editingUser.avatar} onChange={event => setEditingUser({ ...editingUser, avatar: event.target.value.toUpperCase() })} placeholder="AP" />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between rounded-xl bg-secondary p-3">
              <div>
                <div className="text-sm font-semibold">Usuário ativo</div>
                <div className="text-xs text-muted-foreground">Permite acesso à plataforma</div>
              </div>
              <Switch checked={editingUser.active} onCheckedChange={active => setEditingUser({ ...editingUser, active })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-gradient-primary" onClick={saveUser}>Salvar usuário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
