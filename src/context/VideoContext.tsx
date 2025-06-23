// src/context/VideoContext.tsx
import React, { createContext, useContext, useState } from 'react';

export type VideoItem = { id: string; uri: string; poster?: string };
type VideoContextType = {
  videos: VideoItem[];
  addVideo: (video: VideoItem) => void;
};

const mockVideos: VideoItem[] = [
  { id: '1', uri: 'https://example.com/video1.mp4', poster: 'https://example.com/poster1.jpg' },
  { id: '2', uri: 'https://example.com/video2.mp4', poster: 'https://example.com/poster2.jpg' },
  { id: '3', uri: 'https://example.com/video3.mp4', poster: '' },
  { id: '4', uri: 'https://example.com/video4.mp4', poster: 'https://example.com/poster4.jpg' },
];

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<VideoItem[]>(mockVideos);
  const addVideo = (video: VideoItem) => setVideos(vs => [video, ...vs]);
  return (
    <VideoContext.Provider value={{ videos, addVideo }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideoContext = () => {
  const ctx = useContext(VideoContext);
  if (!ctx) throw new Error('useVideoContext must be used within VideoProvider');
  return ctx;
};