import React, { useEffect, useState, useRef } from 'react';
import { View,  TouchableOpacity, Alert, LayoutAnimation, Modal } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useFocusEffect } from 'expo-router';
import { useHifzStore } from '@/features/hifz/hooks/useHifzStore';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageContainer } from '@/components/ui/PageContainer';
import { Select } from '@/components/ui/Select';
import { DatabaseService, HifzLog } from '@/data/db/DatabaseService';
import {
  eighthsToLabel, absEighthLabel, calcDailyReview, formatEighthsRange,
  TOTAL_EIGHTHS, EIGHTHS_PER_HIZB, logicalToPhysical, UNIT_OPTIONS
} from '@/core/domain/hizbMath';
import {
  todayStr, formatDateLong, getWeekDates, buildWeekSchedule, DAY_NAMES_AR, getAppDate, dateToStr, formatDateShort
} from '@/core/domain/dateHelpers';
import * as NotificationService from '@/data/services/NotificationService';
import { Ionicons } from '@expo/vector-icons';

export interface MissedTask {
  id: string;
  date: string;
  type: 'review';
  amount: number;
  rangeStr: string;
  isCompleted: boolean;
}

export default function TodayScreen() {
  const memorizedEighths     = useHifzStore(s => s.memorizedEighths);
  const memorizationMode     = useHifzStore(s => s.memorizationMode);
  const memorizedAtWeekStart = useHifzStore(s => s.memorizedAtWeekStart);
  const weekStartSavedDate   = useHifzStore(s => s.weekStartSavedDate);
  const izharDay             = useHifzStore(s => s.izharDay);
  const appStartDate         = useHifzStore(s => s.appStartDate);

  const addMemorizedEighths   = useHifzStore(s => s.addMemorizedEighths);
  const setAppStartDate       = useHifzStore(s => s.setAppStartDate);
  const setWeekStartSavedDate = useHifzStore(s => s.setWeekStartSavedDate);
  const setMemorizedAtWeekStart = useHifzStore(s => s.setMemorizedAtWeekStart);

  const remindersEnabled = useHifzStore(s => s.remindersEnabled);
  const reminderTime     = useHifzStore(s => s.reminderTime);
  const setRemindersEnabled = useHifzStore(s => s.setRemindersEnabled);

  const today = todayStr(0);
  const weekDates = getWeekDates(izharDay, 0);

  // Weekly review schedule frozen calculation
  // If the week start has changed in real time but is not yet committed to store, 
  // we immediately calculate active reviews using the live progress since it will update on this cycle.
  const isNewWeekCycle = weekStartSavedDate !== weekDates[0];
  const activeReviewEighths = isNewWeekCycle ? memorizedEighths : memorizedAtWeekStart;

  const dailyReview   = calcDailyReview(activeReviewEighths);
  const weekSchedule  = buildWeekSchedule(activeReviewEighths, weekDates);
  const todaySchedule = weekSchedule.find(d => d.date === today) ?? { eighths: [], amount: 0, isOptional: false };

  const isWeekResetDay = today === weekDates[0];
  const quranComplete = memorizedEighths >= TOTAL_EIGHTHS;

  const pct = Math.round((memorizedEighths / TOTAL_EIGHTHS) * 100);

  // --- Task Interaction State ---
  const [completedReview, setCompletedReview] = useState(false);
  const [missedTasks, setMissedTasks] = useState<MissedTask[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHifzAmount, setNewHifzAmount] = useState(1); // default +1 eighth

  const completedMissedIdsRef = useRef<Set<string>>(new Set());
  const lastTodayRef = useRef(today);

  // Initialize app start date if missing
  useEffect(() => {
    if (!appStartDate) {
      setAppStartDate(todayStr(0));
    }
  }, [appStartDate]);

  // Load today's and past logs whenever this screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchLogs = async () => {
        // Commit weekly progress freeze on week cycle boundary
        const currentWeekStart = weekDates[0];
        if (weekStartSavedDate !== currentWeekStart) {
          setWeekStartSavedDate(currentWeekStart);
          setMemorizedAtWeekStart(memorizedEighths);
        }

        // Clear the cache exactly when we run a fetch for a new simulated day
        if (lastTodayRef.current !== today) {
          completedMissedIdsRef.current.clear();
          lastTodayRef.current = today;
        }

        const logs = await DatabaseService.getAllLogs();
        if (!isActive) return;

        // 1. Today's review status
        const todayLogs = logs.filter(l => l.date === today);
        const isReviewDoneToday = todayLogs.some(l => l.task_type === 'review');
        setCompletedReview(isReviewDoneToday);

        // 2. Missed tasks for the last 7 days (Review logs only)
        const computedMissed: MissedTask[] = [];
        const currentWeek = getWeekDates(izharDay, 0);
        const previousWeek = getWeekDates(izharDay, -7);
        
        // We use activeReviewEighths (week-frozen count) for building schedule historical scanner
        const allSchedules = [
          ...buildWeekSchedule(activeReviewEighths, previousWeek),
          ...buildWeekSchedule(activeReviewEighths, currentWeek)
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

          // Check Review Only
          if (!daySchedule.isOptional && activeReviewEighths > 0) {
            const isCompleted = logsForPastDay.some(l => l.task_type === 'review');
            const taskId = `${pastDateStr}-review`;
            
            if (!isCompleted || completedMissedIdsRef.current.has(taskId)) {
              computedMissed.push({
                id: taskId,
                date: pastDateStr,
                type: 'review',
                amount: daySchedule.amount,
                rangeStr: formatEighthsRange(daySchedule.eighths, memorizationMode),
                isCompleted
              });
            }
          }
        }
        
        // Sort oldest to newest
        setMissedTasks(computedMissed.sort((a, b) => a.date.localeCompare(b.date)));

        // 3. Sync Notification Reminders
        if (remindersEnabled) {
          const hasPermission = await NotificationService.getPermissions();
          if (hasPermission) {
            await NotificationService.updateSchedule(true, reminderTime, isReviewDoneToday);
          } else {
            const granted = await NotificationService.requestPermissions();
            if (granted) {
              await NotificationService.updateSchedule(true, reminderTime, isReviewDoneToday);
            } else {
              if (remindersEnabled) {
                setRemindersEnabled(false);
              }
              await NotificationService.updateSchedule(false, reminderTime, false);
            }
          }
        } else {
          await NotificationService.updateSchedule(false, reminderTime, false);
        }
      };

      fetchLogs();
      return () => { isActive = false; };
    }, [today, memorizedEighths, activeReviewEighths, izharDay, appStartDate, remindersEnabled, reminderTime, setRemindersEnabled, weekStartSavedDate])
  );

  const handleToggleMissed = async (task: MissedTask) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    if (task.isCompleted) {
      await DatabaseService.removeLog(task.date, task.type);
      completedMissedIdsRef.current.delete(task.id);
      setMissedTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: false } : t));
    } else {
      await DatabaseService.addLog(task.date, task.type, task.amount, task.rangeStr);
      completedMissedIdsRef.current.add(task.id);
      setMissedTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: true } : t));
    }
  };

  const handleToggleReview = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (completedReview) {
      // Uncheck
      await DatabaseService.removeLog(today, 'review');
      setCompletedReview(false);
      await NotificationService.updateSchedule(remindersEnabled, reminderTime, false);
    } else {
      // Check
      const range = todaySchedule.isOptional 
        ? '(راجع ما تراه يحتاج إلى تثبيت (تمت مراجعة المحفوظ بالكامل هذا الأسبوع' 
        : formatEighthsRange(todaySchedule.eighths, memorizationMode);
      await DatabaseService.addLog(today, 'review', todaySchedule.amount, range);
      setCompletedReview(true);
      await NotificationService.updateSchedule(remindersEnabled, reminderTime, true);
    }
  };

  const handleAddHifz = () => {
    if (newHifzAmount <= 0) return;
    
    const newTotal = Math.min(TOTAL_EIGHTHS, memorizedEighths + newHifzAmount);
    const addedAmount = newTotal - memorizedEighths;
    
    if (addedAmount <= 0) {
      Alert.alert('رصيد الحفظ ممتلئ', 'لقد أتممت حفظ القرآن بالكامل بالفعل! مبارك لك.', [{ text: 'حسناً' }]);
      setShowAddModal(false);
      return;
    }

    addMemorizedEighths(addedAmount);
    setShowAddModal(false);

    Alert.alert(
      'تم تسجيل الحفظ الجديد 🎉',
      `تمت إضافة ${eighthsToLabel(addedAmount)} بنجاح إلى رصيد حفظك! سيتم جدولة مراجعتها عند بداية أسبوع المراجعة القادم.`,
      [{ text: 'حسناً' }]
    );
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
          <Text style={statLabel}>رصيد الحفظ</Text>
        </View>
        <View style={statCard}>
          <Text style={statValue}>
            {memorizedAtWeekStart > 0 ? eighthsToLabel(memorizedAtWeekStart) : '—'}
          </Text>
          <Text style={statLabel}>حفظ المراجعة الحالي</Text>
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

      {/* Add New Memorization Call-to-Action */}
      {!quranComplete && (
        <View style={{ backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#e6edf3', fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginBottom: 4 }}>
              سجلت حفظاً جديداً؟
            </Text>
            <Text style={{ color: '#8b949e', fontSize: 11, textAlign: 'right', lineHeight: 18 }}>
              أضف محفوظك الجديد لتحديث خريطة ختمتك. سيتم إدراج الجديد في جدول المراجعة الأسبوع القادم.
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowAddModal(true)}
            style={{
              backgroundColor: 'rgba(212,168,67,0.15)',
              borderWidth: 1,
              borderColor: '#d4a843',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row-reverse',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Ionicons name="add-circle" size={18} color="#f0c96b" />
            <Text style={{ color: '#f0c96b', fontWeight: 'bold', fontSize: 14 }}>إضافة حفظ</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* No-data prompt */}
      {memorizedEighths === 0 && (
        <View style={{ backgroundColor: 'rgba(138,106,32,0.1)', borderWidth: 1, borderColor: '#8a6a20', padding: 14, borderRadius: 12, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Ionicons name="sparkles" size={16} color="#f0c96b" />
            <Text style={{ color: '#f0c96b', fontSize: 13, fontWeight: 'bold' }}>مرحباً بك في تطبيق مراجعة</Text>
          </View>
          <Text style={{ color: '#f0c96b', fontSize: 13, lineHeight: 22, textAlign: 'right' }}>
            ابدأ بضبط إعداداتك من تبويب الإعدادات أو اضغط على «إضافة حفظ» أعلاه لتسجيل حفظك الأول.
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
          {isWeekResetDay && (
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: 'rgba(168,85,247,0.15)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
              <Ionicons name="sparkles" size={12} color="#c084fc" />
              <Text style={{ color: '#c084fc', fontSize: 11, fontWeight: 'bold' }}>بداية المراجعة الأسبوعية</Text>
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
                  <Ionicons name="sync-outline" size={14} color="#f87171" />
                  <Text style={{ color: '#f87171', fontSize: 11, fontWeight: 'bold', textAlign: 'right', textDecorationLine: task.isCompleted ? 'line-through' : 'none' }}>
                    مراجعة متأخرة — {eighthsToLabel(task.amount)} ({formatDateShort(task.date)})
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

          {quranComplete && (
            <View style={{ backgroundColor: '#21262d', borderWidth: 1, borderColor: 'rgba(234,179,8,0.4)', borderRadius: 12, padding: 16 }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="trophy" size={18} color="#f0c96b" />
                <Text style={{ color: '#f0c96b', textAlign: 'center', fontWeight: 'bold' }}>القرآن محفوظ بالكامل — مبارك لك الختم!</Text>
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
                {activeReviewEighths === 0
                  ? 'لا يوجد محفوظ للمراجعة بعد'
                  : todaySchedule.isOptional 
                    ? 'راجع ما تراه يحتاج إلى تثبيت (تمت مراجعة المحفوظ بالكامل هذا الأسبوع)' 
                    : formatEighthsRange(todaySchedule.eighths, memorizationMode)
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
            يوم بداية المراجعة الأسبوعية: {DAY_NAMES_AR[izharDay]}
          </Text>
        </View>
      </View>

      {/* Add Hifz Modal */}
      <Modal
        transparent={true}
        visible={showAddModal}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340 }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#e6edf3', fontSize: 18, fontWeight: 'bold' }}>تسجيل حفظ جديد</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#8b949e" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#8b949e', fontSize: 13, textAlign: 'right', marginBottom: 16, lineHeight: 20 }}>
              اختر مقدار الحفظ الجديد الذي أنجزته اليوم لإضافته لختمتك:
            </Text>

            <View style={{ marginBottom: 24 }}>
              <Select
                selectedValue={newHifzAmount}
                onValueChange={setNewHifzAmount}
                options={UNIT_OPTIONS}
              />
            </View>

            <View style={{ backgroundColor: 'rgba(212,168,67,0.1)', padding: 12, borderRadius: 8, marginBottom: 24, alignItems: 'center' }}>
              <Text style={{ color: '#8b949e', fontSize: 12, marginBottom: 4 }}>المجموع بعد الإضافة</Text>
              <Text style={{ color: '#f0c96b', fontWeight: 'bold', fontSize: 15, textAlign: 'center' }}>
                {eighthsToLabel(Math.min(TOTAL_EIGHTHS, memorizedEighths + newHifzAmount))}
              </Text>
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: '#d4a843', paddingVertical: 14, borderRadius: 8, alignItems: 'center' }}
              onPress={handleAddHifz}
            >
              <Text style={{ color: '#0d1117', fontWeight: 'bold', fontSize: 16 }}>تسجيل الحفظ الجديد</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
