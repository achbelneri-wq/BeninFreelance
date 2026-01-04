import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import SparkleIcon from "@/components/SparkleIcon";
import {
  Search,
  Filter,
  Briefcase,
  Code,
  ShoppingCart,
  Globe,
  Cpu,
  Palette,
  TrendingUp,
  Settings,
  Headphones,
  Bookmark,
  BookmarkCheck,
  Rss,
  ChevronDown,
  ChevronUp,
  X,
  Users,
  Eye,
  MessageSquare,
  Clock,
  Euro,
  Flag,
} from "lucide-react";

// Catégories avec icônes
const CATEGORIES = [
  { id: "my-skills", name: "Dans mes compét...", icon: Briefcase, special: true },
  { id: "all", name: "Toutes les catégor...", icon: null },
  { id: "developpement", name: "Développement", icon: Code },
  { id: "e-commerce", name: "E-commerce", icon: ShoppingCart },
  { id: "web", name: "Web", icon: Globe },
  { id: "ia", name: "IA", icon: Cpu },
  { id: "graphisme", name: "Graphisme", icon: Palette },
  { id: "webmarketing", name: "Webmarketing", icon: TrendingUp },
  { id: "systemes", name: "Systèmes d'entrep...", icon: Settings },
  { id: "services", name: "Services", icon: Headphones },
];

// Filtres par état
const STATUS_FILTERS = [
  { id: "open", label: "Projets ouverts" },
  { id: "in_progress", label: "Projets en travail" },
  { id: "completed", label: "Projets terminés" },
  { id: "cancelled", label: "Projets fermés" },
];

// Filtres par lecture
const READ_FILTERS = [
  { id: "all", label: "Projets lus et non-lus" },
  { id: "read", label: "Projets lus" },
  { id: "unread", label: "Projets non-lus" },
];

// Filtres personnels
const PERSONAL_FILTERS = [
  { id: "applied", label: "Mes projets postulés" },
  { id: "followed", label: "Mes projets suivis" },
  { id: "won", label: "Mes projets remportés" },
  { id: "created", label: "Mes projets créés" },
];

// Filtres par budget
const BUDGET_FILTERS = [
  { id: "quote", label: "Demande de devis" },
  { id: "under500", label: "Moins de 500 €" },
  { id: "500-1000", label: "500 € à 1 000 €" },
  { id: "1000-10000", label: "1 000 € à 10 000 €" },
  { id: "over10000", label: "10 000 € et plus" },
];

// Ordre de tri
const SORT_OPTIONS = [
  { id: "newest", label: "Les plus récents" },
  { id: "oldest", label: "Les plus anciens" },
];

export default function AllProjects() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // États des filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [readFilter, setReadFilter] = useState("all");
  const [personalFilters, setPersonalFilters] = useState<string[]>([]);
  const [budgetFilters, setBudgetFilters] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  
  // États des données
  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [bookmarkedProjects, setBookmarkedProjects] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Charger les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').eq('is_active', true);
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // Charger les projets sauvegardés
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('project_bookmarks')
        .select('project_id')
        .eq('user_id', user.id);
      if (data) {
        setBookmarkedProjects(data.map(b => b.project_id));
      }
    };
    fetchBookmarks();
  }, [user?.id]);

  // Charger les projets avec filtres
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('projects')
          .select(`
            *,
            client:client_id (
              id,
              name,
              avatar,
              avatar_url,
              country
            )
          `, { count: 'exact' });

        // Filtre par statut
        if (selectedStatuses.length > 0) {
          query = query.in('status', selectedStatuses);
        } else {
          // Par défaut, montrer les projets ouverts
          query = query.eq('status', 'open');
        }

        // Filtre par catégorie
        if (selectedCategory !== "all" && selectedCategory !== "my-skills") {
          query = query.eq('category', selectedCategory);
        }

        // Filtre par recherche
        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        // Filtre par budget
        if (budgetFilters.length > 0) {
          // Logique simplifiée pour les filtres de budget
          if (budgetFilters.includes('under500')) {
            query = query.lt('budget_max', 500);
          }
          if (budgetFilters.includes('500-1000')) {
            query = query.gte('budget_min', 500).lte('budget_max', 1000);
          }
          if (budgetFilters.includes('1000-10000')) {
            query = query.gte('budget_min', 1000).lte('budget_max', 10000);
          }
          if (budgetFilters.includes('over10000')) {
            query = query.gte('budget_min', 10000);
          }
        }

        // Tri
        if (sortOrder === 'newest') {
          query = query.order('created_at', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: true });
        }

        // Limite
        query = query.limit(50);

        const { data, error, count } = await query;
        
        if (error) throw error;
        
        setProjects(data || []);
        setTotalCount(count || 0);

      } catch (error) {
        console.error("Erreur chargement projets:", error);
        toast.error("Erreur lors du chargement des projets");
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchProjects();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedStatuses, readFilter, budgetFilters, sortOrder]);

  // Toggle bookmark
  const toggleBookmark = async (projectId: number) => {
    if (!user?.id) {
      toast.error("Connectez-vous pour sauvegarder des projets");
      return;
    }

    const isBookmarked = bookmarkedProjects.includes(projectId);

    try {
      if (isBookmarked) {
        await supabase
          .from('project_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('project_id', projectId);
        setBookmarkedProjects(prev => prev.filter(id => id !== projectId));
        toast.success("Projet retiré des favoris");
      } else {
        await supabase
          .from('project_bookmarks')
          .insert({ user_id: user.id, project_id: projectId });
        setBookmarkedProjects(prev => [...prev, projectId]);
        toast.success("Projet ajouté aux favoris");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // Toggle status filter
  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // Toggle budget filter
  const toggleBudgetFilter = (budget: string) => {
    setBudgetFilters(prev => 
      prev.includes(budget) 
        ? prev.filter(b => b !== budget)
        : [...prev, budget]
    );
  };

  // Toggle personal filter
  const togglePersonalFilter = (filter: string) => {
    setPersonalFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Réinitialiser les filtres
  const clearFilters = () => {
    setSelectedStatuses([]);
    setReadFilter("all");
    setPersonalFilters([]);
    setBudgetFilters([]);
    setSortOrder("newest");
    setSearchQuery("");
    setSelectedCategory("all");
  };

  // Composant de carte projet
  const ProjectCard = ({ project }: { project: any }) => {
    const isBookmarked = bookmarkedProjects.includes(project.id);
    const skills = project.skills_required || [];
    
    return (
      <Card 
        className="hover:shadow-md transition-all duration-200 cursor-pointer"
        style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}
      >
        <CardContent className="p-6">
          {/* Titre et bookmark */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <Link href={`/projects/${project.id}`}>
              <h3 
                className="font-semibold text-lg hover:underline"
                style={{ color: '#C75B39' }}
              >
                {project.title}
              </h3>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleBookmark(project.id);
              }}
              className="shrink-0 p-2 rounded hover:bg-gray-100 transition-colors"
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-5 w-5" style={{ color: '#C75B39' }} />
              ) : (
                <Bookmark className="h-5 w-5" style={{ color: '#9A948D' }} />
              )}
            </button>
          </div>

          {/* Statut et infos */}
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
            <Badge 
              variant="outline" 
              className="gap-1"
              style={{ 
                background: project.status === 'open' ? '#DCFCE7' : '#E8E2D9',
                color: project.status === 'open' ? '#166534' : '#6B6560',
                border: 'none'
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: project.status === 'open' ? '#22C55E' : '#9A948D' }} />
              {project.status === 'open' ? 'Ouvert' : project.status === 'in_progress' ? 'En cours' : 'Fermé'}
            </Badge>
            <span style={{ color: '#6B6560' }}>·</span>
            <span style={{ color: '#6B6560' }}>
              {project.budget_min && project.budget_max 
                ? `${project.budget_min.toLocaleString()} € à ${project.budget_max.toLocaleString()} €`
                : project.budget_min 
                  ? `À partir de ${project.budget_min.toLocaleString()} €`
                  : 'Demande de devis'
              }
            </span>
            <span style={{ color: '#6B6560' }}>·</span>
            <span style={{ color: '#6B6560' }}>
              {project.proposals_count || 0} offres
            </span>
            <span style={{ color: '#6B6560' }}>·</span>
            <span style={{ color: '#6B6560' }}>
              {project.views_count || 0} vues
            </span>
            {project.interactions_count > 0 && (
              <>
                <span style={{ color: '#6B6560' }}>·</span>
                <span style={{ color: '#6B6560' }}>
                  {project.interactions_count} interactions
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-sm line-clamp-3 mb-4" style={{ color: '#3D3833' }}>
            {project.description}
          </p>

          {/* Compétences */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.slice(0, 4).map((skill: string, index: number) => (
                <span 
                  key={index}
                  className="text-xs px-2 py-1"
                  style={{ color: '#6B6560' }}
                >
                  {skill}
                </span>
              ))}
              {skills.length > 4 && (
                <span className="text-xs" style={{ color: '#9A948D' }}>
                  +{skills.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Footer: Date et client */}
          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#E8E2D9' }}>
            <span className="text-sm" style={{ color: '#9A948D' }}>
              Il y a {formatDistanceToNow(new Date(project.created_at), { locale: fr })} par Client #{project.client?.id || 'N/A'}
            </span>
            {project.client?.country && (
              <span className="text-lg">
                {project.client.country === 'Bénin' || project.client.country === 'France' ? '🇧🇯' : '🌍'}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Panneau de filtres
  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Filtrer par état */}
      <div>
        <h4 className="font-medium mb-3" style={{ color: '#6B6560' }}>Filtrer par état</h4>
        <div className="space-y-2">
          {STATUS_FILTERS.map((filter) => (
            <div key={filter.id} className="flex items-center gap-2">
              <Checkbox
                id={`status-${filter.id}`}
                checked={selectedStatuses.includes(filter.id)}
                onCheckedChange={() => toggleStatusFilter(filter.id)}
              />
              <Label htmlFor={`status-${filter.id}`} className="cursor-pointer" style={{ color: '#3D3833' }}>
                {filter.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Filtrer par lecture */}
      <div>
        <RadioGroup value={readFilter} onValueChange={setReadFilter}>
          {READ_FILTERS.map((filter) => (
            <div key={filter.id} className="flex items-center gap-2">
              <RadioGroupItem value={filter.id} id={`read-${filter.id}`} />
              <Label htmlFor={`read-${filter.id}`} className="cursor-pointer" style={{ color: '#3D3833' }}>
                {filter.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Filtres personnels */}
      {isAuthenticated && (
        <div>
          <div className="space-y-2">
            {PERSONAL_FILTERS.map((filter) => (
              <div key={filter.id} className="flex items-center gap-2">
                <Checkbox
                  id={`personal-${filter.id}`}
                  checked={personalFilters.includes(filter.id)}
                  onCheckedChange={() => togglePersonalFilter(filter.id)}
                />
                <Label htmlFor={`personal-${filter.id}`} className="cursor-pointer" style={{ color: '#3D3833' }}>
                  {filter.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtrer par budget */}
      <div>
        <h4 className="font-medium mb-3" style={{ color: '#6B6560' }}>Filtrer par budget</h4>
        <div className="space-y-2">
          {BUDGET_FILTERS.map((filter) => (
            <div key={filter.id} className="flex items-center gap-2">
              <Checkbox
                id={`budget-${filter.id}`}
                checked={budgetFilters.includes(filter.id)}
                onCheckedChange={() => toggleBudgetFilter(filter.id)}
              />
              <Label htmlFor={`budget-${filter.id}`} className="cursor-pointer" style={{ color: '#3D3833' }}>
                {filter.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Ordre de tri */}
      <div>
        <h4 className="font-medium mb-3" style={{ color: '#6B6560' }}>Ordre de tri</h4>
        <RadioGroup value={sortOrder} onValueChange={setSortOrder}>
          {SORT_OPTIONS.map((option) => (
            <div key={option.id} className="flex items-center gap-2">
              <RadioGroupItem value={option.id} id={`sort-${option.id}`} />
              <Label htmlFor={`sort-${option.id}`} className="cursor-pointer" style={{ color: '#3D3833' }}>
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2 pt-4">
        <Button 
          className="flex-1"
          style={{ background: '#C75B39', color: '#FFFDFB' }}
          onClick={() => setShowFilters(false)}
        >
          Appliquer
        </Button>
        <Button 
          variant="outline"
          className="flex-1"
          style={{ borderColor: '#C75B39', color: '#C75B39' }}
          onClick={clearFilters}
        >
          Effacer
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF7F2' }}>
      <Navbar />

      {/* Header terracotta avec icônes sparkle */}
      <div className="py-8 relative overflow-hidden" style={{ background: '#C75B39' }}>
        {/* Icônes décoratives */}
        <div className="absolute top-2 right-4 opacity-30">
          <SparkleIcon variant="default" size="lg" bgColor="transparent" color="#FFFDFB" />
        </div>
        <div className="absolute bottom-2 right-24 opacity-20">
          <SparkleIcon variant="plus" size="md" bgColor="transparent" color="#FFFDFB" />
        </div>
        <div className="absolute top-4 right-48 opacity-15">
          <SparkleIcon variant="star" size="sm" bgColor="transparent" color="#FFFDFB" />
        </div>
        <div className="container relative z-10">
          <div className="flex items-center gap-4">
            <SparkleIcon variant="default" size="lg" />
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              Tous les projets
            </h1>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Sidebar - Catégories */}
            <aside className="lg:w-64 shrink-0">
              <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4" style={{ color: '#1A1714' }}>
                    Filtrer par catégorie
                  </h3>
                  <nav className="space-y-1">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isActive = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                            isActive ? 'font-medium' : ''
                          }`}
                          style={{ 
                            background: isActive ? '#EFF6FF' : 'transparent',
                            color: isActive ? '#C75B39' : '#3D3833'
                          }}
                        >
                          {Icon && <Icon className="h-4 w-4 shrink-0" />}
                          {cat.special && (
                            <Briefcase className="h-4 w-4 shrink-0" style={{ color: '#C75B39' }} />
                          )}
                          {!Icon && !cat.special && (
                            <span className="w-4 h-4 grid grid-cols-2 gap-0.5 shrink-0">
                              {[...Array(4)].map((_, i) => (
                                <span key={i} className="w-1.5 h-1.5 rounded-sm" style={{ background: '#9A948D' }} />
                              ))}
                            </span>
                          )}
                          <span className="truncate text-sm">{cat.name}</span>
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </aside>

            {/* Contenu principal */}
            <div className="flex-1 min-w-0">
              {/* Barre de recherche et filtres */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Recherche */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#9A948D' }} />
                  <Input
                    type="search"
                    placeholder="Rechercher un projet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#1A1714' }}
                  />
                </div>

                {/* Boutons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    style={{ background: '#C75B39', color: '#FFFDFB', border: 'none' }}
                  >
                    <Rss className="h-4 w-4" />
                  </Button>

                  {/* Bouton filtres mobile */}
                  <Sheet open={showFilters} onOpenChange={setShowFilters}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2"
                        style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#3D3833' }}
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80" style={{ background: '#FFFDFB' }}>
                      <SheetHeader>
                        <SheetTitle style={{ color: '#1A1714' }}>Filtres</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterPanel />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              {/* Filtres actifs */}
              {(selectedStatuses.length > 0 || budgetFilters.length > 0 || searchQuery) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedStatuses.map(status => (
                    <Badge 
                      key={status}
                      variant="secondary"
                      className="gap-1 cursor-pointer"
                      onClick={() => toggleStatusFilter(status)}
                    >
                      {STATUS_FILTERS.find(f => f.id === status)?.label}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                  {budgetFilters.map(budget => (
                    <Badge 
                      key={budget}
                      variant="secondary"
                      className="gap-1 cursor-pointer"
                      onClick={() => toggleBudgetFilter(budget)}
                    >
                      {BUDGET_FILTERS.find(f => f.id === budget)?.label}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                  {searchQuery && (
                    <Badge 
                      variant="secondary"
                      className="gap-1 cursor-pointer"
                      onClick={() => setSearchQuery("")}
                    >
                      "{searchQuery}"
                      <X className="h-3 w-3" />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    style={{ color: '#C75B39' }}
                  >
                    Tout effacer
                  </Button>
                </div>
              )}

              {/* Résultats */}
              <div className="text-sm mb-4" style={{ color: '#6B6560' }}>
                {totalCount} projet{totalCount > 1 ? 's' : ''} trouvé{totalCount > 1 ? 's' : ''}
              </div>

              {/* Liste des projets */}
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                  <CardContent className="py-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4" style={{ color: '#9A948D' }} />
                    <h3 className="font-semibold mb-2" style={{ color: '#1A1714' }}>
                      Aucun projet trouvé
                    </h3>
                    <p style={{ color: '#6B6560' }}>
                      Essayez de modifier vos filtres ou votre recherche.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={clearFilters}
                      style={{ background: '#C75B39', color: '#FFFDFB' }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
