
export enum AppState {
  HOME = 'HOME',
  LIVE_ANALYSIS = 'LIVE_ANALYSIS',
  STATIC_ANALYSIS = 'STATIC_ANALYSIS',
  KNOWLEDGE = 'KNOWLEDGE',
  SETTINGS = 'SETTINGS',
  HISTORY = 'HISTORY',
  LEARNING = 'LEARNING'
}

export interface AnalysisHistoryItem {
  id: string;
  timestamp: number;
  imageData: string[];
  title: string;
  transcription: string;
  mode: UserMode;
}

export enum UserMode {
  STUDENT = 'Student',
  PROFESSIONAL = 'Professional'
}

export type DefectSeverity = 'Minor' | 'Moderate' | 'Major' | 'Critical';

export interface StructuralReport {
  objectName: string;
  material: string;
  loadCapacity?: string;
  defects?: Array<{
    type: string;
    severity: DefectSeverity;
    remedy: string;
  }>;
  costEstimate?: string;
}

export interface SavedNote {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface LibraryFolder {
  id: string;
  name: string;
  notes: SavedNote[];
  updatedAt: number;
}
