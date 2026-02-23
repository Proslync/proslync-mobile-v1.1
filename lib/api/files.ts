// Files API - Presigned URL upload flow
import { apiClient } from './client';
import type {
  PresignedUrlRequest,
  PresignedUrlResponse,
  ConfirmUploadResponse,
} from '../types/files.types';

/**
 * Get file info from a local URI
 */
function getFileInfoFromUri(uri: string): { name: string; type: string } {
  const filename = uri.split('/').pop() || 'file';
  const match = /\.(\w+)$/.exec(filename);
  const extension = match ? match[1].toLowerCase() : '';

  // Map common extensions to MIME types
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
  };

  const type = mimeTypes[extension] || 'image/jpeg';

  return { name: filename, type };
}

export const filesApi = {
  /**
   * Get a presigned URL for uploading a file directly to S3
   *
   * @param data - File metadata for presigned URL generation
   * @returns Presigned URL and file ID for upload
   */
  getPresignedUrl: async (data: PresignedUrlRequest): Promise<PresignedUrlResponse> => {
    return apiClient.post<PresignedUrlResponse>('/api/files/presigned-url', data);
  },

  /**
   * Upload a file directly to S3 using a presigned URL
   * This bypasses the backend server for better performance
   *
   * @param presignedUrl - The S3 presigned URL
   * @param fileUri - Local file URI (e.g., from ImagePicker)
   * @param mimeType - File MIME type
   */
  uploadToPresignedUrl: async (
    presignedUrl: string,
    fileUri: string,
    mimeType: string
  ): Promise<void> => {
    console.log('[FilesApi] Uploading to presigned URL...');
    console.log('[FilesApi] File URI:', fileUri.substring(0, 50) + '...');
    console.log('[FilesApi] MIME type:', mimeType);

    // For React Native, we need to use a blob or the fetch with file URI
    // React Native's fetch can handle file:// URIs directly
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': mimeType,
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => 'Unknown error');
      console.error('[FilesApi] S3 upload failed:', uploadResponse.status, errorText);
      throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    console.log('[FilesApi] S3 upload successful');
  },

  /**
   * Confirm file upload after successful S3 upload
   * This links the file to the event/entity in the database
   *
   * @param fileId - File ID from presigned URL response
   * @returns Confirmed file metadata with public URL
   */
  confirmUpload: async (fileId: string): Promise<ConfirmUploadResponse> => {
    return apiClient.post<ConfirmUploadResponse>(`/api/files/confirm-upload/${fileId}`);
  },

  /**
   * Complete presigned URL upload flow for an event flyer
   * Convenience method that handles all 3 steps
   *
   * @param eventId - Event ID to attach flyer to
   * @param fileUri - Local file URI
   * @returns Public URL of the uploaded flyer
   */
  uploadEventFlyer: async (eventId: number, fileUri: string): Promise<string> => {
    const { name, type } = getFileInfoFromUri(fileUri);

    // Get file size
    const fileResponse = await fetch(fileUri);
    const blob = await fileResponse.blob();
    const fileSize = blob.size.toString();

    console.log('[FilesApi] Starting flyer upload for event:', eventId);
    console.log('[FilesApi] File:', { name, type, size: fileSize });

    // Step 1: Get presigned URL
    const { uploadUrl, fileId } = await filesApi.getPresignedUrl({
      fileType: 'flyer',
      fileName: name,
      mimeType: type,
      fileSize,
      eventId: eventId.toString(),
    });

    console.log('[FilesApi] Got presigned URL, fileId:', fileId);

    // Step 2: Upload to S3
    // Use the blob we already fetched
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed: ${uploadResponse.status}`);
    }

    console.log('[FilesApi] S3 upload complete');

    // Step 3: Confirm upload
    const confirmed = await filesApi.confirmUpload(fileId);

    console.log('[FilesApi] Upload confirmed, URL:', confirmed.url);

    return confirmed.url;
  },

  /**
   * Complete presigned URL upload flow for a table image
   *
   * @param fileUri - Local file URI
   * @returns Public URL of the uploaded image
   */
  uploadTableImage: async (fileUri: string): Promise<string> => {
    const { name, type } = getFileInfoFromUri(fileUri);

    console.log('[FilesApi] Table image upload:', { name, type, uri: fileUri.substring(0, 80) });

    const fileResponse = await fetch(fileUri);
    const blob = await fileResponse.blob();
    const fileSize = blob.size.toString();

    console.log('[FilesApi] Blob size:', fileSize, 'blob.type:', blob.type);

    // Step 1: Get presigned URL
    const { uploadUrl, fileId } = await filesApi.getPresignedUrl({
      fileType: 'table-image',
      fileName: name,
      mimeType: type,
      fileSize,
    });

    console.log('[FilesApi] Got presigned URL for table image, fileId:', fileId);

    // Use the same Content-Type that was used to generate the signed URL
    // Step 2: Upload to GCS/S3
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': type },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => '');
      console.error('[FilesApi] Table image upload failed:', uploadResponse.status, errorText);
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    // Step 3: Confirm upload
    const confirmed = await filesApi.confirmUpload(fileId);
    return confirmed.url;
  },

  /**
   * Delete a file by ID
   *
   * @param fileId - File ID to delete
   */
  deleteFile: async (fileId: string): Promise<void> => {
    return apiClient.delete(`/api/files/${fileId}`);
  },
};
