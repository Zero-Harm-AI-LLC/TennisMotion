import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, Image, Alert, PanResponder, Dimensions, Modal} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useVideoContext } from '../context/VideoContext';
import type { VideoItem } from '../context/VideoContext';
import { center } from '@shopify/react-native-skia';
import Animated, {useAnimatedStyle, useSharedValue, withTiming, withSpring, runOnJS} from 'react-native-reanimated';
import {Gesture, GestureDetector, GestureHandlerRootView} from 'react-native-gesture-handler';
import {Video} from 'react-native-video';
import VideoPlayer from 'react-native-video-controls';
//import Swipeable from 'react-native-swipeable-row';

type RootStackParamList = {
  VideoPlayer: undefined;
  // ...other routes
};



const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.3;

const SwipeableItem = ({ item, onDelete }) => {
  const translateX = useSharedValue(0);
  const height = useSharedValue(180);
  const opacity = useSharedValue(1);
  const [videoVisible, setVideoVisible] = useState(false);

  const { videos, addVideo, deleteVideo } = useVideoContext();
  const handleDelete = (id: string) => { deleteVideo(id);};

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -SCREEN_WIDTH);
      }
    })
    .onEnd(() => {
      if (translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withSpring(-SCREEN_WIDTH);
        height.value = withSpring(0);
        opacity.value = withSpring(0, {}, () => {
          runOnJS(handleDelete)(item.vidId);
          console.log(videos.length);
          for (let i = 0; i < videos.length; i++) {
            console.log(videos[i].vidId);
          }
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const rContainerStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));

  const handleCloseModal = () => {
    setVideoVisible(false);
    const id = item.vidId;
    const uri = item.uri;
    const poster = item.poster || '';
    const stroke = item.stroke || '';
    const poseArray = item.poses || [];
    deleteVideo(id);
    console.log(videos.length);
    addVideo(id, uri, poster, stroke, poseArray);
    console.log(videos.length);
  }

  return (
    <View style={{ marginBottom: 30, alignContent: 'center' }}> 
      <Animated.View style={[styles.itemContainer, rContainerStyle]}> 
        <Icon name="trash-can" size={50} color="#fff" style={styles.deleteIcon} />
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.videoItem, rStyle]}>

            <Image
              source={item.poster ? { uri: item.poster } : require('../assets/video-placeholder.png')}
              style={styles.thumbnail}
              resizeMode="cover"
            />
              
            <TouchableOpacity onPress={() => setVideoVisible(true)} style={styles.playIcon}>
              <Icon name="play-circle-outline" size={50} color="black" />
            </TouchableOpacity>
            
            <Modal
              visible={videoVisible}
              animationType='slide'
              onRequestClose={handleCloseModal}
            >
              
              <Video
                source={{ uri: item.uri }}
                //onFullscreenPlayerDidDismiss={() => handleCloseModal()}
                style={styles.video}
                resizeMode="contain"
                controls
                //onBack={() => setVideoVisible(false)}
              
              />
              
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Icon name="close" size={28} color="white" />
              </TouchableOpacity>
              
            </Modal>    
          
          </Animated.View>
        </GestureDetector>
        
      </Animated.View>
      <Text style={styles.videoText}> {item.vidId} ({item.stroke})</Text>
    </View>   
  );
};

const VideoScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  const { videos } = useVideoContext();

  const handleAnalyze = () => {
    navigation.navigate('VideoPlayer');
  };


  const { deleteVideo } = useVideoContext();
  const handleDelete = (id: string) => {
      deleteVideo(id);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Text style={styles.title}>Recorded Videos</Text>
      <FlatList
        data={videos}
        keyExtractor={item => item.vidId}
        renderItem={(item) => (
          <SwipeableItem item={item.item} onDelete={handleDelete} />)}
        style={styles.videoList}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1, alignItems: 'center'}}
      />
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleAnalyze}>
          <Icon name="video-plus" size={24} color="#fff" />
          <Text style={styles.buttonText}>Analyze</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    paddingVertical: 16, 
    backgroundColor: '#fff' 
  },
  title: {
    fontSize: 22, 
    fontWeight: 'bold', 
    margin: 20,
    marginTop: 40,
    marginBottom: 10,
  },
  videoList: {
    margin: 30,
    width: '100%',
    alignSelf: 'center',
  },
  itemContainer: {
    width: '100%',
    height: '100%',
    //alignSelf: 'flex-end',
    //marginBottom: 50,
    borderRadius: 10,
    backgroundColor: 'red',
    //overflow: 'hidden',
  },
  videoItem: {
    alignItems: 'center',  
    //marginTop: 25,
    //marginBottom: 25,   
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignContent: 'center',
    backgroundColor: 'red',
    padding: 0,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 250,
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#ccc',
    overflow: 'hidden',
  },
  deleteIcon: {
    position: 'absolute',
    alignSelf: 'flex-end',
    right: 20,
    top: 75,
    color: '#fff',
    fontSize: 24,
  },
  playIcon: {
    position: 'absolute',
    top: '35%',
    left: '40%',
    opacity: 0.8,
    zIndex: 9999,
  },
  videoText: {
    marginTop: 3,
    fontSize: 16,
    fontFamily: 'Chalkboard SE',
    alignSelf: 'center',
  },
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
  closeButton: {
    position: 'absolute',
    top: 63,
    left: 30,
    zIndex: 9999,
  },
  video: {
    width: '100%',
    height: '100%',
  }
});

export default VideoScreen;