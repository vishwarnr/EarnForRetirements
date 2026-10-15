// -------------------------------------------------------------
// services/dataCaptureService.ts
// Handles document upload to the RnR Data Capture pipeline.
// -------------------------------------------------------------

import { CustomerTemplate, DocumentStatus, DocumentUploadResult } from '@/types/models';
import axios from 'axios';
import { Platform } from 'react-native';
import { apiClient } from './authService';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

const FASTAPI_URL = process.env.EXPO_PUBLIC_DATA_CAPTURE_URL ?? 'https://rnrrobots.site/test-fastapi';
const UPLOAD_URL = process.env.EXPO_PUBLIC_DATA_CAPTURE_UPLOAD_URL ?? `${FASTAPI_URL}/upload-pdf-new`;

/**
 * Normalizes images before upload.
 *
 * - PDF / Excel / CSV: returned completely untouched.
 * - Images (JPG, PNG, HEIC, HEIF, WEBP):
 *     1. If width/height are provided by the picker (camera), use them directly.
 *        No extra Image.getSize() call is made — avoids Fresco crashes on Android.
 *     2. If dimensions are NOT provided (gallery via DocumentPicker), we call
 *        manipulateAsync(uri, []) with an empty action list. Expo's own native
 *        image decoder reads the dimensions safely without loading full pixels
 *        into memory a second time.
 *     3. Resize so the longest side is at most 1600 px, preserving aspect ratio,
 *        never upscaling.
 *     4. Convert to JPEG at quality 0.8.
 *     5. Validate that the resulting file is within the acceptable upload limit.
 */
const processImageIfNecessary = async (
  uri: string,
  filename: string,
  knownWidth?: number,
  knownHeight?: number,
): Promise<{ uri: string; filename: string; mimeType: string }> => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp'].includes(extension);

  // ── Non-image files: preserve existing behavior exactly ──────────────────
  if (!isImage) {
    let mimeType = 'application/octet-stream';
    if (extension === 'pdf') mimeType = 'application/pdf';
    else if (['xls', 'xlsx'].includes(extension)) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (extension === 'csv') mimeType = 'text/csv';
    return { uri, filename, mimeType };
  }

  // ── Image processing ─────────────────────────────────────────────────────
  try {
    const MAX_DIMENSION = 1600;
    let width = knownWidth;
    let height = knownHeight;

    // If picker did not supply dimensions (gallery), let Expo read them.
    // manipulateAsync with an empty action list only decodes the image header —
    // it does NOT re-compress or modify the file.
    if (!width || !height) {
      const info = await ImageManipulator.manipulateAsync(uri, []);
      width = info.width;
      height = info.height;
    }

    // Build the resize action only when the image is actually too large.
    // Never upscale smaller images.
    const actions: ImageManipulator.Action[] = [];
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width >= height) {
        actions.push({ resize: { width: MAX_DIMENSION } });
      } else {
        actions.push({ resize: { height: MAX_DIMENSION } });
      }
    }

    // Convert to JPEG at 0.8 quality (handles HEIC/PNG/WEBP → JPEG conversion)
    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    // File-size guard: warn the user before blindly hitting the server limit.
    // 5 MB is a conservative heuristic; a 1600×1067 JPEG at 0.8 quality is
    // typically 400 KB–1.2 MB, so triggering this guard would be unusual.
    const fileInfo = await FileSystem.getInfoAsync(result.uri);
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (fileInfo.exists && fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
      throw new Error(
        `The processed image is still too large (${(fileInfo.size / 1024 / 1024).toFixed(1)} MB). ` +
        'Please select a smaller file.'
      );
    }

    // Ensure the uploaded filename always ends with .jpg
    const newFilename = filename.replace(/\.[^/.]+$/, '') + '.jpg';

    return { uri: result.uri, filename: newFilename, mimeType: 'image/jpeg' };

  } catch (error: any) {
    // Re-throw size errors so the user sees the exact message above
    if (error.message?.includes('too large')) throw error;
    console.error('[Image Processing Error]:', error);
    throw new Error('Failed to process image. The file format might be unsupported or corrupted.');
  }
};

/**
 * Fetch available templates for the user's company.
 * We resolve the companyId directly since it's available in the user profile.
 *
 * WHY apiClient instead of axios:
 *   apiClient's request interceptor automatically attaches
 *   "Authorization: Bearer <token>" from SecureStore on every call.
 *   Plain axios sends no token, which causes 401/403 on authenticated
 *   production endpoints. Passing a full URL (https://...) overrides
 *   apiClient's baseURL so the correct FastAPI host is still used.
 */
export async function getTemplatesByCompany(companyId: number): Promise<CustomerTemplate[]> {
  try {
    const { data } = await apiClient.get(`${FASTAPI_URL}/get-templates-by-company/`, {
      params: { company_id: companyId }
    });
    
    // The real API returns { templates: [{ customer, template_name }], customer_codes: [] }
    const templates: CustomerTemplate[] = [];
    
    if (data && Array.isArray(data.templates)) {
      data.templates.forEach((t: any) => {
        if (t.customer && t.template_name) {
          templates.push({
            label: t.template_name,
            customerId: t.customer,
            companyId: companyId.toString()
          });
        }
      });
    }

    // Add fallbacks for codes without templates (mirroring the Postman script)
    const claimed = templates.map(t => t.customerId);
    if (data && Array.isArray(data.customer_codes)) {
      data.customer_codes.forEach((id: string) => {
        if (!claimed.includes(id)) {
          templates.push({
            label: `(no template) ${id.slice(-6)}`,
            customerId: id,
            companyId: companyId.toString()
          });
        }
      });
    }

    return templates;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail ?? 'Failed to fetch customer templates.');
  }
}

/**
 * Check if the Data Capture API is healthy.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const { data } = await axios.get(`${FASTAPI_URL}/health`);
    return data.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Upload a document (PDF, Excel, Image) to the Data Capture API.
 */
export async function uploadDocument(
  fileUri: string,
  filename: string,
  customerId: string,
  companyId: string,
  category: string,
  createdBy: string = 'frontend-user',
  knownWidth?: number,
  knownHeight?: number
): Promise<DocumentUploadResult> {
  
  // 1. Process and normalize image (leaves PDF/Excel untouched)
  const processed = await processImageIfNecessary(fileUri, filename, knownWidth, knownHeight);

  // 2. Construct FormData
  const formData = new FormData();
  formData.append('file', {
    uri: Platform.OS === 'ios' ? processed.uri.replace('file://', '') : processed.uri,
    name: processed.filename,
    type: processed.mimeType,
  } as any);

  formData.append('customer', customerId);
  formData.append('created_company', companyId);
  formData.append('category', category);
  formData.append('created_by', createdBy);

  // 3. Upload
  try {
    const response = await axios.post(UPLOAD_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Note: Sync extraction for PDFs can take up to 30s.
      timeout: 60000, 
    });

    return {
      documentId: response.data.inserted_id,
      customer: customerId,
      createdCompany: companyId
    };
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error('File type not supported. Only PDF, Excel, and images are allowed.');
    } else if (error.response?.status === 409) {
      throw new Error('Rejected as duplicate: Document with this PO/Invoice number was already sent.');
    } else if (error.response?.status === 413) {
      throw new Error('The file is too large to upload.');
    }
    throw new Error(error.response?.data?.error ?? 'Upload failed. Please try again.');
  }
}

/**
 * Check the status and validation errors of a specific document.
 */
export async function getDocumentStatus(documentId: string, companyId: string): Promise<DocumentStatus> {
  try {
    const { data } = await axios.get(`${FASTAPI_URL}/documents`, {
      params: { company: companyId, limit: 100 }
    });
    
    const docs = Array.isArray(data) ? data : (data.documents || []);
    const doc = docs.find((d: any) => d.id === documentId || d._id === documentId);
    
    if (doc) {
      return {
        status: doc.status || 'Processing',
        document_no: doc.document_no,
        validation_errors: doc.validation_errors || [],
      };
    }
    return { status: 'Not found or still processing' };
  } catch (error: any) {
    throw new Error('Failed to retrieve document status.');
  }
}
