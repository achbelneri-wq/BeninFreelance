import { Link } from "wouter";
// SUPPRIMÉ: import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase"; // AJOUT
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState, useEffect } from "react";

export default function Favorites() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // On récupère le favori ET les détails du service associé (et le vendeur du service)
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            id,
            service:services (
              *,
              category:categories(*),
              user:users(*)
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        setFavorites(data || []);
      } catch (error) {
        console.error("Erreur chargement favoris:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [isAuthenticated, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-heading text-xl font-semibold mb-2">Connexion requise</h2>
            <p className="text-muted-foreground mb-4">
              Connectez-vous pour voir vos favoris.
            </p>
            <a href={getLoginUrl()}>
              <Button className="btn-benin">Se connecter</Button>
            </a>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container py-8">
          <h1 className="font-heading text-3xl font-bold mb-8">Mes Favoris</h1>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : favorites && favorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((fav: any) => (
                // Note: fav.service contient les détails grâce à la jointure Supabase
                <ServiceCard 
                  key={fav.id} 
                  service={fav.service} 
                  isFavorited={true}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-heading font-semibold text-lg mb-2">
                Aucun favori
              </h3>
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore ajouté de services à vos favoris.
              </p>
              <Link href="/services">
                <Button className="btn-benin">Explorer les services</Button>
              </Link>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}