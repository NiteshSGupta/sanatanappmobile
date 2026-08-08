import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const toLocalDateString = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

interface DayStatus {
  dayName: string;
  dateStr: string;
  completed: boolean;
  tasksCount: number;
  completedCount: number;
}

export default function ReportsScreen() {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [challengeProgressDays, setChallengeProgressDays] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [successRate, setSuccessRate] = useState(86); // fallback default
  const [activeTab, setActiveTab] = useState<'Challenges' | 'Discipline' | 'Recovery'>('Challenges');
  const [weeklyStatus, setWeeklyStatus] = useState<DayStatus[]>([]);
  const [relapses, setRelapses] = useState<any[]>([]);
  const [relapseStats, setRelapseStats] = useState({ week: 0, month: 0, year: 0 });

  const [targetGoalDays, setTargetGoalDays] = useState(90);
  const [triggerStats, setTriggerStats] = useState<any[]>([]);
  const [locationStats, setLocationStats] = useState<any[]>([]);
  const [timeStats, setTimeStats] = useState<any[]>([]);
  const [keystoneCompliance, setKeystoneCompliance] = useState(80);
  const [correlationScore, setCorrelationScore] = useState(83);
  const [goalsHistory, setGoalsHistory] = useState<any[]>([]);

  // Retrospective Modal States
  const [selectedRetroGoal, setSelectedRetroGoal] = useState<any>(null);
  const [isRetroModalOpen, setIsRetroModalOpen] = useState(false);
  const [selectedRetroDate, setSelectedRetroDate] = useState<string | null>(null);

  const getRetroDays = (goal: any) => {
    if (!goal || !goal.start_date || !goal.completion_date) return [];
    const days = [];
    const curr = new Date(goal.start_date);
    const end = new Date(goal.completion_date);

    // Normalize times to midnight for date comparisons
    curr.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (curr <= end) {
      days.push(toLocalDateString(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  };

  const renderRetroHeatmap = () => {
    if (!selectedRetroGoal) return null;
    const days = getRetroDays(selectedRetroGoal);

    if (!selectedRetroGoal.daily_logs || Object.keys(selectedRetroGoal.daily_logs).length === 0) {
      return (
        <View style={styles.noHeatmapContainer}>
          <FontAwesome5 name="info-circle" size={16} color="#64748B" style={{ marginBottom: 6 }} />
          <Text style={styles.noHeatmapText}>
            Granular calendar data is unavailable for sankalp completed prior to App version 1.1.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.heatmapCard}>
        <Text style={styles.heatmapSectionTitle}>CHALLENGE HEATMAP</Text>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#EA580C' }]} />
            <Text style={styles.legendLabel}>100% Done</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#FFEDD5', borderWidth: 1, borderColor: '#FDBA74' }]} />
            <Text style={styles.legendLabel}>Partial</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' }]} />
            <Text style={styles.legendLabel}>Missed / 0%</Text>
          </View>
        </View>

        <View style={styles.heatmapGrid}>
          {days.map((dateStr, index) => {
            const log = selectedRetroGoal.daily_logs[dateStr];
            let bgColor = '#F1F5F9';
            let borderColor = '#CBD5E1';
            let total = 0;
            let completed = 0;

            if (log) {
              total = log.total;
              completed = log.completed;
              if (total > 0) {
                if (completed === total) {
                  bgColor = '#EA580C';
                  borderColor = '#EA580C';
                } else if (completed > 0) {
                  bgColor = '#FFEDD5';
                  borderColor = '#FDBA74';
                }
              }
            }

            const isSelected = selectedRetroDate === dateStr;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.heatmapCell,
                  { backgroundColor: bgColor, borderColor: borderColor },
                  isSelected && styles.heatmapCellSelected
                ]}
                onPress={() => setSelectedRetroDate(dateStr)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.heatmapCellText,
                  { color: bgColor === '#EA580C' ? '#FFFFFF' : '#475569' }
                ]}>
                  {index + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.dayDetailsContainer}>
          {selectedRetroDate ? (() => {
            const log = selectedRetroGoal.daily_logs[selectedRetroDate];
            const displayDate = new Date(selectedRetroDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

            if (!log || !log.tasks || log.tasks.length === 0) {
              return (
                <View>
                  <Text style={styles.dayDetailsHeader}>{displayDate}</Text>
                  <Text style={styles.noTasksRetroText}>No routines were scheduled or recorded on this day. 🧘</Text>
                </View>
              );
            }

            return (
              <View>
                <Text style={styles.dayDetailsHeader}>{displayDate}</Text>
                <Text style={styles.dayDetailsSummary}>
                  Completed {log.completed} out of {log.total} tasks ({log.total > 0 ? Math.round((log.completed / log.total) * 100) : 0}%)
                </Text>

                <View style={styles.retroTasksList}>
                  {log.tasks.map((t: any, tid: number) => (
                    <View key={tid} style={styles.retroTaskRow}>
                      <View style={[styles.retroTaskCheck, t.completed && styles.retroTaskCheckCompleted]}>
                        {t.completed && <FontAwesome5 name="check" size={7} color="#FFFFFF" />}
                      </View>
                      <Text style={[styles.retroTaskText, t.completed && styles.retroTaskTextCompleted]}>
                        {t.title}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })() : (
            <Text style={styles.tapPromptText}>
              Tap any numbered day cell in the heatmap grid above to view the routine checkoff list for that day.
            </Text>
          )}
        </View>
      </View>
    );
  };

  const loadReportData = async () => {
    try {
      const activeVal = await AsyncStorage.getItem('ojas_challenge_active');
      const isActive = activeVal === 'true';

      // 1. Calculate Master Streak ALWAYS (only resets on relapse)
      const savedStreakStart = await AsyncStorage.getItem('ojas_streak_start');
      let streakDays = 0;
      if (savedStreakStart) {
        const now = new Date();
        const diff = now.getTime() - new Date(savedStreakStart).getTime();
        if (diff >= 0) {
          streakDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        }
      }
      setCurrentStreak(streakDays);

      // Best streak tracking
      const savedBest = await AsyncStorage.getItem('ojas_best_streak');
      let best = streakDays;
      if (savedBest) {
        best = Math.max(parseInt(savedBest), streakDays);
      }
      setBestStreak(best);
      await AsyncStorage.setItem('ojas_best_streak', best.toString());

      if (!isActive) {
        setChallengeProgressDays(0);
        setSuccessRate(0);

        const today = new Date();
        const last7DaysKeys: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dateStr = toLocalDateString(d);
          last7DaysKeys.push(`dincharya_${dateStr}`);
        }
        const pairs = last7DaysKeys.length > 0 ? await AsyncStorage.multiGet(last7DaysKeys) : [];
        const taskMap = Object.fromEntries(pairs);

        const last7Days: DayStatus[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dateStr = toLocalDateString(d);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

          const stored = taskMap[`dincharya_${dateStr}`];
          const dateTasks = stored ? JSON.parse(stored) : [];
          const completed = dateTasks.length > 0 && dateTasks.every((t: any) => t.completed);

          last7Days.push({
            dayName,
            dateStr,
            completed,
            tasksCount: dateTasks.length,
            completedCount: dateTasks.filter((t: any) => t.completed).length,
          });
        }
        setWeeklyStatus(last7Days);
        return;
      }

      const savedStart = await AsyncStorage.getItem('ojas_challenge_start');
      let cDays = 0;
      const start = savedStart ? new Date(savedStart) : new Date();
      if (savedStart) {
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        if (diff >= 0) {
          cDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        }
      }
      setChallengeProgressDays(cDays);

      // 2. Scan last 7 days for tasks (optimized batch query)
      const today = new Date();
      const last7DaysKeys: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = toLocalDateString(d);
        last7DaysKeys.push(`dincharya_${dateStr}`);
      }
      const pairs = await AsyncStorage.multiGet(last7DaysKeys);
      const taskMap = Object.fromEntries(pairs);

      const last7Days: DayStatus[] = [];
      let totalTasks = 0;
      let completedTasks = 0;

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = toLocalDateString(d);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

        // Skip days before start date
        if (d < start && d.toDateString() !== start.toDateString()) {
          last7Days.push({
            dayName,
            dateStr,
            completed: false,
            tasksCount: 0,
            completedCount: 0,
          });
          continue;
        }

        const storedTasks = taskMap[`dincharya_${dateStr}`];
        let completed = false;
        let tCount = 0;
        let cCount = 0;

        if (storedTasks) {
          const tasks = JSON.parse(storedTasks);
          tCount = tasks.length;
          cCount = tasks.filter((t: any) => t.completed).length;
          completed = cCount > 0;
        } else {
          const everydayTasksStr = await AsyncStorage.getItem('ojas_everyday_tasks');
          const onedayTasksStr = await AsyncStorage.getItem(`ojas_oneday_tasks_${dateStr}`);
          const eCount = everydayTasksStr ? JSON.parse(everydayTasksStr).length : 0;
          const oCount = onedayTasksStr ? JSON.parse(onedayTasksStr).length : 0;
          tCount = eCount + oCount;
          cCount = 0;
          completed = false;
        }

        totalTasks += tCount;
        completedTasks += cCount;

        last7Days.push({
          dayName,
          dateStr,
          completed,
          tasksCount: tCount,
          completedCount: cCount,
        });
      }

      setWeeklyStatus(last7Days);

      if (totalTasks > 0) {
        const rate = Math.round((completedTasks / totalTasks) * 100);
        setSuccessRate(rate);
      } else {
        setSuccessRate(0);
      }

    } catch (e) {
      console.error('Error loading report data:', e);
    }
  };

  const loadRelapseData = useCallback(async () => {
    try {
      const storedRelapses = await AsyncStorage.getItem('ojas_relapses');
      if (storedRelapses) {
        const list = JSON.parse(storedRelapses);

        // Show all relapses (continuous recovery journey)
        setRelapses([...list].reverse());

        // Calculate counts based on time
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        let weekCount = 0;
        let monthCount = 0;
        let yearCount = 0;

        list.forEach((r: any) => {
          const rDate = new Date(r.date);
          if (rDate >= oneWeekAgo) weekCount++;
          if (rDate >= oneMonthAgo) monthCount++;
          if (rDate >= oneYearAgo) yearCount++;
        });

        setRelapseStats({
          week: weekCount,
          month: monthCount,
          year: yearCount,
        });
      } else {
        setRelapses([]);
        setRelapseStats({ week: 0, month: 0, year: 0 });
      }
    } catch (e) {
      console.error('Error loading relapse report data:', e);
    }
  }, []);

  const loadAdvancedMetrics = async () => {
    try {
      // Load Goal History
      const storedHistory = await AsyncStorage.getItem('ojas_goals_history');
      if (storedHistory) {
        setGoalsHistory(JSON.parse(storedHistory));
      } else {
        setGoalsHistory([]);
      }

      const activeVal = await AsyncStorage.getItem('ojas_challenge_active');
      const isActive = activeVal === 'true';

      const savedGoal = await AsyncStorage.getItem('ojas_target_goal_days');
      if (savedGoal) {
        setTargetGoalDays(parseInt(savedGoal));
      } else {
        setTargetGoalDays(90);
      }

      const savedStart = await AsyncStorage.getItem('ojas_challenge_start');
      const journeyStartObj = savedStart ? new Date(savedStart) : null;

      // Load all relapses for trigger analytics (continuous recovery journey)
      const storedRelapses = await AsyncStorage.getItem('ojas_relapses');
      const relapseList = storedRelapses ? JSON.parse(storedRelapses) : [];

      const triggersMap: { [key: string]: number } = {};
      const locationsMap: { [key: string]: number } = {};
      const timesMap: { [key: string]: number } = {};

      relapseList.forEach((r: any) => {
        const trig = r.trigger_type || 'Unknown';
        const loc = r.location || 'Unknown';
        const tod = r.time_of_day || 'Unknown';

        triggersMap[trig] = (triggersMap[trig] || 0) + 1;
        locationsMap[loc] = (locationsMap[loc] || 0) + 1;
        timesMap[tod] = (timesMap[tod] || 0) + 1;
      });

      const totalRelapses = relapseList.length || 1;

      const computedTriggers = Object.keys(triggersMap).map(k => ({
        name: k,
        percent: Math.round((triggersMap[k] / totalRelapses) * 100)
      })).sort((a, b) => b.percent - a.percent);

      const computedLocations = Object.keys(locationsMap).map(k => ({
        name: k,
        percent: Math.round((locationsMap[k] / totalRelapses) * 100)
      })).sort((a, b) => b.percent - a.percent);

      const computedTimes = Object.keys(timesMap).map(k => ({
        name: k,
        percent: Math.round((timesMap[k] / totalRelapses) * 100)
      })).sort((a, b) => b.percent - a.percent);

      setTriggerStats(computedTriggers);
      setLocationStats(computedLocations);
      setTimeStats(computedTimes);

      // Keystone Habits compliance over last 7 days (requires active challenge start)
      let compliance = 0;
      if (journeyStartObj) {
        const today = new Date();
        const last7DaysKeys: string[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          if (d < journeyStartObj && d.toDateString() !== journeyStartObj.toDateString()) continue;
          const dateStr = toLocalDateString(d);
          last7DaysKeys.push(`dincharya_${dateStr}`);
        }
        const pairs = last7DaysKeys.length > 0 ? await AsyncStorage.multiGet(last7DaysKeys) : [];
        const taskMap = Object.fromEntries(pairs);

        let totalKeystones = 0;
        let completedKeystones = 0;

        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          if (d < journeyStartObj && d.toDateString() !== journeyStartObj.toDateString()) continue;

          const dateStr = toLocalDateString(d);
          const storedTasks = taskMap[`dincharya_${dateStr}`];
          if (storedTasks) {
            const tasks = JSON.parse(storedTasks);
            const keystones = tasks.filter((t: any) => t.keystone);
            if (keystones.length > 0) {
              totalKeystones += keystones.length;
              completedKeystones += keystones.filter((t: any) => t.completed).length;
            }
          } else {
            const everydayTasksStr = await AsyncStorage.getItem('ojas_everyday_tasks');
            const onedayTasksStr = await AsyncStorage.getItem(`ojas_oneday_tasks_${dateStr}`);
            const eTasks = everydayTasksStr ? JSON.parse(everydayTasksStr) : [];
            const oTasks = onedayTasksStr ? JSON.parse(onedayTasksStr) : [];
            const combined = [...eTasks, ...oTasks];
            const keystones = combined.filter((t: any) => t.keystone);
            totalKeystones += keystones.length;
          }
        }

        compliance = totalKeystones > 0 ? Math.round((completedKeystones / totalKeystones) * 100) : 0;
      }
      setKeystoneCompliance(compliance);

      const willpower = Math.round((compliance * 0.6) + (successRate * 0.4));
      setCorrelationScore(willpower > 0 ? willpower : 0);

    } catch (e) {
      console.error('Error loading advanced metrics:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReportData();
      loadRelapseData();
      loadAdvancedMetrics();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadRelapseData])
  );

  // League details for the League Journey section
  const LEAGUES = [
    { name: 'Seed', days: '0+ days', req: 0, icon: 'seedling', image: require('../../../assets/leaque-images/seed.png'), imgSize: 26 },
    { name: 'Sprout', days: '7+ days', req: 7, icon: 'medal', image: require('../../../assets/leaque-images/sprout.png'), imgSize: 26 },
    { name: 'Frozen', days: '21+ days', req: 21, icon: 'shield-alt', image: require('../../../assets/leaque-images/frozen.png'), imgSize: 26 },
    { name: 'Bloom', days: '40+ days', req: 40, icon: 'crown', image: require('../../../assets/leaque-images/bloom.png'), imgSize: 26 },
    { name: 'Season', days: '90+ days', req: 90, icon: 'gem', image: require('../../../assets/leaque-images/season.png'), imgSize: 26 },
    { name: 'Aurora', days: '180+ days', req: 180, icon: 'mountain', image: require('../../../assets/leaque-images/aurora.png'), imgSize: 26, imgStyle: { borderRadius: 6 } },
    { name: 'Brahmachari', days: '365+ days', req: 365, icon: 'om', image: require('../../../assets/leaque-images/brahmacharya.png'), imgSize: 26 },
  ];

  // Helper to calculate progress for active league
  const getActiveLeagueProgress = (days: number) => {
    if (days >= 180 && days < 365) return Math.min(((days - 180) / 185) * 100, 100);
    if (days >= 90 && days < 180) return Math.min(((days - 90) / 90) * 100, 100);
    if (days >= 40 && days < 90) return Math.min(((days - 40) / 50) * 100, 100);
    if (days >= 21 && days < 40) return Math.min(((days - 21) / 19) * 100, 100);
    if (days >= 7 && days < 21) return Math.min(((days - 7) / 14) * 100, 100);
    if (days < 7) return Math.min((days / 7) * 100, 100);
    return 100;
  };

  const activeProgress = getActiveLeagueProgress(currentStreak);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <Text style={styles.headerTitle}>Reports</Text>

        {/* Top Stat Cards (3 Columns) */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{currentStreak}d</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{bestStreak}d</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{successRate}%</Text>
            <Text style={styles.statLabel}>Rate</Text>
          </View>
        </View>



        {/* Challenges / Discipline / Recovery Tab Switcher */}
        <View style={styles.tabSwitcher}>
          {(['Challenges', 'Discipline', 'Recovery'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* This Week Section */}
        {activeTab === 'Discipline' && (
          <>
            <View style={styles.reportCard}>
              <Text style={styles.cardTitle}>THIS WEEK</Text>

              {/* Weekday checkmark row */}
              <View style={styles.weekdayRow}>
                {weeklyStatus.map((ws) => (
                  <View key={ws.dateStr} style={styles.weekdayCol}>
                    <View style={[styles.badgeCircle, ws.completed ? styles.badgeChecked : styles.badgeCrossed]}>
                      <FontAwesome5
                        name={ws.completed ? "check" : "times"}
                        size={10}
                        color={ws.completed ? "#EA580C" : "#94A3B8"}
                      />
                    </View>
                    <Text style={styles.weekdayName}>{ws.dayName}</Text>
                  </View>
                ))}
              </View>

              {/* Simple Custom Bar Chart */}
              <View style={styles.chartContainer}>
                {weeklyStatus.map((ws) => {
                  // Calculate dynamic height based on completed tasks, or binary if mock
                  const heightPercent = ws.completed
                    ? Math.max((ws.completedCount / (ws.tasksCount || 7)) * 100, 40) // minimum visual fill
                    : 0;

                  return (
                    <View key={ws.dateStr} style={styles.chartCol}>
                      <View style={styles.barTrack}>
                        {ws.completed && (
                          <View style={[styles.barFill, { height: `${heightPercent}%` }]} />
                        )}
                      </View>
                      <Text style={styles.barLabel}>{ws.dayName}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Dincharya Correlation Card */}
            <View style={styles.reportCard}>
              <Text style={styles.cardTitle}>WILLPOWER & HABIT CORRELATION</Text>

              <View style={styles.correlationRow}>
                <View style={styles.correlationMetric}>
                  <Text style={styles.correlationVal}>{keystoneCompliance}%</Text>
                  <Text style={styles.correlationLbl}>Keystone Compliance</Text>
                </View>
                <View style={styles.correlationDivider} />
                <View style={styles.correlationMetric}>
                  <Text style={[styles.correlationVal, { color: '#10B981' }]}>{correlationScore}/100</Text>
                  <Text style={styles.correlationLbl}>Willpower Score</Text>
                </View>
              </View>

              <View style={styles.correlationInsightBox}>
                <FontAwesome5 name="lightbulb" size={14} color="#EA580C" style={styles.insightIcon} />
                <Text style={styles.correlationInsightText}>
                  Your Keystone habits (Snan, Meditation, Pranayama) directly build grey matter in the prefrontal cortex. Compliance above 75% reduces urge relapse probability by 90%.
                </Text>
              </View>
            </View>
          </>)}

        {/* Relapse Report Card */}
        {activeTab === 'Recovery' && (
          <View style={styles.reportCard}>
            <Text style={styles.cardTitle}>RELAPSE REPORT</Text>

            <View style={styles.relapseStatsContainer}>
              <View style={styles.relapseStatItem}>
                <Text style={styles.relapseStatVal}>{relapseStats.week}</Text>
                <Text style={styles.relapseStatLbl}>THIS WEEK</Text>
              </View>
              <View style={styles.relapseStatDivider} />
              <View style={styles.relapseStatItem}>
                <Text style={styles.relapseStatVal}>{relapseStats.month}</Text>
                <Text style={styles.relapseStatLbl}>THIS MONTH</Text>
              </View>
              <View style={styles.relapseStatDivider} />
              <View style={styles.relapseStatItem}>
                <Text style={styles.relapseStatVal}>{relapseStats.year}</Text>
                <Text style={styles.relapseStatLbl}>THIS YEAR</Text>
              </View>
            </View>

            {relapses.length === 0 ? (
              <Text style={styles.noRelapseText}>No relapses recorded. Keep going strong! 💪</Text>
            ) : (
              <View style={{ width: '100%' }}>
                {/* Trigger Stats */}
                {triggerStats.length > 0 && (
                  <View style={styles.breakdownSection}>
                    <Text style={styles.breakdownSectionTitle}>TOP SLIP TRIGGERS</Text>
                    {triggerStats.slice(0, 3).map((item) => (
                      <View key={item.name} style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>{item.name}</Text>
                        <View style={styles.breakdownBarBg}>
                          <View style={[styles.breakdownBarFill, { width: `${item.percent}%`, backgroundColor: '#EF4444' }]} />
                        </View>
                        <Text style={styles.breakdownPercent}>{item.percent}%</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Location Stats */}
                {locationStats.length > 0 && (
                  <View style={styles.breakdownSection}>
                    <Text style={styles.breakdownSectionTitle}>HIGH-RISK LOCATIONS</Text>
                    {locationStats.slice(0, 3).map((item) => (
                      <View key={item.name} style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>{item.name}</Text>
                        <View style={styles.breakdownBarBg}>
                          <View style={[styles.breakdownBarFill, { width: `${item.percent}%`, backgroundColor: '#3B82F6' }]} />
                        </View>
                        <Text style={styles.breakdownPercent}>{item.percent}%</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Time of Day Stats */}
                {timeStats.length > 0 && (
                  <View style={styles.breakdownSection}>
                    <Text style={styles.breakdownSectionTitle}>DANGER HOURS</Text>
                    {timeStats.slice(0, 3).map((item) => (
                      <View key={item.name} style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>{item.name}</Text>
                        <View style={styles.breakdownBarBg}>
                          <View style={[styles.breakdownBarFill, { width: `${item.percent}%`, backgroundColor: '#8B5CF6' }]} />
                        </View>
                        <Text style={styles.breakdownPercent}>{item.percent}%</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.relapseSectionSubTitle}>Recent Lessons Learned</Text>
                <View style={styles.relapseList}>
                  {relapses.slice(0, 3).map((r, idx) => {
                    const dateObj = new Date(r.date);
                    const dateFormatted = dateObj.toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <View key={idx.toString()} style={styles.relapseListItem}>
                        <View style={styles.relapseListDot} />
                        <View style={styles.relapseListMeta}>
                          <Text style={styles.relapseListDate}>{dateFormatted} · {r.trigger_type || 'Unknown'} @ {r.location || 'Unknown'}</Text>
                          <Text style={styles.relapseListReason}>&quot;{r.notes || r.reason}&quot;</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* League Journey Section */}
        {activeTab === 'Challenges' && (
          <>
            {/* Goal Days Progress Card */}
            <View style={styles.reportCard}>
              <Text style={styles.cardTitle}>ACTIVE GOAL PROGRESS</Text>
              <View style={styles.goalInfoRow}>
                <View style={styles.goalInfoBlock}>
                  <Text style={styles.goalInfoVal}>{challengeProgressDays} days</Text>
                  <Text style={styles.goalInfoLbl}>CURRENT PROGRESS</Text>
                </View>
                <View style={styles.goalInfoBlockRight}>
                  <Text style={styles.goalInfoVal}>{targetGoalDays} days</Text>
                  <Text style={styles.goalInfoLbl}>TARGET GOAL</Text>
                </View>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min((challengeProgressDays / targetGoalDays) * 100, 100)}%` }]} />
              </View>
              <Text style={styles.goalStatusText}>
                {challengeProgressDays >= targetGoalDays
                  ? "🎉 Goal achieved! Set a new goal from the Home screen to continue rewiring your brain."
                  : `${targetGoalDays - challengeProgressDays} days remaining to reboot your reward system.`}
              </Text>
            </View>

            <View style={styles.reportCard}>
              <Text style={styles.cardTitle}>LEAGUE JOURNEY</Text>

              <View style={styles.leagueList}>
                {LEAGUES.map((l) => {
                  const isAchieved = currentStreak >= l.req;
                  const nextLeague = LEAGUES[LEAGUES.findIndex(x => x.name === l.name) + 1];
                  const isActiveLeague = currentStreak >= l.req && (!nextLeague || currentStreak < nextLeague.req);

                  return (
                    <View key={l.name} style={[styles.leagueItem, !isAchieved && styles.leagueItemLocked]}>
                      <View style={[
                        styles.leagueIconWrapper,
                        isAchieved ? styles.leagueIconWrapperActive : styles.leagueIconWrapperLocked
                      ]}>
                        {l.image ? (
                          <Image
                            source={l.image}
                            style={[
                              {
                                width: l.imgSize || 18,
                                height: l.imgSize || 18,
                                opacity: isAchieved ? 1 : 0.7
                              },
                              l.imgStyle
                            ]}
                            resizeMode="contain"
                          />
                        ) : (
                          <FontAwesome5
                            name={l.icon}
                            size={14}
                            color={isAchieved ? '#EA580C' : '#94A3B8'}
                          />
                        )}
                      </View>

                      <View style={styles.leagueInfo}>
                        <Text style={[styles.leagueNameText, isAchieved && styles.leagueNameTextActive]}>
                          {l.name} {isActiveLeague && <Text style={styles.youIndicator}>← you</Text>}
                        </Text>

                        {isActiveLeague && l.name !== 'Brahmachari' && (
                          <View style={styles.leagueProgressContainer}>
                            <View style={styles.leagueProgressTrack}>
                              <View style={[styles.leagueProgressFill, { width: `${activeProgress}%` }]} />
                            </View>
                          </View>
                        )}
                      </View>

                      <View style={styles.leagueRight}>
                        <Text style={styles.leagueDaysText}>{l.days}</Text>
                        {isAchieved && (
                          <FontAwesome5 name="check" size={12} color="#EA580C" style={styles.checkIcon} />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Goal History Section */}
            <View style={styles.reportCard}>
              <Text style={styles.cardTitle}>GOAL HISTORY</Text>
              {goalsHistory.length === 0 ? (
                <Text style={styles.noRelapseText}>No completed goals yet. Complete a Sankalpa to add to your history! 🏆</Text>
              ) : (
                <View style={styles.relapseList}>
                  {goalsHistory.map((g, idx) => {
                    const startFormatted = new Date(g.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    const endFormatted = new Date(g.completion_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                    return (
                      <TouchableOpacity
                        key={g.id || idx.toString()}
                        style={styles.historyListItemClickable}
                        onPress={() => {
                          setSelectedRetroGoal(g);
                          setSelectedRetroDate(null);
                          setIsRetroModalOpen(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.historyDot} />
                        <View style={styles.relapseListMeta}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '95%' }}>
                            <Text style={styles.historyTitle}>{g.target_days}-Day Challenge Completed! 🎉</Text>
                            <FontAwesome5 name="chevron-right" size={10} color="#94A3B8" />
                          </View>
                          <Text style={styles.relapseListDate}>{startFormatted} — {endFormatted}</Text>
                          {g.overall_completion_rate !== undefined && (
                            <Text style={styles.historyCompletionRate}>Routine Completion: {g.overall_completion_rate}%</Text>
                          )}
                          <Text style={styles.historyReason}>&quot;{g.start_reason}&quot;</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </>)}

      </ScrollView>

      {/* Challenge Retrospective Modal */}
      <Modal visible={isRetroModalOpen} transparent animationType="slide" onRequestClose={() => setIsRetroModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.retroModalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Challenge Retrospective</Text>
                {selectedRetroGoal && (
                  <Text style={styles.modalSubtitle}>
                    {selectedRetroGoal.target_days}-Day Goal Completed
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsRetroModalOpen(false)}>
                <FontAwesome5 name="times" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedRetroGoal && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Reason Card */}
                <View style={styles.retroReasonCard}>
                  <FontAwesome5 name="quote-left" size={12} color="#EA580C" style={{ marginBottom: 6 }} />
                  <Text style={styles.retroReasonText}>&quot;{selectedRetroGoal.start_reason}&quot;</Text>
                  <Text style={styles.retroDurationText}>
                    Started: {new Date(selectedRetroGoal.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {"\n"}
                    Ended: {new Date(selectedRetroGoal.completion_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </View>

                {/* Overall Stats Card */}
                {selectedRetroGoal.overall_completion_rate !== undefined && (
                  <View style={styles.retroStatsGrid}>
                    <View style={styles.retroStatCard}>
                      <Text style={styles.retroStatVal}>{selectedRetroGoal.overall_completion_rate}%</Text>
                      <Text style={styles.retroStatLabel}>Overall Success</Text>
                    </View>
                    <View style={styles.retroStatCard}>
                      <Text style={styles.retroStatVal}>{selectedRetroGoal.total_tasks_completed}</Text>
                      <Text style={styles.retroStatLabel}>Tasks Completed</Text>
                    </View>
                    <View style={styles.retroStatCard}>
                      <Text style={styles.retroStatVal}>{selectedRetroGoal.total_tasks_scheduled}</Text>
                      <Text style={styles.retroStatLabel}>Tasks Scheduled</Text>
                    </View>
                  </View>
                )}

                {/* Relapse Snapshot during Challenge */}
                {selectedRetroGoal.relapses_during_challenge !== undefined && (
                  <View style={[styles.retroStatsGrid, { marginTop: -10 }]}>
                    <View style={[
                      styles.retroStatCard,
                      {
                        backgroundColor: selectedRetroGoal.relapses_during_challenge === 0 ? '#F0FDF4' : '#FEF2F2',
                        borderColor: selectedRetroGoal.relapses_during_challenge === 0 ? '#DCFCE7' : '#FEE2E2',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 12
                      }
                    ]}>
                      <FontAwesome5
                        name={selectedRetroGoal.relapses_during_challenge === 0 ? "shield-alt" : "exclamation-triangle"}
                        size={16}
                        color={selectedRetroGoal.relapses_during_challenge === 0 ? '#16A34A' : '#EF4444'}
                      />
                      <Text style={[styles.retroStatLabel, { color: selectedRetroGoal.relapses_during_challenge === 0 ? '#15803D' : '#B91C1C', fontSize: 12, fontWeight: '700' }]}>
                        Recovery during Challenge: {selectedRetroGoal.relapses_during_challenge} Relapse(s)
                      </Text>
                    </View>
                  </View>
                )}

                {/* Heatmap Section */}
                {renderRetroHeatmap()}
              </ScrollView>
            )}
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 20,
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#EA580C',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  weekdayCol: {
    alignItems: 'center',
  },
  badgeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeChecked: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  badgeCrossed: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  weekdayName: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    height: 80,
    width: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#EA580C',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 8,
  },
  leagueList: {
    gap: 16,
  },
  leagueItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leagueItemLocked: {
    opacity: 0.6,
  },
  leagueIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  leagueIconWrapperActive: {
    backgroundColor: '#FFF7ED',
  },
  leagueIconWrapperLocked: {
    backgroundColor: '#F1F5F9',
  },
  leagueInfo: {
    flex: 1,
  },
  leagueNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
  },
  leagueNameTextActive: {
    color: '#0F172A',
  },
  youIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EA580C',
  },
  leagueProgressContainer: {
    marginTop: 6,
    width: '80%',
  },
  leagueProgressTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
  },
  leagueProgressFill: {
    height: '100%',
    backgroundColor: '#EA580C',
    borderRadius: 2,
  },
  leagueRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leagueDaysText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 2,
  },
  relapseStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 20,
    marginTop: 10,
  },
  relapseStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  relapseStatVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 4,
  },
  relapseStatLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  relapseStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  relapseSectionSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.0,
    marginBottom: 12,
  },
  noRelapseText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
  relapseList: {
    gap: 12,
  },
  relapseListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  relapseListDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 6,
  },
  relapseListMeta: {
    flex: 1,
  },
  relapseListDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 2,
  },
  relapseListReason: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    lineHeight: 18,
  },
  goalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalInfoBlock: {
    alignItems: 'flex-start',
  },
  goalInfoBlockRight: {
    alignItems: 'flex-end',
  },
  goalInfoVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  goalInfoLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EA580C',
    borderRadius: 4,
  },
  goalStatusText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 10,
  },
  correlationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  correlationMetric: {
    alignItems: 'center',
    flex: 1,
  },
  correlationVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  correlationLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  correlationDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  correlationInsightBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  insightIcon: {
    marginTop: 2,
  },
  correlationInsightText: {
    fontSize: 11,
    color: '#7C2D12',
    lineHeight: 16,
    flex: 1,
  },
  breakdownSection: {
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breakdownSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    width: 80,
  },
  breakdownBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    width: 32,
    textAlign: 'right',
  },
  historyListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  historyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EA580C',
    marginTop: 6,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyReason: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  historyListItemClickable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyCompletionRate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EA580C',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  retroModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  retroReasonCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  retroReasonText: {
    fontSize: 14,
    color: '#7C2D12',
    lineHeight: 20,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  retroDurationText: {
    fontSize: 11,
    color: '#9A3412',
    marginTop: 10,
    lineHeight: 16,
    fontWeight: '600',
  },
  retroStatsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  retroStatCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  retroStatVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 2,
  },
  retroStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  noHeatmapContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginVertical: 10,
  },
  noHeatmapText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  heatmapCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  heatmapSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.0,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  heatmapCell: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatmapCellSelected: {
    borderColor: '#0F172A',
    borderWidth: 2,
    transform: [{ scale: 1.1 }],
  },
  heatmapCellText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dayDetailsContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
  },
  dayDetailsHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  dayDetailsSummary: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '600',
    marginBottom: 12,
  },
  noTasksRetroText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  tapPromptText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  retroTasksList: {
    gap: 8,
  },
  retroTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retroTaskCheck: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  retroTaskCheckCompleted: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  retroTaskText: {
    fontSize: 12,
    color: '#475569',
  },
  retroTaskTextCompleted: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
});
