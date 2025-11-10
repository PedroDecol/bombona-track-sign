import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, User, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const Perfil = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [historico, setHistorico] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadHistory();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Erro ao carregar perfil:", error);
      return;
    }

    if (data) {
      setNomeCompleto(data.nome_completo || "");
      setTelefone(data.telefone || "");
    }
  };

  const loadHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("fichas")
      .select(`
        *,
        bombona:bombonas(codigo, tipo)
      `)
      .eq("entregador_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Erro ao carregar histórico:", error);
      return;
    }

    setHistorico(data || []);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        nome_completo: nomeCompleto,
        telefone: telefone,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar perfil");
      console.error(error);
      return;
    }

    toast.success("Perfil atualizado com sucesso!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluido":
        return "bg-success";
      case "pendente":
        return "bg-warning";
      case "cancelado":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const getTipoMovimentacaoLabel = (tipo: string) => {
    switch (tipo) {
      case "entrega":
        return "Entrega";
      case "coleta":
        return "Coleta";
      case "troca":
        return "Troca";
      default:
        return tipo;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie suas informações pessoais
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="dados">
              <User className="w-4 h-4 mr-2" />
              Meus Dados
            </TabsTrigger>
            <TabsTrigger value="historico">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize seus dados cadastrais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O e-mail não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Cargo</Label>
                  <Input
                    id="role"
                    value={userRole || ""}
                    disabled
                    className="bg-muted capitalize"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <Button 
                  onClick={handleSaveProfile} 
                  disabled={loading}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Fichas</CardTitle>
                <CardDescription>
                  Últimas 10 fichas criadas por você
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historico.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma ficha encontrada
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Bombona</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historico.map((ficha) => (
                          <TableRow key={ficha.id}>
                            <TableCell>
                              {format(new Date(ficha.created_at), "dd/MM/yyyy HH:mm")}
                            </TableCell>
                            <TableCell>
                              {ficha.bombona?.codigo}
                            </TableCell>
                            <TableCell>{ficha.cliente_nome}</TableCell>
                            <TableCell>
                              {getTipoMovimentacaoLabel(ficha.tipo_movimentacao)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(ficha.status)}>
                                {ficha.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Perfil;
