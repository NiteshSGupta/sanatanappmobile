/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withTiming, 
  useAnimatedProps,
  Easing,
  withRepeat
} from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import api from '../../utils/api';
import CustomAlert from '../../components/CustomAlert';

const toLocalDateString = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STAGES = [
  { name: 'Inhale', duration: 4, label: 'INHALE 4S' },
  { name: 'Hold', duration: 4, label: 'HOLD 4S' },
  { name: 'Exhale', duration: 8, label: 'EXHALE 8S' },
  { name: 'Pause', duration: 2, label: 'PAUSE 2S' },
];

const CIRCLE_RADIUS = 90;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
const GAUGE_SPAN = 0.75; // 3/4 circle arc

export default function JourneyScreen() {
  const [user, setUser] = useState<any>(null);
  
  // Master Streak
  const [streakStart, setStreakStart] = useState<Date | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [streakHours, setStreakHours] = useState('00');
  const [streakMinutes, setStreakMinutes] = useState('00');
  const [streakSeconds, setStreakSeconds] = useState('00');

  // Active Challenge
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [challengeStart, setChallengeStart] = useState<Date | null>(null);
  const [challengeDays, setChallengeDays] = useState(0);

  const [dincharyaCompletedCount, setDincharyaCompletedCount] = useState(0);
  const [dincharyaTotalCount, setDincharyaTotalCount] = useState(0);
  
  const [isRelapseModalOpen, setIsRelapseModalOpen] = useState(false);
  const [targetGoalDays, setTargetGoalDays] = useState(90);
  const [startReason, setStartReason] = useState('');
  
  // Custom Alert States
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showCustomAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Modals
  const [isStartChallengeModalOpen, setIsStartChallengeModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [isGoalCompletedModalOpen, setIsGoalCompletedModalOpen] = useState(false);

  // Modal Inputs
  const [startGoalDays, setStartGoalDays] = useState(90);
  const [startReasonInput, setStartReasonInput] = useState('');
  const [editGoalDays, setEditGoalDays] = useState(90);
  const [editReasonInput, setEditReasonInput] = useState('');

  // Scientific Relapse States
  const [relapseStep, setRelapseStep] = useState(1);
  const [selectedTrigger, setSelectedTrigger] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState('');
  const [relapseNotes, setRelapseNotes] = useState('');

  const progressOffset = useSharedValue(CIRCLE_CIRCUMFERENCE);
  const glowValue = useSharedValue(1);

  const [isUrgeModalOpen, setIsUrgeModalOpen] = useState(false);
  const [isUrgeActive, setIsUrgeActive] = useState(false);
  const [urgeElapsed, setUrgeElapsed] = useState(0);
  const [urgeCycles, setUrgeCycles] = useState(0);
  const [urgeStageIndex, setUrgeStageIndex] = useState(0);
  const [urgeStageTimeLeft, setUrgeStageTimeLeft] = useState(4); // Default to inhale duration
  const urgeCircleScale = useSharedValue(1);

  const openRelapseModal = () => {
    if (!streakStart) {
      showCustomAlert('Start Challenge First', 'Please set your first challenge goal to begin tracking your journey before recording a relapse.');
      return;
    }
    setIsRelapseModalOpen(true);
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setSelectedTimeOfDay('Morning');
    else if (hour >= 12 && hour < 17) setSelectedTimeOfDay('Afternoon');
    else if (hour >= 17 && hour < 21) setSelectedTimeOfDay('Evening');
    else setSelectedTimeOfDay('Late Night');
  };

  // League computation matching Figma layout with science details
  const getLeagueData = useCallback((currentDays: number) => {
    if (currentDays < 7) {
      return { 
        current: 'Beginner', 
        next: 'Bronze', 
        nextDaysReq: 7, 
        icon: 'seedling',
        stage: 'Acute Withdrawal',
        energy: 'Virya (Physical)'
      };
    } else if (currentDays < 21) {
      return { 
        current: 'Bronze', 
        next: 'Silver', 
        nextDaysReq: 21, 
        icon: 'medal',
        stage: 'Habit Formation',
        energy: 'Prana (Vitality)'
      };
    } else if (currentDays < 45) {
      return { 
        current: 'Silver', 
        next: 'Gold', 
        nextDaysReq: 45, 
        icon: 'shield-alt',
        stage: 'Discipline',
        energy: 'Tejas (Radiance)'
      };
    } else if (currentDays < 90) {
      return { 
        current: 'Gold', 
        next: 'Diamond', 
        nextDaysReq: 90, 
        icon: 'crown',
        stage: 'Dopamine Reset',
        energy: 'Ojas (Clarity)'
      };
    } else if (currentDays < 180) {
      return { 
        current: 'Diamond', 
        next: 'Master', 
        nextDaysReq: 180, 
        icon: 'gem',
        stage: 'Deep Healing',
        energy: 'Spiritual Alignment'
      };
    } else if (currentDays < 365) {
      return { 
        current: 'Master', 
        next: 'Brahmachari', 
        nextDaysReq: 365, 
        icon: 'mountain',
        stage: 'Transmutation',
        energy: 'Profound Peace'
      };
    } else {
      return { 
        current: 'Brahmachari', 
        next: 'None', 
        nextDaysReq: 0, 
        icon: 'om',
        stage: 'Identity Restructured',
        energy: 'Atman (Mastery)'
      };
    }
  }, []);

  const router = useRouter();

  const loadJourney = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      let parsedUser: any = null;
      if (userData) {
        parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
      
      // Master Streak Migration & Loading
      let savedStreakStart = await AsyncStorage.getItem('ojas_streak_start');
      if (!savedStreakStart) {
        // Fallback to legacy journey start for existing users
        const legacyStart = await AsyncStorage.getItem('ojas_journey_start');
        if (legacyStart) {
          savedStreakStart = legacyStart; 
          await AsyncStorage.setItem('ojas_streak_start', savedStreakStart);
        }
      }
      setStreakStart(savedStreakStart ? new Date(savedStreakStart) : null);

      // Challenge Loading
      const activeVal = await AsyncStorage.getItem('ojas_challenge_active');
      const isActive = activeVal === 'true';
      setIsChallengeActive(isActive);

      const savedChallengeStart = await AsyncStorage.getItem('ojas_challenge_start');
      if (savedChallengeStart && isActive) {
        setChallengeStart(new Date(savedChallengeStart));
      } else {
        setChallengeStart(null);
      }

      const savedGoal = await AsyncStorage.getItem('ojas_target_goal_days');
      if (savedGoal) {
        setTargetGoalDays(parseInt(savedGoal));
      } else if (parsedUser && parsedUser.target_goal_days) {
        setTargetGoalDays(parsedUser.target_goal_days);
        await AsyncStorage.setItem('ojas_target_goal_days', parsedUser.target_goal_days.toString());
      } else {
        setTargetGoalDays(90);
      }

      const reason = await AsyncStorage.getItem('ojas_goal_start_reason');
      if (reason) {
        setStartReason(reason);
      } else if (parsedUser && parsedUser.start_reason) {
        setStartReason(parsedUser.start_reason);
        await AsyncStorage.setItem('ojas_goal_start_reason', parsedUser.start_reason);
      }

      // Check for completion
      if (isActive && savedChallengeStart) {
        const start = new Date(savedChallengeStart);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        if (diff >= 0) {
          const calculatedDays = Math.floor(diff / (1000 * 60 * 60 * 24));
          const goalDaysNum = parseInt(savedGoal || '90');
          if (calculatedDays >= goalDaysNum) {
            setIsGoalCompletedModalOpen(true);
          }
        }
      }

      // Compute Dincharya Today Stats
      if (isActive) {
        const todayStr = toLocalDateString(new Date());
        const storedTasks = await AsyncStorage.getItem(`dincharya_${todayStr}`);
        if (storedTasks) {
          const tasks = JSON.parse(storedTasks);
          setDincharyaTotalCount(tasks.length);
          setDincharyaCompletedCount(tasks.filter((t: any) => t.completed).length);
        } else {
          const everydayTasksStr = await AsyncStorage.getItem('ojas_everyday_tasks');
          const onedayTasksStr = await AsyncStorage.getItem(`ojas_oneday_tasks_${todayStr}`);
          const everydayCount = everydayTasksStr ? JSON.parse(everydayTasksStr).length : 0;
          const onedayCount = onedayTasksStr ? JSON.parse(onedayTasksStr).length : 0;
          setDincharyaTotalCount(everydayCount + onedayCount);
          setDincharyaCompletedCount(0);
        }
      } else {
        setDincharyaTotalCount(0);
        setDincharyaCompletedCount(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadJourney();
    }, [])
  );

  useEffect(() => {
    if (!isChallengeActive) {
      glowValue.value = withRepeat(
        withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      glowValue.value = 1;
    }
  }, [isChallengeActive, glowValue]);

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowValue.value,
      transform: [{ scale: withTiming(isChallengeActive ? 1 : 1 + (1 - glowValue.value) * 0.04) }]
    };
  });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    interval = setInterval(() => {
      const now = new Date();
      
      // Update Master Streak
      if (streakStart) {
        const streakDiff = now.getTime() - streakStart.getTime();
        if (streakDiff >= 0) {
          setStreakDays(Math.floor(streakDiff / (1000 * 60 * 60 * 24)));
          setStreakHours(Math.floor((streakDiff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0'));
          setStreakMinutes(Math.floor((streakDiff / 1000 / 60) % 60).toString().padStart(2, '0'));
          setStreakSeconds(Math.floor((streakDiff / 1000) % 60).toString().padStart(2, '0'));
        }
      }
      
      // Update Active Challenge
      if (challengeStart && isChallengeActive) {
        const diff = now.getTime() - challengeStart.getTime();
        if (diff >= 0) {
          const cd = Math.floor(diff / (1000 * 60 * 60 * 24));
          setChallengeDays(cd);

          // Scale circle gauge progress relative to active goal days
          const targetPercent = Math.min((cd / targetGoalDays) * 100, 100);
          const fillPercentage = (targetPercent / 100) * GAUGE_SPAN;
          const offset = CIRCLE_CIRCUMFERENCE - fillPercentage * CIRCLE_CIRCUMFERENCE;
          progressOffset.value = withTiming(offset, { duration: 1000, easing: Easing.out(Easing.ease) });

          // Live Goal check
          if (cd >= targetGoalDays) {
            setIsGoalCompletedModalOpen(true);
          }
        }
      } else {
        setChallengeDays(0);
        progressOffset.value = CIRCLE_CIRCUMFERENCE;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [streakStart, challengeStart, isChallengeActive, targetGoalDays, progressOffset]);

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: progressOffset.value
    };
  });

  const syncGoalAndRelapses = async (updatedGoal?: number, updatedRelapses?: any[]) => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) return;
      const parsedUser = JSON.parse(userData);
      
      const goal = updatedGoal !== undefined ? updatedGoal : targetGoalDays;
      
      let relapsesToSend = updatedRelapses;
      if (!relapsesToSend) {
        const storedRelapses = await AsyncStorage.getItem('ojas_relapses');
        relapsesToSend = storedRelapses ? JSON.parse(storedRelapses) : [];
      }

      await api.post('/sync', {
        uuid: parsedUser.username,
        date: toLocalDateString(new Date()),
        target_goal_days: goal,
        relapses: relapsesToSend,
        device_info: 'React Native App',
      });
    } catch (e) {
      console.error('Error syncing goals/relapses with server:', e);
    }
  };

  const handleStartChallenge = async () => {
    if (!startReasonInput.trim()) {
      showCustomAlert('Intention Required', 'Please write a brief reason for starting this reboot cycle to help program your prefrontal cortex.');
      return;
    }
    try {
      const now = new Date();
      setIsChallengeActive(true);
      setChallengeStart(now);
      setTargetGoalDays(startGoalDays);
      setStartReason(startReasonInput);

      await AsyncStorage.setItem('ojas_challenge_active', 'true');
      await AsyncStorage.setItem('ojas_challenge_start', now.toISOString());
      await AsyncStorage.setItem('ojas_target_goal_days', startGoalDays.toString());
      await AsyncStorage.setItem('ojas_goal_start_reason', startReasonInput);

      // Initialize Master Streak if this is their very first challenge
      const existingStreakStart = await AsyncStorage.getItem('ojas_streak_start');
      if (!existingStreakStart) {
        await AsyncStorage.setItem('ojas_streak_start', now.toISOString());
        setStreakStart(now);
      }

      setIsStartChallengeModalOpen(false);

      if (user && user.username) {
        await api.post('/sync', {
          uuid: user.username,
          date: toLocalDateString(now),
          target_goal_days: startGoalDays,
          journey_status: 'active',
          active_goal_start_at: now.toISOString(),
          start_reason: startReasonInput,
          device_info: 'React Native App',
        });
      }
      
      showCustomAlert('Success: Challenge Initiated! 🛡️', "Your reboot cycle has begun. Focus on today's Dincharya tasks.");
    } catch (e) {
      console.error(e);
    }
  };

  const openEditGoalModal = () => {
    setEditGoalDays(targetGoalDays);
    setEditReasonInput(startReason);
    setIsEditGoalModalOpen(true);
  };

  const handleEditGoalSave = async () => {
    if (!editReasonInput.trim()) {
      showCustomAlert('Intention Required', 'Please provide a reason/intention.');
      return;
    }
    try {
      setTargetGoalDays(editGoalDays);
      setStartReason(editReasonInput);

      await AsyncStorage.setItem('ojas_target_goal_days', editGoalDays.toString());
      await AsyncStorage.setItem('ojas_goal_start_reason', editReasonInput);

      setIsEditGoalModalOpen(false);

      if (user && user.username) {
        await api.post('/sync', {
          uuid: user.username,
          date: toLocalDateString(new Date()),
          target_goal_days: editGoalDays,
          journey_status: 'active',
          active_goal_start_at: challengeStart ? challengeStart.toISOString() : null,
          start_reason: editReasonInput,
          device_info: 'React Native App',
        });
      }

      showCustomAlert('Success: Goal Updated', 'Your goal parameters have been successfully updated.');
    } catch (e) {
      console.error(e);
    }
  };

  const claimVictory = async () => {
    try {
      setIsGoalCompletedModalOpen(false);
      
      // Move to history
      const storedHistory = await AsyncStorage.getItem('ojas_goals_history');
      const history = storedHistory ? JSON.parse(storedHistory) : [];
      
      const newArchivedGoal = {
        id: Date.now().toString(),
        target_days: targetGoalDays,
        start_date: challengeStart ? challengeStart.toISOString() : new Date().toISOString(),
        completion_date: new Date().toISOString(),
        start_reason: startReason,
        status: 'completed',
      };
      
      const updatedHistory = [...history, newArchivedGoal];
      await AsyncStorage.setItem('ojas_goals_history', JSON.stringify(updatedHistory));
      
      // Clear active challenge states (do not reset streak!)
      setIsChallengeActive(false);
      setChallengeStart(null);
      setChallengeDays(0);
      
      await AsyncStorage.setItem('ojas_challenge_active', 'false');
      await AsyncStorage.removeItem('ojas_challenge_start');
      await AsyncStorage.removeItem('ojas_goal_start_reason');
      
      // We do NOT reset active relapse list here (Streak continues)
      
      // Clear all Dincharya history for active cycle to start clean
      const keys = await AsyncStorage.getAllKeys();
      const dincharyaKeys = keys.filter(k => k.startsWith('dincharya_'));
      if (dincharyaKeys.length > 0) {
        await AsyncStorage.multiRemove(dincharyaKeys);
      }
      
      // Sync to server
      if (user && user.username) {
        await api.post('/sync', {
          uuid: user.username,
          date: toLocalDateString(new Date()),
          target_goal_days: 90,
          journey_status: 'inactive',
          active_goal_start_at: null,
          start_reason: null,
          goals_history: updatedHistory,
          relapses: []
        });
      }
      
      showCustomAlert('Success: Congratulations! 🎉', 'Victory archived. Start your next phase when ready.');
    } catch (e) {
      console.error(e);
    }
  };

  const confirmRelapse = async () => {
    const now = new Date();
    const trigger = selectedTrigger || 'No trigger specified';
    const location = selectedLocation || 'No location specified';
    const timeOfDay = selectedTimeOfDay || 'No time specified';
    const notes = relapseNotes.trim() || 'No notes specified';

    try {
      const storedRelapses = await AsyncStorage.getItem('ojas_relapses');
      const relapses = storedRelapses ? JSON.parse(storedRelapses) : [];
      const newRelapse = {
        date: now.toISOString(),
        trigger_type: trigger,
        location: location,
        time_of_day: timeOfDay,
        notes: notes,
        reason: trigger,
      };
      relapses.push(newRelapse);
      await AsyncStorage.setItem('ojas_relapses', JSON.stringify(relapses));
      
      // Sync to backend
      await syncGoalAndRelapses(targetGoalDays, relapses);
    } catch (e) {
      console.error('Error saving relapse:', e);
    }

    // Master streak always resets on relapse
    setStreakStart(now);
    await AsyncStorage.setItem('ojas_streak_start', now.toISOString());
    
    // The active challenge continues despite a slip. It acts as a container for these events!
    // We only reset the master streak, which was handled above.
    setIsRelapseModalOpen(false);
    
    // Reset state
    setSelectedTrigger('');
    setSelectedLocation('');
    setSelectedTimeOfDay('');
    setRelapseNotes('');
    setRelapseStep(1);
  };

  // Urge Surfer Timer and Breathing Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isUrgeModalOpen && isUrgeActive) {
      interval = setInterval(() => {
        setUrgeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isUrgeModalOpen, isUrgeActive]);

  useEffect(() => {
    let breathingInterval: ReturnType<typeof setInterval>;
    if (isUrgeModalOpen && isUrgeActive) {
      const currentStage = STAGES[urgeStageIndex].name;
      if (currentStage === 'Inhale') {
        urgeCircleScale.value = withTiming(1.4, {
          duration: STAGES[urgeStageIndex].duration * 1000,
          easing: Easing.inOut(Easing.ease),
        });
      } else if (currentStage === 'Exhale') {
        urgeCircleScale.value = withTiming(1.0, {
          duration: STAGES[urgeStageIndex].duration * 1000,
          easing: Easing.inOut(Easing.ease),
        });
      }

      breathingInterval = setInterval(() => {
        setUrgeStageTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            const nextIndex = (urgeStageIndex + 1) % STAGES.length;
            setUrgeStageIndex(nextIndex);
            if (nextIndex === 0) {
              setUrgeCycles(c => c + 1);
            }
            return STAGES[nextIndex].duration;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(breathingInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUrgeModalOpen, isUrgeActive, urgeStageIndex]);

  const animatedUrgeCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: urgeCircleScale.value }],
    };
  });

  const openUrgeSurfer = () => {
    setIsUrgeModalOpen(true);
    setIsUrgeActive(false); // do not start automatically, waits for click
    setUrgeElapsed(0);
    setUrgeCycles(0);
    setUrgeStageIndex(0);
    setUrgeStageTimeLeft(4);
    urgeCircleScale.value = 1;
  };

  const closeUrgeSurfer = () => {
    setIsUrgeModalOpen(false);
    setIsUrgeActive(false);
  };

  const resetUrgeSurfer = () => {
    setUrgeElapsed(0);
    setUrgeCycles(0);
    setUrgeStageIndex(0);
    setUrgeStageTimeLeft(4);
    urgeCircleScale.value = 1;
  };



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerLogo}>
              <FontAwesome5 name="om" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Brahmacharya</Text>
          </View>
          <Text style={styles.headerUser}>Hi, {user?.name?.split(' ')[0] || 'seeker'}</Text>
        </View>

        {/* Hero Circular Progress Gauge Card */}
        <View style={styles.heroCard}>
          <Text style={styles.streakLabel}>LIFETIME RECOVERY</Text>
          
          <View style={styles.circleWrapper}>
            {/* Om Background Watermark */}
            <View style={styles.omWatermark}>
              <FontAwesome5 name="om" size={120} color="#EA580C" style={{ opacity: 0.05 }} />
            </View>
            
            {/* Svg Semi-Circle Ring */}
            <Svg width={CIRCLE_RADIUS * 2 + 20} height={CIRCLE_RADIUS * 2 + 20} viewBox="0 0 200 200" style={styles.svgRotation}>
              <Circle
                cx="100" cy="100" r={CIRCLE_RADIUS}
                stroke="#E2E8F0" strokeWidth="8" fill="transparent"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                strokeDashoffset={CIRCLE_CIRCUMFERENCE * (1 - GAUGE_SPAN)}
                strokeLinecap="round"
              />
              <AnimatedCircle
                cx="100" cy="100" r={CIRCLE_RADIUS}
                stroke="#EA580C" strokeWidth="8" fill="transparent"
                strokeLinecap="round"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                animatedProps={animatedCircleProps}
              />
            </Svg>

            {/* Inner text */}
            <View style={styles.circleCenter}>
              
              {streakStart ? (
                <>
                  <Text style={styles.daysText}>{streakDays}</Text>
                  <Text style={styles.daysLabel}>Days</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.daysText, { fontSize: 40, marginTop: -5 }]}>00</Text>
                  <Text style={styles.daysLabel}>Awaiting</Text>
                </>
              )}

              {!isChallengeActive ? (
                <Animated.View style={animatedGlowStyle}>
                  <TouchableOpacity style={styles.startChallengeBtn} onPress={() => setIsStartChallengeModalOpen(true)}>
                    <Text style={styles.startBtnGlowText}>START</Text>
                    <Text style={styles.startBtnSubText}>CHALLENGE</Text>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <TouchableOpacity style={styles.goalPill} onPress={openEditGoalModal}>
                  <FontAwesome5 name="bullseye" size={9} color="#EA580C" />
                  <Text style={styles.goalPillText}>Challenge: {challengeDays}/{targetGoalDays}d</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ width: '100%', alignItems: 'center', marginTop: 12 }}>
            <Text style={styles.streakLabel}>LIFETIME STREAK</Text>
          </View>
          {/* Hours, Minutes, Seconds Counters */}
          <View style={[styles.timeGrid, { marginTop: 4 }]}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeCount}>{streakStart ? streakHours : '00'}</Text>
              <Text style={styles.timeLabel}>HOURS</Text>
            </View>
            <Text style={styles.timeDivider}>:</Text>
            <View style={styles.timeBlock}>
              <Text style={styles.timeCount}>{streakStart ? streakMinutes : '00'}</Text>
              <Text style={styles.timeLabel}>MINUTES</Text>
            </View>
            <Text style={styles.timeDivider}>:</Text>
            <View style={styles.timeBlock}>
              <Text style={styles.timeCount}>{streakStart ? streakSeconds : '00'}</Text>
              <Text style={styles.timeLabel}>SECONDS</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnEmergency} onPress={openUrgeSurfer}>
              <FontAwesome5 name="fire" size={16} color="#FFFFFF" />
              <Text style={styles.btnEmergencyText}>Emergency</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnRelapse} onPress={openRelapseModal}>
              <FontAwesome5 name="history" size={14} color="#0F172A" />
              <Text style={styles.btnRelapseText}>Relapsed</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dincharya Summary Card */}
        <TouchableOpacity style={styles.leagueCard} onPress={() => router.push('/(tabs)/dincharya')}>
          <View style={styles.leagueHeader}>
            <View style={styles.leagueBadgeWrapper}>
              <View style={styles.leagueBadgeIcon}>
                <FontAwesome5 name="clipboard-list" size={22} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.leagueTitle}>TODAY'S DINCHARYA</Text>
                <Text style={styles.activeLeagueText}>
                  {dincharyaTotalCount > 0 
                    ? `${dincharyaCompletedCount} out of ${dincharyaTotalCount} Tasks Completed` 
                    : 'No Routine Set Today'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: dincharyaTotalCount === 0 ? '0%' : `${(dincharyaCompletedCount / dincharyaTotalCount) * 100}%` }]} />
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* Scientific Stepped Relapse Reset Modal */}
      <Modal visible={isRelapseModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBg}>
              <FontAwesome5 name="biohazard" size={24} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Reflective Reboot</Text>
            
            {/* Step Indicators */}
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, relapseStep >= 1 && styles.stepDotActive]} />
              <View style={[styles.stepDot, relapseStep >= 2 && styles.stepDotActive]} />
              <View style={[styles.stepDot, relapseStep >= 3 && styles.stepDotActive]} />
            </View>

            {relapseStep === 1 && (
              <View style={{ width: '100%', alignItems: 'center' }}>
                <Text style={styles.modalTitleLeft}>Step 1: What triggered this?</Text>
                <Text style={styles.modalDesc}>Identify the stimulus. Understanding triggers is key to neuroplastic rewiring.</Text>
                <View style={styles.optionGrid}>
                  {[
                    { label: 'Boredom 🥱', val: 'Boredom' },
                    { label: 'Loneliness 👤', val: 'Loneliness' },
                    { label: 'Stress / Anxiety ⚡', val: 'Stress' },
                    { label: 'Sensual Content 📱', val: 'Content' },
                    { label: 'Late Night Awake 🌙', val: 'LateNight' },
                    { label: 'Other 📝', val: 'Other' }
                  ].map((t) => (
                    <TouchableOpacity
                      key={t.val}
                      style={[styles.optionBtn, selectedTrigger === t.val && styles.optionBtnActive]}
                      onPress={() => setSelectedTrigger(t.val)}
                    >
                      <Text style={[styles.optionBtnText, selectedTrigger === t.val && styles.optionBtnTextActive]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={[styles.modalBtnSecondary, { flex: 1 }]}
                    onPress={() => {
                      setIsRelapseModalOpen(false);
                      setRelapseStep(1);
                    }}
                  >
                    <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtnPrimary, { flex: 1, backgroundColor: selectedTrigger ? '#EA580C' : '#CBD5E1', marginBottom: 0 }]}
                    disabled={!selectedTrigger}
                    onPress={() => setRelapseStep(2)}
                  >
                    <Text style={styles.modalBtnPrimaryText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {relapseStep === 2 && (
              <View style={{ width: '100%', alignItems: 'center' }}>
                <Text style={styles.modalTitleLeft}>Step 2: Where did it happen?</Text>
                <Text style={styles.modalDesc}>Environmental triggers are strong. We will highlight high-risk locations.</Text>
                <View style={styles.optionGrid}>
                  {[
                    { label: 'Bedroom 🛏️', val: 'Bedroom' },
                    { label: 'Bathroom 🚿', val: 'Bathroom' },
                    { label: 'Living Room 🛋️', val: 'LivingRoom' },
                    { label: 'Study / Office 🖥️', val: 'Office' },
                    { label: 'Other 📍', val: 'Other' }
                  ].map((l) => (
                    <TouchableOpacity
                      key={l.val}
                      style={[styles.optionBtn, selectedLocation === l.val && styles.optionBtnActive]}
                      onPress={() => setSelectedLocation(l.val)}
                    >
                      <Text style={[styles.optionBtnText, selectedLocation === l.val && styles.optionBtnTextActive]}>
                        {l.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={[styles.modalBtnSecondary, { flex: 1 }]}
                    onPress={() => setRelapseStep(1)}
                  >
                    <Text style={styles.modalBtnSecondaryText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtnPrimary, { flex: 1, backgroundColor: selectedLocation ? '#EA580C' : '#CBD5E1', marginBottom: 0 }]}
                    disabled={!selectedLocation}
                    onPress={() => setRelapseStep(3)}
                  >
                    <Text style={styles.modalBtnPrimaryText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {relapseStep === 3 && (
              <View style={{ width: '100%', alignItems: 'center' }}>
                <Text style={styles.modalTitleLeft}>Step 3: Acknowledge & Reflect</Text>
                <Text style={styles.modalDesc}>Set the time of urge and write down one lesson so this slip becomes a step forward.</Text>
                
                <Text style={styles.relapseInputLabel}>TIME OF DAY</Text>
                <View style={styles.timeRow}>
                  {['Morning', 'Afternoon', 'Evening', 'Late Night'].map((tod) => (
                    <TouchableOpacity
                      key={tod}
                      style={[styles.timeBtn, selectedTimeOfDay === tod && styles.timeBtnActive]}
                      onPress={() => setSelectedTimeOfDay(tod)}
                    >
                      <Text style={[styles.timeBtnText, selectedTimeOfDay === tod && styles.timeBtnTextActive]}>
                        {tod}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.relapseInputContainer}>
                  <Text style={styles.relapseInputLabel}>REFLECTIVE LESSON (HOW TO AVOID NEXT TIME?)</Text>
                  <TextInput
                    style={styles.relapseTextInput}
                    placeholder="e.g. Keep phone out of room at night..."
                    placeholderTextColor="#94A3B8"
                    value={relapseNotes}
                    onChangeText={setRelapseNotes}
                    multiline
                  />
                </View>

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={[styles.modalBtnSecondary, { flex: 1 }]}
                    onPress={() => setRelapseStep(2)}
                  >
                    <Text style={styles.modalBtnSecondaryText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtnPrimary, { flex: 1.3, backgroundColor: '#EF4444', marginBottom: 0 }]}
                    onPress={confirmRelapse}
                  >
                    <Text style={styles.modalBtnPrimaryText}>Reset Streak</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </View>
        </View>
      </Modal>

      {/* Start Challenge Modal */}
      <Modal visible={isStartChallengeModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconBg, { backgroundColor: '#FFF7ED' }]}>
              <FontAwesome5 name="fire" size={22} color="#EA580C" />
            </View>
            <Text style={styles.goalModalTitle}>Start Challenge</Text>
            <Text style={styles.goalModalSubtitle}>
              Commit to a specific phase of rewiring. Milestones reduce cognitive friction.
            </Text>

            <Text style={styles.relapseInputLabel}>SELECT TARGET DAYS</Text>
            <View style={styles.presetGrid}>
              {[7, 21, 45, 90, 180, 365].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.presetBtn, startGoalDays === val && styles.presetBtnActive]}
                  onPress={() => setStartGoalDays(val)}
                >
                  <Text style={[styles.presetBtnTitle, startGoalDays === val && styles.presetBtnTextActive]}>{val}</Text>
                  <Text style={[styles.presetBtnLabel, startGoalDays === val && styles.presetBtnTextActive]}>Days</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.selectedPresetLabel}>
              {startGoalDays === 7 ? '7 Days · Micro Reboot 🌱' : 
               startGoalDays === 21 ? '21 Days · Habit Builder 🌿' : 
               startGoalDays === 45 ? '45 Days · Discipline Master 🏹' : 
               startGoalDays === 90 ? '90 Days · Dopamine Reset 🔥' : 
               startGoalDays === 180 ? '180 Days · Deep Healing 🌊' : 
               '365 Days · Brahmacharya Journey 🛡️'}
            </Text>

            <Text style={styles.relapseInputLabel}>YOUR INTENTION / RESOLVE</Text>
            <TextInput
              style={[styles.relapseTextInput, { width: '100%', minHeight: 60, marginBottom: 20 }]}
              placeholder="Why are you starting this path? (e.g. build clarity, master focus...)"
              placeholderTextColor="#94A3B8"
              value={startReasonInput}
              onChangeText={setStartReasonInput}
              multiline
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={[styles.modalBtnSecondary, { flex: 1 }]} 
                onPress={() => {
                  setIsStartChallengeModalOpen(false);
                  setStartReasonInput('');
                }}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtnPrimary, { flex: 1.5, backgroundColor: '#EA580C', marginBottom: 0 }]} 
                onPress={handleStartChallenge}
              >
                <Text style={styles.modalBtnPrimaryText}>Begin Challenge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal visible={isEditGoalModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconBg, { backgroundColor: '#FFF7ED' }]}>
              <FontAwesome5 name="edit" size={20} color="#EA580C" />
            </View>
            <Text style={styles.goalModalTitle}>Edit Challenge</Text>
            <Text style={styles.goalModalSubtitle}>
              Modify your current target and starting resolve. Note: this will not reset your active streak.
            </Text>

            <Text style={styles.relapseInputLabel}>TARGET CHALLENGE (DAYS)</Text>
            <View style={styles.presetGrid}>
              {[7, 21, 45, 90, 180, 365].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.presetBtn, editGoalDays === val && styles.presetBtnActive]}
                  onPress={() => setEditGoalDays(val)}
                >
                  <Text style={[styles.presetBtnTitle, editGoalDays === val && styles.presetBtnTextActive]}>{val}</Text>
                  <Text style={[styles.presetBtnLabel, editGoalDays === val && styles.presetBtnTextActive]}>Days</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.selectedPresetLabel}>
              {editGoalDays === 7 ? '7 Days · Micro Reboot 🌱' : 
               editGoalDays === 21 ? '21 Days · Habit Builder 🌿' : 
               editGoalDays === 45 ? '45 Days · Discipline Master 🏹' : 
               editGoalDays === 90 ? '90 Days · Dopamine Reset 🔥' : 
               editGoalDays === 180 ? '180 Days · Deep Healing 🌊' : 
               '365 Days · Brahmacharya Journey 🛡️'}
            </Text>

            <Text style={styles.relapseInputLabel}>YOUR INTENTION / RESOLVE</Text>
            <TextInput
              style={[styles.relapseTextInput, { width: '100%', minHeight: 60, marginBottom: 20 }]}
              placeholder="Edit your start reason..."
              placeholderTextColor="#94A3B8"
              value={editReasonInput}
              onChangeText={setEditReasonInput}
              multiline
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={[styles.modalBtnSecondary, { flex: 1 }]} 
                onPress={() => setIsEditGoalModalOpen(false)}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtnPrimary, { flex: 1.5, backgroundColor: '#EA580C', marginBottom: 0 }]} 
                onPress={handleEditGoalSave}
              >
                <Text style={styles.modalBtnPrimaryText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal Completed Celebration Modal */}
      <Modal visible={isGoalCompletedModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#EA580C', borderWidth: 2 }]}>
            <View style={[styles.modalIconBg, { backgroundColor: '#FEF3C7' }]}>
              <FontAwesome5 name="trophy" size={28} color="#D97706" />
            </View>
            <Text style={[styles.goalModalTitle, { color: '#B45309' }]}>Victory Achieved! 🏆</Text>
            <Text style={styles.goalModalSubtitle}>
              Congratulations! You have successfully completed your target of {targetGoalDays} days clean.
            </Text>

            <View style={styles.victoryCard}>
              <Text style={styles.victoryLabel}>INTENTION MET</Text>
              <Text style={styles.victoryText}>&quot;{startReason}&quot;</Text>
            </View>

            <Text style={styles.victoryNextPhaseText}>
              Claiming your victory will archive this challenge into history and reset your active streak/dincharya/relapses.
            </Text>

            <TouchableOpacity 
              style={[styles.modalBtnPrimary, { width: '100%', backgroundColor: '#D97706', marginBottom: 0 }]} 
              onPress={claimVictory}
            >
              <Text style={styles.modalBtnPrimaryText}>Claim Victory & Restart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Urge Surfer Modal */}
      <Modal visible={isUrgeModalOpen} transparent animationType="slide">
        <View style={styles.urgeOverlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={closeUrgeSurfer}>
            <FontAwesome5 name="times" size={24} color="#94A3B8" />
          </TouchableOpacity>
          
          <View style={styles.urgeContent}>
            <View style={styles.urgeHeaderInfo}>
              <Text style={styles.urgeTitle}>Urge Surfer</Text>
              <Text style={styles.urgeSubtitle}>
                {Math.floor(urgeElapsed / 60)}:{(urgeElapsed % 60).toString().padStart(2, '0')} · {urgeCycles} {urgeCycles === 1 ? 'cycle' : 'cycles'}
              </Text>
            </View>

            {/* Breathing Animated Circle */}
            <View style={styles.urgeBreathContainer}>
              <View style={styles.urgeOuterRing3}>
                <View style={styles.urgeOuterRing2}>
                  <View style={styles.urgeOuterRing1}>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => setIsUrgeActive(!isUrgeActive)}>
                      <Animated.View style={[styles.urgeBreathCircle, animatedUrgeCircleStyle]}>
                        <Text style={styles.urgeStageStateText}>{STAGES[urgeStageIndex].name}</Text>
                        <Text style={styles.urgeStageTimerText}>{urgeStageTimeLeft}</Text>
                      </Animated.View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Breathing Stage Timeline tracker */}
            <View style={styles.urgeTimelineContainer}>
              {STAGES.map((st, index) => {
                const isCurrent = index === urgeStageIndex;
                return (
                  <View key={st.name} style={styles.urgeTimelineItem}>
                    <View style={[styles.urgeTimelineDot, isCurrent && styles.urgeTimelineDotActive]} />
                    <Text style={[styles.urgeTimelineLabel, isCurrent && styles.urgeTimelineLabelActive]}>
                      {st.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.urgeActionContainer}>
              <TouchableOpacity 
                style={[styles.urgeBtnStop, urgeActiveBtnStyle(isUrgeActive)]} 
                onPress={() => setIsUrgeActive(!isUrgeActive)}
              >
                <Text style={isUrgeActive ? styles.urgeBtnStopText : styles.urgeBtnStartText}>
                  {isUrgeActive ? 'Stop' : 'Start'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.urgeBtnReset} onPress={resetUrgeSurfer}>
                <Text style={styles.urgeBtnResetText}>Reset</Text>
              </TouchableOpacity>
            </View>
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

const urgeActiveBtnStyle = (active: boolean) => {
  return active ? styles.urgeBtnActiveStop : styles.urgeBtnActiveStart;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0', // warm beige background
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerUser: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  circleWrapper: {
    width: CIRCLE_RADIUS * 2 + 20,
    height: CIRCLE_RADIUS * 2 + 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  omWatermark: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  svgRotation: {
    transform: [{ rotate: '-225deg' }], // rotate so open arc faces bottom center
    zIndex: 2,
  },
  circleCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  daysText: {
    fontSize: 54,
    fontWeight: 'bold',
    color: '#0F172A',
    lineHeight: 60,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    gap: 8,
  },
  timeBlock: {
    alignItems: 'center',
    width: 60,
  },
  timeCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
  },
  timeDivider: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: -14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 28,
  },
  btnEmergency: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  btnEmergencyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  btnRelapse: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  btnRelapseText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    position: 'relative',
  },
  quoteIcon: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFEDD5',
    position: 'absolute',
    top: -10,
    left: 20,
    height: 60,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#334155',
    lineHeight: 24,
    marginTop: 20,
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    letterSpacing: 1,
  },
  leagueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leagueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leagueTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  activeLeagueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  leagueRight: {
    alignItems: 'flex-end',
  },
  nextLeagueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  daysAwayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    marginTop: 2,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EA580C',
    borderRadius: 4,
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
    padding: 32,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalIconBg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalBtnPrimary: {
    backgroundColor: '#EA580C',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBtnSecondary: {
    backgroundColor: '#F1F5F9',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 16,
  },
  urgeOverlay: {
    flex: 1,
    backgroundColor: '#F5F4F0', // warm beige background
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    padding: 12,
    zIndex: 10,
  },
  urgeContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    width: '100%',
    paddingTop: 40,
  },
  urgeHeaderInfo: {
    alignItems: 'center',
  },
  urgeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  urgeSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  urgeBreathContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgeOuterRing3: {
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(234, 88, 12, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgeOuterRing2: {
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: 'rgba(234, 88, 12, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgeOuterRing1: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(234, 88, 12, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgeBreathCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#FFEDD5', // light orange tint
    borderWidth: 2,
    borderColor: '#FDBA74',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  urgeStageStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 4,
  },
  urgeStageTimerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  urgeTimelineContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 40,
  },
  urgeTimelineItem: {
    alignItems: 'center',
    flex: 1,
  },
  urgeTimelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginBottom: 8,
  },
  urgeTimelineDotActive: {
    backgroundColor: '#EA580C',
  },
  urgeTimelineLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  urgeTimelineLabelActive: {
    color: '#EA580C',
  },
  urgeActionContainer: {
    width: '100%',
    paddingHorizontal: 32,
    gap: 12,
  },
  urgeBtnStop: {
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
  },
  urgeBtnActiveStop: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  urgeBtnActiveStart: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  urgeBtnStopText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '700',
  },
  urgeBtnStartText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  urgeBtnReset: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  urgeBtnResetText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '700',
  },
  relapseInputContainer: {
    width: '100%',
    marginBottom: 20,
    marginTop: 10,
  },
  relapseInputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  relapseTextInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    gap: 4,
  },
  goalPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C',
  },
  goalModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  goalModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  presetGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  presetBtn: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '31%',
    marginBottom: 10,
  },
  presetBtnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
  },
  presetBtnLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  selectedPresetLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: '#FFF7ED',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  presetBtnActive: {
    backgroundColor: '#FFEDD5',
    borderColor: '#EA580C',
  },
  presetBtnText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 14,
  },
  presetBtnTextActive: {
    color: '#EA580C',
  },
  customGoalRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  customGoalInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    height: 48,
  },
  customGoalBtn: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
  },
  customGoalBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: '#EA580C',
    width: 20,
  },
  modalTitleLeft: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  optionBtn: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  optionBtnActive: {
    backgroundColor: '#FFEDD5',
    borderColor: '#EA580C',
  },
  optionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  optionBtnTextActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 6,
    marginBottom: 16,
  },
  timeBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  timeBtnActive: {
    backgroundColor: '#FFEDD5',
    borderColor: '#EA580C',
  },
  timeBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  timeBtnTextActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 10,
  },
  leagueBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leagueBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leagueStageRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leagueStageCol: {
    flex: 1,
  },
  leagueSubLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  leagueSubVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  leagueProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressMinLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  progressNextLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C',
  },
  progressMaxLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  startChallengeBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFEDD5',
  },
  startBtnGlowText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  startBtnSubText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFEDD5',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  victoryCard: {
    width: '100%',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
    alignItems: 'center',
  },
  victoryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  victoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  victoryNextPhaseText: {
    fontSize: 11,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});
