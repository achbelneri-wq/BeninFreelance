import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SparkleIcon from "@/components/SparkleIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Users,
  Eye,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  Share2,
  Flag,
  Shield,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Send,
  Loader2,
  FileText,
  Briefcase,
  Star,
  Zap,
  ExternalLink,
} from "lucide-react";
import { getLoginUrl } from "@/const";

interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  budget_min?: number;
  budget_max?: number;
  budget_type: string;
  deadline?: string;
  skills_required: string[];
  attachments: string[];
  status: string;
  urgency: string;
  experience_level: string;
  project_length: string;
  location_preference: string;
  preferred_city?: string;
  proposals_count: number;
  views_count: number;
  is_featured: boolean;
  created_at: string;
  client_id: number;
  client?: {
    id: number;
    name: string;
    avatar?: string;
    country?: string;
    city?: string;
    is_verified: boolean;
    created_at: string;
    total_projects?: number;
  };
  questions?: { id: number; question: string; is_required: boolean }[];
}

interface Milestone {
  title: string;
  description: string;
  amount: number;
  due_days: number;
}

export default function ProjectDetailPro() {
  const { user } = useAuth();
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = params.id ? parseInt(params.id) : null;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasProposed, setHasProposed] = useState(false);

  // Modal proposition
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulaire proposition
  const [proposalData, setProposalData] = useState({
    cover_letter: "",
    proposed_price: "",
    delivery_time: "",
    validity_days: "7",
  });
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [useMilestones, setUseMilestones] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Charger le projet
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;

      setLoading(true);
      try {
        // Charger le projet avec le client
        const { data: projectData, error } = await supabase
          .from("projects")
          .select(`
            *,
            client:users!projects_client_id_fkey (
              id, name, avatar, country, city, kyc_status, created_at
            )
          `)
          .eq("id", projectId)
          .single();

        if (error) throw error;

        // Charger les questions du projet
        const { data: questions } = await supabase
          .from("project_questions")
          .select("*")
          .eq("project_id", projectId)
          .order("sort_order");

        // Compter les projets du client
        const { count: clientProjects } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("client_id", projectData.client_id);

        setProject({
          ...projectData,
          client: projectData.client ? {
            ...projectData.client,
            is_verified: projectData.client.kyc_status === 'verified',
            total_projects: clientProjects || 0,
          } : undefined,
          questions: questions || [],
        });

        // Incrémenter les vues
        await supabase.rpc("increment_project_views", { p_project_id: projectId });

        // Vérifier si déjà bookmarké
        if (user) {
          const { data: bookmark } = await supabase
            .from("project_bookmarks")
            .select("id")
            .eq("user_id", user.id)
            .eq("project_id", projectId)
            .single();

          setIsBookmarked(!!bookmark);

          // Vérifier si déjà proposé
          const { data: proposal } = await supabase
            .from("proposals")
            .select("id")
            .eq("freelancer_id", user.id)
            .eq("project_id", projectId)
            .single();

          setHasProposed(!!proposal);
        }
      } catch (error) {
        console.error("Erreur chargement projet:", error);
        toast.error("Projet non trouvé");
        setLocation("/projects/all");
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, user]);

  const handleBookmark = async () => {
    if (!user) {
      setLocation(getLoginUrl());
      return;
    }

    try {
      if (isBookmarked) {
        await supabase
          .from("project_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("project_id", projectId);
        setIsBookmarked(false);
        toast.success("Projet retiré des favoris");
      } else {
        await supabase
          .from("project_bookmarks")
          .insert({ user_id: user.id, project_id: projectId });
        setIsBookmarked(true);
        toast.success("Projet ajouté aux favoris");
      }
    } catch (error) {
      console.error("Erreur bookmark:", error);
    }
  };

  const openProposalModal = () => {
    if (!user) {
      setLocation(getLoginUrl());
      return;
    }

    if (hasProposed) {
      toast.info("Vous avez déjà soumis une proposition pour ce projet");
      return;
    }

    // Pré-remplir avec le budget du projet
    setProposalData({
      cover_letter: "",
      proposed_price: project?.budget_min?.toString() || "",
      delivery_time: "7",
      validity_days: "7",
    });
    setMilestones([]);
    setUseMilestones(false);
    setAnswers({});
    setProposalModalOpen(true);
  };

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { title: "", description: "", amount: 0, due_days: 7 },
    ]);
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string | number) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const calculateMilestonesTotal = () => {
    return milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  };

  const submitProposal = async () => {
    if (!user || !project) return;

    // Validations
    if (!proposalData.cover_letter.trim()) {
      toast.error("Veuillez rédiger votre lettre de motivation");
      return;
    }

    if (!proposalData.proposed_price || Number(proposalData.proposed_price) <= 0) {
      toast.error("Veuillez indiquer votre tarif");
      return;
    }

    if (!proposalData.delivery_time || Number(proposalData.delivery_time) <= 0) {
      toast.error("Veuillez indiquer le délai de livraison");
      return;
    }

    // Vérifier les questions obligatoires
    const requiredQuestions = project.questions?.filter(q => q.is_required) || [];
    for (const q of requiredQuestions) {
      if (!answers[q.id]?.trim()) {
        toast.error("Veuillez répondre à toutes les questions obligatoires");
        return;
      }
    }

    // Vérifier les jalons si activés
    if (useMilestones) {
      if (milestones.length === 0) {
        toast.error("Ajoutez au moins un jalon");
        return;
      }

      const total = calculateMilestonesTotal();
      if (total !== Number(proposalData.proposed_price)) {
        toast.error(`Le total des jalons (${total.toLocaleString()} FCFA) doit correspondre au prix proposé`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // Créer la proposition
      const { data: proposal, error } = await supabase
        .from("proposals")
        .insert({
          project_id: project.id,
          freelancer_id: user.id,
          cover_letter: proposalData.cover_letter,
          proposed_price: Number(proposalData.proposed_price),
          delivery_time: Number(proposalData.delivery_time),
          validity_days: Number(proposalData.validity_days),
          expires_at: new Date(Date.now() + Number(proposalData.validity_days) * 24 * 60 * 60 * 1000).toISOString(),
          questions_answered: answers,
        })
        .select()
        .single();

      if (error) throw error;

      // Ajouter les jalons si présents
      if (useMilestones && milestones.length > 0) {
        const milestonesData = milestones.map((m, index) => ({
          proposal_id: proposal.id,
          title: m.title,
          description: m.description,
          amount: m.amount,
          due_days: m.due_days,
          sort_order: index,
        }));

        await supabase.from("proposal_milestones").insert(milestonesData);
      }

      // Ajouter les réponses aux questions
      if (Object.keys(answers).length > 0) {
        const answersData = Object.entries(answers).map(([questionId, answer]) => ({
          proposal_id: proposal.id,
          question_id: Number(questionId),
          answer,
        }));

        await supabase.from("proposal_answers").insert(answersData);
      }

      // Mettre à jour le compteur de propositions
      await supabase
        .from("projects")
        .update({ proposals_count: (project.proposals_count || 0) + 1 })
        .eq("id", project.id);

      toast.success("Proposition envoyée avec succès !");
      setProposalModalOpen(false);
      setHasProposed(true);
    } catch (error) {
      console.error("Erreur soumission:", error);
      toast.error("Erreur lors de l'envoi de la proposition");
    } finally {
      setSubmitting(false);
    }
  };

  const formatBudget = () => {
    if (!project) return "À discuter";
    const { budget_min, budget_max, budget_type } = project;
    
    if (!budget_min && !budget_max) return "À discuter";
    
    const suffix = budget_type === 'hourly' ? '/h' : '';
    
    if (budget_min && budget_max) {
      if (budget_min === budget_max) {
        return `${budget_min.toLocaleString()} FCFA${suffix}`;
      }
      return `${budget_min.toLocaleString()} - ${budget_max.toLocaleString()} FCFA${suffix}`;
    }
    if (budget_min) return `À partir de ${budget_min.toLocaleString()} FCFA${suffix}`;
    if (budget_max) return `Jusqu'à ${budget_max.toLocaleString()} FCFA${suffix}`;
    return "À discuter";
  };

  const getStatusBadge = () => {
    if (!project) return null;
    
    const statuses: Record<string, { label: string; color: string; bg: string }> = {
      open: { label: "Ouvert", color: "#5C6B4A", bg: "#E8F5E9" },
      in_progress: { label: "En cours", color: "#C75B39", bg: "#FFF3E0" },
      completed: { label: "Terminé", color: "#6B6560", bg: "#E8E2D9" },
      cancelled: { label: "Annulé", color: "#9A948D", bg: "#F5F5F5" },
    };
    
    return statuses[project.status] || statuses.open;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#FAF7F2' }}>
        <Navbar />
        <main className="flex-1 py-8">
          <div className="container max-w-5xl">
            <Skeleton className="h-8 w-32 mb-6" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-48" />
              </div>
              <div>
                <Skeleton className="h-96" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#FAF7F2' }}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4" style={{ color: '#E8E2D9' }} />
              <h2 className="text-xl font-semibold mb-2" style={{ color: '#1A1714' }}>
                Projet non trouvé
              </h2>
              <Link href="/projects/all">
                <Button style={{ background: '#C75B39', color: '#FFFDFB' }}>
                  Voir tous les projets
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const statusBadge = getStatusBadge();
  const timeAgo = formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: fr });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF7F2' }}>
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container max-w-5xl">
          {/* Retour */}
          <Link href="/projects/all">
            <Button variant="ghost" className="mb-6 gap-2" style={{ color: '#6B6560' }}>
              <ArrowLeft className="h-4 w-4" />
              Tous les projets
            </Button>
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contenu principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header projet */}
              <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {statusBadge && (
                          <Badge style={{ background: statusBadge.bg, color: statusBadge.color }}>
                            {statusBadge.label}
                          </Badge>
                        )}
                        {project.urgency === 'urgent' && (
                          <Badge style={{ background: '#C75B39', color: '#FFFDFB' }}>
                            <Zap className="h-3 w-3 mr-1" />
                            Urgent
                          </Badge>
                        )}
                        {project.is_featured && (
                          <Badge style={{ background: '#D4AF37', color: '#1A1714' }}>
                            En vedette
                          </Badge>
                        )}
                      </div>
                      <h1 
                        className="text-2xl font-bold"
                        style={{ color: '#1A1714', fontFamily: 'Playfair Display, serif' }}
                      >
                        {project.title}
                      </h1>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleBookmark}
                        style={{ borderColor: '#E8E2D9' }}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="h-5 w-5" style={{ color: '#C75B39' }} />
                        ) : (
                          <Bookmark className="h-5 w-5" style={{ color: '#6B6560' }} />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        style={{ borderColor: '#E8E2D9' }}
                      >
                        <Share2 className="h-5 w-5" style={{ color: '#6B6560' }} />
                      </Button>
                    </div>
                  </div>

                  {/* Infos rapides */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" style={{ color: '#C75B39' }} />
                      <div>
                        <p className="text-xs" style={{ color: '#9A948D' }}>Budget</p>
                        <p className="font-semibold" style={{ color: '#1A1714' }}>{formatBudget()}</p>
                      </div>
                    </div>
                    
                    {project.deadline && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" style={{ color: '#5C6B4A' }} />
                        <div>
                          <p className="text-xs" style={{ color: '#9A948D' }}>Deadline</p>
                          <p className="font-semibold" style={{ color: '#1A1714' }}>
                            {new Date(project.deadline).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" style={{ color: '#9A948D' }} />
                      <div>
                        <p className="text-xs" style={{ color: '#9A948D' }}>Propositions</p>
                        <p className="font-semibold" style={{ color: '#1A1714' }}>{project.proposals_count}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5" style={{ color: '#9A948D' }} />
                      <div>
                        <p className="text-xs" style={{ color: '#9A948D' }}>Vues</p>
                        <p className="font-semibold" style={{ color: '#1A1714' }}>{project.views_count}</p>
                      </div>
                    </div>
                  </div>

                  {/* Catégorie et tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" style={{ borderColor: '#C75B39', color: '#C75B39' }}>
                      {project.category}
                    </Badge>
                    {project.subcategory && (
                      <Badge variant="outline" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>
                        {project.subcategory}
                      </Badge>
                    )}
                  </div>

                  {/* Compétences requises */}
                  {project.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.skills_required.map((skill, i) => (
                        <Badge 
                          key={i}
                          variant="secondary"
                          style={{ background: '#FAF7F2', color: '#3D3833' }}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Publié */}
                  <p className="text-sm mt-4" style={{ color: '#9A948D' }}>
                    Publié {timeAgo}
                  </p>
                </CardContent>
              </Card>

              {/* Description */}
              <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                <CardHeader>
                  <CardTitle style={{ color: '#1A1714', fontFamily: 'Playfair Display, serif' }}>
                    Description du projet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none"
                    style={{ color: '#3D3833' }}
                  >
                    {project.description.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Détails supplémentaires */}
              <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                <CardHeader>
                  <CardTitle style={{ color: '#1A1714', fontFamily: 'Playfair Display, serif' }}>
                    Détails du projet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {project.experience_level && project.experience_level !== 'any' && (
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: '#6B6560' }}>
                          Niveau d'expérience requis
                        </p>
                        <p style={{ color: '#1A1714' }}>
                          {project.experience_level === 'entry' ? 'Débutant' :
                           project.experience_level === 'intermediate' ? 'Intermédiaire' : 'Expert'}
                        </p>
                      </div>
                    )}
                    
                    {project.project_length && (
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: '#6B6560' }}>
                          Durée estimée
                        </p>
                        <p style={{ color: '#1A1714' }}>
                          {project.project_length === 'short' ? 'Court terme (< 1 mois)' :
                           project.project_length === 'medium' ? 'Moyen terme (1-3 mois)' :
                           project.project_length === 'long' ? 'Long terme (3+ mois)' : 'En continu'}
                        </p>
                      </div>
                    )}
                    
                    {project.location_preference && (
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: '#6B6560' }}>
                          Préférence de lieu
                        </p>
                        <p style={{ color: '#1A1714' }}>
                          {project.location_preference === 'remote' ? 'À distance' :
                           project.location_preference === 'local' ? `Sur place${project.preferred_city ? ` (${project.preferred_city})` : ''}` :
                           project.location_preference === 'hybrid' ? 'Hybride' : 'Flexible'}
                        </p>
                      </div>
                    )}
                    
                    {project.budget_type && (
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: '#6B6560' }}>
                          Type de budget
                        </p>
                        <p style={{ color: '#1A1714' }}>
                          {project.budget_type === 'fixed' ? 'Prix fixe' :
                           project.budget_type === 'hourly' ? 'Tarif horaire' : 'Sur devis'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Questions du client */}
              {project.questions && project.questions.length > 0 && (
                <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                  <CardHeader>
                    <CardTitle style={{ color: '#1A1714', fontFamily: 'Playfair Display, serif' }}>
                      Questions du client
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4" style={{ color: '#6B6560' }}>
                      Le client souhaite que vous répondiez à ces questions dans votre proposition :
                    </p>
                    <ul className="space-y-3">
                      {project.questions.map((q, i) => (
                        <li key={q.id} className="flex items-start gap-2">
                          <span 
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                            style={{ background: '#C75B39', color: '#FFFDFB' }}
                          >
                            {i + 1}
                          </span>
                          <span style={{ color: '#3D3833' }}>
                            {q.question}
                            {q.is_required && <span style={{ color: '#C75B39' }}> *</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* CTA Postuler */}
              <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                <CardContent className="p-6">
                  {project.status === 'open' ? (
                    <>
                      <Button
                        className="w-full gap-2 py-6 text-lg"
                        style={{ background: '#C75B39', color: '#FFFDFB' }}
                        onClick={openProposalModal}
                        disabled={hasProposed}
                      >
                        {hasProposed ? (
                          <>
                            <CheckCircle className="h-5 w-5" />
                            Proposition envoyée
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5" />
                            Soumettre une proposition
                          </>
                        )}
                      </Button>
                      
                      {!hasProposed && (
                        <p className="text-xs text-center mt-3" style={{ color: '#9A948D' }}>
                          Gratuit • Réponse sous 48h en moyenne
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3" style={{ color: '#9A948D' }} />
                      <p className="font-medium" style={{ color: '#1A1714' }}>
                        Ce projet n'accepte plus de propositions
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Infos client */}
              {project.client && (
                <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                  <CardHeader>
                    <CardTitle className="text-base" style={{ color: '#1A1714' }}>
                      À propos du client
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={project.client.avatar} />
                        <AvatarFallback style={{ background: '#E8E2D9', color: '#6B6560' }}>
                          {project.client.name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium" style={{ color: '#1A1714' }}>
                            {project.client.name || `Client #${project.client.id}`}
                          </p>
                          {project.client.is_verified && (
                            <Shield className="h-4 w-4" style={{ color: '#C75B39' }} />
                          )}
                        </div>
                        {project.client.city && (
                          <p className="text-sm" style={{ color: '#6B6560' }}>
                            {project.client.city}, {project.client.country || 'Bénin'}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator className="my-4" style={{ background: '#E8E2D9' }} />

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: '#6B6560' }}>Projets publiés</span>
                        <span className="font-medium" style={{ color: '#1A1714' }}>
                          {project.client.total_projects}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: '#6B6560' }}>Membre depuis</span>
                        <span className="font-medium" style={{ color: '#1A1714' }}>
                          {new Date(project.client.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Signaler */}
              <Button
                variant="ghost"
                className="w-full gap-2"
                style={{ color: '#9A948D' }}
              >
                <Flag className="h-4 w-4" />
                Signaler ce projet
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal proposition */}
      <Dialog open={proposalModalOpen} onOpenChange={setProposalModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              Soumettre une proposition
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Lettre de motivation */}
            <div>
              <Label htmlFor="cover_letter">Lettre de motivation *</Label>
              <p className="text-xs mb-2" style={{ color: '#9A948D' }}>
                Expliquez pourquoi vous êtes le meilleur choix pour ce projet
              </p>
              <Textarea
                id="cover_letter"
                value={proposalData.cover_letter}
                onChange={(e) => setProposalData({ ...proposalData, cover_letter: e.target.value })}
                placeholder="Bonjour, je suis intéressé par votre projet..."
                rows={6}
                style={{ borderColor: '#E8E2D9' }}
              />
            </div>

            {/* Prix et délai */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proposed_price">Votre tarif (FCFA) *</Label>
                <Input
                  id="proposed_price"
                  type="number"
                  value={proposalData.proposed_price}
                  onChange={(e) => setProposalData({ ...proposalData, proposed_price: e.target.value })}
                  placeholder="Ex: 150000"
                  style={{ borderColor: '#E8E2D9' }}
                />
                <p className="text-xs mt-1" style={{ color: '#9A948D' }}>
                  Budget client: {formatBudget()}
                </p>
              </div>
              <div>
                <Label htmlFor="delivery_time">Délai de livraison (jours) *</Label>
                <Input
                  id="delivery_time"
                  type="number"
                  value={proposalData.delivery_time}
                  onChange={(e) => setProposalData({ ...proposalData, delivery_time: e.target.value })}
                  placeholder="Ex: 14"
                  style={{ borderColor: '#E8E2D9' }}
                />
              </div>
            </div>

            {/* Jalons */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label>Paiement par jalons</Label>
                  <p className="text-xs" style={{ color: '#9A948D' }}>
                    Divisez le projet en étapes avec paiements échelonnés
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useMilestones}
                    onChange={(e) => setUseMilestones(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm" style={{ color: '#3D3833' }}>Activer</span>
                </label>
              </div>

              {useMilestones && (
                <div className="space-y-4 p-4 rounded-lg" style={{ background: '#FAF7F2' }}>
                  {milestones.map((milestone, index) => (
                    <div key={index} className="p-4 rounded-lg bg-white border" style={{ borderColor: '#E8E2D9' }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium" style={{ color: '#1A1714' }}>
                          Jalon {index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeMilestone(index)}
                        >
                          <Trash2 className="h-4 w-4" style={{ color: '#9A948D' }} />
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        <Input
                          placeholder="Titre du jalon"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                          style={{ borderColor: '#E8E2D9' }}
                        />
                        <Textarea
                          placeholder="Description des livrables"
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          rows={2}
                          style={{ borderColor: '#E8E2D9' }}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Montant (FCFA)</Label>
                            <Input
                              type="number"
                              value={milestone.amount || ''}
                              onChange={(e) => updateMilestone(index, 'amount', Number(e.target.value))}
                              style={{ borderColor: '#E8E2D9' }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Délai (jours)</Label>
                            <Input
                              type="number"
                              value={milestone.due_days || ''}
                              onChange={(e) => updateMilestone(index, 'due_days', Number(e.target.value))}
                              style={{ borderColor: '#E8E2D9' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={addMilestone}
                    style={{ borderColor: '#E8E2D9', color: '#6B6560' }}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un jalon
                  </Button>

                  {milestones.length > 0 && (
                    <div className="flex justify-between pt-3 border-t" style={{ borderColor: '#E8E2D9' }}>
                      <span className="font-medium" style={{ color: '#1A1714' }}>Total des jalons</span>
                      <span 
                        className="font-bold"
                        style={{ 
                          color: calculateMilestonesTotal() === Number(proposalData.proposed_price) 
                            ? '#5C6B4A' 
                            : '#C75B39' 
                        }}
                      >
                        {calculateMilestonesTotal().toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Questions du client */}
            {project.questions && project.questions.length > 0 && (
              <div>
                <Label>Réponses aux questions du client</Label>
                <div className="space-y-4 mt-3">
                  {project.questions.map((q) => (
                    <div key={q.id}>
                      <Label className="text-sm font-normal">
                        {q.question}
                        {q.is_required && <span style={{ color: '#C75B39' }}> *</span>}
                      </Label>
                      <Textarea
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        rows={2}
                        className="mt-1"
                        style={{ borderColor: '#E8E2D9' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validité */}
            <div>
              <Label htmlFor="validity">Validité de la proposition</Label>
              <Select 
                value={proposalData.validity_days} 
                onValueChange={(v) => setProposalData({ ...proposalData, validity_days: v })}
              >
                <SelectTrigger style={{ borderColor: '#E8E2D9' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 jours</SelectItem>
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="14">14 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProposalModalOpen(false)}
              style={{ borderColor: '#E8E2D9', color: '#6B6560' }}
            >
              Annuler
            </Button>
            <Button
              onClick={submitProposal}
              disabled={submitting}
              style={{ background: '#C75B39', color: '#FFFDFB' }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer la proposition
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
