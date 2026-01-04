import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wallet,
  Lock,
  Unlock,
  RefreshCw,
  MessageSquare,
  FileText
} from "lucide-react";

interface EscrowData {
  id: number;
  order_id: number;
  amount: string;
  status: string;
  created_at: string;
  released_at: string | null;
  order?: {
    id: number;
    title: string;
    status: string;
    buyer_id: number;
    seller_id: number;
    buyer?: {
      id: number;
      name: string;
    };
    seller?: {
      id: number;
      name: string;
    };
  };
}

const escrowStatusConfig: Record<string, { label: string; bgColor: string; textColor: string; icon: any }> = {
  pending: { label: "En attente", bgColor: 'rgba(139, 69, 19, 0.1)', textColor: '#8B4513', icon: Clock },
  held: { label: "Fonds bloqués", bgColor: 'rgba(199, 91, 57, 0.1)', textColor: '#C75B39', icon: Lock },
  released: { label: "Fonds libérés", bgColor: 'rgba(92, 107, 74, 0.1)', textColor: '#5C6B4A', icon: Unlock },
  refunded: { label: "Remboursé", bgColor: 'rgba(154, 148, 141, 0.1)', textColor: '#9A948D', icon: RefreshCw },
  disputed: { label: "En litige", bgColor: 'rgba(199, 91, 57, 0.1)', textColor: '#C75B39', icon: AlertTriangle },
};

export default function Escrow() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, profile, isAuthenticated } = useAuth();
  const [escrow, setEscrow] = useState<EscrowData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const internalUserId = profile?.id;

  useEffect(() => {
    async function loadEscrow() {
      if (!orderId) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('escrow')
          .select(`
            *,
            order:orders!escrow_order_id_fkey (
              id,
              title,
              status,
              buyer_id,
              seller_id,
              buyer:users!orders_buyer_id_fkey (
                id,
                name
              ),
              seller:users!orders_seller_id_fkey (
                id,
                name
              )
            )
          `)
          .eq('order_id', parseInt(orderId))
          .single();

        if (error) throw error;
        setEscrow(data);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'escrow:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadEscrow();
  }, [orderId]);

  const handleReleaseEscrow = async () => {
    if (!escrow || !internalUserId) return;

    // Vérifier que c'est l'acheteur qui libère les fonds
    if (escrow.order?.buyer_id !== internalUserId) {
      toast.error("Seul l'acheteur peut libérer les fonds");
      return;
    }

    setIsProcessing(true);
    try {
      // Appeler la fonction SQL pour libérer les fonds
      const { error } = await supabase.rpc('release_escrow', {
        order_id: escrow.order_id
      });

      if (error) throw error;

      toast.success("Fonds libérés avec succès !");
      setEscrow(prev => prev ? { ...prev, status: 'released', released_at: new Date().toISOString() } : null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la libération des fonds");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestRefund = async () => {
    if (!escrow || !internalUserId) return;

    // Vérifier que c'est l'acheteur qui demande le remboursement
    if (escrow.order?.buyer_id !== internalUserId) {
      toast.error("Seul l'acheteur peut demander un remboursement");
      return;
    }

    setIsProcessing(true);
    try {
      // Mettre en litige
      const { error } = await supabase
        .from('escrow')
        .update({ status: 'disputed' })
        .eq('id', escrow.id);

      if (error) throw error;

      // Mettre la commande en litige aussi
      await supabase
        .from('orders')
        .update({ status: 'disputed' })
        .eq('id', escrow.order_id);

      toast.success("Demande de remboursement envoyée. Notre équipe va examiner le litige.");
      setEscrow(prev => prev ? { ...prev, status: 'disputed' } : null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la demande");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: string) => {
    return `${parseFloat(amount).toLocaleString('fr-FR')} F`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" style={{ background: '#E8E2D9' }} />
        <Skeleton className="h-64 w-full rounded-sm" style={{ background: '#E8E2D9' }} />
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 mx-auto mb-4" style={{ color: '#E8E2D9' }} />
        <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
          Escrow non trouvé
        </h2>
        <p className="mb-4" style={{ color: '#6B6560' }}>
          Aucune information d'escrow pour cette commande.
        </p>
        <Link href="/dashboard/orders">
          <Button className="rounded-sm" style={{ background: '#C75B39', color: '#FFFDFB' }}>
            Retour aux commandes
          </Button>
        </Link>
      </div>
    );
  }

  const status = escrowStatusConfig[escrow.status] || escrowStatusConfig.pending;
  const StatusIcon = status.icon;
  const isBuyer = escrow.order?.buyer_id === internalUserId;
  const isSeller = escrow.order?.seller_id === internalUserId;

  // Calcul du pourcentage de progression
  const getProgress = () => {
    switch (escrow.status) {
      case 'pending': return 25;
      case 'held': return 50;
      case 'released': return 100;
      case 'refunded': return 100;
      case 'disputed': return 75;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
          Système d'Escrow
        </h1>
        <p className="mt-1" style={{ color: '#6B6560' }}>
          Protection des paiements pour la commande #{escrow.order_id}
        </p>
      </div>

      {/* Carte principale */}
      <Card className="rounded-sm overflow-hidden" style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
        <div className="p-6" style={{ background: 'linear-gradient(135deg, #1A1714 0%, #3D3833 100%)' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-sm flex items-center justify-center" style={{ background: 'rgba(199, 91, 57, 0.2)' }}>
              <Shield className="h-8 w-8" style={{ color: '#C75B39' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'rgba(250, 247, 242, 0.7)' }}>Montant protégé</p>
              <p className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#FAF7F2' }}>
                {formatCurrency(escrow.amount)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              className="rounded-sm flex items-center gap-1"
              style={{ background: status.bgColor, color: status.textColor, border: 'none' }}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6">
          {/* Progression */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: '#6B6560' }}>Progression</span>
              <span style={{ color: '#1A1714' }}>{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>

          {/* Étapes */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${escrow.status !== 'pending' ? 'bg-[#5C6B4A]' : 'bg-[#E8E2D9]'}`}>
                <CheckCircle2 className="h-4 w-4" style={{ color: escrow.status !== 'pending' ? '#FFFDFB' : '#9A948D' }} />
              </div>
              <div>
                <p className="font-medium" style={{ color: '#1A1714' }}>Paiement reçu</p>
                <p className="text-sm" style={{ color: '#6B6560' }}>Les fonds ont été déposés</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['held', 'released'].includes(escrow.status) ? 'bg-[#5C6B4A]' : 'bg-[#E8E2D9]'}`}>
                <Lock className="h-4 w-4" style={{ color: ['held', 'released'].includes(escrow.status) ? '#FFFDFB' : '#9A948D' }} />
              </div>
              <div>
                <p className="font-medium" style={{ color: '#1A1714' }}>Fonds sécurisés</p>
                <p className="text-sm" style={{ color: '#6B6560' }}>En attente de la livraison</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${escrow.status === 'released' ? 'bg-[#5C6B4A]' : 'bg-[#E8E2D9]'}`}>
                <Unlock className="h-4 w-4" style={{ color: escrow.status === 'released' ? '#FFFDFB' : '#9A948D' }} />
              </div>
              <div>
                <p className="font-medium" style={{ color: '#1A1714' }}>Fonds libérés</p>
                <p className="text-sm" style={{ color: '#6B6560' }}>
                  {escrow.status === 'released' && escrow.released_at
                    ? `Libérés le ${formatDate(escrow.released_at)}`
                    : 'En attente de validation'}
                </p>
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="p-4 rounded-sm mb-6" style={{ background: '#FAF7F2' }}>
            <h3 className="font-semibold mb-3" style={{ color: '#1A1714' }}>Détails de la transaction</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#6B6560' }}>Commande</span>
                <span style={{ color: '#1A1714' }}>{escrow.order?.title || `#${escrow.order_id}`}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B6560' }}>Acheteur</span>
                <span style={{ color: '#1A1714' }}>{escrow.order?.buyer?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B6560' }}>Vendeur</span>
                <span style={{ color: '#1A1714' }}>{escrow.order?.seller?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B6560' }}>Date de création</span>
                <span style={{ color: '#1A1714' }}>{formatDate(escrow.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {escrow.status === 'held' && (
            <div className="space-y-3">
              {isBuyer && (
                <>
                  <Button 
                    onClick={handleReleaseEscrow}
                    disabled={isProcessing}
                    className="w-full rounded-sm"
                    style={{ background: '#5C6B4A', color: '#FFFDFB' }}
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Unlock className="h-4 w-4 mr-2" />
                    )}
                    Libérer les fonds
                  </Button>
                  <Button 
                    onClick={handleRequestRefund}
                    disabled={isProcessing}
                    variant="outline"
                    className="w-full rounded-sm"
                    style={{ border: '1px solid #C75B39', color: '#C75B39' }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Signaler un problème
                  </Button>
                </>
              )}
              {isSeller && (
                <div className="p-4 rounded-sm text-center" style={{ background: 'rgba(139, 69, 19, 0.1)' }}>
                  <Clock className="h-8 w-8 mx-auto mb-2" style={{ color: '#8B4513' }} />
                  <p className="text-sm" style={{ color: '#8B4513' }}>
                    En attente de la validation de l'acheteur pour libérer les fonds.
                  </p>
                </div>
              )}
            </div>
          )}

          {escrow.status === 'disputed' && (
            <div className="p-4 rounded-sm text-center" style={{ background: 'rgba(199, 91, 57, 0.1)' }}>
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" style={{ color: '#C75B39' }} />
              <p className="font-semibold mb-1" style={{ color: '#C75B39' }}>Litige en cours</p>
              <p className="text-sm" style={{ color: '#6B6560' }}>
                Notre équipe examine ce dossier. Vous serez contacté sous 24-48h.
              </p>
            </div>
          )}

          {escrow.status === 'released' && (
            <div className="p-4 rounded-sm text-center" style={{ background: 'rgba(92, 107, 74, 0.1)' }}>
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2" style={{ color: '#5C6B4A' }} />
              <p className="font-semibold mb-1" style={{ color: '#5C6B4A' }}>Transaction terminée</p>
              <p className="text-sm" style={{ color: '#6B6560' }}>
                Les fonds ont été transférés au vendeur.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aide */}
      <Card className="p-6 rounded-sm" style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1A1714' }}>
          <Shield className="h-5 w-5" style={{ color: '#C75B39' }} />
          Comment fonctionne l'escrow ?
        </h3>
        <div className="space-y-3 text-sm" style={{ color: '#6B6560' }}>
          <p>
            <strong style={{ color: '#1A1714' }}>1. Paiement sécurisé :</strong> Lorsque vous passez commande, 
            votre paiement est conservé en sécurité sur notre plateforme.
          </p>
          <p>
            <strong style={{ color: '#1A1714' }}>2. Travail en cours :</strong> Le freelance travaille sur votre 
            projet en sachant que le paiement est garanti.
          </p>
          <p>
            <strong style={{ color: '#1A1714' }}>3. Livraison :</strong> Une fois le travail livré et que vous 
            êtes satisfait, vous validez la livraison.
          </p>
          <p>
            <strong style={{ color: '#1A1714' }}>4. Libération des fonds :</strong> Les fonds sont alors 
            automatiquement transférés au freelance.
          </p>
        </div>
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E8E2D9' }}>
          <Link href="/help/escrow">
            <Button variant="ghost" className="text-sm" style={{ color: '#C75B39' }}>
              En savoir plus sur la protection des paiements
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
