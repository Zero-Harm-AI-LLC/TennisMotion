import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { PermissionsAndroid } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';

// Mock data for videos
// In a real application, you would fetch this from a server or local storage
const mockVideos = [
  { id: '1', uri: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: '2', uri: 'https://www.w3schools.com/html/movie.mp4' },
];

const AnalyzeScreen = () => {
  const [videos, setVideos] = useState(mockVideos);

  const requestCameraPermission = async () => {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;

    const result = await request(permission);
    if (result === RESULTS.GRANTED) {
      console.log('Camera permission granted');
    } else {
      console.warn('Camera permission denied');
    }
  };

  const requestStoragePermission = async () => {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'This app needs access to your storage to save videos.',
        buttonPositive: 'OK',
      }
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Storage permission granted');
    } else {
      console.warn('Storage permission denied');
    }
  };

  // Request permissions on component mount
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      requestCameraPermission();
      requestStoragePermission();
    } else {
      requestCameraPermission();
    }
  }, []);

  const handleRecord = async () => {
    const options = {
      mediaType: 'video',
      cameraType: 'back', // Use the back camera
      videoQuality: 'high',
      presentationStyle: 'fullScreen', // iOS only, but included for completeness
      saveToPhotos: true, // Save to photos on Android
    };
    const result = await launchCamera(options);
    if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
      setVideos([{ id: Date.now().toString(), uri: result.assets[0].uri }, ...videos]);
      Alert.alert('Video Recorded', result.assets[0].uri);
    }
  };

  const handleSelect = async () => {
    const result = await launchImageLibrary({ mediaType: 'video' });
    if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
      setVideos([{ id: Date.now().toString(), uri: result.assets[0].uri }, ...videos]);
      Alert.alert('Video Selected', result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analyzed Videos</Text>
      <FlatList
        data={videos}
        horizontal
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.videoItem}>
            <Icon name="video" size={48} color="#555" />
            <Text style={styles.videoText}>Video {item.id}</Text>
          </View>
        )}
        style={styles.videoList}
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleRecord}>
          <Icon name="video-plus" size={24} color="#fff" />
          <Text style={styles.buttonText}>Record Video</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleSelect}>
          <Icon name="folder-video" size={24} color="#fff" />
          <Text style={styles.buttonText}>Select Video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  videoList: { marginBottom: 24 },
  videoItem: { alignItems: 'center', marginRight: 16 },
  videoText: { marginTop: 8, fontSize: 14 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around' },
  button: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginHorizontal: 8 },
  buttonText: { color: '#fff', marginLeft: 8, fontSize: 16 },
});

export default AnalyzeScreen;
