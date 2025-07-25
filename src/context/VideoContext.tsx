// src/context/VideoContext.tsx
import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PoseType } from '../utils/types';


export type VideoItem = { vidId: string; uri: string; poster?: string; stroke: string; poses: PoseType[]};
type VideoContextType = {
  videos: VideoItem[];
  addVideo: (vidID: string, vidURI: string, vidPoster: string, vidStroke: string, vidPoses: PoseType[]) => void;
  deleteVideo: (id: string) => void;
};


let storedVideos: VideoItem[] = [];
AsyncStorage.getAllKeys().then(keys => {
  keys.forEach(key => {
    if (key.startsWith('videoUri')) {
      const idNum = key.substring(8)
      //const poster = AsyncStorage.getItem('videoPoster' + idNum);
      AsyncStorage.getItem(key).then(uri => {
        AsyncStorage.getItem('videoPoster' + idNum).then(poster => {
          AsyncStorage.getItem('videoStroke' + idNum).then(stroke => {
            AsyncStorage.getItem('videoPoses' + idNum).then(poses => {
              let poseArray = poses ? JSON.parse(poses) : [];
              if (uri && poster && stroke) {
                storedVideos.push({ vidId: idNum, uri: uri, poster: poster, stroke: stroke, poses: poseArray });
              }
            }).catch(() => {
              // Handle error if needed
            });
          });
        });
      });
    }
  });
});

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<VideoItem[]>(storedVideos);
  
  const addVideo = (
    (vidID: string, vidURI: string, vidPoster: string, vidStroke: string, vidPoses: PoseType[]) => {

      setVideos(vs => [...vs, { vidId: vidID, uri: vidURI, poster: vidPoster, stroke: vidStroke, poses: vidPoses }]);
      AsyncStorage.setItem('videoUri' + vidID, vidURI);
      AsyncStorage.setItem('videoPoster' + vidID, vidPoster);
      AsyncStorage.setItem('videoStroke' + vidID, vidStroke);
      AsyncStorage.setItem('videoPoses' + vidID, JSON.stringify(vidPoses));

    }
  );

  const deleteVideo = (
    (id: string) => {
      setVideos(vs => vs.filter(v => v.vidId !== id));
      AsyncStorage.removeItem('videoUri' + id);
      AsyncStorage.removeItem('videoPoster' + id);
      AsyncStorage.removeItem('videoStroke' + id);
      AsyncStorage.removeItem('videoPoses' + id);
    }
  );

  return (
    <VideoContext.Provider value={{ videos, addVideo, deleteVideo }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideoContext = () => {
  const ctx = useContext(VideoContext);
  if (!ctx) throw new Error('useVideoContext must be used within VideoProvider');
  return ctx;
};