import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SignaturePad } from "@/components/SignaturePad";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Ficha {
  id: string;
  tipo_movimentacao: string;
  cliente_nome: string;
  cliente_endereco: string;
  data_movimentacao: string;
  assinatura_url: string | null;
  status: string;
  bombonas: {
    codigo: string;
  };
}

interface Bombona {
  id: string;
  codigo: string;
}

const Fichas = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [bombonas, setBombonas] = useState<Bombona[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureData, setSignatureData] = useState("");
  
  const [formData, setFormData] = useState({
    bombona_id: "",
    tipo_movimentacao: "entrega",
    cliente_nome: "",
    cliente_endereco: "",
    cliente_telefone: "",
    observacoes: "",
  });

  useEffect(() => {
    fetchData();
  }, [user, userRole]);

  const fetchData = async () => {
    // Fetch bombonas
    const { data: bombonasData } = await supabase
      .from("bombonas")
      .select("id, codigo")
      .eq("status", "disponivel");
    setBombonas(bombonasData || []);

    // Fetch fichas
    let query = supabase
      .from("fichas")
      .select(`
        *,
        bombonas(codigo)
      `)
      .order("created_at", { ascending: false });

    if (userRole === "entregador") {
      query = query.eq("entregador_id", user?.id);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Erro ao carregar fichas");
      console.error(error);
    } else {
      setFichas(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bombona_id || !formData.cliente_nome || !formData.cliente_endereco) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!showSignature) {
      setShowSignature(true);
      return;
    }

    if (!signatureData) {
      toast.error("Assinatura é obrigatória");
      return;
    }

    const { error } = await supabase.from("fichas").insert({
      bombona_id: formData.bombona_id,
      tipo_movimentacao: formData.tipo_movimentacao,
      entregador_id: user?.id,
      cliente_nome: formData.cliente_nome,
      cliente_endereco: formData.cliente_endereco,
      cliente_telefone: formData.cliente_telefone || null,
      observacoes: formData.observacoes || null,
      assinatura_url: signatureData,
      status: "concluido",
    });

    if (error) {
      toast.error("Erro ao criar ficha");
      console.error(error);
      return;
    }

    toast.success("Ficha criada com sucesso!");
    setDialogOpen(false);
    setShowSignature(false);
    setSignatureData("");
    setFormData({
      bombona_id: "",
      tipo_movimentacao: "entrega",
      cliente_nome: "",
      cliente_endereco: "",
      cliente_telefone: "",
      observacoes: "",
    });
    fetchData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluido":
        return "bg-success/10 text-success border-success/20";
      case "pendente":
        return "bg-warning/10 text-warning border-warning/20";
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
              <h1 className="text-2xl font-bold">Fichas</h1>
              <p className="text-sm text-muted-foreground">{fichas.length} fichas registradas</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setShowSignature(false);
              setSignatureData("");
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Ficha
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {showSignature ? "Assinatura do Cliente" : "Criar Nova Ficha"}
                </DialogTitle>
              </DialogHeader>
              {!showSignature ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bombona">Bombona *</Label>
                    <Input
                      id="bombona"
                      value={formData.bombona_id}
                      onChange={(e) => setFormData({ ...formData, bombona_id: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Movimentação</Label>
                    <Select value={formData.tipo_movimentacao} onValueChange={(value) => setFormData({ ...formData, tipo_movimentacao: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrega">Entrega</SelectItem>
                        <SelectItem value="coleta">Coleta</SelectItem>
                        <SelectItem value="troca">Troca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente_nome">Nome do Cliente *</Label>
                    <Input
                      id="cliente_nome"
                      value={formData.cliente_nome}
                      onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente_endereco">Endereço *</Label>
                    <Input
                      id="cliente_endereco"
                      value={formData.cliente_endereco}
                      onChange={(e) => setFormData({ ...formData, cliente_endereco: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente_telefone">Telefone</Label>
                    <Input
                      id="cliente_telefone"
                      value={formData.cliente_telefone}
                      onChange={(e) => setFormData({ ...formData, cliente_telefone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">Próximo: Assinatura</Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <SignaturePad onSave={(dataUrl) => {
                    setSignatureData(dataUrl);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    handleSubmit(new Event("submit") as any);
                  }} />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fichas.map((ficha) => (
            <Card key={ficha.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{ficha.bombonas.codigo}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{ficha.tipo_movimentacao}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(ficha.status)}`}>
                    {ficha.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{ficha.cliente_nome}</p>
                  <p className="text-sm text-muted-foreground">{ficha.cliente_endereco}</p>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2">
                  {format(new Date(ficha.data_movimentacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
                {ficha.assinatura_url && (
                  <div className="border rounded p-2 bg-white">
                    <img src={ficha.assinatura_url} alt="Assinatura" className="w-full h-20 object-contain" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {fichas.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma ficha registrada</h3>
            <p className="text-muted-foreground">Clique em 'Nova Ficha' para começar</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Fichas;