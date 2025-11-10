import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, FileText, Users, LogOut, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const adminCards = [
    {
      title: "Bombonas",
      description: "Gerenciar cadastro de bombonas",
      icon: Package,
      path: "/bombonas",
      color: "bg-primary",
    },
    {
      title: "Fichas",
      description: "Criar e visualizar fichas",
      icon: ClipboardList,
      path: "/fichas",
      color: "bg-accent",
    },
    {
      title: "Relatórios",
      description: "Ver relatórios e histórico",
      icon: FileText,
      path: "/relatorios",
      color: "bg-success",
    },
    {
      title: "Usuários",
      description: "Gerenciar usuários e permissões",
      icon: Users,
      path: "/usuarios",
      color: "bg-warning",
    },
  ];

  const entregadorCards = [
    {
      title: "Minhas Fichas",
      description: "Ver e criar fichas de entrega",
      icon: ClipboardList,
      path: "/fichas",
      color: "bg-accent",
    },
    {
      title: "Bombonas",
      description: "Consultar bombonas disponíveis",
      icon: Package,
      path: "/bombonas",
      color: "bg-primary",
    },
  ];

  const cards = userRole === "admin" ? adminCards : entregadorCards;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Bem-vindo, {user?.email}
              {userRole && <span className="ml-2 text-primary font-medium">({userRole})</span>}
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <Card 
              key={card.path}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              onClick={() => navigate(card.path)}
            >
              <CardHeader>
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">
                  Acessar →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;