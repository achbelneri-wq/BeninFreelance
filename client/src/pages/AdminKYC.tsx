import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminKYC() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      // On cherche les utilisateurs ayant un statut KYC 'pending'
      // Si vous avez une table séparée 'kyc_documents', adaptez la requête
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('kyc_status', 'pending');

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      // Ignorer l'erreur silencieusement si la colonne n'existe pas encore pour éviter de bloquer l'UI
      console.log("Info KYC:", error.message);
      setRequests([]); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDecision = async (userId: string, decision: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ kyc_status: decision })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`Dossier ${decision === 'approved' ? 'approuvé' : 'rejeté'}`);
      fetchRequests();
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Vérifications KYC</h1>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Date soumission</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : requests.length > 0 ? (
              requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">
                    {req.name} <br/>
                    <span className="text-xs text-muted-foreground">{req.email}</span>
                  </TableCell>
                  <TableCell>
                    {req.kyc_submitted_at ? new Date(req.kyc_submitted_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" /> Voir document
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Document d'identité</DialogTitle>
                        </DialogHeader>
                        <div className="aspect-video bg-muted flex items-center justify-center rounded-lg overflow-hidden">
                          {req.kyc_document_url ? (
                            <img src={req.kyc_document_url} alt="KYC" className="w-full h-full object-contain" />
                          ) : (
                            <p>Aucun document chargé</p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-yellow-500">En attente</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleDecision(req.id, 'approved')}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDecision(req.id, 'rejected')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Aucune demande de vérification en attente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}