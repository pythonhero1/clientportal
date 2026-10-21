import { getAuthHeaders, getActivePersona } from './projects-api';

export interface FileVersionDto {
  id: string;
  fileId: string;
  versionNumber: number;
  fileName: string;
  fileExtension: string;
  mimeType: string;
  byteSize: number | string;
  scanStatus: 'QUARANTINED' | 'CLEAN' | 'INFECTED' | 'FAILED';
  isLatest: boolean;
  uploadedById: string;
  uploadedBy?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  reviewStatus: 'PENDING_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED';
  approvedAt?: string | null;
  approvedById?: string | null;
  approvedBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  approvalNotes?: string | null;
  comments?: FileCommentDto[];
  createdAt: string;
}

export interface FileCommentDto {
  id: string;
  fileVersionId: string;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  content: string;
  createdAt: string;
}

export interface FileItemDto {
  id: string;
  projectId: string;
  name: string;
  category: 'IMAGES' | 'DOCUMENTS' | 'SPREADSHEETS' | 'DESIGN_FILES' | 'ARCHIVES' | 'VIDEO' | 'AUDIO';
  visibility: 'SHARED' | 'INTERNAL';
  lifecycleStatus: 'ACTIVE' | 'ARCHIVED' | 'SOFT_DELETED' | 'RESTRICTED_POST_WINDOW' | 'PERMANENTLY_DELETED';
  archivedAt?: string | null;
  softDeletedAt?: string | null;
  softDeleteExpiresAt?: string | null;
  currentVersionNumber: number;
  latestVersion?: FileVersionDto | null;
  versions?: FileVersionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface RequestUploadData {
  name: string;
  category: 'IMAGES' | 'DOCUMENTS' | 'SPREADSHEETS' | 'DESIGN_FILES' | 'ARCHIVES' | 'VIDEO' | 'AUDIO';
  fileName: string;
  fileExtension: string;
  byteSize: number;
  mimeType: string;
  visibility?: 'SHARED' | 'INTERNAL';
  isNewVersion?: boolean;
  existingFileId?: string;
}

const API_BASE = '/api';

// Fallback preview mock database for standalone UI dev and preview mode
let inMemoryMockFiles: FileItemDto[] = [
  {
    id: 'file_demo_1',
    projectId: 'proj_1',
    name: 'Brand Guidelines & Identity Suite',
    category: 'IMAGES',
    visibility: 'SHARED',
    lifecycleStatus: 'ACTIVE',
    currentVersionNumber: 2,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    latestVersion: {
      id: 'ver_demo_1_v2',
      fileId: 'file_demo_1',
      versionNumber: 2,
      fileName: 'brand-guidelines-v2.svg',
      fileExtension: '.svg',
      mimeType: 'image/svg+xml',
      byteSize: 1450000,
      scanStatus: 'CLEAN',
      isLatest: true,
      uploadedById: 'owner',
      uploadedBy: {
        id: 'owner',
        name: 'Stephen Oderinde',
        email: 'owner@oderindestephen.com',
        role: 'Owner',
      },
      reviewStatus: 'APPROVED',
      approvedAt: new Date(Date.now() - 86400000).toISOString(),
      approvedById: 'client_a',
      approvedBy: {
        id: 'client_a',
        name: 'Alpha Client',
        email: 'client_a@example.com',
      },
      approvalNotes: 'Approved vector assets for web typography and hero section palette.',
      comments: [
        {
          id: 'comm_demo_1',
          fileVersionId: 'ver_demo_1_v2',
          authorId: 'owner',
          author: {
            id: 'owner',
            name: 'Stephen Oderinde',
            email: 'owner@oderindestephen.com',
            role: 'Owner',
          },
          content: 'Here is version 2 with high-contrast accessibility tokens included.',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          id: 'comm_demo_2',
          fileVersionId: 'ver_demo_1_v2',
          authorId: 'client_a',
          author: {
            id: 'client_a',
            name: 'Alpha Client',
            email: 'client_a@example.com',
            role: 'Client',
          },
          content: 'Looks fantastic! Color palette matches our brand guidelines perfectly.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    versions: [
      {
        id: 'ver_demo_1_v1',
        fileId: 'file_demo_1',
        versionNumber: 1,
        fileName: 'brand-guidelines-v1.svg',
        fileExtension: '.svg',
        mimeType: 'image/svg+xml',
        byteSize: 1200000,
        scanStatus: 'CLEAN',
        isLatest: false,
        uploadedById: 'owner',
        uploadedBy: {
          id: 'owner',
          name: 'Stephen Oderinde',
          email: 'owner@oderindestephen.com',
          role: 'Owner',
        },
        reviewStatus: 'CHANGES_REQUESTED',
        comments: [
          {
            id: 'comm_demo_0',
            fileVersionId: 'ver_demo_1_v1',
            authorId: 'client_a',
            author: {
              id: 'client_a',
              name: 'Alpha Client',
              email: 'client_a@example.com',
              role: 'Client',
            },
            content: 'Please adjust the contrast ratio on the secondary accent tokens.',
            createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: 'file_demo_2',
    projectId: 'proj_1',
    name: 'E-Commerce Wireframes & Component Specs',
    category: 'DESIGN_FILES',
    visibility: 'SHARED',
    lifecycleStatus: 'ACTIVE',
    currentVersionNumber: 1,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    latestVersion: {
      id: 'ver_demo_2_v1',
      fileId: 'file_demo_2',
      versionNumber: 1,
      fileName: 'ecommerce-wireframes-v1.fig',
      fileExtension: '.fig',
      mimeType: 'application/octet-stream',
      byteSize: 24800000,
      scanStatus: 'CLEAN',
      isLatest: true,
      uploadedById: 'owner',
      uploadedBy: {
        id: 'owner',
        name: 'Stephen Oderinde',
        email: 'owner@oderindestephen.com',
        role: 'Owner',
      },
      reviewStatus: 'PENDING_REVIEW',
      comments: [
        {
          id: 'comm_demo_3',
          fileVersionId: 'ver_demo_2_v1',
          authorId: 'owner',
          author: {
            id: 'owner',
            name: 'Stephen Oderinde',
            email: 'owner@oderindestephen.com',
            role: 'Owner',
          },
          content: 'Desktop and mobile wireframes for Milestone 2 checkout flow are ready for your review.',
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    versions: [],
  },
  {
    id: 'file_demo_3',
    projectId: 'proj_1',
    name: 'Project Scope & Architecture Specification',
    category: 'DOCUMENTS',
    visibility: 'SHARED',
    lifecycleStatus: 'ACTIVE',
    currentVersionNumber: 1,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    latestVersion: {
      id: 'ver_demo_3_v1',
      fileId: 'file_demo_3',
      versionNumber: 1,
      fileName: 'scope-and-technical-architecture.pdf',
      fileExtension: '.pdf',
      mimeType: 'application/pdf',
      byteSize: 3450000,
      scanStatus: 'CLEAN',
      isLatest: true,
      uploadedById: 'owner',
      uploadedBy: {
        id: 'owner',
        name: 'Stephen Oderinde',
        email: 'owner@oderindestephen.com',
        role: 'Owner',
      },
      reviewStatus: 'APPROVED',
      approvedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      approvedById: 'client_a',
      approvedBy: {
        id: 'client_a',
        name: 'Alpha Client',
        email: 'client_a@example.com',
      },
      approvalNotes: 'Signed off during Phase P01 onboarding.',
      comments: [],
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    versions: [],
  },
  {
    id: 'file_demo_4',
    projectId: 'proj_1',
    name: 'Design System Production Token Archive',
    category: 'ARCHIVES',
    visibility: 'SHARED',
    lifecycleStatus: 'ACTIVE',
    currentVersionNumber: 1,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    latestVersion: {
      id: 'ver_demo_4_v1',
      fileId: 'file_demo_4',
      versionNumber: 1,
      fileName: 'design-tokens-v1.zip',
      fileExtension: '.zip',
      mimeType: 'application/zip',
      byteSize: 8900000,
      scanStatus: 'CLEAN',
      isLatest: true,
      uploadedById: 'client_a',
      uploadedBy: {
        id: 'client_a',
        name: 'Alpha Client',
        email: 'client_a@example.com',
        role: 'Client',
      },
      reviewStatus: 'PENDING_REVIEW',
      comments: [],
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    versions: [],
  },
  {
    id: 'file_demo_archived_1',
    projectId: 'proj_1',
    name: 'Legacy Q2 Wireframes & Drafts',
    category: 'DESIGN_FILES',
    visibility: 'SHARED',
    lifecycleStatus: 'ARCHIVED',
    archivedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    currentVersionNumber: 1,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    latestVersion: {
      id: 'ver_arch_1',
      fileId: 'file_demo_archived_1',
      versionNumber: 1,
      fileName: 'q2-wireframes.fig',
      fileExtension: '.fig',
      mimeType: 'application/octet-stream',
      byteSize: 18400000,
      scanStatus: 'CLEAN',
      isLatest: true,
      uploadedById: 'owner',
      reviewStatus: 'APPROVED',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    versions: [],
  },
  {
    id: 'file_demo_soft_deleted_1',
    projectId: 'proj_1',
    name: 'Temporary Marketing Deck v1',
    category: 'DOCUMENTS',
    visibility: 'SHARED',
    lifecycleStatus: 'SOFT_DELETED',
    softDeletedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    softDeleteExpiresAt: new Date(Date.now() + 80 * 86400000).toISOString(),
    currentVersionNumber: 1,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    latestVersion: {
      id: 'ver_sd_1',
      fileId: 'file_demo_soft_deleted_1',
      versionNumber: 1,
      fileName: 'marketing-deck-old.pdf',
      fileExtension: '.pdf',
      mimeType: 'application/pdf',
      byteSize: 4200000,
      scanStatus: 'CLEAN',
      isLatest: true,
      uploadedById: 'owner',
      reviewStatus: 'PENDING_REVIEW',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    versions: [],
  },
  {
    id: 'file_demo_restricted_1',
    projectId: 'proj_1',
    name: 'Unused Hero Background Exploration',
    category: 'IMAGES',
    visibility: 'INTERNAL',
    lifecycleStatus: 'RESTRICTED_POST_WINDOW',
    softDeletedAt: new Date(Date.now() - 95 * 86400000).toISOString(),
    softDeleteExpiresAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    currentVersionNumber: 1,
    createdAt: new Date(Date.now() - 100 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    latestVersion: {
      id: 'ver_rpw_1',
      fileId: 'file_demo_restricted_1',
      versionNumber: 1,
      fileName: 'hero-exploration.png',
      fileExtension: '.png',
      mimeType: 'image/png',
      byteSize: 5200000,
      scanStatus: 'CLEAN',
      isLatest: true,
      uploadedById: 'owner',
      reviewStatus: 'CHANGES_REQUESTED',
      createdAt: new Date(Date.now() - 100 * 86400000).toISOString(),
    },
    versions: [],
  },
];

function isOfflineOrGatewayError(status?: number): boolean {
  return !status || status === 500 || status === 502 || status === 503 || status === 504;
}

export const filesApi = {
  async listFiles(projectId: string, category?: string): Promise<FileItemDto[]> {
    try {
      const url = new URL(`${API_BASE}/projects/${projectId}/files`, window.location.origin);
      if (category) {
        url.searchParams.set('category', category);
      }
      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        if (isOfflineOrGatewayError(res.status)) {
          console.warn(`[filesApi] API server error (${res.status}). Serving preview fallback files.`);
          return this.getMockList(category);
        }
        throw new Error(`Failed to load project files (${res.status})`);
      }

      return res.json();
    } catch (err: any) {
      console.warn('[filesApi] Serving preview fallback files:', err.message);
      return this.getMockList(category);
    }
  },

  getMockList(category?: string): FileItemDto[] {
    const active = inMemoryMockFiles.filter((f) => f.lifecycleStatus === 'ACTIVE');
    if (!category) return active;
    return active.filter((f) => f.category === category);
  },

  async getFileById(projectId: string, fileId: string): Promise<FileItemDto> {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/files/${fileId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (isOfflineOrGatewayError(res.status)) {
          const match = inMemoryMockFiles.find((f) => f.id === fileId);
          if (match) return match;
        }
        throw new Error(`Failed to load file details (${res.status})`);
      }
      return res.json();
    } catch (err: any) {
      const match = inMemoryMockFiles.find((f) => f.id === fileId);
      if (match) return match;
      throw err;
    }
  },

  async initiateUpload(projectId: string, data: RequestUploadData) {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/files/upload-initiate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        if (isOfflineOrGatewayError(res.status)) {
          console.warn('[filesApi] Serving mock upload initiation.');
          return {
            fileId: data.existingFileId || `file_mock_${Date.now()}`,
            versionId: `ver_mock_${Date.now()}`,
            uploadUrl: `mock://s3-upload/${encodeURIComponent(data.fileName)}`,
            quarantineKey: `quarantine/mock-${Date.now()}-${data.fileName}`,
          };
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to initiate upload (${res.status})`);
      }
      return res.json();
    } catch (err: any) {
      console.warn('[filesApi] Fallback upload initiation:', err.message);
      return {
        fileId: data.existingFileId || `file_mock_${Date.now()}`,
        versionId: `ver_mock_${Date.now()}`,
        uploadUrl: `mock://s3-upload/${encodeURIComponent(data.fileName)}`,
        quarantineKey: `quarantine/mock-${Date.now()}-${data.fileName}`,
      };
    }
  },

  /**
   * Direct-to-S3 XHR upload bypassing the API Node server process memory.
   * Reports live upload progress.
   */
  uploadToS3(
    uploadUrl: string,
    file: File,
    onProgress?: (percent: number, loaded: number, total: number) => void,
  ): Promise<void> {
    if (uploadUrl.startsWith('mock://')) {
      return new Promise((resolve) => {
        let p = 0;
        const interval = setInterval(() => {
          p += 25;
          if (onProgress) onProgress(p, (p / 100) * file.size, file.size);
          if (p >= 100) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent, e.loaded, e.total);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 direct upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred during direct S3 transfer'));
      };

      xhr.send(file);
    });
  },

  async completeUpload(
    projectId: string,
    data: {
      fileId: string;
      versionId: string;
      quarantineKey: string;
      checksumSha256?: string;
    },
  ): Promise<FileVersionDto> {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/files/upload-complete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        if (isOfflineOrGatewayError(res.status)) {
          const persona = getActivePersona();
          const mockVersion: FileVersionDto = {
            id: data.versionId,
            fileId: data.fileId,
            versionNumber: 1,
            fileName: data.quarantineKey.split('/').pop() || 'uploaded-file.ext',
            fileExtension: '.' + (data.quarantineKey.split('.').pop() || 'dat'),
            mimeType: 'application/octet-stream',
            byteSize: 1024 * 512,
            scanStatus: 'CLEAN',
            isLatest: true,
            uploadedById: persona.id,
            uploadedBy: {
              id: persona.id,
              name: persona.name,
              email: persona.email,
              role: persona.role,
            },
            reviewStatus: 'PENDING_REVIEW',
            comments: [],
            createdAt: new Date().toISOString(),
          };
          // Insert into in-memory mock if existing
          const existing = inMemoryMockFiles.find((f) => f.id === data.fileId);
          if (existing) {
            existing.latestVersion = mockVersion;
            existing.currentVersionNumber += 1;
            mockVersion.versionNumber = existing.currentVersionNumber;
          } else {
            inMemoryMockFiles.unshift({
              id: data.fileId,
              projectId,
              name: mockVersion.fileName,
              category: 'DOCUMENTS',
              visibility: 'SHARED',
              lifecycleStatus: 'ACTIVE',
              currentVersionNumber: 1,
              latestVersion: mockVersion,
              versions: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
          return mockVersion;
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to complete upload (${res.status})`);
      }
      return res.json();
    } catch (err: any) {
      console.warn('[filesApi] Fallback complete upload:', err.message);
      const persona = getActivePersona();
      const mockVersion: FileVersionDto = {
        id: data.versionId,
        fileId: data.fileId,
        versionNumber: 1,
        fileName: data.quarantineKey.split('/').pop() || 'uploaded-file.ext',
        fileExtension: '.' + (data.quarantineKey.split('.').pop() || 'dat'),
        mimeType: 'application/octet-stream',
        byteSize: 1024 * 512,
        scanStatus: 'CLEAN',
        isLatest: true,
        uploadedById: persona.id,
        uploadedBy: {
          id: persona.id,
          name: persona.name,
          email: persona.email,
          role: persona.role,
        },
        reviewStatus: 'PENDING_REVIEW',
        comments: [],
        createdAt: new Date().toISOString(),
      };
      return mockVersion;
    }
  },

  async getDownloadUrl(projectId: string, fileId: string, versionId: string) {
    try {
      const res = await fetch(
        `${API_BASE}/projects/${projectId}/files/${fileId}/versions/${versionId}/download`,
        { headers: getAuthHeaders() },
      );
      if (!res.ok) {
        if (isOfflineOrGatewayError(res.status)) {
          return { downloadUrl: '#' };
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to generate download URL (${res.status})`);
      }
      return res.json();
    } catch (err: any) {
      return { downloadUrl: '#' };
    }
  },

  async addComment(
    projectId: string,
    fileId: string,
    versionId: string,
    content: string,
  ): Promise<FileCommentDto> {
    try {
      const res = await fetch(
        `${API_BASE}/projects/${projectId}/files/${fileId}/versions/${versionId}/comments`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ content }),
        },
      );
      if (!res.ok) {
        if (isOfflineOrGatewayError(res.status)) {
          return this.createMockComment(fileId, versionId, content);
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to submit comment (${res.status})`);
      }
      return res.json();
    } catch (err: any) {
      return this.createMockComment(fileId, versionId, content);
    }
  },

  createMockComment(fileId: string, versionId: string, content: string): FileCommentDto {
    const persona = getActivePersona();
    const comment: FileCommentDto = {
      id: `comm_${Date.now()}`,
      fileVersionId: versionId,
      authorId: persona.id,
      author: {
        id: persona.id,
        name: persona.name,
        email: persona.email,
        role: persona.role,
      },
      content,
      createdAt: new Date().toISOString(),
    };
    const file = inMemoryMockFiles.find((f) => f.id === fileId);
    if (file?.latestVersion && file.latestVersion.id === versionId) {
      if (!file.latestVersion.comments) file.latestVersion.comments = [];
      file.latestVersion.comments.push(comment);
    }
    return comment;
  },

  async approveVersion(
    projectId: string,
    fileId: string,
    versionId: string,
    approvalNotes?: string,
  ): Promise<FileVersionDto> {
    try {
      const res = await fetch(
        `${API_BASE}/projects/${projectId}/files/${fileId}/versions/${versionId}/approve`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ approvalNotes }),
        },
      );
      if (!res.ok) {
        if (isOfflineOrGatewayError(res.status)) {
          return this.applyMockApproval(fileId, versionId, approvalNotes);
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to approve deliverable version (${res.status})`);
      }
      return res.json();
    } catch (err: any) {
      return this.applyMockApproval(fileId, versionId, approvalNotes);
    }
  },

  applyMockApproval(fileId: string, versionId: string, approvalNotes?: string): FileVersionDto {
    const persona = getActivePersona();
    const file = inMemoryMockFiles.find((f) => f.id === fileId);
    const version = file?.latestVersion?.id === versionId ? file.latestVersion : null;
    if (version) {
      version.reviewStatus = 'APPROVED';
      version.approvedAt = new Date().toISOString();
      version.approvedById = persona.id;
      version.approvedBy = {
        id: persona.id,
        name: persona.name,
        email: persona.email,
      };
      version.approvalNotes = approvalNotes || null;
      return { ...version };
    }
    return {
      id: versionId,
      fileId,
      versionNumber: 1,
      fileName: 'approved-deliverable.pdf',
      fileExtension: '.pdf',
      mimeType: 'application/pdf',
      byteSize: 1024,
      scanStatus: 'CLEAN',
      isLatest: true,
      uploadedById: persona.id,
      reviewStatus: 'APPROVED',
      approvedAt: new Date().toISOString(),
      approvedById: persona.id,
      approvalNotes: approvalNotes || null,
      createdAt: new Date().toISOString(),
    };
  },

  // Owner Lifecycle Management
  async getOwnerLifecycleSummary(projectId?: string): Promise<FileItemDto[]> {
    try {
      const url = new URL(`${API_BASE}/admin/files/lifecycle`, window.location.origin);
      if (projectId) {
        url.searchParams.set('projectId', projectId);
      }
      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (isOfflineOrGatewayError(res.status)) {
          console.warn('[filesApi] Serving mock owner lifecycle files.');
          return inMemoryMockFiles;
        }
        throw new Error(`Failed to fetch lifecycle summary (${res.status})`);
      }
      return res.json();
    } catch (err: any) {
      if (err instanceof TypeError || (err.message && err.message.includes('502'))) {
        return inMemoryMockFiles;
      }
      throw err;
    }
  },

  async archiveFile(fileId: string, reason?: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/files/${fileId}/archive`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        if (isOfflineOrGatewayError(res.status)) {
          const match = inMemoryMockFiles.find((f) => f.id === fileId);
          if (match) {
            match.lifecycleStatus = 'ARCHIVED';
            match.archivedAt = new Date().toISOString();
            return match;
          }
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to archive file (${res.status})`);
      }
      return res.json();
    } catch (err: any) {
      const match = inMemoryMockFiles.find((f) => f.id === fileId);
      if (match) {
        match.lifecycleStatus = 'ARCHIVED';
        match.archivedAt = new Date().toISOString();
        return match;
      }
      throw err;
    }
  },

  async unarchiveFile(fileId: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/files/${fileId}/unarchive`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (isOfflineOrGatewayError(res.status)) {
          const match = inMemoryMockFiles.find((f) => f.id === fileId);
          if (match) {
            match.lifecycleStatus = 'ACTIVE';
            match.archivedAt = null;
            return match;
          }
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to unarchive file (${res.status})`);
      }
      return res.json();
    } catch (err: any) {
      const match = inMemoryMockFiles.find((f) => f.id === fileId);
      if (match) {
        match.lifecycleStatus = 'ACTIVE';
        match.archivedAt = null;
        return match;
      }
      throw err;
    }
  },

  async softDeleteFile(fileId: string, reason?: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/files/${fileId}/soft-delete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        if (isOfflineOrGatewayError(res.status)) {
          const match = inMemoryMockFiles.find((f) => f.id === fileId);
          if (match) {
            match.lifecycleStatus = 'SOFT_DELETED';
            match.softDeletedAt = new Date().toISOString();
            match.softDeleteExpiresAt = new Date(Date.now() + 90 * 86400000).toISOString();
            return match;
          }
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to soft delete file (${res.status})`);
      }
      return res.json();
    } catch (err: any) {
      const match = inMemoryMockFiles.find((f) => f.id === fileId);
      if (match) {
        match.lifecycleStatus = 'SOFT_DELETED';
        match.softDeletedAt = new Date().toISOString();
        match.softDeleteExpiresAt = new Date(Date.now() + 90 * 86400000).toISOString();
        return match;
      }
      throw err;
    }
  },

  async restoreFile(fileId: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/files/${fileId}/restore`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (isOfflineOrGatewayError(res.status)) {
          const match = inMemoryMockFiles.find((f) => f.id === fileId);
          if (match) {
            match.lifecycleStatus = 'ACTIVE';
            match.softDeletedAt = null;
            match.softDeleteExpiresAt = null;
            return match;
          }
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to restore file (${res.status})`);
      }
      return res.json();
    } catch (err: any) {
      const match = inMemoryMockFiles.find((f) => f.id === fileId);
      if (match) {
        match.lifecycleStatus = 'ACTIVE';
        match.softDeletedAt = null;
        match.softDeleteExpiresAt = null;
        return match;
      }
      throw err;
    }
  },

  async permanentDeleteFile(fileId: string, confirmationCode?: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/files/${fileId}/permanent`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ confirmationCode }),
      });
      if (!res.ok) {
        if (isOfflineOrGatewayError(res.status)) {
          inMemoryMockFiles = inMemoryMockFiles.filter((f) => f.id !== fileId);
          return { success: true };
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to permanently delete file (${res.status})`);
      }
      return res.json();
    } catch {
      inMemoryMockFiles = inMemoryMockFiles.filter((f) => f.id !== fileId);
      return { success: true };
    }
  },
};
