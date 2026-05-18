import React, { useEffect, useState, useRef } from 'react';
import { View,  TouchableOpacity, Alert, LayoutAnimation } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useFocusEffect } from 'expo-router';
import { useHifzStore } from '@/features/hifz/hooks/useHifzStore';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageContainer } from '@/components/ui/PageContainer';
import { DatabaseService, HifzLog } from '@/data/db/DatabaseService';
import {
  eighthsToLabel, absEighthLabel, calcDailyReview, formatEighthsRange,
  TOTAL_EIGHTHS, EIGHTHS_PER_HIZB,
} from '@/core/domain/hizbMath';
import {
  todayStr, formatDateLong, getWeekDates, buildWeekSchedule, DAY_NAMES_AR, getAppDate, dateToStr, formatDateShort
} from '@/core/domain/dateHelpers';

export interface MissedTask {
  id: string;
  date: string;
  type: 'izhar' | 'review';
  amount: number;
  rangeStr: string;
  isCompleted: boolean;
}
import { Ionicons } from '@expo/vector-icons';

export default function TodayScreen() {
  const memorizedEighths  = useHifzStore(s => s.memorizedEighths);
  const weeklyGoalEighths = useHifzStore(s => s.weeklyGoalEighths);
  const izharDay          = useHifzStore(s => s.izharDay);
  const addMemorizedEighths = useHifzStore(s => s.addMemorizedEighths);
  const appStartDate = useHifzStore(s => s.appStartDate);
  const setAppStartDate = useHifzStore(s => s.setAppStartDate);

  const today       = todayStr(0);
  const weekDates   = getWeekDates(izharDay, 0);
  const isIzharDay  = today === weekDates[0];

  const dailyReview   = calcDailyReview(memorizedEighths);
  const weekSchedule  = buildWeekSchedule(memorizedEighths, weekDates);
  const todaySchedule = weekSchedule.find(d => d.date === today) ?? { eighths: [], amount: 0, isOptional: false };


  const quranComplete = memorizedEighths >= TOTAL_EIGHTHS;

  const hizbCount = Math.floor(memorizedEighths / EIGHTHS_PER_HIZB);
  const remEighths = memorizedEighths % EIGHTHS_PER_HIZB;
  const pct = Math.round((memorizedEighths / TOTAL_EIGHTHS) * 100);

  // --- Task Interaction State ---
  const [completedIzhar, setCompletedIzhar] = useState(false);
  const [completedReview, setCompletedReview] = useState(false);

  const getIzharRangeStr = (baseIdx: number) => {
    const toIdx = Math.min(TOTAL_EIGHTHS - 1, baseIdx + weeklyGoalEighths - 1);
    return baseIdx === toIdx 
      ? absEighthLabel(baseIdx)
      : `من ${absEighthLabel(baseIdx)} إلى ${absEighthLabel(toIdx)}`;
  };

  const izharBaseIdx  = completedIzhar ? Math.max(0, memorizedEighths - weeklyGoalEighths) : memorizedEighths;
  const izharRangeStr = getIzharRangeStr(izharBaseIdx);

  const [missedTasks, setMissedTasks] = useState<MissedTask[]>([]);
  
  const completedMissedIdsRef = useRef<Set<string>>(new Set());
  const lastTodayRef = useRef(today);

  // Initialize app start date if missing
  useEffect(() => {
    if (!appStartDate) {
      setAppStartDate(todayStr(0)); // Record the real life today
    }
  }, [appStartDate]);

  // Load today's and past logs whenever this screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchLogs = async () => {
        // Clear the cache exactly when we run a fetch for a new simulated day
        if (lastTodayRef.current !== today) {
          completedMissedIdsRef.current.clear();
          lastTodayRef.current = today;
        }

        const logs = await DatabaseService.getAllLogs();
        if (!isActive) return;

        // 1. Today's status
        const todayLogs = logs.filter(l => l.date === today);
        setCompletedIzhar(todayLogs.some(l => l.task_type === 'izhar'));
        setCompletedReview(todayLogs.some(l => l.task_type === 'review'));

        // 2. Missed tasks for the last 7 days
        const computedMissed: MissedTask[] = [];
        const currentWeek = getWeekDates(izharDay, 0);
        const previousWeek = getWeekDates(izharDay, -7);
        const allSchedules = [
          ...buildWeekSchedule(memorizedEighths, previousWeek),
          ...buildWeekSchedule(memorizedEighths, currentWeek)
        ];

        for (let i = 1; i <= 7; i++) {
          const pastDateObj = new Date(getAppDate(0));
          pastDateObj.setDate(pastDateObj.getDate() - i);
          const pastDateStr = dateToStr(pastDateObj);

          if (!appStartDate || pastDateStr < appStartDate) {
            continue; // Don't show overdue tasks from before the app was installed
          }

          const daySchedule = allSchedules.find(s => s.date === pastDateStr);
          if (!daySchedule) continue;

          const logsForPastDay = logs.filter(l => l.date === pastDateStr);

          // Check Izhar
          const isIzharDayPast = pastDateObj.getDay() === izharDay;
          if (isIzharDayPast && !quranComplete) {
            const isCompleted = logsForPastDay.some(l => l.task_type === 'izhar');
            const taskId = `${pastDateStr}-izhar`;
            
            if (!isCompleted || completedMissedIdsRef.current.has(taskId)) {
              computedMissed.push({
                id: taskId,
                date: pastDateStr,
                type: 'izhar',
                amount: weeklyGoalEighths,
                rangeStr: getIzharRangeStr(memorizedEighths),
                isCompleted
              });
            }
          }

          // Check Review
          if (!daySchedule.isOptional && memorizedEighths > 0) {
            const isCompleted = logsForPastDay.some(l => l.task_type === 'review');
            const taskId = `${pastDateStr}-review`;
            
            if (!isCompleted || completedMissedIdsRef.current.has(taskId)) {
              computedMissed.push({
                id: taskId,
                date: pastDateStr,
                type: 'review',
                amount: daySchedule.amount,
                rangeStr: formatEighthsRange(daySchedule.eighths),
                isCompleted
              });
            }
          }
        }
        
        // Sort oldest to newest
        setMissedTasks(computedMissed.sort((a, b) => a.date.localeCompare(b.date)));
      };
      fetchLogs();
      return () => { isActive = false; };
    }, [today, memorizedEighths, weeklyGoalEighths, izharDay, quranComplete, appStartDate])
  );

  const handleToggleMissed = async (task: MissedTask) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    if (task.isCompleted) {
      // Uncheck
      await DatabaseService.removeLog(task.date, task.type);
      if (task.type === 'izhar') addMemorizedEighths(-weeklyGoalEighths);
      completedMissedIdsRef.current.delete(task.id);
      setMissedTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: false } : t));
    } else {
      // Check
      await DatabaseService.addLog(task.date, task.type, task.amount, task.rangeStr);
      if (task.type === 'izhar') addMemorizedEighths(weeklyGoalEighths);
      completedMissedIdsRef.current.add(task.id);
      setMissedTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: true } : t));
    }
  };

  const handleToggleIzhar = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (completedIzhar) {
      // Uncheck
      await DatabaseService.removeLog(today, 'izhar');
      setCompletedIzhar(false);
      addMemorizedEighths(-weeklyGoalEighths);
    } else {
      // Check
      await DatabaseService.addLog(today, 'izhar', weeklyGoalEighths, izharRangeStr);
      setCompletedIzhar(true);
      
      // Auto-increment memorized total
      addMemorizedEighths(weeklyGoalEighths);
      // We don't trigger native Alert on Web since it looks bad, just silent completion.
    }
  };

  const handleToggleReview = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (completedReview) {
      // Uncheck
      await DatabaseService.removeLog(today, 'review');
      setCompletedReview(false);
    } else {
      // Check
      const range = todaySchedule.isOptional ? '(راجع ما تراه يحتاج إلى تثبيت (تمت مراجعة المحفوظ بالكامل هذا الأسبوع' : formatEighthsRange(todaySchedule.eighths);
      await DatabaseService.addLog(today, 'review', todaySchedule.amount, range);
      setCompletedReview(true);
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <Ionicons name="book-outline" size={44} color="#d4a843" />
        <Text style={{ color: '#f0c96b', fontSize: 22, fontWeight: 'bold', marginTop: 12, marginBottom: 4 }}>
          متابعة حفظ القرآن
        </Text>
        <Text style={{ color: '#8b949e', fontSize: 13 }}>نظام مبني على مراجعة المحفوظ أسبوعيا</Text>
      </View>

      {/* Stats Row */}
      <View style={{ flexDirection: 'row-reverse', gap: 10, marginBottom: 16 }}>
        <View style={statCard}>
          <Text style={statValue}>
            {memorizedEighths > 0 ? eighthsToLabel(memorizedEighths) : '—'}
          </Text>
          <Text style={statLabel}>المحفوظ</Text>
        </View>
        <View style={statCard}>
          <Text style={statValue}>{eighthsToLabel(weeklyGoalEighths)}</Text>
          <Text style={statLabel}>مقدار الحفظ الأسبوعي</Text>
        </View>
        <View style={statCard}>
          <Text style={statValue}>{eighthsToLabel(dailyReview)}</Text>
          <Text style={statLabel}>مقدار المراجعة اليومية</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <Card>
        <ProgressBar
          current={memorizedEighths}
          total={TOTAL_EIGHTHS}
          label={`التقدم: ${pct}% — ${memorizedEighths} ثمن من ${TOTAL_EIGHTHS}`}
        />
      </Card>

      {/* No-data prompt */}
      {memorizedEighths === 0 && (
        <View style={{ backgroundColor: 'rgba(138,106,32,0.1)', borderWidth: 1, borderColor: '#8a6a20', padding: 14, borderRadius: 12, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Ionicons name="sparkles" size={16} color="#f0c96b" />
            <Text style={{ color: '#f0c96b', fontSize: 13, fontWeight: 'bold' }}>مرحباً بك في تطبيق مراجعة</Text>
          </View>
          <Text style={{ color: '#f0c96b', fontSize: 13, lineHeight: 22, textAlign: 'right' }}>
            ابدأ بضبط إعداداتك من تبويب الإعدادات وتحديد ما حفظته حتى الآن.
          </Text>
        </View>
      )}

      {/* Today's Tasks */}
      <View style={{ backgroundColor: '#161b22', borderWidth: 1, borderColor: '#8a6a20', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        {/* Date + badge */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar" size={18} color="#d4a843" />
            <Text style={{ color: '#d4a843', fontWeight: 'bold' }}>{formatDateLong(today)}</Text>
          </View>
          {isIzharDay && (
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: 'rgba(168,85,247,0.15)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
              <Ionicons name="sparkles" size={12} color="#c084fc" />
              <Text style={{ color: '#c084fc', fontSize: 11, fontWeight: 'bold' }}>يوم الاستظهار</Text>
            </View>
          )}
        </View>

        <View style={{ gap: 12 }}>
          {/* Missed Tasks (Last 7 Days) */}
          {missedTasks.map((task) => (
            <TouchableOpacity 
              key={task.id}
              activeOpacity={0.7}
              onPress={() => handleToggleMissed(task)}
              style={taskCard(task.isCompleted ? 'rgba(248,113,113,0.02)' : 'rgba(248,113,113,0.05)', task.isCompleted ? 'rgba(248,113,113,0.1)' : 'rgba(248,113,113,0.3)')}
            >
              <View style={{ flex: 1, opacity: task.isCompleted ? 0.6 : 1 }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name={task.type === 'izhar' ? 'book-outline' : 'sync-outline'} size={14} color="#f87171" />
                  <Text style={{ color: '#f87171', fontSize: 11, fontWeight: 'bold', textAlign: 'right', textDecorationLine: task.isCompleted ? 'line-through' : 'none' }}>
                    {task.type === 'izhar' ? 'استظهار متأخر' : 'مراجعة متأخرة'} — {eighthsToLabel(task.amount)} ({formatDateShort(task.date)})
                  </Text>
                </View>
                <Text style={{ color: '#e6edf3', fontSize: 13, lineHeight: 22, textAlign: 'right', textDecorationLine: task.isCompleted ? 'line-through' : 'none' }}>
                  {task.rangeStr}
                </Text>
              </View>
              <View style={[checkbox, { borderColor: '#f87171' }, task.isCompleted && { backgroundColor: '#f87171' }]}>
                {task.isCompleted && <Ionicons name="checkmark" size={16} color="#0d1117" style={{ marginTop: 1, marginLeft: 1 }} />}
              </View>
            </TouchableOpacity>
          ))}

          {/* Izhar task */}
          {isIzharDay && !quranComplete && (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={handleToggleIzhar}
              style={taskCard(completedIzhar ? 'rgba(168,85,247,0.15)' : '#21262d', completedIzhar ? 'rgba(168,85,247,0.6)' : 'rgba(168,85,247,0.3)')}
            >
              <View style={{ flex: 1, opacity: completedIzhar ? 0.6 : 1 }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name="book" size={14} color="#c084fc" />
                  <Text style={{ color: '#c084fc', fontSize: 11, fontWeight: 'bold', textAlign: 'right', textDecorationLine: completedIzhar ? 'line-through' : 'none' }}>
                    استظهار الحفظ الجديد — {eighthsToLabel(weeklyGoalEighths)}
                  </Text>
                </View>
                <Text style={{ color: '#e6edf3', fontSize: 13, lineHeight: 22, textAlign: 'right', textDecorationLine: completedIzhar ? 'line-through' : 'none' }}>
                  {izharRangeStr}
                </Text>
              </View>
              <View style={[checkbox, completedIzhar && { backgroundColor: '#c084fc', borderColor: '#c084fc' }]}>
                {completedIzhar && <Ionicons name="checkmark" size={16} color="#0d1117" style={{ marginTop: 1, marginLeft: 1 }} />}
              </View>
            </TouchableOpacity>
          )}

          {isIzharDay && quranComplete && (
            <View style={{ backgroundColor: '#21262d', borderWidth: 1, borderColor: 'rgba(234,179,8,0.4)', borderRadius: 12, padding: 16 }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="trophy" size={18} color="#f0c96b" />
                <Text style={{ color: '#f0c96b', textAlign: 'center', fontWeight: 'bold' }}>القرآن محفوظ بالكامل — مبارك!</Text>
              </View>
            </View>
          )}

          {/* Daily review */}
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={handleToggleReview}
            style={taskCard(completedReview ? 'rgba(46,160,67,0.15)' : '#21262d', completedReview ? '#2ea043' : '#30363d')}
          >
            <View style={{ flex: 1, opacity: completedReview ? 0.6 : 1 }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="sync" size={14} color={completedReview ? '#2ea043' : '#8b949e'} />
                <Text style={{ color: completedReview ? '#2ea043' : '#8b949e', fontSize: 11, fontWeight: 'bold', textAlign: 'right', textDecorationLine: completedReview ? 'line-through' : 'none' }}>
                  المراجعة اليومية — {todaySchedule.isOptional ? 'اختياري' : eighthsToLabel(todaySchedule.amount)}
                </Text>
              </View>
              <Text style={{ color: '#e6edf3', fontSize: 13, lineHeight: 22, textAlign: 'right', textDecorationLine: completedReview ? 'line-through' : 'none' }}>
                {memorizedEighths === 0
                  ? 'لا يوجد محفوظ بعد'
                  : todaySchedule.isOptional 
                    ? 'راجع ما تراه يحتاج إلى تثبيت (تمت مراجعة المحفوظ بالكامل هذا الأسبوع)' 
                    : formatEighthsRange(todaySchedule.eighths)
                }
              </Text>
            </View>
            <View style={[checkbox, completedReview && { backgroundColor: '#2ea043', borderColor: '#2ea043' }]}>
              {completedReview && <Ionicons name="checkmark" size={16} color="#fff" style={{ marginTop: 1, marginLeft: 1 }} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#30363d' }}>
          <Text style={{ color: '#8b949e', fontSize: 12, textAlign: 'center' }}>
            يوم الاستظهار: {DAY_NAMES_AR[izharDay]}
          </Text>
        </View>
      </View>
    </PageContainer>
  );
}

// ─── Style helpers ──────────
const statCard: object = {
  flex: 1,
  backgroundColor: '#161b22',
  borderWidth: 1,
  borderColor: '#30363d',
  borderRadius: 12,
  padding: 12,
  alignItems: 'center',
};
const statValue: object = {
  color: '#f0c96b',
  fontWeight: 'bold',
  fontSize: 14,
  textAlign: 'center',
  marginBottom: 4,
};
const statLabel: object = {
  color: '#8b949e',
  fontSize: 11,
  textAlign: 'center',
};
const checkbox: object = {
  width: 22,
  height: 22,
  borderRadius: 11,
  borderWidth: 2,
  borderColor: '#8b949e',
  marginTop: 2,
  alignItems: 'center',
  justifyContent: 'center',
};
function taskCard(bg: string, border: string): object {
  return {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: bg,
    borderWidth: 1,
    borderColor: border,
    borderRadius: 12,
    padding: 14,
  };
}

