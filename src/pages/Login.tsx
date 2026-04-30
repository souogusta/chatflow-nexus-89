import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { LockKeyhole, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCRM } from "@/store/crm-store";

export default function Login() {
  const { currentUser, login } = useCRM();
  const [identifier, setIdentifier] = useState("admin");
  const [password, setPassword] = useState("admin123");

  if (currentUser) return <Navigate to="/" replace />;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (login(identifier, password)) {
      toast.success("Login realizado");
      return;
    }
    toast.error("Usuário ou senha inválidos");
  };

  return (
    <main className="min-h-screen bg-background grid place-items-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-border/70 bg-card p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">Entrar no CRM</h1>
            <p className="text-xs text-muted-foreground">Use admin / admin123 para o primeiro acesso.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="identifier">Usuário, e-mail ou nome</Label>
            <Input id="identifier" value={identifier} onChange={event => setIdentifier(event.target.value)} autoComplete="username" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full gap-2 bg-gradient-primary">
            <LogIn className="h-4 w-4" /> Entrar
          </Button>
        </div>
      </form>
    </main>
  );
}
