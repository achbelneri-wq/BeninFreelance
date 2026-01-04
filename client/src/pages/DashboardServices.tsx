import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Eye } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DashboardServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchServices = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*, category:categories(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [user]);

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      toast.success("Service supprimé");
      fetchServices();
    } catch (error: any) {
      toast.error("Erreur suppression: " + error.message);
    }
  };

  const toggleStatus = async (service: any) => {
    const newStatus = service.status === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase
        .from('services')
        .update({ status: newStatus })
        .eq('id', service.id);
        
      if (error) throw error;
      toast.success(`Service ${newStatus === 'active' ? 'activé' : 'mis en pause'}`);
      fetchServices();
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mes Services</h1>
        <Link href="/dashboard/services/new">
          <Button className="btn-benin">
            <Plus className="mr-2 h-4 w-4" /> Nouveau Service
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="overflow-hidden">
            <div className="aspect-video w-full bg-muted relative">
              {service.cover_image ? (
                <img src={service.cover_image} alt={service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400">
                  Pas d'image
                </div>
              )}
              <Badge className={`absolute top-2 right-2 ${service.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                {service.status === 'active' ? 'Actif' : 'Pause'}
              </Badge>
            </div>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="line-clamp-1 text-lg">{service.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{service.category?.name || 'Sans catégorie'}</p>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span>{service.price.toLocaleString()} FCFA</span>
                <span>{service.total_orders} ventes</span>
              </div>
              
              <div className="flex gap-2">
                <Link href={`/dashboard/services/${service.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="h-4 w-4 mr-2" /> Modifier
                  </Button>
                </Link>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => toggleStatus(service)}
                >
                  {service.status === 'active' ? 'Pauser' : 'Activer'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-9 w-9">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer ce service ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(service.id)} className="bg-red-600">
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {services.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">Vous n'avez pas encore créé de service.</p>
          <Link href="/dashboard/services/new">
            <Button>Créer mon premier service</Button>
          </Link>
        </div>
      )}
    </div>
  );
}