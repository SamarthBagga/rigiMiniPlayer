export interface Video {
  id: string;
  source: any;
  title: string;
  thumbnail: any;
  duration: string;
  views: string;
  channel?: string;
  uploadedAt?: string;
}

export interface PlayerState {
  isMinimized: boolean;
  currentVideo: Video | null;
}