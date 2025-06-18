import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function AppClipScreen() {
  const [buyIn, setBuyIn] = useState('');
  const [cashOut, setCashOut] = useState('');
  const [location, setLocation] = useState('');
  const params = useLocalSearchParams();

  const handleSave = () => {
    // Save the session data
    // This would typically save to local storage or send to your backend
    console.log('Session saved:', { buyIn, cashOut, location });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Session Entry</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Buy-in Amount</Text>
        <TextInput
          style={styles.input}
          value={buyIn}
          onChangeText={setBuyIn}
          keyboardType="decimal-pad"
          placeholder="Enter buy-in amount"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Cash-out Amount</Text>
        <TextInput
          style={styles.input}
          value={cashOut}
          onChangeText={setCashOut}
          keyboardType="decimal-pad"
          placeholder="Enter cash-out amount"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Enter location"
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Session</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fullAppButton}>
        <Text style={styles.fullAppButtonText}>Open Full App</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fullAppButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  fullAppButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
}); 