import React, { useState } from 'react';
import { View, Modal, FlatList, Text, StyleSheet, Image, TouchableOpacity, ImageSourcePropType} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons'; 

const profileOptions: ImageSourcePropType[] = [
  require('./ProfileIcons/Ball.png'),
  require('./ProfileIcons/Boy1.png'),
  require('./ProfileIcons/Boy2.png'),
  require('./ProfileIcons/Boy3.png'),
  require('./ProfileIcons/Girl1.png'),
  require('./ProfileIcons/Girl2.png'),
  require('./ProfileIcons/Racket.png'),
  // Add more as needed
];

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <ProfilePic />
      <Info type={"Gender"} info={"Male"} />
      <Info type={"Height"} info={"5'10\""} />
      <Info type={"Handedness"} info={"Left"} />
      <Info type={"Level"} info={"Intermediate"} />
    </View>
  );
}

function ProfilePic() {
  const [profileImage, setProfileImage] = useState(profileOptions[0]);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (image: ImageSourcePropType) => {
    setProfileImage(image);
    setModalVisible(false);
  };

  return (
    <View style={styles.profilePicContainer}>
      <Image
        source={profileImage}
        style={styles.pic} 
        accessibilityLabel="Profile Picture"
      />
      <TouchableOpacity style={styles.iconContainer} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="edit" size={24} color="#fff" />
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <FlatList
            data={profileOptions}
            keyExtractor={(item, index) => index.toString()}
            // horizontal
            columnWrapperStyle={{ justifyContent: 'space-around' }}
            numColumns={3}
            contentContainerStyle={styles.optionList}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelect(item)}>
                <Image source={item} style={styles.optionImage} />
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
      <Text style={styles.username}>User Name</Text>
      
    </View>
  );
}

function Info(props: { type: string; info: string }) {
  return (
    <View style={{ width: '100%', alignItems: 'flex-start' }}>
      <Text style={styles.type}>{props.type}</Text>
      <Text style={styles.info}>{props.info}</Text>
      <View style={styles.horizontalLine}></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    alignItems: 'center',
    
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profilePicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#03adfc',
    width: '100%',
    height: 250,
    marginBottom: 20,
  },
  pic: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
    backgroundColor: '#f0f0f0', 
    color: '#111',
  },
  iconContainer: {
    position: 'absolute',
    bottom: 70,
    right: 130,
    backgroundColor: '#00b894',
    borderRadius: 20,
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    paddingBottom: 40,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  optionImage: {
    width: 80,
    height: 80,
    margin: 10,
    borderRadius: 40,
  },
  optionList: {
    marginTop: 40,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
},
  username: {
    textAlign: 'center',
    fontSize: 18,
    marginTop: 10,
  },
  type: {
    color: '#d8d9d8',
    marginHorizontal: 30,
    padding: 7,
  
  },
  info: {
    color: '#000000',
    marginHorizontal: 30,
    padding: 7,
  },
  horizontalLine: {
    height: 2,
    backgroundColor: '#d8d9d8',
    marginVertical: 10,
    marginLeft: 30,
    width: '80%',
  },
});