import * as React from 'react';
import { View, Button, Text, StyleSheet, ActivityIndicator, Modal, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dropdown } from 'react-native-element-dropdown';

export default function ProfileSetup() {
  //if (AsyncStorage.getItem("Na") === null) {
  const [modalVisible1, setModalVisible1] = React.useState(true);
  const [modalVisible2, setModalVisible2] = React.useState(false);
  const [modalVisible3, setModalVisible3] = React.useState(false);
  const [modalVisible4, setModalVisible4] = React.useState(false);
  const [modalVisible5, setModalVisible5] = React.useState(false);

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



    const [name, setName] = React.useState('');
    const isNameFilled = name.trim().length > 0;

    const [feet, setFeet] = React.useState('');
    const [inches, setInches] = React.useState('');
    
    
    return (
        <View>
            {/* Modal for Name Input */}
            <Modal
                animationType="slide"
                visible={modalVisible1}
            >
                <View style={styles.modal}>
                <Text style={{color: '#03adfc', fontSize: 24, marginBottom: 20}}>Time To Set Up Your Profile!</Text>
                <Text style={{color: '#03adfc', fontSize: 24, marginBottom: 20}}>Name</Text>
                <TextInput placeholder="Enter your name" 
                onChangeText={(text) => {AsyncStorage.setItem("Name", text); setName(text);}} 
                style={styles.inputText}/>
                <TouchableOpacity 
                style={styles.button} 
                onPress={() => {setModalVisible1(false); setModalVisible2(true);}}
                disabled={!isNameFilled}
                >
                    <Text>Next -{">"}</Text>
                </TouchableOpacity>
                </View>
            </Modal>
            {/* Modal for Height Input */}
            <Modal
                animationType="slide"
                visible={modalVisible2}
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
                            onChange={item => {
                                setFeet(item.value);
                                
                            }}
                        />
                        <Text>Feet</Text>
                        <Dropdown
                            style={styles.dropdown}
                            data={inchesOptions}
                            labelField="label"
                            valueField="value"
                            placeholder={inches === '' ? "Select your height" : inches}
                            onChange={item => {
                                setInches(item.value);
                            }}
                        />
                        <Text>Inches</Text>
                    </View>
                    <TouchableOpacity 
                    style={styles.button} 
                    onPress={() => {AsyncStorage.setItem("Height", `${feet}\'${inches}"`); setModalVisible2(false); setModalVisible3(true);}}
                    disabled={feet === '' || inches === ''}
                    >
                        <Text>Next -{">"}</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
            {/* Modal for Gender */}
            <Modal
                animationType="slide"
                visible={modalVisible3}
            >
                <View style={styles.modal}>
                    <Text style={{color: '#03adfc', fontSize: 24, marginBottom: 20}}>Gender</Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={() => {AsyncStorage.setItem("Gender", "Male"); setModalVisible3(false); setModalVisible4(true);}}>
                            <Text>Male</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => {AsyncStorage.setItem("Gender", "Female"); setModalVisible3(false); setModalVisible4(true);}}>
                            <Text>Female</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {/* Modal for Handedness */}
            <Modal
                animationType="slide"
                visible={modalVisible4}
            >
                <View style={styles.modal}>
                    <Text style={{color: '#03adfc', fontSize: 24, marginBottom: 20}}>Handedness</Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={() => {AsyncStorage.setItem("Handedness", "Left"); setModalVisible4(false); setModalVisible5(true)}}>
                            <Text>Left</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => {AsyncStorage.setItem("Handedness", "Right"); setModalVisible4(false); setModalVisible5(true)}}>
                            <Text>Right</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {/*Modal for Level */}
            <Modal
                animationType="slide"
                visible={modalVisible5}
            >
                <View style={styles.modal}>
                    <Text style={{color: '#03adfc', fontSize: 24, marginBottom: 20}}>Level</Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={() => {AsyncStorage.setItem("Level", "Beginner"); setModalVisible5(false);}}>
                            <Text>Beginner</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => {AsyncStorage.setItem("Level", "Intermediate"); setModalVisible5(false);}}>
                            <Text>Intermediate</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => {AsyncStorage.setItem("Level", "Advanced"); setModalVisible5(false);}}>
                            <Text>Advanced</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
  //}
};


const styles = StyleSheet.create({
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
    buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
 },
 button: {
   borderColor: '#03adfc',
   borderWidth: 1,
   borderRadius: 5,
   padding: 10,
   margin: 5,
   width: '30%',
   alignItems: 'center',
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