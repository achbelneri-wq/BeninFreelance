import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Clock,
  Loader2,
  Camera,
  Save,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function DashboardSettings() {
  // ✅ CORRECTION: Récupérer loading depuis useAuth et le renommer
  const { user, profile, loading: authLoading } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    phone: "",
    city: "",
    skills: "",
    languages: "",
    responseTime: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        city: profile.city || "",
        skills: profile.skills || "",
        languages: profile.languages || "",
        responseTime: profile.response_time || "",
      });
    }
  }, [profile]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Le fichier doit être une image (JPG, PNG, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop grande (maximum 5MB)");
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${profile.auth_id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      
      toast.success("Photo de profil mise à jour !");
      setTimeout(() => window.location.reload(), 1000);

    } catch (error: any) {
      console.error('❌ Upload error:', error);
      setPreview(null);

      if (error.message?.includes('new row violates row-level security')) {
        toast.error("Erreur de permissions. Vérifiez la configuration Supabase Storage.");
      } else if (error.message?.includes('Bucket not found')) {
        toast.error("Le bucket 'avatars' n'existe pas. Créez-le dans Supabase Dashboard.");
      } else {
        toast.error(error.message || "Erreur lors de l'upload de la photo");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) { 
      toast.error("Profil non chargé"); 
      return; 
    }

    setIsLoading(true);
    try {
      const updates = {
        name: formData.name,
        bio: formData.bio,
        phone: formData.phone,
        city: formData.city,
        skills: formData.skills,
        languages: formData.languages,
        response_time: formData.responseTime,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;
      toast.success("Profil mis à jour avec succès !");
      setTimeout(() => window.location.reload(), 1000);

    } catch (error: any) {
      console.error('❌ Update error:', error);
      toast.error(error.message || "Erreur lors de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const displayAvatar = preview || profile?.avatar_url;

  // ✅ CORRECTION LIGNE 181: Utiliser authLoading au lieu de loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et préférences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Photo de profil</CardTitle>
            <CardDescription>
              Votre photo sera visible par les autres utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-background">
                  <AvatarImage 
                    src={displayAvatar} 
                    className="object-cover"
                    alt="Photo de profil"
                  />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {formData.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Changer la photo"
                >
                  <Camera className="h-4 w-4" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </div>

              <div className="flex-1">
                <h3 className="font-medium mb-1">Changer la photo</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  JPG, PNG ou GIF. Maximum 5MB.
                </p>

                {preview && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    ✓ Nouvelle photo sélectionnée
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations personnelles</CardTitle>
            <CardDescription>
              Ces informations seront affichées sur votre profil public
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Votre nom"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={user?.email || ""}
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  L'email ne peut pas être modifié
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+229 97 00 00 00"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="city"
                    placeholder="Cotonou"
                    className="pl-10"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Parlez de vous en quelques mots..."
                rows={4}
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/500 caractères
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ✅ CORRECTION: Utiliser profile.is_seller au lieu de profile.isSeller */}
        {(profile?.is_seller) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations professionnelles</CardTitle>
              <CardDescription>
                Ces informations aident les clients à mieux vous connaître
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skills">Compétences</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="skills"
                    placeholder="Ex: Développement web, Design graphique, Rédaction..."
                    className="pl-10 min-h-[80px]"
                    value={formData.skills}
                    onChange={(e) => handleChange('skills', e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Séparez vos compétences par des virgules
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="languages">Langues</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="languages"
                      placeholder="Français, Anglais..."
                      className="pl-10"
                      value={formData.languages}
                      onChange={(e) => handleChange('languages', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responseTime">Temps de réponse</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="responseTime"
                      placeholder="Ex: 1 heure"
                      className="pl-10"
                      value={formData.responseTime}
                      onChange={(e) => handleChange('responseTime', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compte</CardTitle>
            <CardDescription>
              Informations sur votre compte BeninFreelance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Type de compte</p>
                <p className="text-sm text-muted-foreground">
                  {/* ✅ CORRECTION: is_seller au lieu de isSeller */}
                  {(profile?.is_seller) ? "Freelance" : "Client"}
                </p>
              </div>
              {/* ✅ CORRECTION: is_seller au lieu de isSeller */}
              {!(profile?.is_seller) && (
                <Button variant="outline" asChild>
                  <a href="/become-seller">Devenir freelance</a>
                </Button>
              )}
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Membre depuis</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.created_at 
                    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })
                    : "-"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="btn-benin gap-2" 
            disabled={isLoading || isUploading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
