import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
// SUPPRIMÉ: import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase"; // AJOUT
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  Filter,
  Briefcase,
  Clock,
  Calendar,
  Heart,
  Bookmark,
  Users,
  Plus
} from "lucide-react";
import { toast } from "sonner";

export default function PublicProjects() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBudget, setSelectedBudget] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // État local pour les données Supabase
  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Charger les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // 2. Charger les projets avec filtres
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('projects')
          .select('*, categories(*)') // Join category if needed
          .eq('status', 'open'); // Seulement les projets ouverts

        // Filtre Recherche
        if (searchQuery) {
          query = query.ilike('title', `%${searchQuery}%`);
        }

        // Filtre Catégorie
        if (selectedCategory !== "all") {
          query = query.eq('category_id', parseInt(selectedCategory));
        }

        // Filtre Budget (Approximation)
        if (selectedBudget !== "all") {
          const [min, max] = selectedBudget.split('-');
          if (max && max !== '+') {
            query = query.gte('budget_min', min).lte('budget_min', max);
          } else if (selectedBudget === '500000+') {
            query = query.gte('budget_min', 500000);
          } else {
            query = query.lte('budget_min', 50000);
          }
        }

        // Tri
        switch (sortBy) {
          case 'budget_high':
            query = query.order('budget_min', { ascending: false });
            break;
          case 'budget_low':
            query = query.order('budget_min', { ascending: true });
            break;
          case 'deadline':
            query = query.order('deadline', { ascending: true });
            break;
          case 'popular':
            query = query.order('application_count', { ascending: false });
            break;
          case 'newest':
          default:
            query = query.order('created_at', { ascending: false });
            break;
        }

        const { data, error } = await query;
        if (error) throw error;
        setProjects(data || []);

      } catch (error) {
        console.error("Erreur chargement projets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      fetchProjects();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedBudget, sortBy]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const budgetRanges = [
    { value: "all", label: "Tous les budgets" },
    { value: "0-50000", label: "Moins de 50 000 XOF" },
    { value: "50000-200000", label: "50 000 - 200 000 XOF" },
    { value: "200000-500000", label: "200 000 - 500 000 XOF" },
    { value: "500000+", label: "Plus de 500 000 XOF" },
  ];

  const getBudgetDisplay = (min?: string | null, max?: string | null) => {
    if (!min && !max) return "Budget à négocier";
    // Conversion sûre en nombre
    const minVal = min ? parseInt(String(min)) : 0;
    const maxVal = max ? parseInt(String(max)) : 0;

    if (minVal && maxVal) return `${minVal.toLocaleString()} - ${maxVal.toLocaleString()} XOF`;
    if (minVal) return `À partir de ${minVal.toLocaleString()} XOF`;
    if (maxVal) return `Jusqu'à ${maxVal.toLocaleString()} XOF`;
    return "Budget à négocier";
  };

  const getExperienceBadge = (level?: string | null) => {
    switch (level) {
      case "entry":
        return { label: "Débutant", bgColor: 'rgba(92, 107, 74, 0.1)', color: '#5C6B4A' };
      case "intermediate":
        return { label: "Intermédiaire", bgColor: 'rgba(199, 91, 57, 0.1)', color: '#C75B39' };
      case "expert":
        return { label: "Expert", bgColor: 'rgba(139, 69, 19, 0.1)', color: '#8B4513' };
      default:
        return { label: "Tous niveaux", bgColor: '#E8E2D9', color: '#6B6560' };
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF7F2' }}>
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden" style={{ background: 'linear-gradient(135deg, #FAF7F2 0%, #E8E2D9 100%)' }}>
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'rgba(199, 91, 57, 0.08)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-[80px]" style={{ background: 'rgba(92, 107, 74, 0.06)' }} />
          </div>
          
          <div className="container relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm mb-6" style={{ background: 'rgba(199, 91, 57, 0.08)', border: '1px solid rgba(199, 91, 57, 0.15)' }}>
                <Briefcase className="w-4 h-4" style={{ color: '#C75B39' }} />
                <span className="text-sm font-medium" style={{ color: '#C75B39' }}>Projets disponibles</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714', letterSpacing: '-0.02em' }}>
                Trouvez votre prochain{" "}
                <span style={{ color: '#C75B39', fontStyle: 'italic' }}>
                  projet
                </span>
              </h1>
              
              <p className="text-lg mb-8" style={{ color: '#6B6560' }}>
                Des centaines de projets vous attendent. Postulez et collaborez avec des clients du Bénin.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                <div className="flex items-center rounded-sm p-2" style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#9A948D' }} />
                    <Input
                      type="search"
                      placeholder="Rechercher un projet..."
                      className="pl-12 h-12 border-0"
                      style={{ background: 'transparent', color: '#1A1714' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="h-10 px-6 rounded-sm"
                    style={{ background: '#C75B39', color: '#FFFDFB' }}
                  >
                    Rechercher
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </section>

        {/* Filters & Projects */}
        <section className="py-12">
          <div className="container">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Filters */}
              <aside className="lg:w-64 shrink-0">
                <Card className="p-6 sticky top-24" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                  <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1A1714' }}>
                    <Filter className="w-4 h-4" style={{ color: '#C75B39' }} />
                    Filtres
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Category Filter */}
                    <div>
                      <label className="text-sm mb-2 block" style={{ color: '#6B6560' }}>Catégorie</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#3D3833' }}>
                          <SelectValue placeholder="Toutes les catégories" />
                        </SelectTrigger>
                        <SelectContent style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                          <SelectItem value="all" style={{ color: '#3D3833' }}>Toutes les catégories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()} style={{ color: '#3D3833' }}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Budget Filter */}
                    <div>
                      <label className="text-sm mb-2 block" style={{ color: '#6B6560' }}>Budget</label>
                      <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                        <SelectTrigger style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#3D3833' }}>
                          <SelectValue placeholder="Tous les budgets" />
                        </SelectTrigger>
                        <SelectContent style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                          {budgetRanges.map((range) => (
                            <SelectItem key={range.value} value={range.value} style={{ color: '#3D3833' }}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="text-sm mb-2 block" style={{ color: '#6B6560' }}>Trier par</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#3D3833' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                          <SelectItem value="newest" style={{ color: '#3D3833' }}>Plus récents</SelectItem>
                          <SelectItem value="budget_high" style={{ color: '#3D3833' }}>Budget élevé</SelectItem>
                          <SelectItem value="budget_low" style={{ color: '#3D3833' }}>Budget bas</SelectItem>
                          <SelectItem value="deadline" style={{ color: '#3D3833' }}>Date limite</SelectItem>
                          <SelectItem value="popular" style={{ color: '#3D3833' }}>Populaires</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Post Project CTA */}
                  {isAuthenticated && user?.userType === "client" && (
                    <div className="mt-8 pt-6" style={{ borderTop: '1px solid #E8E2D9' }}>
                      <Link href="/dashboard/projects/new">
                        <Button className="w-full" style={{ background: '#C75B39', color: '#FFFDFB' }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Publier un projet
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card>
              </aside>

              {/* Projects List */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <p style={{ color: '#6B6560' }}>
                    <span className="font-medium" style={{ color: '#1A1714' }}>{projects.length}</span> projets trouvés
                  </p>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-6 animate-pulse" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
                        <div className="h-6 rounded w-3/4 mb-4" style={{ background: '#E8E2D9' }} />
                        <div className="h-4 rounded w-full mb-2" style={{ background: '#E8E2D9' }} />
                        <div className="h-4 rounded w-2/3" style={{ background: '#E8E2D9' }} />
                      </Card>
                    ))}
                  </div>
                ) : projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.map((project, index) => {
                      const expBadge = getExperienceBadge(project.experienceLevel);
                      return (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <Link href={`/projects/${project.id}`}>
                            <Card className="p-6 transition-all cursor-pointer group" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className="rounded-sm" style={{ background: expBadge.bgColor, color: expBadge.color, border: 'none' }}>
                                      {expBadge.label}
                                    </Badge>
                                    {project.budget_type === "fixed" && (
                                      <Badge className="rounded-sm" style={{ background: 'rgba(92, 107, 74, 0.1)', color: '#5C6B4A', border: 'none' }}>
                                        Prix fixe
                                      </Badge>
                                    )}
                                  </div>
                                  <h3 className="text-xl font-semibold transition-colors" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                                    {project.title}
                                  </h3>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold" style={{ color: '#5C6B4A' }}>
                                    {getBudgetDisplay(project.budget_min, project.budget_max)}
                                  </div>
                                  <div className="text-sm" style={{ color: '#9A948D' }}>{project.budget_type === "hourly" ? "/heure" : ""}</div>
                                </div>
                              </div>

                              <p className="mb-4 line-clamp-2" style={{ color: '#6B6560' }}>
                                {project.description}
                              </p>

                              {/* Skills */}
                              {project.skills && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {/* Gestion sécurisée du JSON skills */}
                                  {(typeof project.skills === 'string' ? JSON.parse(project.skills) : project.skills)
                                    .slice(0, 5).map((skill: string, i: number) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 text-xs rounded-sm"
                                      style={{ background: '#E8E2D9', color: '#6B6560' }}
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #E8E2D9' }}>
                                <div className="flex items-center gap-4 text-sm" style={{ color: '#9A948D' }}>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {project.created_at && formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: fr })}
                                  </span>
                                  {project.deadline && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      Deadline: {format(new Date(project.deadline), "dd MMM yyyy", { locale: fr })}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {project.application_count || 0} candidatures
                                  </span>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="p-12 text-center" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <Briefcase className="w-16 h-16 mx-auto mb-4" style={{ color: '#E8E2D9' }} />
                    <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>Aucun projet disponible</h3>
                    <p className="mb-6" style={{ color: '#6B6560' }}>
                      Soyez le premier à publier un projet et trouvez des freelances talentueux !
                    </p>
                    {isAuthenticated && user?.userType === "client" && (
                      <Link href="/dashboard/projects/new">
                        <Button style={{ background: '#C75B39', color: '#FFFDFB' }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Publier un projet
                        </Button>
                      </Link>
                    )}
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}