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
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CreateProject() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !budget) {
      toast.error("Champs obligatoires manquants");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('projects').insert({
        client_id: user?.id,
        title,
        description,
        category_id: categoryId ? parseInt(categoryId) : null,
        budget_min: parseFloat(budget),
        budget_max: parseFloat(budget), // Simplifié
        deadline: deadline || null,
        status: 'open'
      });

      if (error) throw error;
      toast.success("Projet publié avec succès !");
      setLocation("/dashboard/projects");
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <h1 className="text-2xl font-bold">Publier un nouveau projet</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>Titre du projet</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Ex: Recherche développeur pour site e-commerce" 
            />
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Budget estimé (FCFA)</Label>
              <Input 
                type="number" 
                value={budget} 
                onChange={(e) => setBudget(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Date limite</Label>
              <Input 
                type="date" 
                value={deadline} 
                onChange={(e) => setDeadline(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description détaillée</Label>
            <Textarea 
              rows={5} 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Décrivez vos besoins..."
            />
          </div>

          <Button className="w-full btn-benin" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publier le projet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}