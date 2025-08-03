// src/context/VideoContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import SQLite, { TableField, TableInfo, Item, Condition} from '../utils/database';
import { ResultSet } from 'react-native-sqlite-storage';

export type VideoItem = { title: string;
                          uri: string; 
                          poster: string; 
                          stroke: string; 
                          data: any[]};

type VideoContextType = {
  videos: VideoItem[];
  sessions: VideoItem[];
  addVideo: (item: VideoItem) => void;
  deleteVideo: (id: string, stroke: string) => void;
};

let storedVideos: VideoItem[] = [];
let storedSessions: VideoItem[] = [];
const VideoContext = createContext<VideoContextType>({
  videos: storedVideos,
  sessions: storedSessions,
  addVideo: () => {},
  deleteVideo: () => {}
});

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<VideoItem[]>(storedVideos);
  const [sessions, setSessions] = useState<VideoItem[]>(storedSessions);
  const _sqLite = new SQLite('tennismotion.db', 'default');
  const _tableFields: TableField[] = [
    { columnName: "id", dataType: "INTEGER PRIMARY KEY AUTOINCREMENT" },
    { columnName: "title", dataType: "TEXT" },
    { columnName: "uri", dataType: "TEXT" },
    { columnName: "created_at", dataType: "TEXT" }, // "YYYY-MM-DD HH:MM:SS.SSS"
    { columnName: "poster", dataType: "TEXT" },
    { columnName: "stroke", dataType: "TEXT" },   // either tennis stroke of tennis session
    { columnName: "data", dataType: "TEXT" }  // JSON.stringify of either PoseType[] or ObjectType[]
  ];

  const _tableName = 'Videos';
  const _tableInfo: TableInfo = { tableName: _tableName, tableFields: _tableFields };

  async function createVideoTable(): Promise<[ResultSet]| undefined> {
    const resultsSel = await _sqLite.createTable(_tableInfo);
    if (__DEV__) { console.log(resultsSel); }

    if (resultsSel && resultsSel.length) {
      return resultsSel;
    } else {
      if (__DEV__) { Alert.alert('Error', 'Failed create table for videos'); }
    }
  }  

  function parseResultSetToVideoItems(resultSet: ResultSet): void {
    const items: VideoItem[] = [];
    const sess:VideoItem[] = [];

    if (__DEV__) { console.log("results length", resultSet.rows.length); }
    for (let i = 0; i < resultSet.rows.length; i++) {
      let row = resultSet.rows.item(i);
      if (__DEV__) { console.log("results row", row); }
      if (row.stroke === 'session') {
        sess.push({
          title: row.title,
          uri: row.uri,
          poster: row.poster,
          stroke: row.stroke,
          data: JSON.parse(row.data), // or just row.data if not stringified
        });
      } else {
        items.push({
          title: row.title,
          uri: row.uri,
          poster: row.poster,
          stroke: row.stroke,
          data: JSON.parse(row.data), // or just row.data if not stringified
        });
      }
    }

    if (__DEV__) { console.log("results row", items); }
    setVideos(items);
    setSessions(sess);
  }

  async function loadVideoItems() {
    const [resultSet] = await _sqLite.queryItems(_tableName);
    parseResultSetToVideoItems(resultSet);
  };

  useEffect(() => {
    const initialize = async () => {
      await createVideoTable();      // Wait for table creation to finish
      await loadVideoItems();        // Now load items safely
    };

    initialize();
  }, []);

  const addVideo = (vidItem: VideoItem) => {
    // add to database
    const item: Item = {
      title: vidItem.title,
      uri: vidItem.uri,
      poster: vidItem.poster,
      stroke: vidItem.stroke,
      data: JSON.stringify(vidItem.data),
    };
        
    _sqLite.insertItem(_tableName, item).then((success: boolean) => {
      if (success) {
        if (__DEV__) { console.log('Video added successfully to database ', item); }
        if (vidItem.stroke === 'session') {
          setSessions(sessions => [...sessions, vidItem]);
        } else {
          setVideos(videos => [...videos, vidItem]);
        }
      } else {
        if (__DEV__) { console.log('Failed to add video to database'); }
        Alert.alert("Warning", `Can't add video to database '${vidItem.title}'`);
      }
    })
    .catch((error: any) => {
      Alert.alert("Error", error);
      console.error('Error inserting video:', error);
    });
  }

  const deleteVideo = (uri: string, stroke: string) => {
    const condition: Condition = { uri: uri, stroke: stroke };

    // Removing an item
    _sqLite.deleteItem(_tableName, condition).then((success: boolean) => {
      if (success) {
        if (__DEV__) { console.log('Video deleted successfully'); }
        if (stroke === 'session') {
          setSessions(sessions => sessions.filter(sessions => sessions.uri !== uri));
        } else {
          setVideos(videos => videos.filter(video => video.uri !== uri));
        }
      } else {
        if (__DEV__) { console.log('Failed to delete video'); }
        Alert.alert("Warning", `Can't delete video '${uri}'`);
      }
    })
    .catch((error: any) => {
      Alert.alert("Error", error);
      console.error('Error inserting video:', error);
    });
  }

  return (
    <VideoContext.Provider value={{ videos, sessions, addVideo, deleteVideo }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideoContext = () => {
  const ctx = useContext(VideoContext);
  if (!ctx) throw new Error('useVideoContext must be used within VideoProvider');
  return ctx;
};