import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import SparkleIcon from "@/components/SparkleIcon";
import {
  User,
  Briefcase,
  Building2,
  Loader2,
  Save,
  ArrowLeft,
  X,
  Plus,
  Link as LinkIcon,
  Camera,
  Euro,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getLoginUrl } from "@/const";

// Liste des spécialités disponibles
const SPECIALTIES = [
  "Développeur full-stack",
  "Développeur front-end",
  "Développeur back-end",
  "Designer UI/UX",
  "Designer graphique",
  "Rédacteur web",
  "Community manager",
  "Expert SEO",
  "Développeur mobile",
  "Chef de projet",
  "Consultant marketing",
  "Traducteur",
  "Monteur vidéo",
  "Photographe",
  "Illustrateur",
  "Data analyst",
  "Expert WordPress",
  "Expert e-commerce",
];

// Suggestions de compétences populaires
const SKILL_SUGGESTIONS = [
  "API", "Full-stack", "React", "Landing page", "Web design",
  "Node.js", "Python", "JavaScript", "TypeScript", "PHP",
  "WordPress", "Figma", "Photoshop", "SEO", "Marketing digital",
  "Mobile", "iOS", "Android", "Flutter", "React Native",
  "E-commerce", "Shopify", "WooCommerce", "UI/UX", "Branding",
];

export default function FreelanceProfile() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [specialties, setSpecialties] = useState<string[]>(SPECIALTIES);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    accountType: "freelance" as "freelance" | "agence",
    skills: [] as string[],
    specialty: "",
    hourlyRate: "",
    avatar: "",
    coverBanner: "",
    bio: "",
    presentation: "",
    showFullName: true,
    name: "",
    city: "",
    phone: "",
  });

  // Charger les données initiales
  useEffect(() => {
    if (user) {
      // Parser les skills
      let skillsArray: string[] = [];
      if (typeof user.skills === 'string') {
        try { skillsArray = JSON.parse(user.skills); } catch (e) { skillsArray = user.skills.split(',').map((s: string) => s.trim()); }
      } else if (Array.isArray(user.skills)) {
        skillsArray = user.skills;
      }

      setFormData({
        accountType: (user as any).user_account_type || "freelance",
        skills: skillsArray,
        specialty: (user as any).specialty || "",
        hourlyRate: (user as any).hourly_rate?.toString() || "",
        avatar: user.avatar || (user as any).avatar_url || "",
        coverBanner: (user as any).cover_banner || "",
        bio: user.bio || "",
        presentation: (user as any).presentation || "",
        showFullName: (user as any).show_full_name !== false,
        name: user.name || (user as any).full_name || "",
        city: user.city || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Ajouter une compétence
  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !formData.skills.includes(trimmedSkill) && formData.skills.length < 10) {
      setFormData({ ...formData, skills: [...formData.skills, trimmedSkill] });
      setNewSkill("");
    }
  };

  // Supprimer une compétence
  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  // Gérer l'upload d'image (simulation - en production utiliser Supabase Storage)
  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    try {
      // Pour la production, utiliser Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (type === 'avatar') {
        setFormData({ ...formData, avatar: publicUrl });
      } else {
        setFormData({ ...formData, coverBanner: publicUrl });
      }

      toast.success("Image téléchargée avec succès");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erreur lors du téléchargement de l'image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.skills.length === 0) {
      toast.error("Veuillez ajouter au moins une compétence");
      return;
    }

    if (!formData.specialty) {
      toast.error("Veuillez sélectionner votre spécialité");
      return;
    }

    if (!formData.bio || formData.bio.length < 50) {
      toast.error("Votre bio doit contenir au moins 50 caractères");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          bio: formData.bio,
          phone: formData.phone,
          city: formData.city,
          avatar: formData.avatar,
          skills: formData.skills,
          user_account_type: formData.accountType,
          specialty: formData.specialty,
          hourly_rate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
          cover_banner: formData.coverBanner,
          presentation: formData.presentation,
          show_full_name: formData.showFullName,
          is_seller: true,
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Mettre à jour les compétences dans la table freelance_skills
      // D'abord supprimer les anciennes
      await supabase
        .from('freelance_skills')
        .delete()
        .eq('user_id', user?.id);

      // Puis insérer les nouvelles
      if (formData.skills.length > 0) {
        const skillsToInsert = formData.skills.map((skill, index) => ({
          user_id: user?.id,
          skill_name: skill,
          is_primary: index === 0,
        }));

        await supabase
          .from('freelance_skills')
          .insert(skillsToInsert);
      }

      toast.success("Profil mis à jour avec succès !");
      setTimeout(() => {
        setLocation(`/profile/${user?.id}`);
      }, 1000);
      
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  // État de chargement initial
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#FAF7F2' }}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#C75B39' }} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#FAF7F2' }}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md" style={{ background: '#FFFDFB' }}>
            <User className="h-12 w-12 mx-auto mb-4" style={{ color: '#9A948D' }} />
            <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
              Connexion requise
            </h2>
            <p className="mb-4" style={{ color: '#6B6560' }}>
              Connectez-vous pour modifier votre profil freelance.
            </p>
            <a href={getLoginUrl()}>
              <Button style={{ background: '#C75B39', color: '#FFFDFB' }}>Se connecter</Button>
            </a>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF7F2' }}>
      <Navbar />

      {/* Header terracotta avec icônes sparkle */}
      <div className="py-6 relative overflow-hidden" style={{ background: '#C75B39' }}>
        {/* Icônes décoratives */}
        <div className="absolute top-2 right-8 opacity-30">
          <SparkleIcon variant="plus" size="lg" bgColor="transparent" color="#FFFDFB" />
        </div>
        <div className="absolute bottom-1 right-32 opacity-20">
          <SparkleIcon variant="diamond" size="md" bgColor="transparent" color="#FFFDFB" />
        </div>
        <div className="container relative z-10">
          <div className="flex items-center gap-4">
            <SparkleIcon variant="default" size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                Modifier mon profil
              </h1>
              <p className="text-white/80 text-sm">Personnalisez votre profil freelance</p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="container py-8">
          <Link href={`/profile/${user?.id}`}>
            <Button variant="ghost" size="sm" className="mb-6 gap-2" style={{ color: '#6B6560' }}>
              <ArrowLeft className="h-4 w-4" />
              Retour au profil
            </Button>
          </Link>

          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Type de compte: Freelance / Agence */}
              <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      onClick={() => setFormData({ ...formData, accountType: "freelance" })}
                      className={`flex-1 gap-2 py-6 ${formData.accountType === 'freelance' ? '' : 'bg-transparent border'}`}
                      style={formData.accountType === 'freelance' 
                        ? { background: '#C75B39', color: '#FFFDFB' }
                        : { background: 'transparent', color: '#6B6560', borderColor: '#E8E2D9' }
                      }
                    >
                      {formData.accountType === 'freelance' && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <User className="h-4 w-4" />
                      Freelance
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setFormData({ ...formData, accountType: "agence" })}
                      className={`flex-1 gap-2 py-6 ${formData.accountType === 'agence' ? '' : 'bg-transparent border'}`}
                      style={formData.accountType === 'agence' 
                        ? { background: '#C75B39', color: '#FFFDFB' }
                        : { background: 'transparent', color: '#6B6560', borderColor: '#E8E2D9' }
                      }
                    >
                      {formData.accountType === 'agence' && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <Building2 className="h-4 w-4" />
                      Agence
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Vos compétences */}
              <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                <CardHeader>
                  <CardTitle style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                    Vos compétences
                  </CardTitle>
                  <CardDescription style={{ color: '#6B6560' }}>
                    <span className="font-medium" style={{ color: '#3D3833' }}>Vos domaines de compétences</span>
                    <span className="text-sm ml-1" style={{ color: '#C75B39' }}>(obligatoire)</span>
                    <br />
                    Ces compétences seront affichées sur votre profil public. De plus, vous recevrez par email une alerte pour chaque nouveau projet publié dans ces compétences.{" "}
                    <Link href="/settings/alerts" className="underline" style={{ color: '#C75B39' }}>
                      Gérer vos alertes ici
                    </Link>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tags de compétences */}
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <Badge
                        key={skill}
                        className="px-3 py-2 gap-2 text-sm cursor-pointer hover:opacity-80"
                        style={{ background: '#C75B39', color: '#FFFDFB' }}
                        onClick={() => removeSkill(skill)}
                      >
                        {skill}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>

                  {/* Input pour ajouter */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ajouter une compétence..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill(newSkill);
                        }
                      }}
                      style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#1A1714' }}
                    />
                    <Button
                      type="button"
                      onClick={() => addSkill(newSkill)}
                      style={{ background: '#E8E2D9', color: '#3D3833' }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Suggestions */}
                  <div className="flex flex-wrap gap-2">
                    {SKILL_SUGGESTIONS.filter(s => !formData.skills.includes(s)).slice(0, 8).map((suggestion) => (
                      <Badge
                        key={suggestion}
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-100"
                        style={{ borderColor: '#E8E2D9', color: '#6B6560' }}
                        onClick={() => addSkill(suggestion)}
                      >
                        + {suggestion}
                      </Badge>
                    ))}
                  </div>

                  <Separator style={{ background: '#E8E2D9' }} />

                  {/* Spécialité */}
                  <div className="space-y-2">
                    <Label style={{ color: '#3D3833' }}>
                      Votre spécialité <span style={{ color: '#C75B39' }}>(obligatoire)</span>
                    </Label>
                    <p className="text-sm" style={{ color: '#6B6560' }}>
                      Choisissez votre spécialité parmi ces compétences. Vous pourrez la modifier plus tard.
                    </p>
                    <Select
                      value={formData.specialty}
                      onValueChange={(value) => setFormData({ ...formData, specialty: value })}
                    >
                      <SelectTrigger style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#1A1714' }}>
                        <SelectValue placeholder="Sélectionnez votre spécialité" />
                      </SelectTrigger>
                      <SelectContent style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty} value={specialty} style={{ color: '#3D3833' }}>
                            {specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator style={{ background: '#E8E2D9' }} />

                  {/* Tarif horaire */}
                  <div className="space-y-2">
                    <Label style={{ color: '#3D3833' }}>
                      Votre tarif horaire moyen <span style={{ color: '#C75B39' }}>(obligatoire)</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="30"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        className="w-32"
                        style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#1A1714' }}
                      />
                      <span className="px-4 py-2 rounded" style={{ background: '#E8E2D9', color: '#3D3833' }}>
                        € / heure
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Votre Profil */}
              <Card style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                <CardHeader>
                  <CardTitle style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                    Votre Profil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Photo de profil avec bannière */}
                  <div className="relative">
                    {/* Bannière */}
                    <div 
                      className="h-40 rounded-lg relative overflow-hidden cursor-pointer group"
                      style={{ 
                        background: formData.coverBanner 
                          ? `url(${formData.coverBanner}) center/cover`
                          : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
                      }}
                      onClick={() => coverInputRef.current?.click()}
                    >
                      {/* Overlay avec texte de code si pas de bannière */}
                      {!formData.coverBanner && (
                        <div className="absolute inset-0 opacity-30 text-xs font-mono text-green-400 p-4 overflow-hidden">
                          <pre>{`function() {
  const floatRandom = true;
  createElement('script');
  javascript
  random();
  document.get
}`}</pre>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'cover');
                      }}
                    />

                    {/* Avatar */}
                    <div 
                      className="absolute -bottom-12 left-6 cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                        <AvatarImage src={formData.avatar || undefined} />
                        <AvatarFallback style={{ background: '#C75B39', color: '#FFFDFB' }} className="text-2xl">
                          {formData.name?.charAt(0) || user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'avatar');
                      }}
                    />
                  </div>

                  <div className="pt-14" />

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label style={{ color: '#3D3833' }}>
                      Votre bio <span style={{ color: '#C75B39' }}>(obligatoire)</span>
                    </Label>
                    <p className="text-sm" style={{ color: '#6B6560' }}>
                      Résumez en une phrase vos compétences et votre expertise. Soyez clair et concis.
                    </p>
                    <div className="relative">
                      <Textarea
                        placeholder="Je suis un Développeur Full-stack Freelance passionné par la livraison de projets complets et esthétiques. De la conception du Web design à l'implémentation d'une API solide, mon expertise en React et..."
                        rows={4}
                        maxLength={200}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        style={{ 
                          background: '#F8F9FA', 
                          border: '1px solid #E8E2D9', 
                          color: '#1A1714',
                          borderLeft: '3px solid #E8E2D9'
                        }}
                      />
                      <div className="absolute bottom-2 right-2 text-xs" style={{ color: '#9A948D' }}>
                        {formData.bio.length}/200 caractères
                      </div>
                    </div>
                  </div>

                  <Separator style={{ background: '#E8E2D9' }} />

                  {/* Présentation */}
                  <div className="space-y-2">
                    <Label style={{ color: '#3D3833' }}>Votre présentation</Label>
                    <p className="text-sm" style={{ color: '#6B6560' }}>
                      Mettez toutes les chances de votre côté en fournissant des informations complémentaires aux clients : 
                      votre parcours professionnel, vos compétences, votre méthode de travail, etc.
                    </p>
                    <div className="flex items-start gap-2 p-3 rounded" style={{ background: '#FEF3C7', border: '1px solid #F59E0B' }}>
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#D97706' }} />
                      <p className="text-sm" style={{ color: '#92400E' }}>
                        <strong>Toute information permettant de vous contacter en dehors de BeninFreelance est interdite dans le profil.</strong>
                      </p>
                    </div>
                    <Textarea
                      placeholder="Décrivez votre parcours, vos réalisations, votre méthode de travail..."
                      rows={6}
                      value={formData.presentation}
                      onChange={(e) => setFormData({ ...formData, presentation: e.target.value })}
                      style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#1A1714' }}
                    />
                  </div>

                  <Separator style={{ background: '#E8E2D9' }} />

                  {/* Toggle afficher nom */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={formData.showFullName}
                        onCheckedChange={(checked) => setFormData({ ...formData, showFullName: checked })}
                        style={{ 
                          background: formData.showFullName ? '#22C55E' : '#E8E2D9'
                        }}
                      />
                      <Label style={{ color: '#3D3833' }}>
                        Afficher mon nom et prénom sur mon profil
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bouton de soumission */}
              <Button
                type="submit"
                className="w-full py-6 text-lg font-medium"
                disabled={isSubmitting}
                style={{ background: '#C75B39', color: '#FFFDFB' }}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                Mettre à jour
              </Button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
