// File upload types for presigned URL flow

export type FileType = 'flyer' | 'logo' | 'activity-media' | 'avatar';

export interface PresignedUrlRequest {
  fileType: FileType;
  fileName: string;
  mimeType: string;
  fileSize: string;
  eventId?: string;
  venueId?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl?: string; // Optional - only for activity-media, other types use confirm
  fileId: string;
}

export interface ConfirmUploadResponse {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  fileType: FileType;
  status: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}
