import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import api from '../../utils/api';

const DEFAULT_TASKS = [
  { id: '1', title: 'Cold bath (Snan)', icon: 'water', completed: false },
  { id: '2', title: 'Morning meditation (30 min)', icon: 'spa', completed: false },
  { id: '3', title: 'Surya Namaskar (12 rounds)', icon: 'sun', completed: false },
  { id: '4', title: 'Pranayama (15 min)', icon: 'wind', completed: false },
  { id: '5', title: 'Scripture study', icon: 'book', completed: false },
  { id: '6', title: 'Sattvic meal', icon: 'leaf', completed: false },
  { id: '7', title: 'Evening journaling', icon: 'pen', completed: false },
];

const getWeekDaysList = () => {
  const daysArr = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' }); // S, M, T, W...
    const dayNum = d.getDate();
    daysArr.push({
      dateStr,
      dayName,
      dayNum,
      completed: false,
    });
  }
  return daysArr;
};

export default function DincharyaScreen() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Add task state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskIcon, setNewTaskIcon] = useState('clipboard-list');

  // Days list for the calendar row
  const [weekDays, setWeekDays] = useState<any[]>(() => getWeekDaysList());

  const loadData = useCallback(async (dateToLoad: string) => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      const storedTasks = await AsyncStorage.getItem(`dincharya_${dateToLoad}`);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      } else {
        setTasks(DEFAULT_TASKS.map(t => ({ ...t, completed: false })));
      }

      const syncTime = await AsyncStorage.getItem('last_synced');
      if (syncTime) {
        setLastSynced(syncTime);
      }

      const baseDays = getWeekDaysList();
      const updatedWeekDays = await Promise.all(baseDays.map(async (wd) => {
        const dateTasksStr = await AsyncStorage.getItem(`dincharya_${wd.dateStr}`);
        if (dateTasksStr) {
          const dateTasks = JSON.parse(dateTasksStr);
          const hasCompleted = dateTasks.some((t: any) => t.completed);
          return { ...wd, completed: hasCompleted };
        }
        return wd;
      }));
      setWeekDays(updatedWeekDays);

    } catch (e) {
      console.error('Error loading data:', e);
    }
  }, []);

  // Reload whenever active date changes
  useEffect(() => {
    if (selectedDate) {
      const timer = setTimeout(() => {
        loadData(selectedDate);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedDate, loadData]);

  useFocusEffect(
    useCallback(() => {
      if (selectedDate) {
        const timer = setTimeout(() => {
          loadData(selectedDate);
        }, 0);
        return () => clearTimeout(timer);
      }
    }, [selectedDate, loadData])
  );

  const toggleTask = async (id: string) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);

    try {
      await AsyncStorage.setItem(`dincharya_${selectedDate}`, JSON.stringify(updatedTasks));

      // Update dots on calendar row
      setWeekDays(prev => prev.map(wd => {
        if (wd.dateStr === selectedDate) {
          return { ...wd, completed: updatedTasks.some(t => t.completed) };
        }
        return wd;
      }));
    } catch (e) {
      console.error('Error saving tasks:', e);
    }
  };

  const handleAddNewTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task name.');
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      icon: newTaskIcon,
      completed: false,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    try {
      await AsyncStorage.setItem(`dincharya_${selectedDate}`, JSON.stringify(updatedTasks));
      setIsAddModalOpen(false);
      setNewTaskTitle('');
    } catch (e) {
      console.error('Error saving new task:', e);
    }
  };

  const syncData = async () => {
    if (!user || !user.username) return;

    setIsSyncing(true);
    try {
      const payload = {
        uuid: user.username,
        date: selectedDate,
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
      console.error('Sync failed:', error);
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
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const getProgressLabel = (percent: number) => {
    if (percent === 0) return 'Get started!';
    if (percent < 50) return 'Just starting';
    if (percent < 100) return 'Going strong!';
    return 'Fully completed!';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header Title with Sync Button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dincharya</Text>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={syncData}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#EA580C" />
            ) : (
              <FontAwesome5 name="sync-alt" size={16} color="#EA580C" />
            )}
          </TouchableOpacity>
        </View>

        {/* Calendar Day Row */}
        <View style={styles.calendarContainer}>
          {weekDays.map((wd) => {
            const isSelected = wd.dateStr === selectedDate;
            return (
              <TouchableOpacity
                key={wd.dateStr}
                style={[styles.calendarDayBox, isSelected && styles.calendarDayBoxSelected]}
                onPress={() => setSelectedDate(wd.dateStr)}
              >
                <Text style={[styles.dayNameText, isSelected && styles.dayNameTextSelected]}>{wd.dayName}</Text>
                <Text style={[styles.dayNumText, isSelected && styles.dayNumTextSelected]}>{wd.dayNum}</Text>
                {/* Active completion dot indicator under date */}
                <View style={[styles.dotIndicator, wd.completed ? styles.dotCompleted : styles.dotEmpty]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Progress circular indicator card */}
        <View style={styles.progressCard}>
          <View style={styles.circularProgressWrapper}>
            <Svg width="70" height="70" viewBox="0 0 70 70">
              <Circle
                cx="35" cy="35" r="28"
                stroke="#F1F5F9" strokeWidth="6" fill="transparent"
              />
              <Circle
                cx="35" cy="35" r="28"
                stroke="#EA580C" strokeWidth="6" fill="transparent"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - progressPercent / 100)}
              />
            </Svg>
            <View style={styles.percentTextContainer}>
              <Text style={styles.percentText}>{progressPercent}%</Text>
            </View>
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressCountText}>{completedCount}/{tasks.length}</Text>
            <Text style={styles.progressLabelSubText}>tasks completed</Text>
            <Text style={styles.progressStatusText}>{getProgressLabel(progressPercent)}</Text>
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksHeader}>
          <Text style={styles.tasksSectionTitle}>TASKS</Text>
          <TouchableOpacity style={styles.btnAddTask} onPress={() => setIsAddModalOpen(true)}>
            <Text style={styles.btnAddTaskText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Tasks List */}
        <View style={styles.listContainer}>
          {tasks.map(task => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskItem, task.completed && styles.taskItemCompleted]}
              onPress={() => toggleTask(task.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, task.completed && styles.iconContainerCompleted]}>
                <FontAwesome5 name={task.icon} size={15} color={task.completed ? "#FFFFFF" : "#EA580C"} />
              </View>
              <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                {task.title}
              </Text>
              <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                {task.completed && <FontAwesome5 name="check" size={10} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {lastSynced && (
          <Text style={styles.lastSyncedText}>Last synced: {lastSynced}</Text>
        )}

      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Task</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Read Swami Vivekananda scriptures"
              placeholderTextColor="#94A3B8"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />

            <Text style={styles.iconSelectionLabel}>SELECT ICON</Text>
            <View style={styles.iconGrid}>
              {[
                { name: 'water', label: 'Water' },
                { name: 'spa', label: 'Yoga' },
                { name: 'sun', label: 'Sun' },
                { name: 'wind', label: 'Breath' },
                { name: 'book', label: 'Book' },
                { name: 'leaf', label: 'Meal' },
                { name: 'pen', label: 'Journal' },
                { name: 'dumbbell', label: 'Gym' },
              ].map((ic) => (
                <TouchableOpacity
                  key={ic.name}
                  style={[styles.iconSelectButton, newTaskIcon === ic.name && styles.iconSelectButtonActive]}
                  onPress={() => setNewTaskIcon(ic.name)}
                >
                  <FontAwesome5 name={ic.name} size={18} color={newTaskIcon === ic.name ? '#EA580C' : '#64748B'} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAddButton} onPress={handleAddNewTask}>
                <Text style={styles.modalAddButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0', // warm beige background
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F4F0',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  syncButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  calendarDayBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  calendarDayBoxSelected: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  dayNameText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 6,
  },
  dayNameTextSelected: {
    color: '#EA580C',
  },
  dayNumText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 6,
  },
  dayNumTextSelected: {
    color: '#EA580C',
  },
  dotIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotCompleted: {
    backgroundColor: '#EA580C',
  },
  dotEmpty: {
    backgroundColor: '#E2E8F0',
  },
  progressCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 24,
  },
  circularProgressWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  percentTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
  },
  progressInfo: {
    flex: 1,
  },
  progressCountText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  progressLabelSubText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  progressStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    marginTop: 6,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
  },
  btnAddTask: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    backgroundColor: '#FFF7ED',
  },
  btnAddTaskText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
  },
  listContainer: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  taskItemCompleted: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FFEDD5',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconContainerCompleted: {
    backgroundColor: '#EA580C',
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  taskTitleCompleted: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxCompleted: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  lastSyncedText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 20,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 20,
  },
  iconSelectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 12,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  iconSelectButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  iconSelectButtonActive: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalAddButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
