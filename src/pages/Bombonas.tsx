import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Bombona {
  id: string;
  codigo: string;
  capacidade: number;
  tipo: string;
  status: string;
  localizacao_atual: string | null;
  observacoes: string | null;
}

const Bombonas = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [bombonas, setBombonas] = useState<Bombona[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    codigo: "",
    capacidade: "",
    tipo: "gas",
    status: "disponivel",
    localizacao_atual: "",
    observacoes: "",
  });

  useEffect(() => {
    fetchBombonas();
  }, []);

  const fetchBombonas = async () => {
    const { data, error } = await supabase
      .from("bombonas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar bombonas");
      console.error(error);
    } else {
      setBombonas(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.codigo || !formData.capacidade) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const { error } = await supabase.from("bombonas").insert({
      codigo: formData.codigo,
      capacidade: parseFloat(formData.capacidade),
      tipo: formData.tipo,
      status: formData.status,
      localizacao_atual: formData.localizacao_atual || null,
      observacoes: formData.observacoes || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Já existe uma bombona com este código");
      } else {
        toast.error("Erro ao cadastrar bombona");
      }
      return;
    }

    toast.success("Bombona cadastrada com sucesso!");
    setDialogOpen(false);
    setFormData({
      codigo: "",
      capacidade: "",
      tipo: "gas",
      status: "disponivel",
      localizacao_atual: "",
      observacoes: "",
    });
    fetchBombonas();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "disponivel":
        return "bg-success/10 text-success border-success/20";
      case "em_uso":
        return "bg-warning/10 text-warning border-warning/20";
      case "manutencao":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Bombonas</h1>
              <p className="text-sm text-muted-foreground">{bombonas.length} bombonas cadastradas</p>
            </div>
          </div>
          {userRole === "admin" && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Bombona
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Cadastrar Nova Bombona</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder="Ex: BOM-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacidade">Capacidade (L) *</Label>
                    <Input
                      id="capacidade"
                      type="number"
                      step="0.1"
                      value={formData.capacidade}
                      onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                      placeholder="Ex: 20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gas">Gás</SelectItem>
                        <SelectItem value="agua">Água</SelectItem>
                        <SelectItem value="quimico">Químico</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disponivel">Disponível</SelectItem>
                        <SelectItem value="em_uso">Em Uso</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="localizacao">Localização Atual</Label>
                    <Input
                      id="localizacao"
                      value={formData.localizacao_atual}
                      onChange={(e) => setFormData({ ...formData, localizacao_atual: e.target.value })}
                      placeholder="Ex: Depósito A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Informações adicionais"
                    />
                  </div>
                  <Button type="submit" className="w-full">Cadastrar</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bombonas.map((bombona) => (
            <Card key={bombona.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{bombona.codigo}</CardTitle>
                      <p className="text-sm text-muted-foreground">{bombona.tipo}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(bombona.status)}`}>
                    {bombona.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capacidade:</span>
                  <span className="font-medium">{bombona.capacidade}L</span>
                </div>
                {bombona.localizacao_atual && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Localização:</span>
                    <span className="font-medium">{bombona.localizacao_atual}</span>
                  </div>
                )}
                {bombona.observacoes && (
                  <p className="text-sm text-muted-foreground border-t pt-2 mt-2">
                    {bombona.observacoes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {bombonas.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma bombona cadastrada</h3>
            <p className="text-muted-foreground">
              {userRole === "admin" ? "Clique em 'Nova Bombona' para começar" : "Aguarde o cadastro de bombonas"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Bombonas;