import React, { useEffect,useRef, useState, useMemo, useCallback } from 'react';
import 'react-native-reanimated';
import { View, Text, SafeAreaView, TextInput, Modal, TouchableOpacity, StyleSheet, Alert, useWindowDimensions, Dimensions} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Camera, useFrameProcessor, useCameraDevices } from 'react-native-vision-camera';
import { requestCameraPermission, requestMicrophonePermission } from '../utils/permissions';
import Svg, { Line, Rect } from 'react-native-svg';
import { detectObjects} from '../utils/detectObjects';
import { ObjectType } from '../utils/types';
import { Worklets } from 'react-native-worklets-core';
import { useFocusEffect } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useVideoContext } from '../context/VideoContext';
import Animated, { defineAnimation, useAnimatedProps } from 'react-native-reanimated';
import { saveVideoToGallery, createVideoThumbnail } from '../utils/gallery';

type RootStackParamList = {
  SessionScreen: undefined;
  // add other screens here if needed
};

const AnimatedBox = Animated.createAnimatedComponent(Rect);

const usePosition = (object: ObjectType) => {
  if (object) {
    console.log("X-Val: ", object.x*200)
    return ( 
      useAnimatedProps(() => ({
        x: object.x*200 + 100,
        y: object.y*200 + 100,
        width: object.width*200 + 100,
        height: object.height*200 + 100,
      }))
    );
  }
  else {
    return (
      useAnimatedProps(() => ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      }))
    );
  }
};

const defaultObject = [
  {class: 'tennis-ball', confidence: 0, height: 0, width: 0, x: 0, y: 0},
  {class: 'player-front', confidence: 0, height: 0, width: 0, x: 0, y: 0},
  {class: 'player-back', confidence: 0, height: 0, width: 0, x: 0, y: 0}
]



const SessionPlayer = () => {
  const cameraRef = useRef<Camera>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const [objects, setObjects] = useState<ObjectType[]>(defaultObject);
  const [isRecording, setIsRecording] = useState(false);
  let frameNum = 0  // what frame we are on
  const [videoTitle, setVideoTitle] = useState('');
  const [pendingVideoUri, setPendingVideoUri] = useState<string | null>(null);
  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const { addVideo } = useVideoContext();

  const desiredWidth = 1920;
  const desiredHeight = 1080;
  const desiredFps = 30; // You can set to 60 if your device supports it

  const dimensions = useWindowDimensions();

  const ballPosition = usePosition(objects[0]);
  const frontPlayerPosition = usePosition(objects[1]);
  const backPlayerPosition = usePosition(objects[2]);

  const format = useMemo(() => {
    if (!device?.formats) return undefined;
    return (
      device.formats.find(
        (f) =>
          f.videoWidth === desiredWidth &&
          f.videoHeight === desiredHeight &&
          f.minFps <= desiredFps &&
          desiredFps <= f.maxFps
      ) || device.formats[0]
    );
  }, [device, desiredWidth, desiredHeight, desiredFps]);

  const handlePositions = useCallback((results: ObjectType[]) => {
    // This runs on the JS thread.
    // You can call setState, navigation, etc. here
    console.log(results)
    setObjects(results)
    console.log("Final Objects: ", objects)
    /*
    setObjects(prevObjects => {
      const newObjects = prevObjects.concat(results);
      console.log(newObjects);
      //return results
      return newObjects;
    });
    */

  }, []);
  const sendToJS = Worklets.createRunOnJS(handlePositions);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    if (!isRecording) {
      const resultsCopy: ObjectType[] = [...defaultObject];
      console.log("defaultObject not recording: ", resultsCopy)
      sendToJS(resultsCopy); // Calls JS safely
    }
    else {
        //const courtPoints = detectCourt(frame);
        //console.log("calling detect court if frame 200 only ", courtPoints);
    
      const results = detectObjects(frame) as unknown as ObjectType[];
      const resultsCopy: ObjectType[] = [...defaultObject];
      // turn 90 degrees clockwise
      // This is necessary because the camera frame is rotated 90 degrees clockwise
      // and we need to adjust the coordinates accordingly.
      // The frame width and height are swapped in the poseObject.
      const yFactor = dimensions.width / frame.height;
      const xFactor = dimensions.height / frame.width;
      /*
        On iOS and Android, front camera preview is usually mirrored by default.
        */
      // Log frame and dimensions for debugging
      if (__DEV__) {
        console.log('Frame dimensions:', frame.width, frame.height);
        console.log('Screen dimensions:', dimensions.width, dimensions.height);
        console.log('X factor:', xFactor, 'Y factor:', yFactor);
      }

      // Make a new array with scaled x, y, width, height
      
      const adjustedResults = results.map(obj => ({
        ...obj,
        x: obj.x * xFactor,
        y: obj.y * yFactor
      }));

      const completeResults: ObjectType[] = []
      let i = 0
      if (adjustedResults.length > i && adjustedResults[i].class === 'tennis-ball') {
        completeResults.push(adjustedResults[i])
        i++
      } else {
        completeResults.push(resultsCopy[0])
        console.log("completeResults 1: ", completeResults)
      }
      if (adjustedResults.length > i && adjustedResults[i].class === 'player-front') {
        completeResults.push(adjustedResults[i])
        i++
      } else {
        completeResults.push(resultsCopy[1])
        console.log("completeResults 2: ", completeResults)
      }
      if (adjustedResults.length > i && adjustedResults[i].class === 'player-back') {
        completeResults.push(adjustedResults[i])
        i++
      } else {
        completeResults.push(resultsCopy[2])
        console.log("completeResults 4: ", completeResults)
      }
      
      console.log('Tennis objects position:', results);
      console.log('Adjusted Tennis objects position:', resultsCopy);
      console.log('Complete Results: ', completeResults)
      sendToJS(completeResults); // Calls JS safely
      //sendToJS(adjustedResults)
    }
  }, [sendToJS]);

  useEffect(() => {
    (async () => {
      const cameraStatus = await requestCameraPermission();
      const micStatus = await requestMicrophonePermission();
      setPermissionsGranted(
        cameraStatus === 'granted' &&
        micStatus === 'granted'
      );
    })();
  }, []);

  // Handle start recording
  const handleStartRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording) return;
    setIsRecording(true);
    try {
      await cameraRef.current.startRecording({
        onRecordingFinished: async (video) => {
          try {
            setPendingVideoUri(video.path.startsWith('file://') ? video.path : `file://${video.path}`);
            setTitleModalVisible(true);
          } catch (e) {
            Alert.alert('Error', 'Failed to save video to gallery.');
          }
          setIsRecording(false);
        },
        onRecordingError: (error) => {
          Alert.alert('Recording Error', error.message || 'Unknown error');
          setIsRecording(false);
        },
      });
    } catch (e) {
      setIsRecording(false);
      Alert.alert('Error', 'Could not start recording.');
    }
  }, [isRecording]);

  const handleStopRecording = useCallback(() => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
    setIsRecording(false);
  }, [isRecording]);

  const handleModalCancel = async () => {
    setTitleModalVisible(false);
    setPendingVideoUri(null);
    navigation.navigate('SessionScreen');
  }

  const handleModalClose = async () => {
    if (!pendingVideoUri) return;
    try {
      const savedUri = await saveVideoToGallery(pendingVideoUri);
      setPendingVideoUri(savedUri);
      const poster = await createVideoThumbnail(pendingVideoUri);
      console.log("Adding now");
      console.log("Objects: ", objects)
      //addSVideo(videoTitle, pendingVideoUri, posterUri || '', objects);
      //console.log("Video successfully added: " + videoTitle);
      //await CameraRoll.save(pendingVideoUri, { type: 'video' });
      setTitleModalVisible(false);
      setPendingVideoUri(null);
      navigation.navigate('SessionScreen');
    } catch (e) {
      console.error(e)
      Alert.alert('Error', 'Failed to save video to gallery.');
      setTitleModalVisible(false);
      setPendingVideoUri(null);
      navigation.navigate('SessionScreen');
    }
  };

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' },
      });
      return () => {
        navigation.getParent()?.setOptions({
          tabBarStyle: undefined, // Restore default
        });
      };
    }, [navigation])
  );

  if (!device || !permissionsGranted) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  console.log("Objects: ", objects)

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused && permissionsGranted}
        video={true}
        audio={true}
        format={format}
        fps={desiredFps}
        onError={(error) => console.error('Camera error:', error)}
        frameProcessor={frameProcessor}
      />
      <Svg
        height={dimensions.height}
        width={dimensions.width}
        style={styles.linesContainer}
      >
        {objects.map((obj) => (
          <Rect
            x={obj.x}
            y={obj.y}
            width={obj.width}
            height={obj.height}
            fill="transparent"
            stroke="red"
            strokeWidth="3"
          />
        ))}
      </Svg>
      <View style={styles.controlsOverlay}>
        {!isRecording ? (
          <TouchableOpacity style={styles.recordButton} onPress={handleStartRecording}>
            <Icon name="record" size={64} color="#ff0000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={handleStopRecording}>
            <Icon name="stop" size={64} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
      <Modal
        animationType="slide"
        visible={titleModalVisible}
        //onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>
          <TextInput
            autoFocus={true}
            style={styles.inputText}
            placeholder="Enter video title"
            value={videoTitle}
            onChangeText={setVideoTitle}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.okButton]} onPress={handleModalClose}>
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleModalCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  modal: {
    flex: 1,
    //width: '40%',
    //height: '30%',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    zIndex: 9999,
    backgroundColor: 'rgb(255, 255, 255)',
    padding: 20,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    alignItems: 'center',
    marginBottom: 10,
  },
  stopButton: {
    alignItems: 'center',
    marginBottom: 0,
  },
  inputText: {
    width: 250,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Android Elevation
    elevation: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 250,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  okButton: {
    backgroundColor: 'green',
  },
  cancelButton: {
    backgroundColor: 'red',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  linesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
});

export default SessionPlayer;
