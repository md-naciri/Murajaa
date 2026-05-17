import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, LayoutAnimation } from 'react-native';
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
  todayStr, formatDateLong, getWeekDates, buildWeekSchedule, DAY_NAMES_AR,
} from '@/core/domain/dateHelpers';
import { Ionicons } from '@expo/vector-icons';

export default function TodayScreen() {
  const memorizedEighths  = useHifzStore(s => s.memorizedEighths);
  const weeklyGoalEighths = useHifzStore(s => s.weeklyGoalEighths);
  const izharDay          = useHifzStore(s => s.izharDay);
  const addMemorizedEighths = useHifzStore(s => s.addMemorizedEighths);

  const today       = todayStr();
  const weekDates   = getWeekDates(izharDay);
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

  // If Izhar is marked done, the store has already incremented, so we shift the index back to display what was actually completed.
  const izharBaseIdx  = completedIzhar ? Math.max(0, memorizedEighths - weeklyGoalEighths) : memorizedEighths;
  const izharFromIdx  = izharBaseIdx;
  const izharToIdx    = Math.min(TOTAL_EIGHTHS - 1, izharBaseIdx + weeklyGoalEighths - 1);
  const izharRangeStr = izharFromIdx === izharToIdx 
    ? absEighthLabel(izharFromIdx)
    : `من ${absEighthLabel(izharFromIdx)} إلى ${absEighthLabel(izharToIdx)}`;

  // Load today's logs whenever this screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchLogs = async () => {
        const logs = await DatabaseService.getLogsForDate(today);
        if (isActive) {
          setCompletedIzhar(logs.some(l => l.task_type === 'izhar'));
          setCompletedReview(logs.some(l => l.task_type === 'review'));
        }
      };
      fetchLogs();
      return () => { isActive = false; };
    }, [today])
  );

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
      const range = todaySchedule.isOptional ? 'مراجعة اختيارية' : formatEighthsRange(todaySchedule.eighths);
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
            {hizbCount > 0 ? `${hizbCount} حزب` : '—'}
            {remEighths > 0 ? `\n+ ${remEighths}/8` : ''}
          </Text>
          <Text style={statLabel}>المحفوظ</Text>
        </View>
        <View style={statCard}>
          <Text style={statValue}>{eighthsToLabel(weeklyGoalEighths)}</Text>
          <Text style={statLabel}>الهدف الأسبوعي</Text>
        </View>
        <View style={statCard}>
          <Text style={statValue}>{eighthsToLabel(dailyReview)}</Text>
          <Text style={statLabel}>مراجعة يومية</Text>
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
          <Text style={{ color: '#f0c96b', fontSize: 13, textAlign: 'center', lineHeight: 22 }}>
            🌟 ابدأ بضبط إعداداتك من تبويب الإعدادات وتحديد ما حفظته حتى الآن.
          </Text>
        </View>
      )}

      {/* Today's Tasks */}
      <View style={{ backgroundColor: '#161b22', borderWidth: 1, borderColor: '#8a6a20', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        {/* Date + badge */}
        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Text style={{ color: '#d4a843', fontWeight: 'bold' }}>📅 {formatDateLong(today)}</Text>
          {isIzharDay && (
            <View style={{ backgroundColor: 'rgba(168,85,247,0.15)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 }}>
              <Text style={{ color: '#c084fc', fontSize: 11, fontWeight: 'bold' }}>◆ يوم الاستظهار</Text>
            </View>
          )}
        </View>

        <View style={{ gap: 12 }}>
          {/* Izhar task */}
          {isIzharDay && !quranComplete && (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={handleToggleIzhar}
              style={taskCard(completedIzhar ? 'rgba(168,85,247,0.15)' : '#21262d', completedIzhar ? 'rgba(168,85,247,0.6)' : 'rgba(168,85,247,0.3)')}
            >
              <View style={{ flex: 1, opacity: completedIzhar ? 0.6 : 1 }}>
                <Text style={{ color: '#c084fc', fontSize: 11, fontWeight: 'bold', marginBottom: 4, textAlign: 'right', textDecorationLine: completedIzhar ? 'line-through' : 'none' }}>
                  ◆ استظهار الحفظ الجديد — {eighthsToLabel(weeklyGoalEighths)}
                </Text>
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
              <Text style={{ color: '#f0c96b', textAlign: 'center', fontWeight: 'bold' }}>🎉 القرآن محفوظ بالكامل — مبارك!</Text>
            </View>
          )}

          {/* Daily review */}
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={handleToggleReview}
            style={taskCard(completedReview ? 'rgba(46,160,67,0.15)' : '#21262d', completedReview ? '#2ea043' : '#30363d')}
          >
            <View style={{ flex: 1, opacity: completedReview ? 0.6 : 1 }}>
              <Text style={{ color: completedReview ? '#2ea043' : '#8b949e', fontSize: 11, fontWeight: 'bold', marginBottom: 4, textAlign: 'right', textDecorationLine: completedReview ? 'line-through' : 'none' }}>
                🔁 المراجعة اليومية — {todaySchedule.isOptional ? 'اختياري' : eighthsToLabel(todaySchedule.amount)}
              </Text>
              <Text style={{ color: '#e6edf3', fontSize: 13, lineHeight: 22, textAlign: 'right', textDecorationLine: completedReview ? 'line-through' : 'none' }}>
                {memorizedEighths === 0
                  ? 'لا يوجد محفوظ بعد'
                  : todaySchedule.isOptional 
                    ? 'مراجعة اختيارية' 
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
            يوم الاستظهار الأسبوعي: {DAY_NAMES_AR[izharDay]}
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
