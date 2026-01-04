import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SparkleIcon from "@/components/SparkleIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  DollarSign,
  Calendar,
  FileText,
  Upload,
  Download,
  Star,
  Shield,
  ArrowRight,
  Package,
  Truck,
  Flag,
  MoreVertical,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getLoginUrl } from "@/const";

interface ProjectOrder {
  id: number;
  project_id: number;
  proposal_id: number;
  client_id: number;
  freelancer_id: number;
  status: string;
  total_amount: number;
  platform_fee: number;
  freelancer_amount: number;
  payment_status: string;
  started_at?: string;
  deadline?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  project?: {
    id: number;
    title: string;
    description: string;
  };
  client?: {
    id: number;
    name: string;
    avatar?: string;
  };
  freelancer?: {
    id: number;
    name: string;
    avatar?: string;
  };
  milestones?: OrderMilestone[];
  deliverables?: Deliverable[];
}

interface OrderMilestone {
  id: number;
  title: string;
  description?: string;
  amount: number;
  status: string;
  due_date?: string;
  completed_at?: string;
  sort_order: number;
}

interface Deliverable {
  id: number;
  title: string;
  description?: string;
  file_url?: string;
  file_type?: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  feedback?: string;
}

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "En attente", color: "#C75B39", bg: "#FFF3E0", icon: Clock },
  active: { label: "En cours", color: "#5C6B4A", bg: "#E8F5E9", icon: RefreshCw },
  delivered: { label: "Livré", color: "#3B82F6", bg: "#EFF6FF", icon: Package },
  revision: { label: "En révision", color: "#D4AF37", bg: "#FFF8E1", icon: RefreshCw },
  completed: { label: "Terminé", color: "#5C6B4A", bg: "#E8F5E9", icon: CheckCircle },
  cancelled: { label: "Annulé", color: "#9A948D", bg: "#F5F5F5", icon: XCircle },
  disputed: { label: "Litige", color: "#EF4444", bg: "#FEF2F2", icon: AlertCircle },
};

function OrderSkeleton() {
  return (
    <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectOrders() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();

  const [orders, setOrders] = useState<ProjectOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProjectOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  // Modal livraison
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    title: "",
    description: "",
    file_url: "",
  });
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Modal révision
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");

  // Stats
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    if (!user) {
      setLocation(getLoginUrl());
      return;
    }

    const loadOrders = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("project_orders")
          .select(`
            *,
            project:projects (id, title, description),
            client:users!project_orders_client_id_fkey (id, name, avatar),
            freelancer:users!project_orders_freelancer_id_fkey (id, name, avatar),
            milestones:project_order_milestones (*),
            deliverables:project_order_deliverables (*)
          `)
          .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setOrders(data || []);

        const active = data?.filter(o => ['pending', 'active', 'delivered', 'revision'].includes(o.status)).length || 0;
        const completed = data?.filter(o => o.status === 'completed').length || 0;
        const totalEarnings = data
          ?.filter(o => o.status === 'completed' && o.freelancer_id === user.id)
          .reduce((sum, o) => sum + (o.freelancer_amount || 0), 0) || 0;

        setStats({ active, completed, totalEarnings });

        if (params.id) {
          const order = data?.find(o => o.id === parseInt(params.id as string));
          if (order) setSelectedOrder(order);
        }
      } catch (error) {
        console.error("Erreur chargement commandes:", error);
        toast.error("Erreur lors du chargement des commandes");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user, params.id]);

  const isFreelancer = (order: ProjectOrder) => order.freelancer_id === user?.id;
  const isClient = (order: ProjectOrder) => order.client_id === user?.id;

  const getOtherParty = (order: ProjectOrder) => {
    return isFreelancer(order) ? order.client : order.freelancer;
  };

  const submitDelivery = async () => {
    if (!selectedOrder || !deliveryData.title.trim()) {
      toast.error("Veuillez remplir le titre de la livraison");
      return;
    }

    setSubmittingDelivery(true);
    try {
      const { error: deliverableError } = await supabase
        .from("project_order_deliverables")
        .insert({
          order_id: selectedOrder.id,
          title: deliveryData.title,
          description: deliveryData.description,
          file_url: deliveryData.file_url || null,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        });

      if (deliverableError) throw deliverableError;

      const { error: orderError } = await supabase
        .from("project_orders")
        .update({ status: 'delivered' })
        .eq("id", selectedOrder.id);

      if (orderError) throw orderError;

      toast.success("Livraison soumise avec succès !");
      setDeliveryModalOpen(false);
      setDeliveryData({ title: "", description: "", file_url: "" });
      window.location.reload();
    } catch (error) {
      console.error("Erreur livraison:", error);
      toast.error("Erreur lors de la soumission");
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const requestRevision = async () => {
    if (!selectedOrder || !revisionFeedback.trim()) {
      toast.error("Veuillez expliquer les modifications demandées");
      return;
    }

    try {
      const lastDeliverable = selectedOrder.deliverables?.[selectedOrder.deliverables.length - 1];
      if (lastDeliverable) {
        await supabase
          .from("project_order_deliverables")
          .update({ 
            status: 'revision_requested',
            feedback: revisionFeedback,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", lastDeliverable.id);
      }

      await supabase
        .from("project_orders")
        .update({ status: 'revision' })
        .eq("id", selectedOrder.id);

      toast.success("Demande de révision envoyée");
      setRevisionModalOpen(false);
      setRevisionFeedback("");
      window.location.reload();
    } catch (error) {
      console.error("Erreur révision:", error);
      toast.error("Erreur lors de la demande");
    }
  };

  const acceptDelivery = async () => {
    if (!selectedOrder) return;

    if (!confirm("Confirmer l'acceptation de la livraison ? Le paiement sera libéré au freelance.")) return;

    try {
      const lastDeliverable = selectedOrder.deliverables?.[selectedOrder.deliverables.length - 1];
      if (lastDeliverable) {
        await supabase
          .from("project_order_deliverables")
          .update({ 
            status: 'accepted',
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", lastDeliverable.id);
      }

      await supabase
        .from("project_orders")
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          payment_status: 'released',
        })
        .eq("id", selectedOrder.id);

      toast.success("Livraison acceptée ! Le projet est terminé.");
      window.location.reload();
    } catch (error) {
      console.error("Erreur acceptation:", error);
      toast.error("Erreur lors de l'acceptation");
    }
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === "active") return ['pending', 'active', 'delivered', 'revision'].includes(o.status);
    if (activeTab === "completed") return o.status === 'completed';
    if (activeTab === "cancelled") return ['cancelled', 'disputed'].includes(o.status);
    return true;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF7F2' }}>
      <Navbar />

      {/* Header */}
      <div className="py-8 relative overflow-hidden" style={{ background: '#C75B39' }}>
        <div className="absolute top-2 right-8 opacity-30">
          <SparkleIcon variant="star" size="lg" bgColor="transparent" color="#FFFDFB" />
        </div>
        <div className="container relative z-10">
          <div className="flex items-center gap-4">
            <SparkleIcon variant="default" size="lg" />
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                Commandes Projets
              </h1>
              <p className="text-white/80">
                Gérez vos projets freelance en cours et terminés
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="container">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: '#C75B39' }}>{stats.active}</p>
                <p className="text-sm" style={{ color: '#6B6560' }}>En cours</p>
              </CardContent>
            </Card>
            <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: '#5C6B4A' }}>{stats.completed}</p>
                <p className="text-sm" style={{ color: '#6B6560' }}>Terminées</p>
              </CardContent>
            </Card>
            <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: '#1A1714' }}>
                  {stats.totalEarnings.toLocaleString()} <span className="text-sm font-normal">FCFA</span>
                </p>
                <p className="text-sm" style={{ color: '#6B6560' }}>Gains totaux</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Liste des commandes */}
            <div className="lg:col-span-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList className="w-full" style={{ background: '#E8E2D9' }}>
                  <TabsTrigger value="active" className="flex-1 data-[state=active]:bg-white text-xs">
                    En cours
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="flex-1 data-[state=active]:bg-white text-xs">
                    Terminées
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="flex-1 data-[state=active]:bg-white text-xs">
                    Annulées
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <OrderSkeleton key={i} />
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                  <CardContent className="py-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-3" style={{ color: '#E8E2D9' }} />
                    <p style={{ color: '#6B6560' }}>Aucune commande</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => {
                    const statusConfig = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
                    const StatusIcon = statusConfig.icon;
                    const otherParty = getOtherParty(order);
                    const isSelected = selectedOrder?.id === order.id;

                    return (
                      <Card 
                        key={order.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2' : ''}`}
                        style={{ 
                          background: '#FFFDFB', 
                          border: '1px solid #E8E2D9',
                          ringColor: isSelected ? '#C75B39' : undefined,
                        }}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={otherParty?.avatar} />
                              <AvatarFallback style={{ background: '#E8E2D9', color: '#6B6560' }}>
                                {otherParty?.name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 
                                className="font-medium text-sm line-clamp-1"
                                style={{ color: '#1A1714' }}
                              >
                                {order.project?.title}
                              </h4>
                              <p className="text-xs" style={{ color: '#6B6560' }}>
                                {isFreelancer(order) ? 'Client' : 'Freelance'}: {otherParty?.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  className="text-xs gap-1"
                                  style={{ background: statusConfig.bg, color: statusConfig.color }}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm" style={{ color: '#C75B39' }}>
                                {order.total_amount.toLocaleString()}
                              </p>
                              <p className="text-xs" style={{ color: '#9A948D' }}>FCFA</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Détail de la commande */}
            <div className="lg:col-span-2">
              {selectedOrder ? (
                <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle style={{ color: '#1A1714', fontFamily: 'Playfair Display, serif' }}>
                          {selectedOrder.project?.title}
                        </CardTitle>
                        <p className="text-sm mt-1" style={{ color: '#6B6560' }}>
                          Commande #{selectedOrder.id}
                        </p>
                      </div>
                      <Badge 
                        className="gap-1"
                        style={{ 
                          background: ORDER_STATUS[selectedOrder.status]?.bg, 
                          color: ORDER_STATUS[selectedOrder.status]?.color 
                        }}
                      >
                        {ORDER_STATUS[selectedOrder.status]?.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Infos principales */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs" style={{ color: '#9A948D' }}>Montant total</p>
                        <p className="font-semibold" style={{ color: '#1A1714' }}>
                          {selectedOrder.total_amount.toLocaleString()} FCFA
                        </p>
                      </div>
                      {isFreelancer(selectedOrder) && (
                        <div>
                          <p className="text-xs" style={{ color: '#9A948D' }}>Vos gains</p>
                          <p className="font-semibold" style={{ color: '#5C6B4A' }}>
                            {selectedOrder.freelancer_amount.toLocaleString()} FCFA
                          </p>
                        </div>
                      )}
                      {selectedOrder.deadline && (
                        <div>
                          <p className="text-xs" style={{ color: '#9A948D' }}>Deadline</p>
                          <p className="font-semibold" style={{ color: '#1A1714' }}>
                            {format(new Date(selectedOrder.deadline), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs" style={{ color: '#9A948D' }}>Paiement</p>
                        <p className="font-semibold" style={{ color: selectedOrder.payment_status === 'released' ? '#5C6B4A' : '#C75B39' }}>
                          {selectedOrder.payment_status === 'pending' ? 'En attente' :
                           selectedOrder.payment_status === 'escrow' ? 'Séquestre' :
                           selectedOrder.payment_status === 'released' ? 'Libéré' : 'Remboursé'}
                        </p>
                      </div>
                    </div>

                    <Separator style={{ background: '#E8E2D9' }} />

                    {/* Livrables */}
                    {selectedOrder.deliverables && selectedOrder.deliverables.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3" style={{ color: '#1A1714' }}>
                          Livrables
                        </h4>
                        <div className="space-y-3">
                          {selectedOrder.deliverables.map((deliverable) => (
                            <div 
                              key={deliverable.id}
                              className="p-4 rounded-lg border"
                              style={{ borderColor: '#E8E2D9' }}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h5 className="font-medium" style={{ color: '#1A1714' }}>
                                    {deliverable.title}
                                  </h5>
                                  <p className="text-xs" style={{ color: '#9A948D' }}>
                                    Soumis {formatDistanceToNow(new Date(deliverable.submitted_at), { addSuffix: true, locale: fr })}
                                  </p>
                                </div>
                                <Badge 
                                  className="text-xs"
                                  style={{ 
                                    background: deliverable.status === 'accepted' ? '#E8F5E9' : 
                                               deliverable.status === 'revision_requested' ? '#FFF8E1' : '#EFF6FF',
                                    color: deliverable.status === 'accepted' ? '#5C6B4A' :
                                           deliverable.status === 'revision_requested' ? '#D4AF37' : '#3B82F6',
                                  }}
                                >
                                  {deliverable.status === 'accepted' ? 'Accepté' :
                                   deliverable.status === 'revision_requested' ? 'Révision demandée' : 'En attente'}
                                </Badge>
                              </div>
                              {deliverable.description && (
                                <p className="text-sm mb-3" style={{ color: '#3D3833' }}>
                                  {deliverable.description}
                                </p>
                              )}
                              {deliverable.file_url && (
                                <a
                                  href={deliverable.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm"
                                  style={{ color: '#C75B39' }}
                                >
                                  <Download className="h-4 w-4" />
                                  Télécharger le fichier
                                </a>
                              )}
                              {deliverable.feedback && (
                                <div className="mt-3 p-3 rounded" style={{ background: '#FFF8E1' }}>
                                  <p className="text-xs font-medium mb-1" style={{ color: '#D4AF37' }}>
                                    Feedback du client :
                                  </p>
                                  <p className="text-sm" style={{ color: '#3D3833' }}>
                                    {deliverable.feedback}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t" style={{ borderColor: '#E8E2D9' }}>
                      {isFreelancer(selectedOrder) && (
                        <>
                          {(selectedOrder.status === 'active' || selectedOrder.status === 'revision') && (
                            <Button
                              className="gap-2"
                              style={{ background: '#C75B39', color: '#FFFDFB' }}
                              onClick={() => setDeliveryModalOpen(true)}
                            >
                              <Upload className="h-4 w-4" />
                              Soumettre une livraison
                            </Button>
                          )}
                        </>
                      )}

                      {isClient(selectedOrder) && (
                        <>
                          {selectedOrder.status === 'delivered' && (
                            <>
                              <Button
                                className="gap-2"
                                style={{ background: '#5C6B4A', color: '#FFFDFB' }}
                                onClick={acceptDelivery}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Accepter la livraison
                              </Button>
                              <Button
                                variant="outline"
                                className="gap-2"
                                style={{ borderColor: '#D4AF37', color: '#D4AF37' }}
                                onClick={() => setRevisionModalOpen(true)}
                              >
                                <RefreshCw className="h-4 w-4" />
                                Demander une révision
                              </Button>
                            </>
                          )}
                        </>
                      )}

                      <Link href={`/messages?order=${selectedOrder.id}`}>
                        <Button
                          variant="outline"
                          className="gap-2"
                          style={{ borderColor: '#E8E2D9', color: '#6B6560' }}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Messages
                        </Button>
                      </Link>

                      {selectedOrder.status === 'completed' && (
                        <Link href={`/review/${selectedOrder.id}`}>
                          <Button
                            variant="outline"
                            className="gap-2"
                            style={{ borderColor: '#D4AF37', color: '#D4AF37' }}
                          >
                            <Star className="h-4 w-4" />
                            Laisser un avis
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                  <CardContent className="py-16 text-center">
                    <Eye className="h-16 w-16 mx-auto mb-4" style={{ color: '#E8E2D9' }} />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1714' }}>
                      Sélectionnez une commande
                    </h3>
                    <p style={{ color: '#6B6560' }}>
                      Cliquez sur une commande pour voir les détails
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal livraison */}
      <Dialog open={deliveryModalOpen} onOpenChange={setDeliveryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              Soumettre une livraison
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="delivery_title">Titre de la livraison *</Label>
              <input
                id="delivery_title"
                type="text"
                value={deliveryData.title}
                onChange={(e) => setDeliveryData({ ...deliveryData, title: e.target.value })}
                placeholder="Ex: Version finale du site"
                className="w-full px-3 py-2 border rounded-md"
                style={{ borderColor: '#E8E2D9' }}
              />
            </div>
            <div>
              <Label htmlFor="delivery_description">Description</Label>
              <Textarea
                id="delivery_description"
                value={deliveryData.description}
                onChange={(e) => setDeliveryData({ ...deliveryData, description: e.target.value })}
                placeholder="Décrivez ce que vous livrez..."
                rows={4}
                style={{ borderColor: '#E8E2D9' }}
              />
            </div>
            <div>
              <Label htmlFor="delivery_file">Lien du fichier (optionnel)</Label>
              <input
                id="delivery_file"
                type="url"
                value={deliveryData.file_url}
                onChange={(e) => setDeliveryData({ ...deliveryData, file_url: e.target.value })}
                placeholder="https://drive.google.com/..."
                className="w-full px-3 py-2 border rounded-md"
                style={{ borderColor: '#E8E2D9' }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeliveryModalOpen(false)}
              style={{ borderColor: '#E8E2D9', color: '#6B6560' }}
            >
              Annuler
            </Button>
            <Button
              onClick={submitDelivery}
              disabled={submittingDelivery}
              style={{ background: '#C75B39', color: '#FFFDFB' }}
            >
              {submittingDelivery ? "Envoi..." : "Soumettre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal révision */}
      <Dialog open={revisionModalOpen} onOpenChange={setRevisionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              Demander une révision
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="revision_feedback">Expliquez les modifications souhaitées *</Label>
            <Textarea
              id="revision_feedback"
              value={revisionFeedback}
              onChange={(e) => setRevisionFeedback(e.target.value)}
              placeholder="Décrivez précisément ce qui doit être modifié..."
              rows={6}
              className="mt-2"
              style={{ borderColor: '#E8E2D9' }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevisionModalOpen(false)}
              style={{ borderColor: '#E8E2D9', color: '#6B6560' }}
            >
              Annuler
            </Button>
            <Button
              onClick={requestRevision}
              style={{ background: '#D4AF37', color: '#1A1714' }}
            >
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
