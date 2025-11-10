import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, FileText, Package, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Stats {
  totalBombonas: number;
  totalFichas: number;
  fichasMes: number;
  bombonasMaisUsadas: Array<{ codigo: string; count: number }>;
}

const Relatorios = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalBombonas: 0,
    totalFichas: 0,
    fichasMes: 0,
    bombonasMaisUsadas: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total bombonas
      const { count: bombonas } = await supabase
        .from("bombonas")
        .select("*", { count: "exact", head: true });

      // Total fichas
      const { count: fichas } = await supabase
        .from("fichas")
        .select("*", { count: "exact", head: true });

      // Fichas do mês atual
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { count: fichasMes } = await supabase
        .from("fichas")
        .select("*", { count: "exact", head: true })
        .gte("data_movimentacao", firstDayOfMonth.toISOString());

      // Bombonas mais usadas
      const { data: fichasData } = await supabase
        .from("fichas")
        .select("bombona_id, bombonas(codigo)");

      const bombonaCount = (fichasData || []).reduce((acc: any, ficha: any) => {
        const codigo = ficha.bombonas?.codigo;
        if (codigo) {
          acc[codigo] = (acc[codigo] || 0) + 1;
        }
        return acc;
      }, {});

      const bombonasMaisUsadas = Object.entries(bombonaCount)
        .map(([codigo, count]) => ({ codigo, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalBombonas: bombonas || 0,
        totalFichas: fichas || 0,
        fichasMes: fichasMes || 0,
        bombonasMaisUsadas,
      });
    } catch (error) {
      toast.error("Erro ao carregar estatísticas");
      console.error(error);
    }
    setLoading(false);
  };

  const exportData = async () => {
    try {
      const { data } = await supabase
        .from("fichas")
        .select(`
          *,
          bombonas(codigo, tipo)
        `)
        .order("data_movimentacao", { ascending: false });

      const csv = [
        ["Data", "Bombona", "Tipo", "Cliente", "Endereço", "Status"].join(","),
        ...(data || []).map((ficha) =>
          [
            new Date(ficha.data_movimentacao).toLocaleDateString("pt-BR"),
            ficha.bombonas?.codigo,
            ficha.tipo_movimentacao,
            ficha.cliente_nome,
            ficha.cliente_endereco,
            ficha.status,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar relatório");
      console.error(error);
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
              <h1 className="text-2xl font-bold">Relatórios</h1>
              <p className="text-sm text-muted-foreground">Visão geral do sistema</p>
            </div>
          </div>
          <Button onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Bombonas</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBombonas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Fichas</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFichas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fichas Este Mês</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.fichasMes}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bombonas Mais Utilizadas</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.bombonasMaisUsadas.length > 0 ? (
              <div className="space-y-4">
                {stats.bombonasMaisUsadas.map((bombona, index) => (
                  <div key={bombona.codigo} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <span className="font-medium">{bombona.codigo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(bombona.count / (stats.bombonasMaisUsadas[0]?.count || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{bombona.count}x</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Relatorios;