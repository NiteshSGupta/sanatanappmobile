import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '../../components/CustomAlert';
import Svg, { Circle } from 'react-native-svg';
import api from '../../utils/api';



const getMonthDaysList = (dateString?: string) => {
  const daysArr = [];
  const date = dateString ? new Date(dateString) : new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  
  // Total days in month
  const totalDays = new Date(year, month + 1, 0).getDate();
  
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' }); // S, M, T...
    const dayNum = i;
    
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
  const [newTaskType, setNewTaskType] = useState<'everyday' | 'oneday'>('everyday');
  
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [longPressedTask, setLongPressedTask] = useState<any>(null);

  // Challenge context
  const [challengeStart, setChallengeStart] = useState<Date | null>(null);
  const [challengeEnd, setChallengeEnd] = useState<Date | null>(null);
  const [isChallengeActive, setIsChallengeActive] = useState(false);

  // Custom Alert States
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showCustomAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const getDayState = (dateStr: string, active: boolean, start: Date | null, end: Date | null) => {
    if (!active || !start || !end) return 'Past Day'; 
    const todayStr = new Date().toISOString().split('T')[0];
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    if (dateStr < startStr || dateStr > endStr) return 'Not Started';
    if (dateStr > todayStr) return 'Future Day';
    if (dateStr === todayStr) return 'Today';
    return 'Past Day';
  };

  // Month days list for the calendar
  const [monthDays, setMonthDays] = useState<any[]>(() => getMonthDaysList());

  const loadData = useCallback(async (dateToLoad: string) => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      // Load challenge constraints
      const activeStr = await AsyncStorage.getItem('ojas_challenge_active');
      const isActive = activeStr === 'true';
      setIsChallengeActive(isActive);
      
      const startStr = await AsyncStorage.getItem('ojas_challenge_start');
      const startD = startStr ? new Date(startStr) : null;
      setChallengeStart(startD);

      const targetDays = parseInt(await AsyncStorage.getItem('ojas_target_goal_days') || '90');
      let endD = null;
      if (startD) {
        endD = new Date(startD);
        endD.setDate(endD.getDate() + targetDays - 1);
      }
      setChallengeEnd(endD);

      const state = getDayState(dateToLoad, isActive, startD, endD);

      const storedTasks = await AsyncStorage.getItem(`dincharya_${dateToLoad}`);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      } else {
        if (state !== 'Not Started') {
          const everydayTasks = JSON.parse(await AsyncStorage.getItem('ojas_everyday_tasks') || '[]');
          const onedayTasks = JSON.parse(await AsyncStorage.getItem(`ojas_oneday_tasks_${dateToLoad}`) || '[]');
          const combined = [...everydayTasks, ...onedayTasks].map((t: any) => ({ ...t, completed: false }));
          if (state === 'Today' || state === 'Past Day') {
            await AsyncStorage.setItem(`dincharya_${dateToLoad}`, JSON.stringify(combined));
          }
          setTasks(combined);
        } else {
          setTasks([]);
        }
      }

      const syncTime = await AsyncStorage.getItem('last_synced');
      if (syncTime) {
        setLastSynced(syncTime);
      }

      const baseDays = getMonthDaysList(dateToLoad);
      const keys = baseDays.map(wd => `dincharya_${wd.dateStr}`);
      const pairs = await AsyncStorage.multiGet(keys);
      const taskMap = Object.fromEntries(pairs);

      const updatedMonthDays = baseDays.map((wd) => {
        const dateTasksStr = taskMap[`dincharya_${wd.dateStr}`];
        if (dateTasksStr) {
          const dateTasks = JSON.parse(dateTasksStr);
          const hasCompleted = dateTasks.some((t: any) => t.completed);
          return { ...wd, completed: hasCompleted };
        }
        return wd;
      });
      setMonthDays(updatedMonthDays);

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

  const changeMonth = (direction: number) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + direction);
    d.setDate(1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const toggleTask = async (id: string) => {
    const state = getDayState(selectedDate, isChallengeActive, challengeStart, challengeEnd);
    if (state !== 'Today') {
      showCustomAlert('Mindfulness Check', 'You can only update today\'s tasks. Historical or future days are read-only. 🙏');
      return;
    }

    const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);

    try {
      await AsyncStorage.setItem(`dincharya_${selectedDate}`, JSON.stringify(updatedTasks));

      // Update dots on calendar grid
      setMonthDays(prev => prev.map(wd => {
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
      showCustomAlert('Error', 'Please enter a task name.');
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      icon: newTaskIcon,
      completed: false,
      keystone: false,
      type: newTaskType,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    try {
      if (newTaskType === 'everyday') {
        const everyday = JSON.parse(await AsyncStorage.getItem('ojas_everyday_tasks') || '[]');
        everyday.push(newTask);
        await AsyncStorage.setItem('ojas_everyday_tasks', JSON.stringify(everyday));
      } else {
        const oneday = JSON.parse(await AsyncStorage.getItem(`ojas_oneday_tasks_${selectedDate}`) || '[]');
        oneday.push(newTask);
        await AsyncStorage.setItem(`ojas_oneday_tasks_${selectedDate}`, JSON.stringify(oneday));
      }

      await AsyncStorage.setItem(`dincharya_${selectedDate}`, JSON.stringify(updatedTasks));
      setIsAddModalOpen(false);
      setNewTaskTitle('');
      setNewTaskType('everyday');

      // Update dots on calendar grid
      setMonthDays(prev => prev.map(wd => {
        if (wd.dateStr === selectedDate) {
          return { ...wd, completed: true };
        }
        return wd;
      }));
    } catch (e) {
      console.error('Error saving new task:', e);
    }
  };

  const handleDeleteTask = async () => {
    if (!longPressedTask) return;
    const taskToDelete = longPressedTask;
    const newTasks = tasks.filter(t => t.id !== taskToDelete.id);
    setTasks(newTasks);
    try {
      await AsyncStorage.setItem(`dincharya_${selectedDate}`, JSON.stringify(newTasks));
      if (taskToDelete.type === 'everyday') {
        const everyday = JSON.parse(await AsyncStorage.getItem('ojas_everyday_tasks') || '[]');
        const newEveryday = everyday.filter((t: any) => t.id !== taskToDelete.id);
        await AsyncStorage.setItem('ojas_everyday_tasks', JSON.stringify(newEveryday));
      } else {
        const oneday = JSON.parse(await AsyncStorage.getItem(`ojas_oneday_tasks_${selectedDate}`) || '[]');
        const newOneday = oneday.filter((t: any) => t.id !== taskToDelete.id);
        await AsyncStorage.setItem(`ojas_oneday_tasks_${selectedDate}`, JSON.stringify(newOneday));
      }
      setIsActionModalOpen(false);
      setLongPressedTask(null);
      
      // Update dot if tasks length zero
      if (newTasks.length === 0) {
        setMonthDays(prev => prev.map(wd => {
          if (wd.dateStr === selectedDate) {
            return { ...wd, completed: false };
          }
          return wd;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onTaskLongPress = (task: any) => {
    if (getDayState(selectedDate, isChallengeActive, challengeStart, challengeEnd) !== 'Today') return;
    setLongPressedTask(task);
    setIsActionModalOpen(true);
  };

  const renderCalendarCells = () => {
    const d = new Date(selectedDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // Offset (0 = Sun, 1 = Mon...)
    
    const cells = [];
    // 1. Add empty padding cells
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.calendarCellEmpty} />);
    }
    
    // 2. Add day cells
    monthDays.forEach((wd) => {
      const isSelected = wd.dateStr === selectedDate;
      const isToday = wd.dateStr === new Date().toISOString().split('T')[0];
      const state = getDayState(wd.dateStr, isChallengeActive, challengeStart, challengeEnd);
      const isNotStarted = state === 'Not Started';
      const isFuture = state === 'Future Day';
      
      cells.push(
        <TouchableOpacity
          key={wd.dateStr}
          disabled={isNotStarted}
          style={[
            styles.calendarCell, 
            isSelected && styles.calendarCellSelected,
            isToday && !isSelected && styles.calendarCellToday,
            isNotStarted && { opacity: 0.3 }
          ]}
          onPress={() => setSelectedDate(wd.dateStr)}
        >
          {isFuture && !isSelected && (
            <FontAwesome5 name="lock" size={8} color="#94A3B8" style={{ position: 'absolute', top: 4, right: 4 }} />
          )}
          <Text style={[
            styles.calendarCellText, 
            isSelected && styles.calendarCellTextSelected,
            isToday && !isSelected && styles.calendarCellTextToday,
            isNotStarted && { color: '#94A3B8' }
          ]}>
            {wd.dayNum}
          </Text>
          <View style={[
            styles.cellDot, 
            wd.completed && !isNotStarted ? styles.cellDotCompleted : styles.cellDotEmpty
          ]} />
        </TouchableOpacity>
      );
    });
    
    return cells;
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
        showCustomAlert('Success', 'Dincharya synced to server.');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      showCustomAlert('Sync Failed', 'Could not sync with server. Will try again later.');
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

        {/* Month Calendar Grid View */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeaderRow}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calendarNavBtn}>
              <FontAwesome5 name="chevron-left" size={12} color="#EA580C" />
            </TouchableOpacity>
            <Text style={styles.calendarMonthTitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calendarNavBtn}>
              <FontAwesome5 name="chevron-right" size={12} color="#EA580C" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayHeadersRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <Text key={idx} style={styles.weekdayHeaderCell}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {renderCalendarCells()}
          </View>
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
          {selectedDate === new Date().toISOString().split('T')[0] && (
            <TouchableOpacity style={styles.btnAddTask} onPress={() => setIsAddModalOpen(true)}>
              <Text style={styles.btnAddTaskText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tasks List */}
        <View style={styles.listContainer}>
          {tasks.length === 0 ? (
            <View style={styles.emptyTasksContainer}>
              <FontAwesome5 name="clipboard" size={26} color="#94A3B8" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTasksTitle}>No routines defined</Text>
              <Text style={styles.emptyTasksDesc}>Add daily habits like snan, meditation, or scripture study to start building your routine.</Text>
            </View>
          ) : (
            tasks.map(task => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskItem, 
                  task.completed && styles.taskItemCompleted,
                  task.keystone && styles.keystoneTaskItem
                ]}
                onPress={() => toggleTask(task.id)}
                onLongPress={() => onTaskLongPress(task)}
                activeOpacity={0.7}
              >
                <View style={styles.taskLeftRow}>
                  <View style={[
                    styles.iconContainer, 
                    task.completed && styles.iconContainerCompleted,
                    task.keystone && styles.keystoneIconContainer
                  ]}>
                    <FontAwesome5 name={task.icon} size={14} color={task.completed ? "#FFFFFF" : task.keystone ? "#EA580C" : "#64748B"} />
                  </View>
                  
                  <View style={styles.taskTextColumn}>
                    <View style={styles.taskTitleRow}>
                      <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                        {task.title}
                      </Text>
                      {task.keystone && (
                        <View style={styles.keystoneBadge}>
                          <FontAwesome5 name="shield-alt" size={8} color="#EA580C" />
                          <Text style={styles.keystoneBadgeText}>KEYSTONE</Text>
                        </View>
                      )}
                    </View>
                    
                    {task.desc && (
                      <Text style={[styles.taskDescText, task.completed && styles.taskDescTextCompleted]}>
                        {task.desc}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                  {task.completed && <FontAwesome5 name="check" size={9} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            ))
          )}
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

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { flex: 1, backgroundColor: newTaskType === 'everyday' ? '#FFF7ED' : '#F1F5F9', borderColor: newTaskType === 'everyday' ? '#EA580C' : '#E2E8F0', borderWidth: 1 }]}
                onPress={() => setNewTaskType('everyday')}
              >
                <Text style={[styles.modalCancelButtonText, { color: newTaskType === 'everyday' ? '#EA580C' : '#475569' }]}>Everyday Task</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCancelButton, { flex: 1, backgroundColor: newTaskType === 'oneday' ? '#FFF7ED' : '#F1F5F9', borderColor: newTaskType === 'oneday' ? '#EA580C' : '#E2E8F0', borderWidth: 1 }]}
                onPress={() => setNewTaskType('oneday')}
              >
                <Text style={[styles.modalCancelButtonText, { color: newTaskType === 'oneday' ? '#EA580C' : '#475569' }]}>One-Day Task</Text>
              </TouchableOpacity>
            </View>

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

      <Modal visible={isActionModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Task Options</Text>
            <Text style={{ color: '#64748B', marginBottom: 20 }}>{longPressedTask?.title}</Text>
            
            <TouchableOpacity 
              style={[styles.modalAddButton, { backgroundColor: '#EF4444', marginBottom: 12 }]} 
              onPress={handleDeleteTask}
            >
              <Text style={styles.modalAddButtonText}>Delete for Today & Future</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => { setIsActionModalOpen(false); setLongPressedTask(null); }}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CustomAlert 
        visible={alertVisible} 
        title={alertTitle} 
        message={alertMessage} 
        onClose={() => setAlertVisible(false)} 
      />

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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  calendarNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  weekdayHeadersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  weekdayHeaderCell: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  calendarCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 2,
    position: 'relative',
  },
  calendarCellSelected: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  calendarCellToday: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calendarCellEmpty: {
    width: '14.28%',
    height: 40,
  },
  calendarCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  calendarCellTextSelected: {
    color: '#EA580C',
    fontWeight: '700',
  },
  calendarCellTextToday: {
    color: '#0F172A',
    fontWeight: '700',
  },
  cellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
  cellDotCompleted: {
    backgroundColor: '#EA580C',
  },
  cellDotEmpty: {
    backgroundColor: 'transparent',
  },
  emptyTasksContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 24,
  },
  emptyTasksTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyTasksDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  taskTitleCompleted: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  taskLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskTextColumn: {
    flex: 1,
    gap: 2,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  keystoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  keystoneBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#EA580C',
  },
  taskDescText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },
  taskDescTextCompleted: {
    color: '#CBD5E1',
    textDecorationLine: 'line-through',
  },
  keystoneTaskItem: {
    borderColor: '#FDBA74',
    borderLeftWidth: 4,
  },
  keystoneIconContainer: {
    backgroundColor: '#FFEDD5',
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
