import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function CreateService() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { id } = useParams(); // Si id présent = mode édition
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [coverImage, setCoverImage] = useState("");

  useEffect(() => {
    // Charger catégories
    supabase.from('categories').select('*').then(({ data }) => {
      if (data) setCategories(data);
    });

    // Si mode édition, charger le service
    if (id) {
      supabase.from('services').select('*').eq('id', id).single()
        .then(({ data, error }) => {
          if (data) {
            setTitle(data.title);
            setDescription(data.description);
            setCategoryId(data.category_id?.toString() || "");
            setPrice(data.price?.toString() || "");
            setDeliveryTime(data.delivery_time?.toString() || "");
            setCoverImage(data.cover_image || "");
          }
        });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !price || !categoryId) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        user_id: user?.id,
        title,
        description,
        category_id: parseInt(categoryId),
        price: parseFloat(price),
        delivery_time: parseInt(deliveryTime) || 3,
        cover_image: coverImage,
        status: 'active'
      };

      let error;
      if (id) {
        // Update
        const { error: updateError } = await supabase
          .from('services')
          .update(payload)
          .eq('id', id);
        error = updateError;
      } else {
        // Create
        const { error: insertError } = await supabase
          .from('services')
          .insert(payload);
        error = insertError;
      }

      if (error) throw error;
      toast.success(id ? "Service modifié !" : "Service créé avec succès !");
      setLocation("/dashboard/services");

    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <h1 className="text-2xl font-bold">{id ? "Modifier le service" : "Nouveau Service"}</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Titre du service</Label>
              <Input 
                placeholder="Je vais créer votre site web..." 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Délai de livraison (jours)</Label>
                <Input 
                  type="number" 
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prix (FCFA)</Label>
              <Input 
                type="number" 
                placeholder="Ex: 50000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description complète</Label>
              <Textarea 
                rows={6}
                placeholder="Détaillez ce que vous offrez..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Image de couverture (URL)</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="https://..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">Pour l'instant, veuillez utiliser une URL d'image externe.</p>
            </div>

            <Button className="w-full btn-benin" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {id ? "Enregistrer les modifications" : "Publier le service"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}