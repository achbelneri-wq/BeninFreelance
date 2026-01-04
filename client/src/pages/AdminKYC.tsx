import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, X, FileText, Loader2, RefreshCw } from "lucide-react";

export default function AdminKYC() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    // On joint la table kyc_documents avec users
    const { data, error } = await supabase
      .from('kyc_documents')
      .select(`
        id,
        document_url,
        document_type,
        created_at,
        status,
        users (
          id,
          name,
          email,
          kyc_status
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Erreur de chargement");
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReview = async (docId: number, userId: number, status: 'approved' | 'rejected') => {
    try {
      // 1. Mise à jour du document
      const { error: docError } = await supabase
        .from('kyc_documents')
        .update({ status: status, reviewed_at: new Date().toISOString() })
        .eq('id', docId);

      if (docError) throw docError;

      // 2. Mise à jour de l'utilisateur (Badge)
      const userStatus = status === 'approved' ? 'verified' : 'rejected';
      const { error: userError } = await supabase
        .from('users')
        .update({ kyc_status: userStatus })
        .eq('id', userId);

      if (userError) throw userError;

      toast.success(status === 'approved' ? "Utilisateur validé !" : "Demande rejetée");
      fetchRequests();

    } catch (e: any) {
      toast.error("Erreur: " + e.message);
    }
  };

  const viewDocument = async (path: string) => {
    // Création d'une URL temporaire pour voir le fichier privé
    const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    else toast.error("Impossible d'ouvrir le document");
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-serif text-[#1A1714]">Validation KYC</h1>
        <Button variant="outline" size="sm" onClick={fetchRequests}><RefreshCw className="h-4 w-4 mr-2" /> Actualiser</Button>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Documents en attente ({requests.length})</CardTitle></CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-[#9A948D]">
              <p>Aucun document à valider pour le moment.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium">{req.users?.name || "Inconnu"}</div>
                      <div className="text-xs text-muted-foreground">{req.users?.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="uppercase text-xs font-bold bg-gray-100 px-2 py-1 rounded">{req.document_type}</span>
                        <Button variant="ghost" size="sm" onClick={() => viewDocument(req.document_url)}>
                          <FileText className="h-4 w-4 text-[#C75B39]" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" className="bg-[#5C6B4A]" onClick={() => handleReview(req.id, req.users.id, 'approved')}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReview(req.id, req.users.id, 'rejected')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
