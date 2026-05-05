import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCRM } from "@/store/crm-store";
import { MessageSquare, Smartphone, Tags, UserCheck } from "lucide-react";
import { toast } from "sonner";

const INSTANCE_OPTIONS = [
  { id: "wa-01", name: "WhatsApp Principal", phone: "+55 11 98888-0101" },
  { id: "wa-02", name: "WhatsApp Comercial 2", phone: "+55 11 97777-0202" },
  { id: "wa-03", name: "WhatsApp Pos-venda", phone: "+55 11 96666-0303" },
];

export default function Usuarios() {
  const { teamUsers, setTeamUsers, deals, tags, hasPermission } = useCRM();
  const configurableUsers = useMemo(() => teamUsers.filter(user => user.role !== "Administrador"), [teamUsers]);
  const [selectedUserId, setSelectedUserId] = useState(configurableUsers[0]?.id || "");
  const selectedUser = teamUsers.find(user => user.id === selectedUserId) || configurableUsers[0];

  const patchSelectedUser = (patch: Partial<typeof selectedUser>) => {
    if (!selectedUser) return;
    setTeamUsers(current => current.map(user => user.id === selectedUser.id ? { ...user, ...patch } : user));
  };

  const toggleListValue = (key: "allowedTags" | "allowedConversationIds" | "allowedInstanceIds", value: string) => {
    if (!selectedUser) return;
    const current = selectedUser[key] || [];
    const next = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    patchSelectedUser({ [key]: next });
  };

  if (!hasPermission("Alterar configurações da empresa")) {
    return (
      <AppLayout title="Usuarios" subtitle="Acesso restrito">
        <div className="card-elevated p-6 text-sm text-muted-foreground">
          Seu usuario nao tem permissao para configurar acessos de vendedores.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Usuarios" subtitle="Controle acesso por vendedor, tag, conversa e instancia">
      <section className="card-elevated mb-6 p-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
          <div>
            <Label>Vendedor</Label>
            <Select value={selectedUser?.id || ""} onValueChange={setSelectedUserId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione um usuario" /></SelectTrigger>
              <SelectContent>
                {configurableUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <div className="flex flex-col gap-4 rounded-xl bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser.photoUrl} alt={selectedUser.name} />
                  <AvatarFallback className="bg-primary-soft text-primary font-semibold">{selectedUser.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{selectedUser.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold">Recebe novos leads</div>
                  <div className="text-xs text-muted-foreground">Distribuicao automatica</div>
                </div>
                <Switch
                  checked={selectedUser.receivesNewLeads ?? false}
                  onCheckedChange={receivesNewLeads => patchSelectedUser({ receivesNewLeads })}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {selectedUser && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <section className="card-elevated p-5">
            <div className="mb-4 flex items-center gap-2">
              <Tags className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-bold">Tags permitidas</h2>
            </div>
            <div className="mb-3 text-xs text-muted-foreground">
              Se nenhuma tag estiver marcada, o acesso por tag fica livre e continuam valendo os responsaveis da conversa.
            </div>
            <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border/70 bg-background p-2">
              {tags.map(tag => (
                <label key={tag} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-secondary">
                  <Checkbox checked={(selectedUser.allowedTags || []).includes(tag)} onCheckedChange={() => toggleListValue("allowedTags", tag)} />
                  <span className="truncate">{tag}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="card-elevated p-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-bold">Conversas permitidas</h2>
            </div>
            <div className="mb-3 text-xs text-muted-foreground">
              Marque conversas especificas para liberar acesso mesmo quando o vendedor nao for responsavel direto.
            </div>
            <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border/70 bg-background p-2">
              {deals.map(deal => (
                <label key={deal.id} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-sm hover:bg-secondary">
                  <Checkbox checked={(selectedUser.allowedConversationIds || []).includes(deal.id)} onCheckedChange={() => toggleListValue("allowedConversationIds", deal.id)} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{deal.customer}</span>
                    <span className="block truncate text-xs text-muted-foreground">{deal.phone}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="card-elevated p-5">
            <div className="mb-4 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-bold">Instancias permitidas</h2>
            </div>
            <div className="mb-3 text-xs text-muted-foreground">
              Controle quais canais o vendedor pode usar quando a integracao estiver conectada.
            </div>
            <div className="space-y-2">
              {INSTANCE_OPTIONS.map(instance => (
                <label key={instance.id} className="flex cursor-pointer items-start gap-2 rounded-xl border border-border/70 bg-background p-3 hover:bg-secondary">
                  <Checkbox checked={(selectedUser.allowedInstanceIds || []).includes(instance.id)} onCheckedChange={() => toggleListValue("allowedInstanceIds", instance.id)} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{instance.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{instance.phone}</span>
                  </span>
                </label>
              ))}
            </div>

            <Button className="mt-5 w-full gap-2 bg-gradient-primary" onClick={() => toast.success("Permissoes de usuario salvas")}>
              <UserCheck className="h-4 w-4" /> Salvar permissoes
            </Button>
          </section>
        </div>
      )}
    </AppLayout>
  );
}
