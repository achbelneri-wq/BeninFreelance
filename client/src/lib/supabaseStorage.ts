/**
 * Supabase Storage pour le stockage des fichiers
 * ===============================================
 * Gère les uploads d'images pour les profils, projets et services
 */

import { supabase } from './supabase';

// Buckets disponibles
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  PROJECTS: 'projects',
  SERVICES: 'services',
  MESSAGES: 'messages',
  KYC: 'kyc-documents',
} as const;

type BucketName = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

interface UploadOptions {
  bucket: BucketName;
  folder?: string;
  fileName?: string;
  upsert?: boolean;
}

interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Génère un nom de fichier unique
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'jpg';
  return `${timestamp}-${random}.${extension}`;
}

/**
 * Upload un fichier vers Supabase Storage
 */
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    const { bucket, folder = '', fileName, upsert = false } = options;
    
    // Générer le chemin du fichier
    const finalFileName = fileName || generateFileName(file.name);
    const filePath = folder ? `${folder}/${finalFileName}` : finalFileName;

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert,
      });

    if (error) {
      console.error('[Supabase Storage] Upload error:', error);
      return { success: false, error: error.message };
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error: any) {
    console.error('[Supabase Storage] Upload exception:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}

/**
 * Upload une image de profil (avatar)
 */
export async function uploadAvatar(
  file: File,
  userId: number
): Promise<UploadResult> {
  // Valider le type de fichier
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Le fichier doit être une image' };
  }

  // Limiter la taille à 5MB
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'L\'image ne doit pas dépasser 5MB' };
  }

  return uploadFile(file, {
    bucket: STORAGE_BUCKETS.AVATARS,
    folder: String(userId),
    upsert: true,
  });
}

/**
 * Upload une image de projet
 */
export async function uploadProjectImage(
  file: File,
  projectId?: number
): Promise<UploadResult> {
  // Valider le type de fichier
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Le fichier doit être une image' };
  }

  // Limiter la taille à 10MB
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'L\'image ne doit pas dépasser 10MB' };
  }

  return uploadFile(file, {
    bucket: STORAGE_BUCKETS.PROJECTS,
    folder: projectId ? String(projectId) : 'temp',
  });
}

/**
 * Upload une image de service
 */
export async function uploadServiceImage(
  file: File,
  serviceId?: number
): Promise<UploadResult> {
  // Valider le type de fichier
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Le fichier doit être une image' };
  }

  // Limiter la taille à 10MB
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'L\'image ne doit pas dépasser 10MB' };
  }

  return uploadFile(file, {
    bucket: STORAGE_BUCKETS.SERVICES,
    folder: serviceId ? String(serviceId) : 'temp',
  });
}

/**
 * Upload un fichier de message (pièce jointe)
 */
export async function uploadMessageAttachment(
  file: File,
  conversationId: number
): Promise<UploadResult> {
  // Limiter la taille à 25MB
  if (file.size > 25 * 1024 * 1024) {
    return { success: false, error: 'Le fichier ne doit pas dépasser 25MB' };
  }

  return uploadFile(file, {
    bucket: STORAGE_BUCKETS.MESSAGES,
    folder: String(conversationId),
  });
}

/**
 * Upload un document KYC
 */
export async function uploadKYCDocument(
  file: File,
  userId: number,
  documentType: string
): Promise<UploadResult> {
  // Valider le type de fichier (images et PDF)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Format de fichier non supporté (JPG, PNG, WEBP ou PDF)' };
  }

  // Limiter la taille à 10MB
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'Le fichier ne doit pas dépasser 10MB' };
  }

  return uploadFile(file, {
    bucket: STORAGE_BUCKETS.KYC,
    folder: `${userId}/${documentType}`,
  });
}

/**
 * Supprime un fichier de Supabase Storage
 */
export async function deleteFile(
  bucket: BucketName,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('[Supabase Storage] Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Supabase Storage] Delete exception:', error);
    return { success: false, error: error.message || 'Delete failed' };
  }
}

/**
 * Liste les fichiers dans un dossier
 */
export async function listFiles(
  bucket: BucketName,
  folder: string
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder);

    if (error) {
      console.error('[Supabase Storage] List error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, files: data };
  } catch (error: any) {
    console.error('[Supabase Storage] List exception:', error);
    return { success: false, error: error.message || 'List failed' };
  }
}

/**
 * Obtient l'URL publique d'un fichier
 */
export function getPublicUrl(bucket: BucketName, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Obtient une URL signée temporaire (pour les fichiers privés)
 */
export async function getSignedUrl(
  bucket: BucketName,
  path: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('[Supabase Storage] Signed URL error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, url: data.signedUrl };
  } catch (error: any) {
    console.error('[Supabase Storage] Signed URL exception:', error);
    return { success: false, error: error.message || 'Failed to create signed URL' };
  }
}


/**
 * Fonction utilitaire simplifiée pour uploader vers un bucket spécifique
 * @param file - Le fichier à uploader
 * @param bucketType - Le type de bucket ('avatars', 'projects', 'services', 'messages', 'kyc')
 * @returns L'URL publique du fichier uploadé
 */
export async function uploadToSupabaseStorage(
  file: File,
  bucketType: 'avatars' | 'projects' | 'services' | 'messages' | 'kyc' = 'projects'
): Promise<string> {
  const bucketMap: Record<string, BucketName> = {
    avatars: STORAGE_BUCKETS.AVATARS,
    projects: STORAGE_BUCKETS.PROJECTS,
    services: STORAGE_BUCKETS.SERVICES,
    messages: STORAGE_BUCKETS.MESSAGES,
    kyc: STORAGE_BUCKETS.KYC,
  };

  const bucket = bucketMap[bucketType] || STORAGE_BUCKETS.PROJECTS;

  const result = await uploadFile(file, {
    bucket,
    folder: 'uploads',
  });

  if (!result.success || !result.url) {
    throw new Error(result.error || 'Upload failed');
  }

  return result.url;
}
