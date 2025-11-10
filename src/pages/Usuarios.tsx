import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface User {
  id: string;
  nome_completo: string;
  role?: string;
}

const Usuarios = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, nome_completo");

    if (profilesError) {
      toast.error("Erro ao carregar usuários");
      console.error(profilesError);
      setLoading(false);
      return;
    }

    // Fetch roles for each profile
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.error("Erro ao carregar roles:", rolesError);
    }

    // Merge profiles with roles
    const usersWithRoles = (profiles || []).map((profile) => ({
      ...profile,
      role: roles?.find((r) => r.user_id === profile.id)?.role,
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    // Delete existing role
    await supabase.from("user_roles").delete().eq("user_id", userId);

    // Insert new role
    const { error } = await supabase.from("user_roles").insert([{
      user_id: userId,
      role: newRole as "admin" | "entregador" | "operador",
    }]);

    if (error) {
      toast.error("Erro ao atualizar cargo");
      console.error(error);
      return;
    }

    toast.success("Cargo atualizado com sucesso!");
    fetchUsers();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "entregador":
        return "Entregador";
      case "operador":
        return "Operador";
      default:
        return "Sem cargo";
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
              <h1 className="text-2xl font-bold">Usuários</h1>
              <p className="text-sm text-muted-foreground">{users.length} usuários cadastrados</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{user.nome_completo}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {user.role ? getRoleLabel(user.role) : "Sem cargo"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alterar Cargo</label>
                  <Select
                    value={user.role || ""}
                    onValueChange={(value) => updateUserRole(user.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="entregador">Entregador</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum usuário cadastrado</h3>
          </div>
        )}
      </main>
    </div>
  );
};

export default Usuarios;