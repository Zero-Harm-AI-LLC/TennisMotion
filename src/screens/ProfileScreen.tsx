import React, { useState } from 'react';
import { View, Modal, FlatList, Text, StyleSheet, Image, TouchableOpacity, ImageSourcePropType, TextInput} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dropdown } from 'react-native-element-dropdown';

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
  const storeData = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      // saving error
    }
  };
  const getData = async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return value; // value found
      } else {
        return "";
      }
    } catch (e) {
      return "";
      // error reading value
    }
  };
  const feetOptions = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
  ];

  const inchesOptions = [
    { label: '0', value: '0' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '10', value: '10' },
    { label: '11', value: '11' },
    { label: '12', value: '12' },
  ];

  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [nameModalVisible, setNameModalVisible] = React.useState(false);
  const [genderModalVisible, setGenderModalVisible] = React.useState(false);
  const [heightModalVisible, setHeightModalVisible] = React.useState(false);
  const [handednessModalVisible, setHandednessModalVisible] = React.useState(false);
  const [levelModalVisible, setLevelModalVisible] = React.useState(false);
  


  const editModal = () => {
    return (
      <Modal
        animationType="slide"
        visible={editModalVisible}
      >
        <View style={styles.modal}>
          <Text style={{color: '#03adfc', fontSize: 24, marginBottom: 20}}>Level</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => {setEditModalVisible(false); setNameModalVisible(true);}}>
              <Text>Name</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {setEditModalVisible(false); setGenderModalVisible(true);}}>
              <Text>Gender</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {setEditModalVisible(false); setHeightModalVisible(true);}}>
              <Text>Height</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {setEditModalVisible(false); setHandednessModalVisible(true);}}>
              <Text>Handedness</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {setEditModalVisible(false); setLevelModalVisible(true);}}>
              <Text>Level</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  { /* Function to render the modal for name input */}
  const nameModal = () => {
    // state for new name input
    let newName = '';

    return (
      <Modal
      animationType="slide"
      visible={nameModalVisible}
      >
        <View style={styles.modal}>
          <Text style={{color: '#03adfc', fontSize: 24, marginBottom: 20}}>Name</Text>
          {/* TextInput for New Name */}
          <TextInput placeholder='Enter New Name' 
          style={styles.inputText}
          onChangeText={(text) => { newName = text}}/>
          <View style={styles.buttonContainer}>
            { /* Cancel and Confirm Buttons */}
            <TouchableOpacity 
            style={styles.button} 
            onPress={() => {setNameModalVisible(false); newName = '';}}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
            style={styles.button} 
            onPress={() => {
              setNameModalVisible(false); 
              (newName.trim().length > 0 ? AsyncStorage.setItem("Name", newName) : null); 
              newName = '';}}
            >
              <Text>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  };
  

  const genderModal = () => {
    return (
      <Modal
      animationType="slide"
      visible={genderModalVisible}
      >
        <View style={styles.modal}>
          <Text style={{color: '#03adfc', fontSize: 24, marginBottom: 20}}>Gender</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => {AsyncStorage.setItem("Gender", "Male"); setGenderModalVisible(false);}}>
              <Text>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {AsyncStorage.setItem("Gender", "Female"); setGenderModalVisible(false);}}>
              <Text>Female</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  const heightModal = () => {
    // state for height input
    let feet = '';
    let inches = '';

    return (
      <Modal
      animationType="slide"
      visible={heightModalVisible}
      >
        <View style={styles.modal}>
          <Text style={{color: '#03adfc', fontSize: 24, marginBottom: 20}}>Height</Text>
          <View style={styles.buttonContainer}> 
            <Dropdown
              style={styles.dropdown}
              data={feetOptions}
              labelField="label"
              valueField="value"
              placeholder={feet === '' ? "Select your height" : feet}
              onChange={item => {feet = item.value;}}
            />
            <Text>Feet</Text>
            <Dropdown
              style={styles.dropdown}
              data={inchesOptions}
              labelField="label"
              valueField="value"
              placeholder={inches === '' ? "Select your height" : inches}
              onChange={item => {inches = item.value;}}
            />
            <Text>Inches</Text>
          </View>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => {feet === '' || inches === '' ? null : AsyncStorage.setItem("Height", `${feet}\'${inches}"`); setHeightModalVisible(false);}}
          >
            <Text>Next -{">"}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    )
  }

  const handednessModal = () => {
    return (
      <Modal
      animationType="slide"
      visible={handednessModalVisible}
      >
        <View style={styles.modal}>
          <Text style={{color: '#03adfc', fontSize: 24, marginBottom: 20}}>Handedness</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => {AsyncStorage.setItem("Handedness", "Left"); setHandednessModalVisible(false);}}>
              <Text>Left</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {AsyncStorage.setItem("Handedness", "Right"); setHandednessModalVisible(false);}}>
              <Text>Right</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  const levelModal = () => {
    return (
      <Modal
        animationType="slide"
        visible={levelModalVisible}
      >
        <View style={styles.modal}>
          <Text style={{color: '#03adfc', fontSize: 24, marginBottom: 20}}>Level</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => {AsyncStorage.setItem("Level", "Beginner"); setLevelModalVisible(false);}}>
              <Text>Beginner</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {AsyncStorage.setItem("Level", "Intermediate"); setLevelModalVisible(false);}}>
              <Text>Intermediate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {AsyncStorage.setItem("Level", "Advanced"); setLevelModalVisible(false);}}>
              <Text>Advanced</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <View style={styles.container}>
      {/*Display Profile Picture and Name*/}
      <ProfilePic name={getData("Name")} />
      {/* Display Name Edit Button */}
      <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
        <Text>Edit</Text>
      </TouchableOpacity>
      {/* Modal for Edit */}
      {editModal()}
      {/* Modal for Name Input */}
      {nameModal()}
      {/* Modal for Gender Input */}
      {genderModal()}
      {/* Modal for Height Input */}
      {heightModal()}
      {/* Modal for Handedness Input */}
      {handednessModal()}
      {/* Modal for Level Input */}
      {levelModal()}
      {/* Display Other Profile Information */}
      <Info type={"Gender"} info={getData("Gender")} />
      <Info type={"Height"} info={getData("Height")} />
      <Info type={"Handedness"} info={getData("Handedness")} />
      <Info type={"Level"} info={getData("Level")} />
    </View>
  );
}


function ProfilePic(props: {name}) {
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
      <Text style={styles.username}>{props.name} </Text>

    </View>
  );
}

function Info(props: { type: string; info }) {
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
    height: 275,
    marginBottom: 20,
    paddingTop: 60,
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
    bottom: 50,
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
  editButton: {
    backgroundColor: '#00b894',
    padding: 10,
    borderRadius: 10,
    position: 'absolute',
    top: 50,
    right: 25,
  },
  editModal: {
    backgroundColor: 'rgb(255, 255, 255)',
    padding: 20,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  modal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(255, 255, 255)',
    padding: 20,
  },
  inputText: {
    borderBottomWidth: 1, 
    borderBottomColor: '#03adfc', 
    marginBottom: 20, 
    paddingTop: 20
  },
  button: {
   borderColor: '#03adfc',
   borderWidth: 1,
   borderRadius: 5,
   padding: 10,
   margin: 5,
   width: '40%',
   alignItems: 'center',
 },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 20,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dropdown: {
    height: 50,
    width: 100,
    backgroundColor: '#fff',
    borderColor: '#03adfc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    marginBottom: 20,
    color: '#03adfc',
  },
});