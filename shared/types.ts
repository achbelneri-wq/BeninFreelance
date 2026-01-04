import { z } from "zod";
import validation from "./validation";

/**
 * Types inférés depuis les schémas de validation Zod
 * Ces types remplacent les anciens modèles Drizzle
 */

export type User = z.infer<typeof validation.nameSchema> & {
  id: number;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
  // Ajoutez d'autres champs si nécessaire ou utilisez les types générés par Supabase CLI
};

export type Service = {
  id: number;
  title: string;
  description: string;
  price: number;
  // ...
};

export * from "./_core/errors";