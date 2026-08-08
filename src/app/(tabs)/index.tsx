/* eslint-disable react-hooks/immutability */
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import CustomAlert from '../../components/CustomAlert';
import api from '../../utils/api';

const LEAGUE_BADGES: { [key: string]: any } = {
  seed: require('../../../assets/leaque-images/seed.png'),
  sprout: require('../../../assets/leaque-images/sprout.png'),
  frozen: require('../../../assets/leaque-images/frozen.png'),
  bloom: require('../../../assets/leaque-images/bloom.png'),
  season: require('../../../assets/leaque-images/season.png'),
  aurora: require('../../../assets/leaque-images/aurora.png'),
  brahmachari: require('../../../assets/leaque-images/brahmacharya.png'),
};

interface LeagueDetail {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  progressText: string;
  milestones: string[];
  reqDays: number;
}

const LEAGUE_DETAILS: LeagueDetail[] = [
  {
    id: 'seed',
    emoji: '🌱',
    title: 'Seed',
    subtitle: 'THE BEGINNING',
    description: 'Every great journey starts with a single decision. Your commitment has been planted, and the foundation for a stronger mind begins today.',
    progressText: 'days to Sprout',
    milestones: ['Started your journey', 'Built your first habit', 'Took the first step toward discipline'],
    reqDays: 0,
  },
  {
    id: 'sprout',
    emoji: '🌱',
    title: 'Sprout',
    subtitle: 'THE EMERGING ROOTS',
    description: 'Your discipline has taken root. Daily actions are becoming habits, and your mind is learning to choose growth over impulses.',
    progressText: 'days to Frozen',
    milestones: ['7-day streak completed', 'Daily routine becoming consistent', 'Improved self-control'],
    reqDays: 7,
  },
  {
    id: 'frozen',
    emoji: '❄️',
    title: 'Frozen',
    subtitle: 'THE TEST',
    description: 'Growth continues even through difficult days. Like a bud surviving winter, your discipline is becoming stronger under pressure.',
    progressText: 'days to Bloom',
    milestones: ['21-day milestone', 'Better urge control', 'Greater emotional resilience'],
    reqDays: 21,
  },
  {
    id: 'bloom',
    emoji: '🌸',
    title: 'Bloom',
    subtitle: 'THE ASCENT',
    description: 'Weeks of discipline have begun to blossom into lasting change. Your confidence grows as your mind becomes calmer and more focused.',
    progressText: 'days to Season',
    milestones: ['30-day streak milestone', 'Heightened mental clarity', 'Increased energy and confidence'],
    reqDays: 40,
  },
  {
    id: 'season',
    emoji: '🍂',
    title: 'Season',
    subtitle: 'THE BALANCE',
    description: 'True discipline survives every season. Whether life is easy or difficult, you continue moving forward with consistency.',
    progressText: 'days to Aurora',
    milestones: ['Built lasting habits', 'Greater emotional balance', 'Strong daily discipline'],
    reqDays: 90,
  },
  {
    id: 'aurora',
    emoji: '🌌',
    title: 'Aurora',
    subtitle: 'THE LIGHT',
    description: 'Your consistency now shines from within. Discipline is no longer a challenge—it has become part of who you are.',
    progressText: 'days to Brahmachari',
    milestones: ['One of the top achievers', 'Exceptional consistency', 'Inspiring long-term commitment'],
    reqDays: 180,
  },
  {
    id: 'brahmachari',
    emoji: '🏹',
    title: 'Brahmachari',
    subtitle: 'THE CONTROL',
    description: 'Discipline is no longer something you practice—it is part of your identity. Your journey now inspires others to begin their own.',
    progressText: 'Maximum League Achieved',
    milestones: ['365-day milestone completed', 'Master of self-discipline', 'Highest league unlocked'],
    reqDays: 365,
  },
];

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
  const [isArchivedConfirmModalOpen, setIsArchivedConfirmModalOpen] = useState(false);
  const [activeChallengeCompletionRate, setActiveChallengeCompletionRate] = useState(0);
  const [activeChallengeBestStreak, setActiveChallengeBestStreak] = useState(0);

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
  const [isLeagueModalOpen, setIsLeagueModalOpen] = useState(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('seed');
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
        current: 'seed',
        next: 'sprout',
        nextDaysReq: 7,
        icon: 'seedling',
        stage: 'Acute Withdrawal',
        energy: 'Virya (Physical)'
      };
    } else if (currentDays < 21) {
      return {
        current: 'sprout',
        next: 'frozen',
        nextDaysReq: 21,
        icon: 'medal',
        stage: 'Habit Formation',
        energy: 'Prana (Vitality)'
      };
    } else if (currentDays < 40) {
      return {
        current: 'frozen',
        next: 'bloom',
        nextDaysReq: 40,
        icon: 'shield-alt',
        stage: 'Discipline',
        energy: 'Tejas (Radiance)'
      };
    } else if (currentDays < 90) {
      return {
        current: 'bloom',
        next: 'season',
        nextDaysReq: 90,
        icon: 'crown',
        stage: 'Dopamine Reset',
        energy: 'Ojas (Clarity)'
      };
    } else if (currentDays < 180) {
      return {
        current: 'season',
        next: 'aurora',
        nextDaysReq: 180,
        icon: 'gem',
        stage: 'Deep Healing',
        energy: 'Spiritual Alignment'
      };
    } else if (currentDays < 365) {
      return {
        current: 'aurora',
        next: 'brahmachari',
        nextDaysReq: 365,
        icon: 'mountain',
        stage: 'Transmutation',
        energy: 'Profound Peace'
      };
    } else {
      return {
        current: 'brahmachari',
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

  const calculateActiveChallengeStats = async () => {
    try {
      if (!challengeStart) return;
      const start = new Date(challengeStart);
      const end = new Date();
      const dateKeys: string[] = [];
      const dateList: string[] = [];

      const temp = new Date(start);
      while (temp <= end) {
        const dateStr = toLocalDateString(temp);
        dateKeys.push(`dincharya_${dateStr}`);
        dateList.push(dateStr);
        temp.setDate(temp.getDate() + 1);
      }

      let totalScheduled = 0;
      let totalCompleted = 0;

      if (dateKeys.length > 0) {
        const pairs = await AsyncStorage.multiGet(dateKeys);
        const taskMap = Object.fromEntries(pairs);

        for (const dateStr of dateList) {
          const stored = taskMap[`dincharya_${dateStr}`];
          if (stored) {
            const tasks = JSON.parse(stored);
            totalScheduled += tasks.length;
            totalCompleted += tasks.filter((t: any) => t.completed).length;
          } else {
            const everydayTasksStr = await AsyncStorage.getItem('ojas_everyday_tasks');
            const onedayTasksStr = await AsyncStorage.getItem(`ojas_oneday_tasks_${dateStr}`);
            const everyday = everydayTasksStr ? JSON.parse(everydayTasksStr) : [];
            const oneday = onedayTasksStr ? JSON.parse(onedayTasksStr) : [];
            totalScheduled += everyday.length + oneday.length;
          }
        }
      }

      const rate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
      setActiveChallengeCompletionRate(rate);

      // Best streak calculation during active challenge
      const storedRelapses = await AsyncStorage.getItem('ojas_relapses');
      const relapseList = storedRelapses ? JSON.parse(storedRelapses) : [];

      const relDates = relapseList
        .map((r: any) => new Date(r.date))
        .filter((rDate: Date) => rDate >= start && rDate <= end)
        .sort((a: any, b: any) => a.getTime() - b.getTime());

      let bestStr = 0;
      if (relDates.length === 0) {
        const diff = end.getTime() - start.getTime();
        bestStr = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
      } else {
        let prevDate = new Date(start);
        relDates.forEach((rDate: Date) => {
          const diff = rDate.getTime() - prevDate.getTime();
          const dCount = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (dCount > bestStr) bestStr = dCount;
          prevDate = rDate;
        });
        const diff = end.getTime() - prevDate.getTime();
        const dCount = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (dCount > bestStr) bestStr = dCount;
      }

      setActiveChallengeBestStreak(bestStr);
    } catch (e) {
      console.error('Error calculating active challenge stats:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadJourney();
    }, [])
  );

  useEffect(() => {
    if (isGoalCompletedModalOpen) {
      calculateActiveChallengeStats();
    }
  }, [isGoalCompletedModalOpen]);

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

      // Compile routine history logs during this challenge
      let overallCompletionRate = 0;
      let totalTasksScheduled = 0;
      let totalTasksCompleted = 0;
      const dailyLogs: { [key: string]: any } = {};

      if (challengeStart) {
        const start = new Date(challengeStart);
        const end = new Date();
        const dateKeys: string[] = [];
        const dateList: string[] = [];

        const temp = new Date(start);
        while (temp <= end) {
          const dateStr = toLocalDateString(temp);
          dateKeys.push(`dincharya_${dateStr}`);
          dateList.push(dateStr);
          temp.setDate(temp.getDate() + 1);
        }

        if (dateKeys.length > 0) {
          const pairs = await AsyncStorage.multiGet(dateKeys);
          const taskMap = Object.fromEntries(pairs);

          for (const dateStr of dateList) {
            const stored = taskMap[`dincharya_${dateStr}`];
            if (stored) {
              const tasks = JSON.parse(stored);
              const total = tasks.length;
              const completed = tasks.filter((t: any) => t.completed).length;
              totalTasksScheduled += total;
              totalTasksCompleted += completed;
              dailyLogs[dateStr] = {
                total,
                completed,
                tasks: tasks.map((t: any) => ({ title: t.title, completed: t.completed, icon: t.icon })),
              };
            } else {
              const everydayTasksStr = await AsyncStorage.getItem('ojas_everyday_tasks');
              const onedayTasksStr = await AsyncStorage.getItem(`ojas_oneday_tasks_${dateStr}`);
              const everyday = everydayTasksStr ? JSON.parse(everydayTasksStr) : [];
              const oneday = onedayTasksStr ? JSON.parse(onedayTasksStr) : [];
              const total = everyday.length + oneday.length;
              totalTasksScheduled += total;
              dailyLogs[dateStr] = {
                total,
                completed: 0,
                tasks: [...everyday, ...oneday].map((t: any) => ({ title: t.title, completed: false, icon: t.icon })),
              };
            }
          }
        }
        if (totalTasksScheduled > 0) {
          overallCompletionRate = Math.round((totalTasksCompleted / totalTasksScheduled) * 100);
        }
      }

      // Count relapses during challenge
      let relapsesDuringChallenge = 0;
      try {
        const storedRelapses = await AsyncStorage.getItem('ojas_relapses');
        if (storedRelapses && challengeStart) {
          const list = JSON.parse(storedRelapses);
          const start = new Date(challengeStart);
          const end = new Date();
          relapsesDuringChallenge = list.filter((r: any) => {
            const rDate = new Date(r.date);
            return rDate >= start && rDate <= end;
          }).length;
        }
      } catch (err) {
        console.error('Error counting relapses during challenge:', err);
      }

      const newArchivedGoal = {
        id: Date.now().toString(),
        target_days: targetGoalDays,
        start_date: challengeStart ? challengeStart.toISOString() : new Date().toISOString(),
        completion_date: new Date().toISOString(),
        start_reason: startReason,
        status: 'completed',
        overall_completion_rate: overallCompletionRate,
        total_tasks_scheduled: totalTasksScheduled,
        total_tasks_completed: totalTasksCompleted,
        daily_logs: dailyLogs,
        relapses_during_challenge: relapsesDuringChallenge,
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

      setIsArchivedConfirmModalOpen(true);
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
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.headerLogo}
            />
            <Text style={styles.headerTitle}>Kaivalya</Text>
          </View>
          <Text style={styles.headerUser}>Hi, {user?.name?.split(' ')[0] || 'seeker'}</Text>
        </View>

        {/* Hero Circular Progress Gauge Card */}
        <View style={styles.heroCard}>
          <Text style={styles.streakLabel}>SANKALPA DURATION</Text>

          <View style={styles.circleWrapper}>
            {/* Bow & Arrow Background Watermark */}
            <View style={styles.omWatermark}>
              <Image
                source={require('../../../assets/images/logo.png')}
                style={{ width: 100, height: 100, opacity: 0.04 }}
                resizeMode="contain"
              />
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
                <Animated.View style={animatedGlowStyle}>
                  <TouchableOpacity
                    style={styles.startChallengeBtn}
                    onPress={() => setIsStartChallengeModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.startBtnGlowText}>START</Text>
                    <Text style={styles.startBtnSubText}>CHALLENGE</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>

            {/* League Badge positioned half-in, half-out at the bottom center border */}
            {streakStart && LEAGUE_BADGES[getLeagueData(streakStart ? streakDays : 0).current] && (
              <TouchableOpacity
                onPress={() => {
                  const curLeague = getLeagueData(streakStart ? streakDays : 0).current;
                  setSelectedLeagueId(curLeague);
                  setIsLeagueModalOpen(true);
                }}
                style={{
                  position: 'absolute',
                  bottom: -32,
                  zIndex: 10
                }}
                activeOpacity={0.8}
              >
                <Image
                  source={LEAGUE_BADGES[getLeagueData(streakStart ? streakDays : 0).current]}
                  style={{ width: 64, height: 64 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Challenge Pill / Button under the league icon */}
          <View style={{ alignItems: 'center', marginTop: 36, marginBottom: 8 }}>
            {isChallengeActive ? (
              <TouchableOpacity style={styles.goalPill} onPress={openEditGoalModal}>
                <FontAwesome5 name="bullseye" size={9} color="#EA580C" />
                <Text style={styles.goalPillText}>Challenge: {challengeDays}/{targetGoalDays}d</Text>
              </TouchableOpacity>
            ) : streakStart ? (
              <Animated.View style={animatedGlowStyle}>
                <TouchableOpacity
                  style={[styles.goalPill, { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginTop: 0, gap: 6 }]}
                  onPress={() => setIsStartChallengeModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <FontAwesome5 name="plus-circle" size={12} color="#EA580C" />
                  <Text style={[styles.goalPillText, { fontSize: 12, fontWeight: '700' }]}>Start New Challenge</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              // Empty spacer to maintain layout spacing and prevent overlap with absolute positioned league icon for new users
              <View style={{ height: 20 }} />
            )}
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
                <Text style={styles.leagueTitle}>{"TODAY'S DINCHARYA"}</Text>
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
              {[2, 7, 21, 40, 90, 180, 365].map((val) => (
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
              {startGoalDays === 2 ? '2 Days · Testing Challenge 🧪' :
                startGoalDays === 7 ? '7 Days · Sprout Challenge 🌱' :
                  startGoalDays === 21 ? '21 Days · Frozen Challenge ❄️' :
                    startGoalDays === 40 ? '40 Days · Bloom Challenge 🌸' :
                      startGoalDays === 90 ? '90 Days · Season Challenge 🍂' :
                        startGoalDays === 180 ? '180 Days · Aurora Challenge ✨' :
                          '365 Days · Brahmachari Challenge 🏆'}
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
            {isChallengeActive && (
              <Text style={{ fontSize: 11, color: '#EA580C', fontWeight: '600', marginBottom: 8 }}>
                🙃 Target days cannot be changed while a challenge is active.
              </Text>
            )}
            <View style={[styles.presetGrid, isChallengeActive && { opacity: 0.6 }]}>
              {[2, 7, 21, 40, 90, 180, 365].map((val) => (
                <TouchableOpacity
                  key={val}
                  disabled={isChallengeActive}
                  style={[styles.presetBtn, editGoalDays === val && styles.presetBtnActive]}
                  onPress={() => setEditGoalDays(val)}
                >
                  <Text style={[styles.presetBtnTitle, editGoalDays === val && styles.presetBtnTextActive]}>{val}</Text>
                  <Text style={[styles.presetBtnLabel, editGoalDays === val && styles.presetBtnTextActive]}>Days</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.selectedPresetLabel}>
              {editGoalDays === 2 ? '2 Days · Testing Challenge 🧪' :
                editGoalDays === 7 ? '7 Days · Sprout Challenge 🌱' :
                  editGoalDays === 21 ? '21 Days · Frozen Challenge ❄️' :
                    editGoalDays === 40 ? '40 Days · Bloom Challenge 🌸' :
                      editGoalDays === 90 ? '90 Days · Season Challenge 🍂' :
                        editGoalDays === 180 ? '180 Days · Aurora Challenge ✨' :
                          '365 Days · Brahmachari Challenge 🏆'}
            </Text>

            <Text style={styles.relapseInputLabel}>YOUR INTENTION / Goal</Text>
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

      {/* Sankalpa Completed Celebration Modal */}
      <Modal visible={isGoalCompletedModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#EA580C', borderWidth: 2 }]}>
            <View style={[styles.modalIconBg, { backgroundColor: '#FEF3C7' }]}>
              <FontAwesome5 name="trophy" size={28} color="#D97706" />
            </View>
            <Text style={[styles.goalModalTitle, { color: '#B45309' }]}>🏆 Sankalpa Completed!</Text>
            <Text style={styles.goalModalSubtitle}>
              {targetGoalDays}-Day Discipline Journey
            </Text>

            <Text style={[styles.victoryNextPhaseText, { textAlign: 'center', marginBottom: 16 }]}>
              You completed your {targetGoalDays}-day Sankalpa.{"\n"}
              Your daily discipline and consistency have been recorded as part of your journey.
            </Text>

            <View style={[styles.victoryCard, { width: '100%', padding: 14, gap: 8, marginBottom: 20 }]}>
              <Text style={[styles.victoryLabel, { marginBottom: 6 }]}>CHALLENGE SUMMARY</Text>
              <Text style={{ fontSize: 13, color: '#475569', fontWeight: '600' }}>
                📅 {targetGoalDays} Days Completed
              </Text>
              <Text style={{ fontSize: 13, color: '#475569', fontWeight: '600' }}>
                ✅ {activeChallengeCompletionRate}% Dincharya Completion
              </Text>
              <Text style={{ fontSize: 13, color: '#475569', fontWeight: '600' }}>
                🔥 {activeChallengeBestStreak} Days Best Recovery Streak
              </Text>
            </View>

            <Text style={[styles.victoryNextPhaseText, { color: '#64748B', fontSize: 11, textAlign: 'center', marginBottom: 20 }]}>
              Your Sankalpa is complete, but your journey continues.{"\n\n"}
              Your Recovery Journey is not reset. Your recovery streak, relapse history, and progress remain unchanged.
            </Text>

            <View style={{ width: '100%', gap: 10 }}>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, { width: '100%', backgroundColor: '#EA580C', marginBottom: 0 }]}
                onPress={claimVictory}
              >
                <Text style={styles.modalBtnPrimaryText}>Archive & Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sankalpa Archived Confirmation Modal */}
      <Modal visible={isArchivedConfirmModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#E2E8F0', borderWidth: 1 }]}>
            <View style={[styles.modalIconBg, { backgroundColor: '#F0FDF4' }]}>
              <FontAwesome5 name="check" size={24} color="#16A34A" />
            </View>
            <Text style={[styles.goalModalTitle, { color: '#16A34A' }]}>Sankalpa Archived 🌱</Text>
            <Text style={[styles.goalModalSubtitle, { textAlign: 'center', marginBottom: 20 }]}>
              Your {targetGoalDays}-day discipline journey has been saved to History.
              {"\n\n"}
              Ready to begin your next Sankalpa?
            </Text>

            <View style={{ width: '100%', gap: 10 }}>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, { width: '100%', backgroundColor: '#EA580C', marginBottom: 0 }]}
                onPress={() => {
                  setIsArchivedConfirmModalOpen(false);
                  setIsStartChallengeModalOpen(true);
                }}
              >
                <Text style={styles.modalBtnPrimaryText}>Start New Sankalpa</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtnSecondary, { width: '100%', borderColor: '#E2E8F0', borderWidth: 1 }]}
                onPress={() => setIsArchivedConfirmModalOpen(false)}
              >
                <Text style={styles.modalBtnSecondaryText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* League Details Bottom Sheet Modal */}
      <Modal visible={isLeagueModalOpen} transparent animationType="slide" onRequestClose={() => setIsLeagueModalOpen(false)}>
        <View style={styles.leagueModalOverlay}>
          <TouchableOpacity
            style={styles.leagueModalBackdrop}
            activeOpacity={1}
            onPress={() => setIsLeagueModalOpen(false)}
          />

          <View style={styles.leagueModalContent}>
            {/* Top Drag Indicator Handle */}
            <View style={styles.leagueModalHandle} />

            {/* Close Button Icon */}
            <TouchableOpacity
              style={styles.leagueModalCloseBtn}
              onPress={() => setIsLeagueModalOpen(false)}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="times" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {(() => {
              const selectedLeague = LEAGUE_DETAILS.find(ld => ld.id === selectedLeagueId) || LEAGUE_DETAILS[0];

              // Get active selected league progress
              const currentStreakDays = streakStart ? streakDays : 0;
              const currentIndex = LEAGUE_DETAILS.findIndex(l => l.id === selectedLeagueId);
              const nextLeague = currentIndex !== -1 && currentIndex < LEAGUE_DETAILS.length - 1
                ? LEAGUE_DETAILS[currentIndex + 1]
                : null;

              let percent = 0;
              let text = '';
              let leftVal = '0 days';
              let rightVal = '';

              if (selectedLeagueId === 'brahmachari') {
                percent = 100;
                text = 'Maximum League Achieved';
                leftVal = '365+ days';
                rightVal = 'Max';
              } else {
                if (currentStreakDays >= selectedLeague.reqDays) {
                  if (nextLeague && currentStreakDays < nextLeague.reqDays) {
                    const diff = nextLeague.reqDays - selectedLeague.reqDays;
                    const progressed = currentStreakDays - selectedLeague.reqDays;
                    percent = Math.min((progressed / diff) * 100, 100);
                    const daysLeft = nextLeague.reqDays - currentStreakDays;
                    text = `${daysLeft} days to ${nextLeague.title}`;
                    leftVal = `${currentStreakDays} days`;
                    rightVal = `${nextLeague.reqDays} days → ${nextLeague.title}`;
                  } else {
                    percent = 100;
                    text = 'League Completed';
                    leftVal = `${selectedLeague.reqDays} days`;
                    rightVal = 'Achieved';
                  }
                } else {
                  percent = 0;
                  text = `${selectedLeague.reqDays - currentStreakDays} days to unlock`;
                  leftVal = `${currentStreakDays} days`;
                  rightVal = `${selectedLeague.reqDays} days → ${selectedLeague.title}`;
                }
              }

              const isAchieved = currentStreakDays >= selectedLeague.reqDays;

              return (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.leagueModalScroll}>

                  {/* Premium Header Card */}
                  <View style={styles.leagueModalHeaderCard}>
                    <Image
                      source={LEAGUE_BADGES[selectedLeague.id]}
                      style={{ width: 80, height: 80, marginBottom: 16 }}
                      resizeMode="contain"
                    />

                    <Text style={styles.leagueModalTitle}>
                      {selectedLeague.title}
                    </Text>

                    <Text style={styles.leagueModalSubtitle}>
                      {selectedLeague.subtitle}
                    </Text>

                    <Text style={styles.leagueModalDescription}>
                      {selectedLeague.description}
                    </Text>

                    {/* Progress Bar Container */}
                    <View style={styles.leagueModalProgressBox}>
                      <View style={styles.leagueModalProgressLabels}>
                        <Text style={styles.leagueModalProgVal}>{leftVal}</Text>
                        <Text style={styles.leagueModalProgVal}>{rightVal}</Text>
                      </View>
                      <View style={styles.leagueModalProgressBarTrack}>
                        <View style={[styles.leagueModalProgressBarFill, { width: `${percent}%` }]} />
                      </View>
                      <Text style={styles.leagueModalProgressStatusText}>
                        {text}
                      </Text>
                    </View>

                    {/* Milestone List */}
                    <View style={styles.leagueModalMilestoneList}>
                      {selectedLeague.milestones.map((m, idx) => (
                        <View key={idx} style={styles.leagueModalMilestoneRow}>
                          <FontAwesome5
                            name="check-circle"
                            size={13}
                            color={isAchieved ? '#EA580C' : '#94A3B8'}
                            style={styles.leagueModalMilestoneCheck}
                          />
                          <Text style={[styles.leagueModalMilestoneText, !isAchieved && styles.leagueModalMilestoneLockedText]}>
                            {m}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* ALL LEAGUES List */}
                  <Text style={styles.leagueModalSectionTitle}>ALL LEAGUES</Text>

                  <View style={styles.leagueModalAllLeaguesContainer}>
                    {LEAGUE_DETAILS.map((l) => {
                      const isSelected = selectedLeagueId === l.id;
                      const isReached = currentStreakDays >= l.reqDays;

                      return (
                        <TouchableOpacity
                          key={l.id}
                          style={[styles.leagueModalLeagueItem, isSelected && styles.leagueModalLeagueItemActive]}
                          onPress={() => setSelectedLeagueId(l.id)}
                        >
                          <View style={[
                            styles.leagueModalItemIconBg,
                            isReached ? styles.leagueModalItemIconBgReached : styles.leagueModalItemIconBgLocked
                          ]}>
                            <Image
                              source={LEAGUE_BADGES[l.id]}
                              style={{ width: 26, height: 26, opacity: isReached ? 1 : 0.6 }}
                              resizeMode="contain"
                            />
                          </View>

                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.leagueModalItemName, isSelected && styles.leagueModalItemNameActive]}>
                              {l.title}
                            </Text>
                            <Text style={styles.leagueModalItemSubtitle}>
                              {l.subtitle}
                            </Text>
                          </View>

                          <View>
                            {isReached ? (
                              <Text style={styles.leagueModalItemStatusReached}>✓ Reached</Text>
                            ) : (
                              <Text style={styles.leagueModalItemStatusLocked}>Locked</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                </ScrollView>
              );
            })()}
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
  leagueModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  leagueModalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  leagueModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  leagueModalCloseBtn: {
    position: 'absolute',
    top: 8,
    right: 12,
    padding: 8,
    zIndex: 20,
  },
  leagueModalHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  leagueModalScroll: {
    paddingBottom: 32,
  },
  leagueModalHeaderCard: {
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginBottom: 20,
    marginTop: 12,
  },
  leagueModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#EA580C',
    textAlign: 'center',
  },
  leagueModalSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginTop: 4,
    marginBottom: 12,
    textAlign: 'center',
  },
  leagueModalDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  leagueModalProgressBox: {
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  leagueModalProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  leagueModalProgVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  leagueModalProgressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  leagueModalProgressBarFill: {
    height: '100%',
    backgroundColor: '#EA580C',
    borderRadius: 3,
  },
  leagueModalProgressStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
    textAlign: 'right',
    marginTop: 6,
  },
  leagueModalMilestoneList: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#FFEDD5',
    paddingTop: 8,
  },
  leagueModalMilestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 237, 213, 0.5)',
  },
  leagueModalMilestoneCheck: {
    marginRight: 10,
  },
  leagueModalMilestoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  leagueModalMilestoneLockedText: {
    color: '#94A3B8',
  },
  leagueModalSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },
  leagueModalAllLeaguesContainer: {
    width: '100%',
    gap: 8,
  },
  leagueModalLeagueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leagueModalLeagueItemActive: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  leagueModalItemIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leagueModalItemIconBgReached: {
    backgroundColor: '#FFEDD5',
  },
  leagueModalItemIconBgLocked: {
    backgroundColor: '#F1F5F9',
  },
  leagueModalItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  leagueModalItemNameActive: {
    color: '#EA580C',
  },
  leagueModalItemSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  leagueModalItemStatusReached: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  leagueModalItemStatusLocked: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
