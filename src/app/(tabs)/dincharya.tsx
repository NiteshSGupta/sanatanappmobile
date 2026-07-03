import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import api from '../../utils/api';
import { useFocusEffect } from 'expo-router';

const DEFAULT_TASKS = [
  { id: '1', title: 'Wake in Brahma Muhurta', icon: 'sun' },
  { id: '2', title: 'Naam Jap (108 times)', icon: 'om' },
  { id: '3', title: 'Daily Workout (45 mins)', icon: 'dumbbell' },
  { id: '4', title: 'Read Scriptures', icon: 'book-open' },
  { id: '5', title: 'Digital Fast After 8 PM', icon: 'mobile-alt' },
];

export default function DashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState(DEFAULT_TASKS.map(t => ({ ...t, completed: false })));
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      
      const today = getTodayString();
      const storedTasks = await AsyncStorage.getItem(`dincharya_${today}`);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
      
      const syncTime = await AsyncStorage.getItem('last_synced');
      if (syncTime) {
        setLastSynced(syncTime);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const toggleTask = async (id: string) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);
    
    try {
      const today = getTodayString();
      await AsyncStorage.setItem(`dincharya_${today}`, JSON.stringify(updatedTasks));
    } catch (e) {
      console.error('Error saving tasks:', e);
    }
  };

  const syncData = async () => {
    if (!user || !user.username) return;
    
    setIsSyncing(true);
    try {
      const today = getTodayString();
      const payload = {
        uuid: user.username,
        date: today,
        sync_data: tasks,
        device_info: 'React Native App',
      };
      
      const response = await api.post('/sync', payload);
      
      if (response.data.success) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSynced(time);
        await AsyncStorage.setItem('last_synced', time);
        Alert.alert('Success', 'Dincharya synced to server.');
      }
    } catch (error) {
      Alert.alert('Sync Failed', 'Could not sync with server. Will try again later.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Namaste, {user.name?.split(' ')[0]}</Text>
          <Text style={styles.subGreeting}>Welcome to your Dincharya</Text>
        </View>
        <TouchableOpacity 
          style={styles.syncButton} 
          onPress={syncData}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#EA580C" />
          ) : (
            <FontAwesome5 name="sync-alt" size={18} color="#EA580C" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <Text style={styles.progressText}>{completedCount} of {tasks.length} tasks</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        {lastSynced && (
          <Text style={styles.syncText}>Last synced: {lastSynced}</Text>
        )}
      </View>

      <View style={styles.tasksContainer}>
        <Text style={styles.sectionTitle}>Daily Routine</Text>
        {tasks.map(task => (
          <TouchableOpacity 
            key={task.id} 
            style={[styles.taskItem, task.completed && styles.taskItemCompleted]}
            onPress={() => toggleTask(task.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, task.completed && styles.iconContainerCompleted]}>
              <FontAwesome5 name={task.icon} size={16} color={task.completed ? "#FFFFFF" : "#EA580C"} />
            </View>
            <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
              {task.title}
            </Text>
            <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
              {task.completed && <FontAwesome5 name="check" size={12} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subGreeting: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
  },
  syncButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA580C',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EA580C',
    borderRadius: 6,
  },
  syncText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 12,
    textAlign: 'right',
  },
  tasksContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
    marginLeft: 4,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F8FAFC',
  },
  taskItemCompleted: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FFEDD5',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerCompleted: {
    backgroundColor: '#EA580C',
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  taskTitleCompleted: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxCompleted: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
});
