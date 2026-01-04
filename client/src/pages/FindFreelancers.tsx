import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FreelancerCard from "@/components/FreelancerCard";
import SparkleIcon from "@/components/SparkleIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Filter,
  MapPin,
  Star,
  SlidersHorizontal,
  X,
  ChevronDown,
  Users,
  Grid3X3,
  List,
  RefreshCw,
} from "lucide-react";

// Compétences populaires
const POPULAR_SKILLS = [
  "React", "Node.js", "WordPress", "PHP", "Python",
  "Design UI/UX", "Logo", "SEO", "Rédaction", "Mobile",
  "E-commerce", "Laravel", "Vue.js", "Figma", "Marketing",
];

// Villes béninoises
const BENIN_CITIES = [
  "Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi",
  "Djougou", "Bohicon", "Natitingou", "Lokossa", "Ouidah",
];

// Options de tri
const SORT_OPTIONS = [
  { value: "relevance", label: "Pertinence" },
  { value: "rating", label: "Meilleure note" },
  { value: "reviews", label: "Plus d'avis" },
  { value: "projects", label: "Plus de projets" },
  { value: "price_low", label: "Tarif croissant" },
  { value: "price_high", label: "Tarif décroissant" },
  { value: "recent", label: "Plus récent" },
];

function FreelancerSkeleton() {
  return (
    <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
        <div className="flex justify-between mt-4 pt-4 border-t" style={{ borderColor: '#E8E2D9' }}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function FindFreelancers() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);

  // États
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filtres
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    searchParams.get("skills")?.split(",").filter(Boolean) || []
  );
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [minRating, setMinRating] = useState(Number(searchParams.get("rating")) || 0);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get("min_price")) || 0,
    Number(searchParams.get("max_price")) || 100000,
  ]);
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verified") === "true");
  const [availableOnly, setAvailableOnly] = useState(searchParams.get("available") === "true");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "relevance");

  // Favoris
  const [favorites, setFavorites] = useState<number[]>([]);

  const ITEMS_PER_PAGE = 12;

  // Charger les freelances
  const loadFreelancers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("users")
        .select("*", { count: "exact" })
        .eq("is_seller", true)
        .eq("is_active", true);

      // Filtres
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%,headline.ilike.%${searchQuery}%`);
      }

      if (selectedSkills.length > 0) {
        query = query.overlaps("skills", selectedSkills);
      }

      if (selectedCity) {
        query = query.eq("city", selectedCity);
      }

      if (minRating > 0) {
        query = query.gte("rating", minRating);
      }

      if (priceRange[0] > 0) {
        query = query.gte("hourly_rate", priceRange[0]);
      }

      if (priceRange[1] < 100000) {
        query = query.lte("hourly_rate", priceRange[1]);
      }

      if (verifiedOnly) {
        query = query.eq("kyc_status", "verified");
      }

      // Tri
      switch (sortBy) {
        case "rating":
          query = query.order("rating", { ascending: false });
          break;
        case "reviews":
          query = query.order("total_reviews", { ascending: false });
          break;
        case "projects":
          query = query.order("completed_orders", { ascending: false });
          break;
        case "price_low":
          query = query.order("hourly_rate", { ascending: true, nullsFirst: false });
          break;
        case "price_high":
          query = query.order("hourly_rate", { ascending: false });
          break;
        case "recent":
          query = query.order("created_at", { ascending: false });
          break;
        default:
          query = query.order("rating", { ascending: false }).order("completed_orders", { ascending: false });
      }

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setFreelancers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Erreur chargement freelances:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSkills, selectedCity, minRating, priceRange, verifiedOnly, sortBy, page]);

  useEffect(() => {
    loadFreelancers();
  }, [loadFreelancers]);

  // Charger les favoris
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("favorites")
        .select("favorited_id")
        .eq("user_id", user.id)
        .eq("type", "user");

      if (data) {
        setFavorites(data.map(f => f.favorited_id));
      }
    };

    loadFavorites();
  }, [user]);

  const handleFavorite = async (freelancerId: number) => {
    if (!user) {
      setLocation("/login");
      return;
    }

    const isFavorite = favorites.includes(freelancerId);

    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("favorited_id", freelancerId)
        .eq("type", "user");
      
      setFavorites(favorites.filter(id => id !== freelancerId));
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: user.id, favorited_id: freelancerId, type: "user" });
      
      setFavorites([...favorites, freelancerId]);
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSkills([]);
    setSelectedCity("");
    setMinRating(0);
    setPriceRange([0, 100000]);
    setVerifiedOnly(false);
    setAvailableOnly(false);
    setSortBy("relevance");
    setPage(1);
  };

  const hasActiveFilters = searchQuery || selectedSkills.length > 0 || selectedCity || 
    minRating > 0 || priceRange[0] > 0 || priceRange[1] < 100000 || verifiedOnly || availableOnly;

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Composant filtres (réutilisé pour desktop et mobile)
  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Compétences */}
      <div>
        <Label className="text-sm font-semibold mb-3 block" style={{ color: '#1A1714' }}>
          Compétences
        </Label>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SKILLS.map((skill) => (
            <Badge
              key={skill}
              variant={selectedSkills.includes(skill) ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              style={selectedSkills.includes(skill) 
                ? { background: '#C75B39', color: '#FFFDFB' }
                : { borderColor: '#E8E2D9', color: '#6B6560' }
              }
              onClick={() => toggleSkill(skill)}
            >
              {skill}
              {selectedSkills.includes(skill) && (
                <X className="h-3 w-3 ml-1" />
              )}
            </Badge>
          ))}
        </div>
      </div>

      {/* Ville */}
      <div>
        <Label className="text-sm font-semibold mb-3 block" style={{ color: '#1A1714' }}>
          Ville
        </Label>
        <Select value={selectedCity || "all"} onValueChange={(v) => { setSelectedCity(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger style={{ borderColor: '#E8E2D9' }}>
            <SelectValue placeholder="Toutes les villes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les villes</SelectItem>
            {BENIN_CITIES.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Note minimum */}
      <div>
        <Label className="text-sm font-semibold mb-3 block" style={{ color: '#1A1714' }}>
          Note minimum
        </Label>
        <div className="flex items-center gap-2">
          {[0, 3, 3.5, 4, 4.5].map((rating) => (
            <Button
              key={rating}
              variant={minRating === rating ? "default" : "outline"}
              size="sm"
              className="gap-1"
              style={minRating === rating 
                ? { background: '#C75B39', color: '#FFFDFB' }
                : { borderColor: '#E8E2D9', color: '#6B6560' }
              }
              onClick={() => { setMinRating(rating); setPage(1); }}
            >
              {rating === 0 ? "Tous" : (
                <>
                  <Star className="h-3 w-3 fill-current" />
                  {rating}+
                </>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Tarif horaire */}
      <div>
        <Label className="text-sm font-semibold mb-3 block" style={{ color: '#1A1714' }}>
          Tarif horaire (FCFA)
        </Label>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(v) => { setPriceRange(v as [number, number]); setPage(1); }}
            min={0}
            max={100000}
            step={5000}
            className="mb-2"
          />
          <div className="flex justify-between text-sm" style={{ color: '#6B6560' }}>
            <span>{priceRange[0].toLocaleString()} FCFA</span>
            <span>{priceRange[1].toLocaleString()} FCFA</span>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="verified"
            checked={verifiedOnly}
            onCheckedChange={(v) => { setVerifiedOnly(v as boolean); setPage(1); }}
          />
          <Label htmlFor="verified" className="text-sm cursor-pointer" style={{ color: '#3D3833' }}>
            Freelances vérifiés uniquement
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="available"
            checked={availableOnly}
            onCheckedChange={(v) => { setAvailableOnly(v as boolean); setPage(1); }}
          />
          <Label htmlFor="available" className="text-sm cursor-pointer" style={{ color: '#3D3833' }}>
            Disponibles maintenant
          </Label>
        </div>
      </div>

      {/* Bouton reset */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full gap-2"
          style={{ borderColor: '#E8E2D9', color: '#6B6560' }}
          onClick={clearFilters}
        >
          <RefreshCw className="h-4 w-4" />
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF7F2' }}>
      <Navbar />

      {/* Header */}
      <div className="py-8 relative overflow-hidden" style={{ background: '#C75B39' }}>
        <div className="absolute top-2 right-8 opacity-30">
          <SparkleIcon variant="default" size="lg" bgColor="transparent" color="#FFFDFB" />
        </div>
        <div className="absolute bottom-2 right-32 opacity-20">
          <SparkleIcon variant="star" size="md" bgColor="transparent" color="#FFFDFB" />
        </div>
        <div className="container relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <SparkleIcon variant="default" size="lg" />
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                Trouver un freelance
              </h1>
              <p className="text-white/80">
                {totalCount.toLocaleString()} talents béninois disponibles
              </p>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#9A948D' }} />
              <Input
                type="search"
                placeholder="Rechercher par nom, compétence, mot-clé..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-12 pr-4 py-6 text-lg"
                style={{ background: '#FFFDFB', border: 'none' }}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Sidebar filtres - Desktop */}
            <aside className="hidden lg:block lg:w-72 shrink-0">
              <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1A1714' }}>
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtres
                  </h3>
                  <FiltersContent />
                </CardContent>
              </Card>
            </aside>

            {/* Contenu principal */}
            <div className="flex-1">
              {/* Barre d'actions */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  {/* Filtres mobile */}
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        className="lg:hidden gap-2"
                        style={{ borderColor: '#E8E2D9', color: '#3D3833' }}
                      >
                        <Filter className="h-4 w-4" />
                        Filtres
                        {hasActiveFilters && (
                          <Badge className="ml-1" style={{ background: '#C75B39', color: '#FFFDFB' }}>
                            {selectedSkills.length + (selectedCity ? 1 : 0) + (verifiedOnly ? 1 : 0)}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <SheetHeader>
                        <SheetTitle>Filtres</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FiltersContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Tri */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48" style={{ borderColor: '#E8E2D9' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Résultats */}
                  <span className="text-sm hidden sm:inline" style={{ color: '#6B6560' }}>
                    {totalCount} résultat{totalCount > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Vue */}
                <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: '#E8E2D9' }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" style={{ color: viewMode === 'grid' ? '#C75B39' : '#6B6560' }} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" style={{ color: viewMode === 'list' ? '#C75B39' : '#6B6560' }} />
                  </Button>
                </div>
              </div>

              {/* Filtres actifs */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1" style={{ background: '#E8E2D9', color: '#3D3833' }}>
                      "{searchQuery}"
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                    </Badge>
                  )}
                  {selectedSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1" style={{ background: '#E8E2D9', color: '#3D3833' }}>
                      {skill}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => toggleSkill(skill)} />
                    </Badge>
                  ))}
                  {selectedCity && (
                    <Badge variant="secondary" className="gap-1" style={{ background: '#E8E2D9', color: '#3D3833' }}>
                      <MapPin className="h-3 w-3" />
                      {selectedCity}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCity("")} />
                    </Badge>
                  )}
                  {minRating > 0 && (
                    <Badge variant="secondary" className="gap-1" style={{ background: '#E8E2D9', color: '#3D3833' }}>
                      <Star className="h-3 w-3" />
                      {minRating}+
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setMinRating(0)} />
                    </Badge>
                  )}
                  {verifiedOnly && (
                    <Badge variant="secondary" className="gap-1" style={{ background: '#E8E2D9', color: '#3D3833' }}>
                      Vérifiés
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setVerifiedOnly(false)} />
                    </Badge>
                  )}
                </div>
              )}

              {/* Liste des freelances */}
              {loading ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : ''}`}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <FreelancerSkeleton key={i} />
                  ))}
                </div>
              ) : freelancers.length === 0 ? (
                <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                  <CardContent className="py-16 text-center">
                    <Users className="h-16 w-16 mx-auto mb-4" style={{ color: '#E8E2D9' }} />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1714' }}>
                      Aucun freelance trouvé
                    </h3>
                    <p className="mb-4" style={{ color: '#6B6560' }}>
                      Essayez de modifier vos critères de recherche
                    </p>
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      style={{ borderColor: '#C75B39', color: '#C75B39' }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : ''}`}>
                    {freelancers.map((freelancer) => (
                      <FreelancerCard
                        key={freelancer.id}
                        freelancer={{
                          ...freelancer,
                          is_verified: freelancer.kyc_status === 'verified',
                          is_online: Math.random() > 0.5, // Simulé pour démo
                        }}
                        variant={viewMode === 'list' ? 'compact' : 'default'}
                        onFavorite={handleFavorite}
                        isFavorite={favorites.includes(freelancer.id)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        style={{ borderColor: '#E8E2D9', color: '#3D3833' }}
                      >
                        Précédent
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              size="icon"
                              onClick={() => setPage(pageNum)}
                              style={page === pageNum 
                                ? { background: '#C75B39', color: '#FFFDFB' }
                                : { borderColor: '#E8E2D9', color: '#3D3833' }
                              }
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        style={{ borderColor: '#E8E2D9', color: '#3D3833' }}
                      >
                        Suivant
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
