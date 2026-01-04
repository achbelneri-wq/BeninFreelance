import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase"; // REMPLACEMENT DE TRPC
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Package,
  MessageSquare,
  Calendar,
  Wallet,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function DashboardOrders() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");

  // Remplacement des hooks tRPC par des états locaux
  const [buyerOrders, setBuyerOrders] = useState<any[]>([]);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [buyerLoading, setBuyerLoading] = useState(true);
  const [sellerLoading, setSellerLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Charger les commandes en tant qu'ACHETEUR
  const fetchBuyerOrders = async () => {
    if (!user) return;
    setBuyerLoading(true);
    try {
      // On suppose que la table orders a une relation 'service_id' vers 'services'
      const { data, error } = await supabase
        .from('orders')
        .select('*, service:services(title, id)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBuyerOrders(data || []);
    } catch (error: any) {
      console.error("Erreur chargement achats:", error);
    } finally {
      setBuyerLoading(false);
    }
  };

  // 2. Charger les commandes en tant que VENDEUR
  const fetchSellerOrders = async () => {
    if (!user || !user.isSeller) {
        setSellerLoading(false);
        return;
    }
    setSellerLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, service:services(title, id)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSellerOrders(data || []);
    } catch (error: any) {
      console.error("Erreur chargement ventes:", error);
    } finally {
      setSellerLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchBuyerOrders();
    fetchSellerOrders();
  }, [user]);

  // Fonction de mise à jour du statut
  const handleStatusUpdate = async (orderId: number, status: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: status })
        .eq('id', orderId);

      if (error) throw error;

      toast.success("Statut mis à jour");
      // Rafraîchir les listes
      fetchBuyerOrders();
      fetchSellerOrders();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatPrice = (price: any, currency: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return "0 FCFA";
    
    if (currency === "XOF") {
      return `${numPrice.toLocaleString('fr-FR')} FCFA`;
    }
    return `${numPrice.toLocaleString('fr-FR')} ${currency}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-300"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"><Package className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'delivered':
        return <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Livré</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Terminé</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Annulé</Badge>;
      case 'disputed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Litige</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filterOrders = (orders: any[]) => {
    if (filter === "all") return orders;
    return orders.filter(o => o.status === filter);
  };

  // Composant Carte Commande
  const OrderCard = ({ order, isSeller }: { order: any; isSeller: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(order.status)}
              <span className="text-sm text-muted-foreground">#{order.id}</span>
            </div>
            {/* Supabase retourne 'created_at' (snake_case) */}
            <h3 className="font-semibold truncate">
                {order.title || order.service?.title || "Commande"}
            </h3>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Wallet className="h-4 w-4" />
                {formatPrice(order.price, order.currency)}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(order.created_at).toLocaleDateString('fr-FR')}
              </div>
              {order.delivery_date && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Livraison: {new Date(order.delivery_date).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            {/* Actions Vendeur */}
            {isSeller && (
              <>
                {order.status === 'pending' && (
                  <Button 
                    size="sm" 
                    className="btn-benin"
                    onClick={() => handleStatusUpdate(order.id, 'in_progress')}
                    disabled={isUpdating}
                  >
                    {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Accepter
                  </Button>
                )}
                {order.status === 'in_progress' && (
                  <Button 
                    size="sm" 
                    className="btn-benin"
                    onClick={() => handleStatusUpdate(order.id, 'delivered')}
                    disabled={isUpdating}
                  >
                    {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Marquer livré
                  </Button>
                )}
              </>
            )}

            {/* Actions Acheteur */}
            {!isSeller && (
              <>
                {order.status === 'delivered' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="btn-benin"
                      onClick={() => handleStatusUpdate(order.id, 'completed')}
                      disabled={isUpdating}
                    >
                      Valider
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusUpdate(order.id, 'disputed')}
                      disabled={isUpdating}
                    >
                      Signaler
                    </Button>
                  </div>
                )}
                {order.status === 'pending' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                    disabled={isUpdating}
                  >
                    Annuler
                  </Button>
                )}
              </>
            )}

            <Link href={`/dashboard/messages`}>
              <Button size="sm" variant="ghost" className="gap-1">
                <MessageSquare className="h-4 w-4" />
                Message
              </Button>
            </Link>
          </div>
        </div>

        {order.requirements && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Instructions:</strong> {order.requirements}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="font-medium">Aucune commande</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Commandes</h1>
          <p className="text-muted-foreground">
            Gérez vos commandes et suivez leur progression
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="delivered">Livrées</SelectItem>
            <SelectItem value="completed">Terminées</SelectItem>
            <SelectItem value="cancelled">Annulées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Affichage conditionnel selon le rôle */}
      {user?.isSeller ? (
        <Tabs defaultValue="received" className="space-y-6">
          <TabsList>
            <TabsTrigger value="received">Commandes reçues</TabsTrigger>
            <TabsTrigger value="placed">Mes achats</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            {sellerLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : sellerOrders && filterOrders(sellerOrders).length > 0 ? (
              <div className="space-y-4">
                {filterOrders(sellerOrders).map((order: any) => (
                  <OrderCard key={order.id} order={order} isSeller={true} />
                ))}
              </div>
            ) : (
              <EmptyState message="Vous n'avez pas encore reçu de commandes" />
            )}
          </TabsContent>

          <TabsContent value="placed" className="space-y-4">
            {buyerLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : buyerOrders && filterOrders(buyerOrders).length > 0 ? (
              <div className="space-y-4">
                {filterOrders(buyerOrders).map((order: any) => (
                  <OrderCard key={order.id} order={order} isSeller={false} />
                ))}
              </div>
            ) : (
              <EmptyState message="Vous n'avez pas encore passé de commandes" />
            )}
          </TabsContent>
        </Tabs>
      ) : (
        /* Vue Acheteur Unique */
        <div className="space-y-4">
          {buyerLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : buyerOrders && filterOrders(buyerOrders).length > 0 ? (
            <div className="space-y-4">
              {filterOrders(buyerOrders).map((order: any) => (
                <OrderCard key={order.id} order={order} isSeller={false} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="font-medium">Aucune commande</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Explorez les services et passez votre première commande
                </p>
                <Link href="/services">
                  <Button className="btn-benin gap-2">
                    Découvrir les services
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}