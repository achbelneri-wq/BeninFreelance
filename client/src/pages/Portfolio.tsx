import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SparkleIcon from "@/components/SparkleIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  Heart,
  Calendar,
  Briefcase,
  Image as ImageIcon,
  X,
  Upload,
  Loader2,
  ArrowLeft,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getLoginUrl } from "@/const";

// Catégories de portfolio
const PORTFOLIO_CATEGORIES = [
  "Site web",
  "Application mobile",
  "Design UI/UX",
  "Logo & Branding",
  "E-commerce",
  "Marketing digital",
  "Rédaction",
  "Vidéo & Animation",
  "Autre",
];

interface PortfolioItem {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  category?: string;
  client_name?: string;
  project_url?: string;
  completion_date?: string;
  is_featured: boolean;
  is_public: boolean;
  views_count: number;
  likes_count: number;
  images?: { id: number; image_url: string; caption?: string; is_cover: boolean }[];
  technologies?: string[];
}

function PortfolioSkeleton() {
  return (
    <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
      <Skeleton className="aspect-[4/3]" />
      <CardContent className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Portfolio() {
  const { user } = useAuth();
  const params = useParams();
  const [, setLocation] = useLocation();
  
  // Déterminer si on affiche le portfolio d'un autre utilisateur ou le sien
  const viewingUserId = params.userId ? parseInt(params.userId) : user?.id;
  const isOwnPortfolio = !params.userId || (user && parseInt(params.userId) === user.id);

  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<any>(null);

  // Modal ajout/édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Formulaire
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    client_name: "",
    project_url: "",
    completion_date: "",
    is_public: true,
    is_featured: false,
    technologies: [] as string[],
  });
  const [newTech, setNewTech] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Charger le portfolio
  useEffect(() => {
    const loadPortfolio = async () => {
      if (!viewingUserId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Charger l'utilisateur
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", viewingUserId)
          .single();

        setProfileUser(userData);

        // Charger les items du portfolio
        let query = supabase
          .from("portfolio_items")
          .select(`
            *,
            portfolio_images (*),
            portfolio_technologies (technology_name)
          `)
          .eq("user_id", viewingUserId)
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false });

        // Si ce n'est pas son propre portfolio, ne montrer que les publics
        if (!isOwnPortfolio) {
          query = query.eq("is_public", true);
        }

        const { data, error } = await query;

        if (error) throw error;

        const items = (data || []).map(item => ({
          ...item,
          images: item.portfolio_images || [],
          technologies: (item.portfolio_technologies || []).map((t: any) => t.technology_name),
        }));

        setPortfolioItems(items);
      } catch (error) {
        console.error("Erreur chargement portfolio:", error);
        toast.error("Erreur lors du chargement du portfolio");
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [viewingUserId, isOwnPortfolio]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      category: "",
      client_name: "",
      project_url: "",
      completion_date: "",
      is_public: true,
      is_featured: false,
      technologies: [],
    });
    setImages([]);
    setExistingImages([]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: PortfolioItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      category: item.category || "",
      client_name: item.client_name || "",
      project_url: item.project_url || "",
      completion_date: item.completion_date || "",
      is_public: item.is_public,
      is_featured: item.is_featured,
      technologies: item.technologies || [],
    });
    setImages([]);
    setExistingImages(item.images || []);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setSaving(true);
    try {
      let itemId = editingItem?.id;

      if (editingItem) {
        // Mise à jour
        const { error } = await supabase
          .from("portfolio_items")
          .update({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            client_name: formData.client_name,
            project_url: formData.project_url,
            completion_date: formData.completion_date || null,
            is_public: formData.is_public,
            is_featured: formData.is_featured,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingItem.id);

        if (error) throw error;
      } else {
        // Création
        const { data, error } = await supabase
          .from("portfolio_items")
          .insert({
            user_id: user!.id,
            title: formData.title,
            description: formData.description,
            category: formData.category,
            client_name: formData.client_name,
            project_url: formData.project_url,
            completion_date: formData.completion_date || null,
            is_public: formData.is_public,
            is_featured: formData.is_featured,
          })
          .select()
          .single();

        if (error) throw error;
        itemId = data.id;
      }

      // Gérer les technologies
      if (itemId) {
        // Supprimer les anciennes
        await supabase
          .from("portfolio_technologies")
          .delete()
          .eq("portfolio_id", itemId);

        // Ajouter les nouvelles
        if (formData.technologies.length > 0) {
          await supabase
            .from("portfolio_technologies")
            .insert(
              formData.technologies.map(tech => ({
                portfolio_id: itemId,
                technology_name: tech,
              }))
            );
        }
      }

      toast.success(editingItem ? "Projet mis à jour" : "Projet ajouté au portfolio");
      setIsModalOpen(false);
      
      // Recharger
      window.location.reload();
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm("Supprimer ce projet du portfolio ?")) return;

    try {
      const { error } = await supabase
        .from("portfolio_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setPortfolioItems(portfolioItems.filter(item => item.id !== itemId));
      toast.success("Projet supprimé");
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const addTechnology = () => {
    if (newTech.trim() && !formData.technologies.includes(newTech.trim())) {
      setFormData({
        ...formData,
        technologies: [...formData.technologies, newTech.trim()],
      });
      setNewTech("");
    }
  };

  const removeTechnology = (tech: string) => {
    setFormData({
      ...formData,
      technologies: formData.technologies.filter(t => t !== tech),
    });
  };

  const openLightbox = (item: PortfolioItem, index: number = 0) => {
    setLightboxItem(item);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Si pas connecté et essaie d'accéder à son propre portfolio
  if (!user && !params.userId) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#FAF7F2' }}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4" style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-16 w-16 mx-auto mb-4" style={{ color: '#E8E2D9' }} />
              <h2 className="text-xl font-semibold mb-2" style={{ color: '#1A1714' }}>
                Connexion requise
              </h2>
              <p className="mb-6" style={{ color: '#6B6560' }}>
                Connectez-vous pour gérer votre portfolio
              </p>
              <Link href={getLoginUrl()}>
                <Button style={{ background: '#C75B39', color: '#FFFDFB' }}>
                  Se connecter
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF7F2' }}>
      <Navbar />

      {/* Header */}
      <div className="py-8 relative overflow-hidden" style={{ background: '#C75B39' }}>
        <div className="absolute top-2 right-8 opacity-30">
          <SparkleIcon variant="diamond" size="lg" bgColor="transparent" color="#FFFDFB" />
        </div>
        <div className="absolute bottom-2 right-32 opacity-20">
          <SparkleIcon variant="plus" size="md" bgColor="transparent" color="#FFFDFB" />
        </div>
        <div className="container relative z-10">
          <div className="flex items-center gap-4">
            <SparkleIcon variant="star" size="lg" />
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                {isOwnPortfolio ? "Mon Portfolio" : `Portfolio de ${profileUser?.name || 'Freelance'}`}
              </h1>
              <p className="text-white/80">
                {portfolioItems.length} réalisation{portfolioItems.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="container">
          {/* Actions */}
          <div className="flex items-center justify-between mb-8">
            {params.userId && (
              <Link href={`/profile/${params.userId}`}>
                <Button variant="ghost" className="gap-2" style={{ color: '#6B6560' }}>
                  <ArrowLeft className="h-4 w-4" />
                  Retour au profil
                </Button>
              </Link>
            )}
            
            {isOwnPortfolio && (
              <Button
                onClick={openAddModal}
                className="gap-2 ml-auto"
                style={{ background: '#C75B39', color: '#FFFDFB' }}
              >
                <Plus className="h-4 w-4" />
                Ajouter un projet
              </Button>
            )}
          </div>

          {/* Grille portfolio */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <PortfolioSkeleton key={i} />
              ))}
            </div>
          ) : portfolioItems.length === 0 ? (
            <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
              <CardContent className="py-16 text-center">
                <Briefcase className="h-16 w-16 mx-auto mb-4" style={{ color: '#E8E2D9' }} />
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1714' }}>
                  {isOwnPortfolio ? "Votre portfolio est vide" : "Aucun projet dans ce portfolio"}
                </h3>
                <p className="mb-6" style={{ color: '#6B6560' }}>
                  {isOwnPortfolio 
                    ? "Ajoutez vos réalisations pour montrer votre expertise aux clients"
                    : "Ce freelance n'a pas encore ajouté de projets"
                  }
                </p>
                {isOwnPortfolio && (
                  <Button
                    onClick={openAddModal}
                    className="gap-2"
                    style={{ background: '#C75B39', color: '#FFFDFB' }}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter mon premier projet
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioItems.map((item) => (
                <Card 
                  key={item.id}
                  className={`group cursor-pointer transition-all duration-200 hover:shadow-lg overflow-hidden ${item.is_featured ? 'ring-2' : ''}`}
                  style={{ 
                    background: '#FFFDFB', 
                    border: '1px solid #E8E2D9',
                    ringColor: item.is_featured ? '#D4AF37' : undefined,
                  }}
                  onClick={() => openLightbox(item)}
                >
                  {/* Image */}
                  <div className="aspect-[4/3] relative overflow-hidden" style={{ background: '#E8E2D9' }}>
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images.find(img => img.is_cover)?.image_url || item.images[0].image_url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12" style={{ color: '#9A948D' }} />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {item.is_featured && (
                        <Badge style={{ background: '#D4AF37', color: '#1A1714' }}>
                          <Star className="h-3 w-3 mr-1" />
                          En vedette
                        </Badge>
                      )}
                      {item.category && (
                        <Badge style={{ background: '#FFFDFB', color: '#6B6560' }}>
                          {item.category}
                        </Badge>
                      )}
                    </div>

                    {/* Actions (si propriétaire) */}
                    {isOwnPortfolio && (
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(item);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Overlay stats */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-4 text-white text-sm">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {item.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {item.likes_count}
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 
                      className="font-semibold text-lg line-clamp-1 mb-1"
                      style={{ color: '#1A1714', fontFamily: 'Playfair Display, serif' }}
                    >
                      {item.title}
                    </h3>
                    
                    {item.client_name && (
                      <p className="text-sm mb-2" style={{ color: '#6B6560' }}>
                        Client: {item.client_name}
                      </p>
                    )}

                    {item.description && (
                      <p className="text-sm line-clamp-2 mb-3" style={{ color: '#3D3833' }}>
                        {item.description}
                      </p>
                    )}

                    {/* Technologies */}
                    {item.technologies && item.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.technologies.slice(0, 3).map((tech, i) => (
                          <Badge 
                            key={i}
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: '#E8E2D9', color: '#6B6560' }}
                          >
                            {tech}
                          </Badge>
                        ))}
                        {item.technologies.length > 3 && (
                          <Badge 
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: '#E8E2D9', color: '#9A948D' }}
                          >
                            +{item.technologies.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Date */}
                    {item.completion_date && (
                      <div className="flex items-center gap-1 mt-3 text-xs" style={{ color: '#9A948D' }}>
                        <Calendar className="h-3 w-3" />
                        {new Date(item.completion_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal ajout/édition */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              {editingItem ? "Modifier le projet" : "Ajouter un projet"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Titre */}
            <div>
              <Label htmlFor="title">Titre du projet *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Refonte site e-commerce"
                style={{ borderColor: '#E8E2D9' }}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez le projet, les défis relevés, les résultats..."
                rows={4}
                style={{ borderColor: '#E8E2D9' }}
              />
            </div>

            {/* Catégorie et Client */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger style={{ borderColor: '#E8E2D9' }}>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {PORTFOLIO_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="client_name">Nom du client</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Ex: Entreprise XYZ"
                  style={{ borderColor: '#E8E2D9' }}
                />
              </div>
            </div>

            {/* URL et Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project_url">Lien du projet</Label>
                <Input
                  id="project_url"
                  type="url"
                  value={formData.project_url}
                  onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                  placeholder="https://..."
                  style={{ borderColor: '#E8E2D9' }}
                />
              </div>
              <div>
                <Label htmlFor="completion_date">Date de réalisation</Label>
                <Input
                  id="completion_date"
                  type="date"
                  value={formData.completion_date}
                  onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                  style={{ borderColor: '#E8E2D9' }}
                />
              </div>
            </div>

            {/* Technologies */}
            <div>
              <Label>Technologies utilisées</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  placeholder="Ex: React, Node.js..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                  style={{ borderColor: '#E8E2D9' }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTechnology}
                  style={{ borderColor: '#E8E2D9' }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.technologies.map((tech) => (
                  <Badge 
                    key={tech}
                    variant="secondary"
                    className="gap-1"
                    style={{ background: '#E8E2D9', color: '#3D3833' }}
                  >
                    {tech}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTechnology(tech)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: '#3D3833' }}>Visible publiquement</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: '#3D3833' }}>Mettre en avant</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              style={{ borderColor: '#E8E2D9', color: '#6B6560' }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ background: '#C75B39', color: '#FFFDFB' }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                editingItem ? "Mettre à jour" : "Ajouter"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxOpen && lightboxItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <div 
            className="max-w-4xl w-full mx-4 bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            {lightboxItem.images && lightboxItem.images.length > 0 && (
              <div className="relative aspect-video bg-black">
                <img
                  src={lightboxItem.images[lightboxIndex]?.image_url}
                  alt={lightboxItem.title}
                  className="w-full h-full object-contain"
                />
                
                {lightboxItem.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={() => setLightboxIndex((lightboxIndex - 1 + lightboxItem.images!.length) % lightboxItem.images!.length)}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={() => setLightboxIndex((lightboxIndex + 1) % lightboxItem.images!.length)}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Infos */}
            <div className="p-6">
              <h2 
                className="text-2xl font-bold mb-2"
                style={{ color: '#1A1714', fontFamily: 'Playfair Display, serif' }}
              >
                {lightboxItem.title}
              </h2>
              
              {lightboxItem.client_name && (
                <p className="text-sm mb-3" style={{ color: '#6B6560' }}>
                  Client: {lightboxItem.client_name}
                </p>
              )}

              {lightboxItem.description && (
                <p className="mb-4" style={{ color: '#3D3833' }}>
                  {lightboxItem.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {lightboxItem.technologies?.map((tech, i) => (
                    <Badge 
                      key={i}
                      variant="outline"
                      style={{ borderColor: '#E8E2D9', color: '#6B6560' }}
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>

                {lightboxItem.project_url && (
                  <a
                    href={lightboxItem.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                    style={{ color: '#C75B39' }}
                  >
                    Voir le projet
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
