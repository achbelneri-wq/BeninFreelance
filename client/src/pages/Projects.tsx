import { useAuth } from "@/_core/hooks/useAuth";
// SUPPRIMÉ: import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase"; // AJOUT
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FolderKanban,
  Plus,
  Clock,
  Calendar,
  Wallet,
  Loader2,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Projects() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // États de formulaire
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [requirements, setRequirements] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États des données
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [freelancerProjects, setFreelancerProjects] = useState<any[]>([]);
  const [openProjects, setOpenProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les projets au montage
  const fetchProjects = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      if (user.is_seller) {
        // Mode Freelance
        // 1. Opportunités (Projets ouverts)
        const { data: open } = await supabase
          .from('projects')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(20);
        setOpenProjects(open || []);

        // 2. Mes missions (Projets où je suis assigné)
        const { data: assigned } = await supabase
          .from('projects')
          .select('*')
          .eq('freelancer_id', user.id);
        setFreelancerProjects(assigned || []);

      } else {
        // Mode Client (Mes projets créés)
        const { data: my } = await supabase
          .from('projects')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });
        setMyProjects(my || []);
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  // Création de projet via Supabase
  const handleCreate = async () => {
    if (!title.trim() || !description.trim() || !budget.trim()) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('projects').insert({
        client_id: user?.id,
        title,
        description,
        budget_min: parseFloat(budget),
        budget_max: parseFloat(budget), // Fixe pour simplifier
        budget_type: 'fixed',
        deadline: deadline || null,
        requirements: requirements || null,
        status: 'open'
      });

      if (error) throw error;

      toast.success("Projet créé avec succès !");
      setIsCreateOpen(false);
      // Reset form
      setTitle("");
      setDescription("");
      setBudget("");
      setDeadline("");
      setRequirements("");
      // Refresh list
      fetchProjects();
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-green-500/10 text-green-600">Ouvert</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/10 text-blue-600">En cours</Badge>;
      case 'completed': return <Badge className="bg-gray-500/10 text-gray-600">Terminé</Badge>;
      case 'cancelled': return <Badge variant="destructive">Annulé</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: any) => {
    if (!amount) return "N/A";
    return `${parseFloat(amount).toLocaleString('fr-FR')} FCFA`;
  };

  const ProjectCard = ({ project, showActions = false }: { project: any; showActions?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(project.status)}
              {project.deadline && new Date(project.deadline) < new Date() && project.status === 'open' && (
                <Badge variant="destructive" className="text-xs">Expiré</Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg truncate">{project.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Wallet className="h-4 w-4" />
                {formatCurrency(project.budget_min)}
              </div>
              {project.deadline && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(project.deadline).toLocaleDateString('fr-FR')}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(project.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
          {showActions && project.status === 'open' && (
            <Button size="sm" className="btn-benin shrink-0">
              Postuler
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Projets</h1>
          <p className="text-muted-foreground">
            {user?.is_seller 
              ? "Gérez vos projets et trouvez de nouvelles opportunités"
              : "Publiez des projets et trouvez des freelances"
            }
          </p>
        </div>
        
        {!user?.is_seller && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-benin gap-2">
                <Plus className="h-4 w-4" />
                Publier un projet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Publier un projet</DialogTitle>
                <DialogDescription>
                  Décrivez votre projet pour trouver le freelance idéal
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du projet *</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (FCFA) *</Label>
                    <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Date limite</Label>
                    <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirements">Exigences</Label>
                  <Textarea id="requirements" rows={2} value={requirements} onChange={(e) => setRequirements(e.target.value)} />
                </div>

                <Button className="w-full btn-benin" onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Publier le projet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Content */}
      {user?.is_seller ? (
        <Tabs defaultValue="opportunities" className="space-y-6">
          <TabsList>
            <TabsTrigger value="opportunities">Opportunités</TabsTrigger>
            <TabsTrigger value="assigned">Mes missions</TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
            ) : openProjects.length > 0 ? (
              <div className="space-y-4">
                {openProjects.map((project: any) => <ProjectCard key={project.id} project={project} showActions />)}
              </div>
            ) : (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Aucun projet disponible</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="assigned" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
            ) : freelancerProjects.length > 0 ? (
              <div className="space-y-4">
                {freelancerProjects.map((project: any) => <ProjectCard key={project.id} project={project} />)}
              </div>
            ) : (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune mission en cours</CardContent></Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
          ) : myProjects.length > 0 ? (
            <div className="space-y-4">
              {myProjects.map((project: any) => <ProjectCard key={project.id} project={project} />)}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p>Aucun projet. Publiez-en un !</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}