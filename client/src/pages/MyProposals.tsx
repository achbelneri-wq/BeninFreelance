import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SparkleIcon from "@/components/SparkleIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  DollarSign,
  Calendar,
  ExternalLink,
  Trash2,
  Edit2,
  MoreVertical,
  FileText,
  Briefcase,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";

interface Proposal {
  id: number;
  project_id: number;
  cover_letter: string;
  proposed_price: number;
  delivery_time: number;
  status: string;
  is_viewed: boolean;
  created_at: string;
  expires_at?: string;
  project?: {
    id: number;
    title: string;
    status: string;
    budget_min?: number;
    budget_max?: number;
    client?: {
      id: number;
      name: string;
      avatar?: string;
    };
  };
  milestones?: {
    id: number;
    title: string;
    amount: number;
    status: string;
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "En attente", color: "#C75B39", bg: "#FFF3E0", icon: Clock },
  viewed: { label: "Vue", color: "#5C6B4A", bg: "#E8F5E9", icon: Eye },
  shortlisted: { label: "Présélectionnée", color: "#D4AF37", bg: "#FFF8E1", icon: CheckCircle },
  accepted: { label: "Acceptée", color: "#5C6B4A", bg: "#E8F5E9", icon: CheckCircle },
  rejected: { label: "Refusée", color: "#9A948D", bg: "#F5F5F5", icon: XCircle },
  withdrawn: { label: "Retirée", color: "#6B6560", bg: "#E8E2D9", icon: AlertCircle },
  expired: { label: "Expirée", color: "#9A948D", bg: "#F5F5F5", icon: AlertCircle },
};

function ProposalSkeleton() {
  return (
    <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-16 w-full mb-4" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyProposals() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (!user) {
      setLocation(getLoginUrl());
      return;
    }

    const loadProposals = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("proposals")
          .select(`
            *,
            project:projects (
              id,
              title,
              status,
              budget_min,
              budget_max,
              client:users!projects_client_id_fkey (
                id,
                name,
                avatar
              )
            ),
            milestones:proposal_milestones (
              id,
              title,
              amount,
              status
            )
          `)
          .eq("freelancer_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setProposals(data || []);

        // Calculer les stats
        const total = data?.length || 0;
        const pending = data?.filter(p => p.status === 'pending' || p.status === 'viewed').length || 0;
        const accepted = data?.filter(p => p.status === 'accepted').length || 0;
        const rejected = data?.filter(p => p.status === 'rejected').length || 0;

        setStats({ total, pending, accepted, rejected });
      } catch (error) {
        console.error("Erreur chargement propositions:", error);
        toast.error("Erreur lors du chargement des propositions");
      } finally {
        setLoading(false);
      }
    };

    loadProposals();
  }, [user]);

  const withdrawProposal = async (proposalId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer cette proposition ?")) return;

    try {
      const { error } = await supabase
        .from("proposals")
        .update({ status: 'withdrawn' })
        .eq("id", proposalId);

      if (error) throw error;

      setProposals(proposals.map(p => 
        p.id === proposalId ? { ...p, status: 'withdrawn' } : p
      ));
      toast.success("Proposition retirée");
    } catch (error) {
      console.error("Erreur retrait:", error);
      toast.error("Erreur lors du retrait");
    }
  };

  const deleteProposal = async (proposalId: number) => {
    if (!confirm("Supprimer définitivement cette proposition ?")) return;

    try {
      const { error } = await supabase
        .from("proposals")
        .delete()
        .eq("id", proposalId);

      if (error) throw error;

      setProposals(proposals.filter(p => p.id !== proposalId));
      toast.success("Proposition supprimée");
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredProposals = proposals.filter(p => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return p.status === 'pending' || p.status === 'viewed' || p.status === 'shortlisted';
    if (activeTab === "accepted") return p.status === 'accepted';
    if (activeTab === "rejected") return p.status === 'rejected' || p.status === 'withdrawn' || p.status === 'expired';
    return true;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF7F2' }}>
      <Navbar />

      {/* Header */}
      <div className="py-8 relative overflow-hidden" style={{ background: '#C75B39' }}>
        <div className="absolute top-2 right-8 opacity-30">
          <SparkleIcon variant="plus" size="lg" bgColor="transparent" color="#FFFDFB" />
        </div>
        <div className="container relative z-10">
          <div className="flex items-center gap-4">
            <SparkleIcon variant="default" size="lg" />
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                Mes Propositions
              </h1>
              <p className="text-white/80">
                Suivez l'état de vos candidatures
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: '#1A1714' }}>{stats.total}</p>
                <p className="text-sm" style={{ color: '#6B6560' }}>Total</p>
              </CardContent>
            </Card>
            <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: '#C75B39' }}>{stats.pending}</p>
                <p className="text-sm" style={{ color: '#6B6560' }}>En attente</p>
              </CardContent>
            </Card>
            <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: '#5C6B4A' }}>{stats.accepted}</p>
                <p className="text-sm" style={{ color: '#6B6560' }}>Acceptées</p>
              </CardContent>
            </Card>
            <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: '#9A948D' }}>{stats.rejected}</p>
                <p className="text-sm" style={{ color: '#6B6560' }}>Refusées</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="w-full justify-start" style={{ background: '#E8E2D9' }}>
              <TabsTrigger value="all" className="data-[state=active]:bg-white">
                Toutes ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-white">
                En cours ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="data-[state=active]:bg-white">
                Acceptées ({stats.accepted})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="data-[state=active]:bg-white">
                Terminées ({stats.rejected})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Liste */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <ProposalSkeleton key={i} />
              ))}
            </div>
          ) : filteredProposals.length === 0 ? (
            <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
              <CardContent className="py-16 text-center">
                <Send className="h-16 w-16 mx-auto mb-4" style={{ color: '#E8E2D9' }} />
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1714' }}>
                  {activeTab === "all" 
                    ? "Aucune proposition envoyée"
                    : `Aucune proposition ${activeTab === 'pending' ? 'en cours' : activeTab === 'accepted' ? 'acceptée' : 'terminée'}`
                  }
                </h3>
                <p className="mb-6" style={{ color: '#6B6560' }}>
                  Parcourez les projets et soumettez vos premières propositions
                </p>
                <Link href="/projects/all">
                  <Button style={{ background: '#C75B39', color: '#FFFDFB' }}>
                    Voir les projets
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredProposals.map((proposal) => {
                const statusConfig = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;
                const timeAgo = formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true, locale: fr });
                const isExpired = proposal.expires_at && new Date(proposal.expires_at) < new Date();

                return (
                  <Card 
                    key={proposal.id}
                    className="transition-all duration-200 hover:shadow-md"
                    style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              className="gap-1"
                              style={{ background: statusConfig.bg, color: statusConfig.color }}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                            {proposal.is_viewed && proposal.status === 'pending' && (
                              <Badge variant="outline" className="text-xs" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>
                                Vue par le client
                              </Badge>
                            )}
                            {isExpired && proposal.status === 'pending' && (
                              <Badge variant="outline" className="text-xs" style={{ borderColor: '#C75B39', color: '#C75B39' }}>
                                Expirée
                              </Badge>
                            )}
                          </div>

                          <Link href={`/projects/${proposal.project_id}`}>
                            <h3 
                              className="font-semibold text-lg hover:underline cursor-pointer line-clamp-1"
                              style={{ color: '#1A1714', fontFamily: 'Playfair Display, serif' }}
                            >
                              {proposal.project?.title || `Projet #${proposal.project_id}`}
                            </h3>
                          </Link>

                          {proposal.project?.client && (
                            <p className="text-sm" style={{ color: '#6B6560' }}>
                              Client: {proposal.project.client.name || `#${proposal.project.client.id}`}
                            </p>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" style={{ color: '#6B6560' }} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/projects/${proposal.project_id}`} className="flex items-center gap-2">
                                <ExternalLink className="h-4 w-4" />
                                Voir le projet
                              </Link>
                            </DropdownMenuItem>
                            {(proposal.status === 'pending' || proposal.status === 'viewed') && (
                              <>
                                <DropdownMenuItem 
                                  className="flex items-center gap-2"
                                  onClick={() => withdrawProposal(proposal.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                  Retirer la proposition
                                </DropdownMenuItem>
                              </>
                            )}
                            {(proposal.status === 'withdrawn' || proposal.status === 'rejected' || proposal.status === 'expired') && (
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-red-600"
                                onClick={() => deleteProposal(proposal.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Extrait de la lettre */}
                      <p 
                        className="text-sm line-clamp-2 mb-4 p-3 rounded-lg"
                        style={{ background: '#FAF7F2', color: '#3D3833' }}
                      >
                        {proposal.cover_letter}
                      </p>

                      {/* Infos */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" style={{ color: '#C75B39' }} />
                          <span className="font-medium" style={{ color: '#1A1714' }}>
                            {proposal.proposed_price.toLocaleString()} FCFA
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" style={{ color: '#5C6B4A' }} />
                          <span style={{ color: '#6B6560' }}>
                            {proposal.delivery_time} jours
                          </span>
                        </div>
                        {proposal.milestones && proposal.milestones.length > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" style={{ color: '#9A948D' }} />
                            <span style={{ color: '#6B6560' }}>
                              {proposal.milestones.length} jalon{proposal.milestones.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        <span className="ml-auto" style={{ color: '#9A948D' }}>
                          {timeAgo}
                        </span>
                      </div>

                      {/* Actions selon le statut */}
                      {proposal.status === 'accepted' && (
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E8E2D9' }}>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium" style={{ color: '#5C6B4A' }}>
                              🎉 Félicitations ! Votre proposition a été acceptée.
                            </p>
                            <Link href={`/orders/${proposal.id}`}>
                              <Button 
                                size="sm"
                                style={{ background: '#C75B39', color: '#FFFDFB' }}
                              >
                                Voir la commande
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}

                      {proposal.status === 'shortlisted' && (
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E8E2D9' }}>
                          <p className="text-sm" style={{ color: '#D4AF37' }}>
                            ⭐ Vous êtes présélectionné ! Le client examine votre proposition.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
