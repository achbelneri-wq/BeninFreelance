import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocation, Link } from "wouter";
import DashboardLayout from "@/pages/DashboardLayout";

export default function KYC() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("id_card");
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/login");
    return null;
  }

  // Si déjà vérifié
  if (profile?.kyc_status === 'verified') {
    return (
      <div className="p-8 flex justify-center">
        <Card className="w-full max-w-md text-center p-8 bg-[#5C6B4A]/5 border-[#5C6B4A]/20">
          <ShieldCheck className="w-16 h-16 mx-auto text-[#5C6B4A] mb-4" />
          <h2 className="text-2xl font-serif text-[#1A1714] mb-2">Compte Vérifié !</h2>
          <p className="text-[#6B6560] mb-6">Vous disposez du badge officiel.</p>
          <Link href="/dashboard">
            <Button className="bg-[#5C6B4A] hover:bg-[#4A5A3C] text-white">Retour au Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user || !profile) return;

    setLoading(true);
    try {
      // 1. Upload
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Enregistrement en base
      const { error: docError } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: profile.id, // ID numérique de la table users
          document_type: docType,
          document_url: filePath,
          status: 'pending'
        });

      if (docError) throw docError;

      // 3. Update User status
      const { error: userError } = await supabase
        .from('users')
        .update({ kyc_status: 'submitted' })
        .eq('id', profile.id);

      if (userError) throw userError;

      toast.success("Documents envoyés avec succès !");
      setTimeout(() => window.location.href = "/dashboard", 1500);

    } catch (error: any) {
      console.error(error);
      toast.error("Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-serif mb-2 text-[#1A1714]">Obtenir le Badge Vérifié</h1>
        <p className="text-[#6B6560]">Prouvez votre identité pour débloquer toutes les fonctionnalités.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Envoi des documents</CardTitle>
          <CardDescription>Vos documents sont sécurisés et visibles uniquement par l'administration.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Type de document</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id_card">Carte d'Identité (CIP)</SelectItem>
                  <SelectItem value="passport">Passeport</SelectItem>
                  <SelectItem value="driver_license">Permis de conduire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fichier (Photo ou Scan)</Label>
              <div className="border-2 border-dashed border-[#E8E2D9] rounded-lg p-8 text-center relative hover:bg-[#FAF7F2] transition-colors">
                <Input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  {file ? (
                    <CheckCircle2 className="h-8 w-8 text-[#5C6B4A]" />
                  ) : (
                    <Upload className="h-8 w-8 text-[#C75B39]" />
                  )}
                  <span className="font-medium text-[#1A1714]">
                    {file ? file.name : "Cliquez pour déposer votre fichier"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#C75B39]/5 p-4 rounded-md flex gap-3">
              <AlertCircle className="h-5 w-5 text-[#C75B39]" />
              <p className="text-sm text-[#6B6560]">
                Format accepté : PDF, JPG, PNG. Max 5Mo.
              </p>
            </div>

            <Button type="submit" className="w-full bg-[#C75B39] text-white" disabled={loading || !file}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Envoyer pour validation
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
