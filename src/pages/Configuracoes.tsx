import { ChangeEvent, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TeamUser, useCRM } from "@/store/crm-store";
import { hashPassword } from "@/lib/password";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

const ROLES = ["Administrador", "Vendedora", "Financeiro", "Somente leitura"];
const PERMISSIONS = [
  "Ver dashboard", "Ver todos os atendimentos", "Ver apenas próprios atendimentos",
  "Editar funil", "Editar atendimentos", "Finalizar venda", "Criar agentes", "Editar agentes",
  "Ver relatórios", "Exportar dados", "Criar usuários", "Alterar configurações da empresa"
];
const DEFAULT_PERMS: Record<string, boolean[]> = {
  "Administrador": PERMISSIONS.map(() => true),
  "Vendedora": [true, false, true, false, false, true, false, false, false, false, false, false],
  "Financeiro": [true, false, false, false, false, false, false, false, true, true, false, false],
  "Somente leitura": [true, true, false, false, false, false, false, false, true, false, false, false],
};

const initialsFromName = (name: string) =>
  name.split(" ").filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase();

const readImageFile = (file: File, onLoad: (dataUrl: string) => void) => {
  if (!file.type.startsWith("image/")) {
    toast.error("Selecione uma imagem");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => onLoad(String(reader.result));
  reader.readAsDataURL(file);
};

const emptyUser: TeamUser = {
  id: "new",
  name: "",
  username: "",
  avatar: "",
  email: "",
  phone: "",
  role: "Vendedora",
  password: "",
  active: true,
  allowedTags: [],
  allowedConversationIds: [],
  allowedInstanceIds: [],
  receivesNewLeads: true,
};

export default function Configuracoes() {
  const { teamUsers: users, setTeamUsers: setUsers, accountProfile, setAccountProfile, currentUser, hasPermission, agents } = useCRM();
  const [perms, setPerms] = useState(DEFAULT_PERMS);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamUser>(emptyUser);
  const sellerOptions = users.filter(user => user.active && user.role !== "Administrador");
  const accountPhotoInputRef = useRef<HTMLInputElement>(null);
  const userPhotoInputRef = useRef<HTMLInputElement>(null);

  const openNewUser = () => {
    setEditingUser(emptyUser);
    setUserDialogOpen(true);
  };

  const openEditUser = (user: TeamUser) => {
    setEditingUser({ ...user, password: "" });
    setUserDialogOpen(true);
  };

  const saveUser = async () => {
    if (!editingUser.name.trim()) return toast.error("Informe o nome do usuário");
    if (!editingUser.email.trim()) return toast.error("Informe o e-mail do usuário");
    if (editingUser.id === "new" && !editingUser.password?.trim()) return toast.error("Informe a senha do usuário");
    const avatar = editingUser.avatar.trim() || initialsFromName(editingUser.name);
    const username = editingUser.username?.trim() || editingUser.email.split("@")[0];
    const passwordPatch = editingUser.password?.trim() ? await hashPassword(editingUser.password) : {};
    const { password: _password, ...userWithoutPassword } = editingUser;
    if (editingUser.id === "new") {
      setUsers(prev => [...prev, { ...userWithoutPassword, ...passwordPatch, id: `u${Date.now()}`, avatar, username }]);
      toast.success("Usuário criado");
    } else {
      const updatedUser = { ...userWithoutPassword, ...passwordPatch, avatar, username };
      setUsers(prev => prev.map(user => user.id === editingUser.id ? updatedUser : user));
      if (editingUser.id === currentUser?.id) {
        setAccountProfile(prev => ({
          ...prev,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone || prev.phone,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          photoUrl: updatedUser.photoUrl,
        }));
      }
      toast.success("Usuário atualizado");
    }
    setUserDialogOpen(false);
  };

  const saveAccount = () => {
    const avatar = initialsFromName(accountProfile.name);
    const nextProfile = { ...accountProfile, avatar };
    setAccountProfile(nextProfile);
    setUsers(prev => prev.map(user => user.id === currentUser?.id
      ? {
        ...user,
        name: nextProfile.name,
        email: nextProfile.email,
        phone: nextProfile.phone,
        role: nextProfile.role,
        avatar: nextProfile.avatar,
        photoUrl: nextProfile.photoUrl,
      }
      : user));
    toast.success("Alterações salvas!");
  };

  const updateAccountPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readImageFile(file, photoUrl => {
      setAccountProfile(prev => ({ ...prev, photoUrl }));
      setUsers(prev => prev.map(user => user.id === currentUser?.id ? { ...user, photoUrl } : user));
      toast.success("Foto atualizada");
    });
    event.target.value = "";
  };

  const updateEditingUserPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readImageFile(file, photoUrl => setEditingUser(prev => ({ ...prev, photoUrl })));
    event.target.value = "";
  };

  const removeUser = (id: string) => {
    if (id === "admin") {
      toast.error("A conta admin inicial não pode ser excluída");
      return;
    }
    setUsers(prev => prev.filter(user => user.id !== id));
    toast.success("Usuário excluído");
  };

  if (!hasPermission("Alterar configurações da empresa")) {
    return (
      <AppLayout title="Configurações" subtitle="Acesso restrito">
        <div className="card-elevated p-6 text-sm text-muted-foreground">
          Seu usuário não tem permissão para alterar configurações da empresa.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Configurações" subtitle="Gerencie sua conta, equipe e integrações">
      <Tabs defaultValue="account">
        <TabsList className="bg-card border border-border/60 p-1 h-auto flex-wrap">
          <TabsTrigger value="account">Minha conta</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="service">Atendimento</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="openai">OpenAI</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="card-elevated p-6 mt-4 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={accountProfile.photoUrl} alt={accountProfile.name} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl font-bold">{accountProfile.avatar}</AvatarFallback>
            </Avatar>
            <input ref={accountPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={updateAccountPhoto} />
            <Button variant="outline" onClick={() => accountPhotoInputRef.current?.click()}>Alterar foto</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nome</Label><Input value={accountProfile.name} onChange={event => setAccountProfile({ ...accountProfile, name: event.target.value, avatar: accountProfile.avatar || initialsFromName(event.target.value) })} /></div>
            <div><Label>E-mail</Label><Input value={accountProfile.email} onChange={event => setAccountProfile({ ...accountProfile, email: event.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={accountProfile.phone} onChange={event => setAccountProfile({ ...accountProfile, phone: event.target.value })} /></div>
            <div><Label>Cargo</Label><Input value={accountProfile.role} onChange={event => setAccountProfile({ ...accountProfile, role: event.target.value })} /></div>
          </div>
          <Button onClick={saveAccount} className="mt-6 bg-gradient-primary">Salvar alterações</Button>
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
                  <td className="py-3"><div className="flex items-center gap-2"><Avatar className="w-8 h-8"><AvatarImage src={u.photoUrl} alt={u.name} /><AvatarFallback className="bg-primary-soft text-primary text-xs font-semibold">{u.avatar}</AvatarFallback></Avatar>{u.name}</div></td>
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

        <TabsContent value="service" className="card-elevated p-6 mt-4 max-w-2xl space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label>Tempo máximo sem resposta</Label><Input defaultValue="15 minutos" /></div>
            <div><Label>Tags padrão</Label><Input defaultValue="Urgente, Retornar hoje, Enviar proposta" /></div>
            <div className="sm:col-span-2"><Label>Mensagem padrão de ausência</Label><Input defaultValue="Recebemos sua mensagem e retornaremos no próximo horário de atendimento." /></div>
            <div className="sm:col-span-2"><Label>Mensagem de boas-vindas</Label><Input defaultValue="Olá! Como podemos ajudar hoje?" /></div>
            <div className="sm:col-span-2"><Label>Motivos de perda personalizáveis</Label><Input defaultValue="Preço, Sem interesse, Sem resposta, Fora do perfil, Outros" /></div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background p-4">
            <div className="mb-3">
              <div className="text-sm font-semibold">Atendimento fora de serviço</div>
              <p className="text-xs text-muted-foreground">Use uma IA para receber novos leads fora do horário e direcionar para uma vendedora quando a operação abrir.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Início fora de serviço</Label><Input type="time" defaultValue="18:00" /></div>
              <div><Label>Fim fora de serviço</Label><Input type="time" defaultValue="08:00" /></div>
              <div>
                <Label>IA para atender novos leads</Label>
                <Select defaultValue={agents[0]?.id || "none"}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma IA" /></SelectTrigger>
                  <SelectContent>
                    {agents.map(agent => <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>)}
                    <SelectItem value="none">Nenhuma IA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Direcionar para vendedora</Label>
                <Select defaultValue={sellerOptions[0]?.id || "none"}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma vendedora" /></SelectTrigger>
                  <SelectContent>
                    {sellerOptions.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                    <SelectItem value="none">Sem direcionamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Button onClick={() => toast.success("Configurações de atendimento salvas")} className="bg-gradient-primary">Salvar</Button>
        </TabsContent>

        <TabsContent value="whatsapp" className="card-elevated p-6 mt-4 max-w-2xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-secondary p-4"><div className="text-xs text-muted-foreground">Status da integração</div><div className="mt-1 font-semibold text-success">Em configuração</div></div>
            <div className="rounded-xl bg-secondary p-4"><div className="text-xs text-muted-foreground">Número conectado</div><div className="mt-1 font-semibold">+55 11 98888-0101</div></div>
            <div className="rounded-xl bg-secondary p-4"><div className="text-xs text-muted-foreground">Instância</div><div className="mt-1 font-semibold">WhatsApp Principal</div></div>
            <div className="rounded-xl bg-secondary p-4"><div className="text-xs text-muted-foreground">Última sincronização</div><div className="mt-1 font-semibold">Hoje, 10:30</div></div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="card-elevated p-6 mt-4 max-w-2xl space-y-4">
          {[
            "Notificar conversa sem resposta",
            "Notificar lead quente parado",
            "Notificar retorno do dia",
            "Notificar campanha finalizada",
          ].map(item => (
            <div key={item} className="flex items-center justify-between rounded-xl bg-secondary p-3">
              <div className="text-sm font-semibold">{item}</div>
              <Switch defaultChecked />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="appearance" className="card-elevated p-6 mt-4 max-w-2xl space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Tema</Label><Select defaultValue="light"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="light">Claro</SelectItem><SelectItem value="dark">Escuro</SelectItem></SelectContent></Select></div>
            <div><Label>Cor principal</Label><Input type="color" defaultValue="#6d5dfc" className="h-10 p-1" /></div>
            <div className="sm:col-span-2"><Label>Nome exibido no sistema</Label><Input defaultValue="CRM WhatsApp Pro" /></div>
          </div>
          <Button onClick={() => toast.success("Aparência atualizada")} className="bg-gradient-primary">Salvar aparência</Button>
        </TabsContent>

        <TabsContent value="openai" className="card-elevated p-6 mt-4 max-w-2xl space-y-4">
          <div>
            <h3 className="font-display font-bold">OpenAI</h3>
            <p className="text-sm text-muted-foreground">Informe a API key usada pelos agentes de IA. A integração real com backend será conectada depois.</p>
          </div>
          <div>
            <Label>OpenAI API Key</Label>
            <Input type="password" placeholder="sk-..." />
          </div>
          <Button onClick={() => toast.success("Chave da OpenAI salva")} className="bg-gradient-primary">Salvar API key</Button>
        </TabsContent>
      </Tabs>

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editingUser.id === "new" ? "Novo usuário" : "Editar usuário"}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={editingUser.photoUrl} alt={editingUser.name} />
              <AvatarFallback className="bg-primary-soft text-primary font-semibold">{editingUser.avatar || initialsFromName(editingUser.name)}</AvatarFallback>
            </Avatar>
            <input ref={userPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={updateEditingUserPhoto} />
            <Button type="button" variant="outline" onClick={() => userPhotoInputRef.current?.click()}>Alterar foto</Button>
          </div>
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
              <Label htmlFor="userLogin">Login</Label>
              <Input id="userLogin" value={editingUser.username || ""} onChange={event => setEditingUser({ ...editingUser, username: event.target.value })} placeholder="ana.paula" />
            </div>
            <div>
              <Label htmlFor="userPassword">Senha *</Label>
              <Input id="userPassword" type="password" value={editingUser.password || ""} onChange={event => setEditingUser({ ...editingUser, password: event.target.value })} />
            </div>
            <div>
              <Label htmlFor="userPhone">Telefone</Label>
              <Input id="userPhone" value={editingUser.phone || ""} onChange={event => setEditingUser({ ...editingUser, phone: event.target.value })} />
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
