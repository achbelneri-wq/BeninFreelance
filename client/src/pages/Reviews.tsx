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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Send,
  Loader2,
  ArrowLeft,
  Flag,
  Award,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getLoginUrl } from "@/const";

interface Review {
  id: number;
  reviewer_id: number;
  reviewed_id: number;
  order_id?: number;
  project_id?: number;
  rating: number;
  communication_rating?: number;
  quality_rating?: number;
  timeliness_rating?: number;
  value_rating?: number;
  title?: string;
  comment: string;
  is_verified: boolean;
  is_public: boolean;
  helpful_count: number;
  response?: string;
  response_at?: string;
  created_at: string;
  reviewer?: {
    id: number;
    name: string;
    avatar?: string;
    country?: string;
  };
  project?: {
    id: number;
    title: string;
  };
}

interface ReviewStats {
  average: number;
  total: number;
  distribution: { [key: number]: number };
  categories: {
    communication: number;
    quality: number;
    timeliness: number;
    value: number;
  };
}

// Composant étoiles interactives
function StarRating({ 
  value, 
  onChange, 
  size = "md",
  readonly = false 
}: { 
  value: number; 
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}) {
  const [hoverValue, setHoverValue] = useState(0);
  
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-transform ${!readonly && 'hover:scale-110'}`}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => !readonly && setHoverValue(0)}
          onClick={() => onChange?.(star)}
        >
          <Star
            className={`${sizes[size]} ${
              star <= (hoverValue || value)
                ? 'fill-current'
                : ''
            }`}
            style={{ 
              color: star <= (hoverValue || value) ? '#D4AF37' : '#E8E2D9'
            }}
          />
        </button>
      ))}
    </div>
  );
}

// Composant barre de progression pour la distribution
function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-8" style={{ color: '#6B6560' }}>{stars}</span>
      <Star className="h-4 w-4" style={{ color: '#D4AF37', fill: '#D4AF37' }} />
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#E8E2D9' }}>
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, background: '#D4AF37' }}
        />
      </div>
      <span className="text-sm w-8 text-right" style={{ color: '#9A948D' }}>{count}</span>
    </div>
  );
}

export default function Reviews() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  
  // Déterminer si on affiche les avis d'un utilisateur ou le formulaire d'évaluation
  const userId = params.userId ? parseInt(params.userId) : null;
  const orderId = params.orderId ? parseInt(params.orderId) : null;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<any>(null);

  // Formulaire d'évaluation
  const [showForm, setShowForm] = useState(!!orderId);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rating: 0,
    communication_rating: 0,
    quality_rating: 0,
    timeliness_rating: 0,
    value_rating: 0,
    title: "",
    comment: "",
    is_public: true,
  });

  // Ordre à évaluer
  const [orderToReview, setOrderToReview] = useState<any>(null);

  // Charger les avis
  useEffect(() => {
    const loadReviews = async () => {
      if (!userId && !orderId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (orderId) {
          // Charger la commande à évaluer
          const { data: order, error: orderError } = await supabase
            .from("project_orders")
            .select(`
              *,
              project:projects (id, title),
              client:users!project_orders_client_id_fkey (id, name, avatar),
              freelancer:users!project_orders_freelancer_id_fkey (id, name, avatar)
            `)
            .eq("id", orderId)
            .single();

          if (orderError) throw orderError;
          setOrderToReview(order);

          // Vérifier si déjà évalué
          const { data: existingReview } = await supabase
            .from("reviews")
            .select("id")
            .eq("order_id", orderId)
            .eq("reviewer_id", user?.id)
            .single();

          if (existingReview) {
            toast.info("Vous avez déjà évalué cette commande");
            setLocation("/project-orders");
            return;
          }
        }

        if (userId) {
          // Charger l'utilisateur
          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

          setProfileUser(userData);

          // Charger les avis
          const { data: reviewsData, error: reviewsError } = await supabase
            .from("reviews")
            .select(`
              *,
              reviewer:users!reviews_reviewer_id_fkey (id, name, avatar, country),
              project:projects (id, title)
            `)
            .eq("reviewed_id", userId)
            .eq("is_public", true)
            .order("created_at", { ascending: false });

          if (reviewsError) throw reviewsError;
          setReviews(reviewsData || []);

          // Calculer les stats
          if (reviewsData && reviewsData.length > 0) {
            const total = reviewsData.length;
            const average = reviewsData.reduce((sum, r) => sum + r.rating, 0) / total;
            
            const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            reviewsData.forEach(r => {
              distribution[r.rating] = (distribution[r.rating] || 0) + 1;
            });

            const categories = {
              communication: reviewsData.reduce((sum, r) => sum + (r.communication_rating || 0), 0) / total,
              quality: reviewsData.reduce((sum, r) => sum + (r.quality_rating || 0), 0) / total,
              timeliness: reviewsData.reduce((sum, r) => sum + (r.timeliness_rating || 0), 0) / total,
              value: reviewsData.reduce((sum, r) => sum + (r.value_rating || 0), 0) / total,
            };

            setStats({ average, total, distribution, categories });
          }
        }
      } catch (error) {
        console.error("Erreur chargement avis:", error);
        toast.error("Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [userId, orderId, user]);

  const submitReview = async () => {
    if (!user || !orderToReview) return;

    if (formData.rating === 0) {
      toast.error("Veuillez donner une note globale");
      return;
    }

    if (!formData.comment.trim()) {
      toast.error("Veuillez rédiger un commentaire");
      return;
    }

    setSubmitting(true);
    try {
      // Déterminer qui est évalué
      const reviewedId = orderToReview.client_id === user.id 
        ? orderToReview.freelancer_id 
        : orderToReview.client_id;

      const { error } = await supabase
        .from("reviews")
        .insert({
          reviewer_id: user.id,
          reviewed_id: reviewedId,
          order_id: orderToReview.id,
          project_id: orderToReview.project_id,
          rating: formData.rating,
          communication_rating: formData.communication_rating || null,
          quality_rating: formData.quality_rating || null,
          timeliness_rating: formData.timeliness_rating || null,
          value_rating: formData.value_rating || null,
          title: formData.title || null,
          comment: formData.comment,
          is_public: formData.is_public,
          is_verified: true,
        });

      if (error) throw error;

      // Mettre à jour la note moyenne de l'utilisateur évalué
      const { data: allReviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewed_id", reviewedId);

      if (allReviews) {
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await supabase
          .from("users")
          .update({ 
            rating: avgRating,
            total_reviews: allReviews.length,
          })
          .eq("id", reviewedId);
      }

      toast.success("Merci pour votre évaluation !");
      setLocation("/project-orders");
    } catch (error) {
      console.error("Erreur soumission:", error);
      toast.error("Erreur lors de l'envoi de l'évaluation");
    } finally {
      setSubmitting(false);
    }
  };

  const markHelpful = async (reviewId: number) => {
    if (!user) {
      setLocation(getLoginUrl());
      return;
    }

    try {
      // Incrémenter le compteur
      const review = reviews.find(r => r.id === reviewId);
      if (review) {
        await supabase
          .from("reviews")
          .update({ helpful_count: (review.helpful_count || 0) + 1 })
          .eq("id", reviewId);

        setReviews(reviews.map(r => 
          r.id === reviewId 
            ? { ...r, helpful_count: (r.helpful_count || 0) + 1 }
            : r
        ));
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Formulaire d'évaluation
  if (showForm && orderToReview) {
    const personToReview = orderToReview.client_id === user?.id 
      ? orderToReview.freelancer 
      : orderToReview.client;

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
                  Laisser un avis
                </h1>
                <p className="text-white/80">
                  Partagez votre expérience avec la communauté
                </p>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 py-8">
          <div className="container max-w-2xl">
            <Link href="/project-orders">
              <Button variant="ghost" className="mb-6 gap-2" style={{ color: '#6B6560' }}>
                <ArrowLeft className="h-4 w-4" />
                Retour aux commandes
              </Button>
            </Link>

            <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={personToReview?.avatar} />
                    <AvatarFallback style={{ background: '#C75B39', color: '#FFFDFB' }}>
                      {personToReview?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle style={{ color: '#1A1714', fontFamily: 'Playfair Display, serif' }}>
                      Évaluer {personToReview?.name}
                    </CardTitle>
                    <p className="text-sm" style={{ color: '#6B6560' }}>
                      Projet: {orderToReview.project?.title}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Note globale */}
                <div className="text-center py-4">
                  <Label className="text-lg font-medium block mb-4" style={{ color: '#1A1714' }}>
                    Note globale *
                  </Label>
                  <StarRating 
                    value={formData.rating} 
                    onChange={(v) => setFormData({ ...formData, rating: v })}
                    size="lg"
                  />
                  <p className="text-sm mt-2" style={{ color: '#6B6560' }}>
                    {formData.rating === 0 ? 'Cliquez pour noter' :
                     formData.rating === 1 ? 'Très insatisfait' :
                     formData.rating === 2 ? 'Insatisfait' :
                     formData.rating === 3 ? 'Correct' :
                     formData.rating === 4 ? 'Satisfait' : 'Excellent'}
                  </p>
                </div>

                {/* Notes détaillées */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg" style={{ background: '#FAF7F2' }}>
                  <div>
                    <Label className="text-sm" style={{ color: '#6B6560' }}>Communication</Label>
                    <StarRating 
                      value={formData.communication_rating} 
                      onChange={(v) => setFormData({ ...formData, communication_rating: v })}
                      size="sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm" style={{ color: '#6B6560' }}>Qualité du travail</Label>
                    <StarRating 
                      value={formData.quality_rating} 
                      onChange={(v) => setFormData({ ...formData, quality_rating: v })}
                      size="sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm" style={{ color: '#6B6560' }}>Respect des délais</Label>
                    <StarRating 
                      value={formData.timeliness_rating} 
                      onChange={(v) => setFormData({ ...formData, timeliness_rating: v })}
                      size="sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm" style={{ color: '#6B6560' }}>Rapport qualité/prix</Label>
                    <StarRating 
                      value={formData.value_rating} 
                      onChange={(v) => setFormData({ ...formData, value_rating: v })}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Titre */}
                <div>
                  <Label htmlFor="title">Titre de l'avis (optionnel)</Label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Résumez votre expérience en quelques mots"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    style={{ borderColor: '#E8E2D9' }}
                  />
                </div>

                {/* Commentaire */}
                <div>
                  <Label htmlFor="comment">Votre avis *</Label>
                  <Textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Décrivez votre expérience de collaboration. Qu'est-ce qui s'est bien passé ? Y a-t-il des points à améliorer ?"
                    rows={5}
                    className="mt-1"
                    style={{ borderColor: '#E8E2D9' }}
                  />
                  <p className="text-xs mt-1" style={{ color: '#9A948D' }}>
                    Minimum 50 caractères • {formData.comment.length} caractères
                  </p>
                </div>

                {/* Visibilité */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_public" className="text-sm cursor-pointer" style={{ color: '#3D3833' }}>
                    Publier cet avis publiquement
                  </Label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setLocation("/project-orders")}
                    style={{ borderColor: '#E8E2D9', color: '#6B6560' }}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={submitReview}
                    disabled={submitting || formData.rating === 0 || formData.comment.length < 50}
                    style={{ background: '#C75B39', color: '#FFFDFB' }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Publier l'avis
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Affichage des avis d'un utilisateur
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
                {profileUser ? `Avis sur ${profileUser.name}` : 'Avis'}
              </h1>
              <p className="text-white/80">
                {stats ? `${stats.total} avis • ${stats.average.toFixed(1)}/5` : 'Chargement...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="container">
          {profileUser && (
            <Link href={`/profile/${profileUser.id}`}>
              <Button variant="ghost" className="mb-6 gap-2" style={{ color: '#6B6560' }}>
                <ArrowLeft className="h-4 w-4" />
                Retour au profil
              </Button>
            </Link>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Stats */}
            <div className="lg:col-span-1">
              {stats && (
                <Card className="sticky top-4" style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                  <CardContent className="p-6">
                    {/* Note moyenne */}
                    <div className="text-center mb-6">
                      <div className="text-5xl font-bold mb-2" style={{ color: '#1A1714' }}>
                        {stats.average.toFixed(1)}
                      </div>
                      <StarRating value={Math.round(stats.average)} readonly size="md" />
                      <p className="text-sm mt-2" style={{ color: '#6B6560' }}>
                        Basé sur {stats.total} avis
                      </p>
                    </div>

                    {/* Distribution */}
                    <div className="space-y-2 mb-6">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <RatingBar 
                          key={stars}
                          stars={stars}
                          count={stats.distribution[stars] || 0}
                          total={stats.total}
                        />
                      ))}
                    </div>

                    {/* Catégories */}
                    <div className="space-y-3 pt-4 border-t" style={{ borderColor: '#E8E2D9' }}>
                      <h4 className="font-medium text-sm" style={{ color: '#1A1714' }}>
                        Notes détaillées
                      </h4>
                      {[
                        { label: 'Communication', value: stats.categories.communication },
                        { label: 'Qualité', value: stats.categories.quality },
                        { label: 'Délais', value: stats.categories.timeliness },
                        { label: 'Rapport qualité/prix', value: stats.categories.value },
                      ].map((cat) => (
                        <div key={cat.label} className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: '#6B6560' }}>{cat.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: '#1A1714' }}>
                              {cat.value > 0 ? cat.value.toFixed(1) : '—'}
                            </span>
                            <Star className="h-3 w-3" style={{ color: '#D4AF37', fill: '#D4AF37' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Liste des avis */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-5 w-32 mb-2" />
                            <Skeleton className="h-4 w-24 mb-3" />
                            <Skeleton className="h-16 w-full" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                  <CardContent className="py-16 text-center">
                    <Star className="h-16 w-16 mx-auto mb-4" style={{ color: '#E8E2D9' }} />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1714' }}>
                      Aucun avis pour le moment
                    </h3>
                    <p style={{ color: '#6B6560' }}>
                      Les avis apparaîtront ici après les premières collaborations
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: fr });

                    return (
                      <Card 
                        key={review.id}
                        style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}
                      >
                        <CardContent className="p-5">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={review.reviewer?.avatar} />
                                <AvatarFallback style={{ background: '#E8E2D9', color: '#6B6560' }}>
                                  {review.reviewer?.name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium" style={{ color: '#1A1714' }}>
                                    {review.reviewer?.name || 'Utilisateur'}
                                  </p>
                                  {review.is_verified && (
                                    <Badge 
                                      className="text-xs gap-1"
                                      style={{ background: '#E8F5E9', color: '#5C6B4A' }}
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                      Vérifié
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <StarRating value={review.rating} readonly size="sm" />
                                  <span className="text-xs" style={{ color: '#9A948D' }}>
                                    {timeAgo}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Projet */}
                          {review.project && (
                            <p className="text-sm mb-3" style={{ color: '#6B6560' }}>
                              Projet: <span style={{ color: '#C75B39' }}>{review.project.title}</span>
                            </p>
                          )}

                          {/* Titre */}
                          {review.title && (
                            <h4 className="font-medium mb-2" style={{ color: '#1A1714' }}>
                              {review.title}
                            </h4>
                          )}

                          {/* Commentaire */}
                          <p className="text-sm mb-4" style={{ color: '#3D3833' }}>
                            {review.comment}
                          </p>

                          {/* Réponse */}
                          {review.response && (
                            <div 
                              className="p-3 rounded-lg mb-4"
                              style={{ background: '#FAF7F2' }}
                            >
                              <p className="text-xs font-medium mb-1" style={{ color: '#C75B39' }}>
                                Réponse du freelance :
                              </p>
                              <p className="text-sm" style={{ color: '#3D3833' }}>
                                {review.response}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#E8E2D9' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => markHelpful(review.id)}
                              style={{ color: '#6B6560' }}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              Utile ({review.helpful_count || 0})
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              style={{ color: '#9A948D' }}
                            >
                              <Flag className="h-4 w-4" />
                              Signaler
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
