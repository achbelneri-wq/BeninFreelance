import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase"; // REMPLACEMENT TRPC
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingBag, AlertTriangle, DollarSign, Activity, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingDisputes: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setIsLoading(true);
      try {
        // 1. Total Utilisateurs
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        // 2. Total Commandes
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        // 3. Revenu Total (Somme des commandes complétées)
        const { data: revenueData } = await supabase
          .from('orders')
          .select('price')
          .eq('status', 'completed');
        const totalRevenue = revenueData?.reduce((acc, order) => acc + (order.price || 0), 0) || 0;

        // 4. Litiges (Disputes)
        // Si vous n'avez pas de table disputes, on met 0 ou on compte les commandes 'cancelled'
        const { count: disputesCount } = await supabase
          .from('orders') // ou 'disputes' si la table existe
          .select('*', { count: 'exact', head: true })
          .eq('status', 'disputed'); 

        setStats({
          totalUsers: usersCount || 0,
          totalOrders: ordersCount || 0,
          totalRevenue: totalRevenue,
          pendingDisputes: disputesCount || 0
        });

      } catch (error: any) {
        console.error("Erreur admin:", error);
        toast.error("Erreur chargement stats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Administrateur</h2>
        <p className="text-muted-foreground">
          Vue d'ensemble de la plateforme Bénin Freelance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+2% depuis le mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Commandes</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Commandes sur la plateforme</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Financier</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} F</div>
            <p className="text-xs text-muted-foreground">Volume total échangé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Litiges Actifs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDisputes}</div>
            <p className="text-xs text-muted-foreground">Nécessitent une intervention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              <Activity className="h-8 w-8 mr-2 opacity-50" />
              Graphique d'activité bientôt disponible
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
             <div className="p-4 border rounded bg-muted/20">
                <h4 className="font-semibold text-sm">Vérification KYC</h4>
                <p className="text-xs text-muted-foreground">Vérifier les documents en attente</p>
             </div>
             <div className="p-4 border rounded bg-muted/20">
                <h4 className="font-semibold text-sm">Gestion Utilisateurs</h4>
                <p className="text-xs text-muted-foreground">Modérer ou bannir des comptes</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}