// src/context/VideoContext.tsx
import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';


export type VideoItem = { vidId: string; uri: string; poster?: string };
type VideoContextType = {
  videos: VideoItem[];
  addVideo: (vidID: string, vidURI: string, vidPoster: string) => void;
  deleteVideo: (id: string) => void;
};

const mockVideos: VideoItem[] = [
  { vidId: 'Video 1', uri: 'https://example.com/video1.mp4', poster: 'https://example.com/poster1.jpg' },
  { vidId: 'Video 2', uri: 'https://example.com/video2.mp4', poster: 'https://example.com/poster2.jpg' },
  { vidId: 'Video 3', uri: 'https://example.com/video3.mp4', poster: '' },
  { vidId: 'Video 4', uri: 'https://example.com/video4.mp4', poster: 'https://example.com/poster4.jpg' },
];

let storedVideos: VideoItem[] = [];
AsyncStorage.getAllKeys().then(keys => {
  keys.forEach(key => {
    if (key.startsWith('videoUri')) {
      const idNum = key.substring(8)
      //const poster = AsyncStorage.getItem('videoPoster' + idNum);
      AsyncStorage.getItem(key).then(uri => {
        if (uri) {
          AsyncStorage.getItem('videoPoster' + idNum).then(poster => {
            if (poster) {
              storedVideos.push({ vidId: idNum, uri: uri, poster: poster });
              /*
              if (!videos.includes(({ vidId: idNum, uri: uri, poster: poster }))) {
                setVideos(vs => [...vs, { vidId: idNum, uri: uri, poster: poster }]);
              }
              */
            }
          });
        }
      });
    }
  });
});

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<VideoItem[]>(storedVideos);
  
  /*
  AsyncStorage.getAllKeys().then(keys => {
    keys.forEach(key => {
      if (key.startsWith('videoUri')) {
        const idNum = key.substring(8)
        AsyncStorage.getItem(key).then(uri => {
          if (uri) {
            if (!videos.includes(({ vidId: idNum, uri: uri, poster: '' }))) {
              setVideos(vs => [...vs, { vidId: idNum, uri: uri, poster: '' }]);
            }
          }
        });
      }
    });
  });
  */

  
  
  const addVideo = (
    (vidID: string, vidURI: string, vidPoster: string) => {
      /*
      if (videos.some(v => v.id === video.id)) {
        setVideos(vs => vs.filter(v => v.id !== video.id));
        AsyncStorage.setItem('videoUri' + video.id, video.uri);
        return;
      }
        */
      setVideos(vs => [...vs, { vidId: vidID, uri: vidURI, poster: vidPoster }]);
      //setVideos(videos);
      AsyncStorage.setItem('videoUri' + vidID, vidURI);
      AsyncStorage.setItem('videoPoster' + vidID, vidPoster);
      
    }
  );

  const deleteVideo = (
    (id: string) => {
      setVideos(vs => vs.filter(v => v.vidId !== id));
      AsyncStorage.removeItem('videoUri' + id);
      AsyncStorage.removeItem('videoPoster' + id);
      /*
      AsyncStorage.setItem("Videos", JSON.stringify(videos));
      const jsonVal = await AsyncStorage.getItem('Videos');
      const val = jsonVal ? parseInt(jsonVal) : 0;
      console.log("Videos value stored: ", val);
      console.log("First Vid: ", videos[0]);
      */
      
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