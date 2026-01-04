import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link, useParams, useLocation } from "wouter";
// SUPPRIMÉ: import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase"; // AJOUT
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  Briefcase,
  Clock,
  Heart,
  MessageCircle,
  Bookmark,
  Eye,
  Users,
  ArrowLeft,
  Send,
  Calendar,
  Share2,
  Loader2,
  ThumbsUp,
  MapPin
} from "lucide-react";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  
  // États de formulaire
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [proposedDuration, setProposedDuration] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  // États de données
  const projectId = parseInt(id || "0");
  const [project, setProject] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // États d'interaction
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // 1. Charger les données du projet
  const fetchProjectData = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      // Récupérer le projet et le client
      const { data: projectData, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:users!client_id (*)
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(projectData);

      // Récupérer les commentaires
      const { data: commentsData } = await supabase
        .from('project_comments')
        .select(`
          *,
          user:users (*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      setComments(commentsData || []);

      // Vérifier si liké/sauvegardé (si connecté)
      if (user) {
        const { count: likeCount } = await supabase
          .from('project_likes')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .eq('user_id', user.id);
        setIsLiked(!!likeCount);

        const { count: saveCount } = await supabase
          .from('project_saves')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .eq('user_id', user.id);
        setIsSaved(!!saveCount);
      }

    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId, user]);

  // Actions
  const handleApply = async () => {
    if (!coverLetter.trim()) {
      toast.error("Veuillez rédiger une lettre de motivation");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('project_applications').insert({
        project_id: projectId,
        freelancer_id: user?.id,
        cover_letter: coverLetter,
        proposed_budget: proposedBudget ? parseFloat(proposedBudget) : null,
        proposed_duration: proposedDuration,
        status: 'pending'
      });

      if (error) throw error;

      toast.success("Candidature envoyée avec succès !");
      setIsApplyModalOpen(false);
      setCoverLetter("");
      setProposedBudget("");
      setProposedDuration("");
      // Update local state if needed (e.g. increment application count)
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Connectez-vous pour aimer ce projet");
      return;
    }
    
    // Optimistic UI
    const previousState = isLiked;
    setIsLiked(!isLiked);
    
    try {
      if (previousState) {
        // Unlike
        await supabase.from('project_likes').delete().match({ project_id: projectId, user_id: user.id });
        setProject((prev: any) => ({ ...prev, like_count: Math.max(0, (prev.like_count || 0) - 1) }));
      } else {
        // Like
        await supabase.from('project_likes').insert({ project_id: projectId, user_id: user.id });
        setProject((prev: any) => ({ ...prev, like_count: (prev.like_count || 0) + 1 }));
      }
    } catch (error) {
      setIsLiked(previousState); // Revert
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Connectez-vous pour sauvegarder");
      return;
    }

    const previousState = isSaved;
    setIsSaved(!isSaved);

    try {
      if (previousState) {
        await supabase.from('project_saves').delete().match({ project_id: projectId, user_id: user.id });
        setProject((prev: any) => ({ ...prev, save_count: Math.max(0, (prev.save_count || 0) - 1) }));
      } else {
        await supabase.from('project_saves').insert({ project_id: projectId, user_id: user.id });
        setProject((prev: any) => ({ ...prev, save_count: (prev.save_count || 0) + 1 }));
      }
    } catch (error) {
      setIsSaved(previousState);
    }
  };

  const handleComment = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Connectez-vous pour commenter");
      return;
    }
    if (!comment.trim()) return;

    setIsCommentSubmitting(true);
    try {
      const { error } = await supabase.from('project_comments').insert({
        project_id: projectId,
        user_id: user.id,
        content: comment
      });

      if (error) throw error;

      toast.success("Commentaire ajouté !");
      setComment("");
      fetchProjectData(); // Refresh comments
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const getBudgetDisplay = (min?: number | null, max?: number | null) => {
    if (!min && !max) return "Budget à négocier";
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} XOF`;
    if (min) return `À partir de ${min.toLocaleString()} XOF`;
    if (max) return `Jusqu'à ${max.toLocaleString()} XOF`;
    return "Budget à négocier";
  };

  const getExperienceBadge = (level?: string | null) => {
    switch (level) {
      case "entry":
        return { label: "Débutant accepté", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
      case "intermediate":
        return { label: "Intermédiaire", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
      case "expert":
        return { label: "Expert requis", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
      default:
        return { label: "Tous niveaux", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Briefcase className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Projet non trouvé</h2>
            <p className="text-white/50 mb-6">Ce projet n'existe pas ou a été supprimé.</p>
            <Link href="/projects">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux projets
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const expBadge = getExperienceBadge(project.experience_level);
  // Gestion sécurisée des skills (JSON ou string)
  let skills = [];
  try {
    skills = typeof project.skills === 'string' ? JSON.parse(project.skills) : (project.skills || []);
  } catch (e) {
    skills = [];
  }

  const canApply = isAuthenticated && user?.userType === "freelance" && project.status === "open";
  const isOwner = isAuthenticated && user?.id === project.client_id;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container">
          <Link href="/projects">
            <Button variant="ghost" className="text-white/60 hover:text-white mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux projets
            </Button>
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="bg-white/[0.03] border-white/[0.08] p-8">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={expBadge.color}>{expBadge.label}</Badge>
                        <Badge className={`${project.status === "open" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                          {project.status === "open" ? "Ouvert" : project.status === "in_progress" ? "En cours" : "Fermé"}
                        </Badge>
                      </div>
                      <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
                      <div className="flex items-center gap-4 text-white/50 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Publié {project.created_at && formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: fr })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {project.view_count || 0} vues
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleLike} className={`p-2 rounded-lg transition-colors ${isLiked ? "bg-rose-500/20 text-rose-400" : "bg-white/[0.05] text-white/40 hover:text-rose-400"}`}>
                        <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                      </button>
                      <button onClick={handleSave} className={`p-2 rounded-lg transition-colors ${isSaved ? "bg-amber-500/20 text-amber-400" : "bg-white/[0.05] text-white/40 hover:text-amber-400"}`}>
                        <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
                      </button>
                      <button className="p-2 rounded-lg bg-white/[0.05] text-white/40 hover:text-white transition-colors">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="prose prose-invert max-w-none mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Description du projet</h3>
                    <p className="text-white/70 whitespace-pre-wrap">{project.description}</p>
                  </div>

                  {project.requirements && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-3">Exigences</h3>
                      <p className="text-white/70 whitespace-pre-wrap">{project.requirements}</p>
                    </div>
                  )}

                  {skills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Compétences requises</h3>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 text-sm rounded-full bg-white/[0.05] text-white/70 border border-white/[0.08]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <Card className="bg-white/[0.03] border-white/[0.08] p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Commentaires ({comments.length})
                  </h3>

                  {isAuthenticated && (
                    <div className="flex gap-3 mb-6">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user?.avatar || ""} />
                        <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                          {user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Ajouter un commentaire..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/30 resize-none mb-2"
                          rows={2}
                        />
                        <Button
                          onClick={handleComment}
                          disabled={!comment.trim() || isCommentSubmitting}
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600"
                        >
                          {isCommentSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Commenter</>}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {comments.length > 0 ? (
                      comments.map((c: any) => (
                        <div key={c.id} className="flex gap-3 p-4 rounded-lg bg-white/[0.02]">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={c.user?.avatar || ""} />
                            <AvatarFallback className="bg-white/[0.1] text-white/60">
                              {c.user?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">{c.user?.name || "Utilisateur"}</span>
                              <span className="text-white/40 text-sm">
                                {c.created_at && formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: fr })}
                              </span>
                            </div>
                            <p className="text-white/70">{c.content}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <button className="text-white/40 hover:text-white text-sm flex items-center gap-1">
                                <ThumbsUp className="w-4 h-4" />
                                {c.like_count || 0}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-white/40 py-8">Aucun commentaire pour le moment.</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <Card className="bg-white/[0.03] border-white/[0.08] p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-emerald-400 mb-1">
                      {getBudgetDisplay(project.budget_min, project.budget_max)}
                    </div>
                    <div className="text-white/50 text-sm">
                      {project.budget_type === "fixed" ? "Prix fixe" : "Taux horaire"}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {project.deadline && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50 flex items-center gap-2"><Calendar className="w-4 h-4" /> Date limite</span>
                        <span className="text-white">{format(new Date(project.deadline), "dd MMM yyyy", { locale: fr })}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50 flex items-center gap-2"><Users className="w-4 h-4" /> Candidatures</span>
                      <span className="text-white">{project.application_count || 0}</span>
                    </div>
                  </div>

                  {canApply && (
                    <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium">
                          <Send className="w-4 h-4 mr-2" /> Postuler maintenant
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#1a1a2e] border-white/[0.1] text-white max-w-lg">
                        <DialogHeader><DialogTitle>Postuler à ce projet</DialogTitle></DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label className="text-white/70">Lettre de motivation *</Label>
                            <Textarea
                              placeholder="Pourquoi vous ?"
                              value={coverLetter}
                              onChange={(e) => setCoverLetter(e.target.value)}
                              className="mt-2 bg-white/[0.05] border-white/[0.1] text-white min-h-[150px]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-white/70">Budget (XOF)</Label>
                              <Input
                                type="number"
                                value={proposedBudget}
                                onChange={(e) => setProposedBudget(e.target.value)}
                                className="mt-2 bg-white/[0.05] border-white/[0.1] text-white"
                              />
                            </div>
                            <div>
                              <Label className="text-white/70">Durée</Label>
                              <Input
                                placeholder="Ex: 2 semaines"
                                value={proposedDuration}
                                onChange={(e) => setProposedDuration(e.target.value)}
                                className="mt-2 bg-white/[0.05] border-white/[0.1] text-white"
                              />
                            </div>
                          </div>
                          <Button onClick={handleApply} disabled={isSubmitting || !coverLetter.trim()} className="w-full bg-emerald-500">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Envoyer"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {!isAuthenticated && (
                    <Link href="/login">
                      <Button className="w-full h-12 bg-emerald-500">Connectez-vous pour postuler</Button>
                    </Link>
                  )}
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                <Card className="bg-white/[0.03] border-white/[0.08] p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">À propos du client</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={project.client?.avatar || ""} />
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-lg">
                        {project.client?.name?.charAt(0) || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-white">{project.client?.name || "Client"}</div>
                      <div className="text-white/50 text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {project.client?.city || "Bénin"}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}