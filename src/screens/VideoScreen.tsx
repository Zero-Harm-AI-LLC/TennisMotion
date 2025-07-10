import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useVideoContext } from '../context/VideoContext';
import type { VideoItem } from '../context/VideoContext';

type RootStackParamList = {
  VideoPlayer: undefined;
  // ...other routes
};

const VideoScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  const { videos } = useVideoContext();

  const handleAnalyze = () => {
    navigation.navigate('VideoPlayer');
  };

  const changeStrokeType = () => {
    Alert.alert('Analyze', 'Display a list of stroke types such as Forehand, backhand, ..etc.');
  };  

  const renderVideoItem = ({ item }: { item: VideoItem }) => (
    <View style={styles.videoItem}>
      <Image
        source={item.poster ? { uri: item.poster } : require('../assets/video-placeholder.png')}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <Icon name="play-circle-outline" size={32} color="#fff" style={styles.playIcon} />
      <Text style={styles.videoText}>Video {item.id}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recorded Videos</Text>
      <FlatList
        data={videos}
        horizontal
        keyExtractor={item => item.id}
        renderItem={renderVideoItem}
        style={styles.videoList}
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleAnalyze}>
          <Icon name="video-plus" size={24} color="#fff" />
          <Text style={styles.buttonText}>Analyze</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={changeStrokeType}>
          <Icon name="chart-bar" size={24} color="#fff" />
          <Text style={styles.buttonText}>Stroke Type</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  videoList: { marginBottom: 24 },
  videoItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 120,
    height: 90,
    justifyContent: 'center',
  },
  thumbnail: {
    width: 120,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
  playIcon: {
    position: 'absolute',
    top: 19,
    left: 44,
    opacity: 0.8,
  },
  videoText: { marginTop: 8, fontSize: 14 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  buttonText: { color: '#fff', marginLeft: 8, fontSize: 16 },
});

export default VideoScreen;