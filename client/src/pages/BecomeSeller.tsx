import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function BecomeSeller() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !bio) {
      toast.error("Veuillez remplir votre profil");
      return;
    }

    setLoading(true);
    try {
      // Transformer les compétences en tableau JSON
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);

      const { error } = await supabase
        .from('users')
        .update({
          is_seller: true,
          title: title,
          bio: bio,
          skills: JSON.stringify(skillsArray) // Stockage JSON simple
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success("Félicitations ! Vous êtes maintenant vendeur.");
      // Force reload or redirect to update auth state context
      window.location.href = "/dashboard";
      
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Devenir Prestataire sur Bénin Freelance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-bold">Publiez vos services</h3>
              <p className="text-xs text-muted-foreground">Créez des offres attractives</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-bold">Recevez des commandes</h3>
              <p className="text-xs text-muted-foreground">Travaillez avec des clients locaux</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-bold">Soyez payé</h3>
              <p className="text-xs text-muted-foreground">Paiement sécurisé via Mobile Money</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Titre Professionnel</Label>
              <Input 
                placeholder="Ex: Développeur Web Fullstack, Graphiste..." 
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Bio / À propos</Label>
              <Textarea 
                placeholder="Présentez-vous, vos expériences, ce que vous savez faire..."
                rows={5}
                value={bio}
                onChange={e => setBio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Compétences (séparées par des virgules)</Label>
              <Input 
                placeholder="React, Photoshop, Rédaction, Traduction..."
                value={skills}
                onChange={e => setSkills(e.target.value)}
              />
            </div>

            <Button className="w-full btn-benin" size="lg" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Activer mon compte vendeur
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}