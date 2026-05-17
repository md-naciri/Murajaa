import React from 'react';
import { View, Text } from 'react-native';
import { useHifzStore } from '@/features/hifz/hooks/useHifzStore';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageContainer } from '@/components/ui/PageContainer';
import {
  eighthsToLabel, absEighthLabel, calcDailyReview,
  TOTAL_EIGHTHS, EIGHTHS_PER_HIZB,
} from '@/core/domain/hizbMath';
import {
  todayStr, formatDateLong, getWeekDates, buildWeekSchedule, DAY_NAMES_AR,
} from '@/core/domain/dateHelpers';
import { Ionicons } from '@expo/vector-icons';

export default function TodayScreen() {
  // Individual selectors — required for React 19 Compiler compatibility.
  // The compiler memoizes components aggressively; per-value selectors
  // guarantee a re-render whenever any of these values change.
  const memorizedEighths  = useHifzStore(s => s.memorizedEighths);
  const weeklyGoalEighths = useHifzStore(s => s.weeklyGoalEighths);
  const izharDay          = useHifzStore(s => s.izharDay);
  const reviewCursor      = useHifzStore(s => s.reviewCursor);

  const today       = todayStr();
  const weekDates   = getWeekDates(izharDay);
  const isIzharDay  = today === weekDates[0];

  const dailyReview   = calcDailyReview(memorizedEighths);
  const weekSchedule  = buildWeekSchedule(memorizedEighths, reviewCursor, weekDates);
  const todaySchedule = weekSchedule.find(d => d.date === today) ?? { eighths: [], amount: 0 };

  const izharFromIdx  = memorizedEighths;
  const izharToIdx    = Math.min(TOTAL_EIGHTHS - 1, memorizedEighths + weeklyGoalEighths - 1);
  const quranComplete = memorizedEighths >= TOTAL_EIGHTHS;

  const hizbCount = Math.floor(memorizedEighths / EIGHTHS_PER_HIZB);
  const remEighths = memorizedEighths % EIGHTHS_PER_HIZB;
  const pct = Math.round((memorizedEighths / TOTAL_EIGHTHS) * 100);

  return (
    <PageContainer>
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <Ionicons name="book-outline" size={44} color="#d4a843" />
        <Text style={{ color: '#f0c96b', fontSize: 22, fontWeight: 'bold', marginTop: 12, marginBottom: 4 }}>
          متابعة حفظ القرآن
        </Text>
        <Text style={{ color: '#8b949e', fontSize: 13 }}>نظام مبني على يوم الاستظهار الأسبوعي</Text>
      </View>

      {/* Stats Row */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 20 }}>
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
            <View style={taskCard('#30363d', 'rgba(168,85,247,0.3)')}>
              <View style={checkbox} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#c084fc', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
                  ◆ استظهار الحفظ الجديد — {eighthsToLabel(weeklyGoalEighths)}
                </Text>
                <Text style={{ color: '#e6edf3', fontSize: 13, lineHeight: 22 }}>
                  {`من ${absEighthLabel(izharFromIdx)} إلى ${absEighthLabel(izharToIdx)}`}
                </Text>
              </View>
            </View>
          )}

          {isIzharDay && quranComplete && (
            <View style={{ backgroundColor: '#21262d', borderWidth: 1, borderColor: 'rgba(234,179,8,0.4)', borderRadius: 12, padding: 16 }}>
              <Text style={{ color: '#f0c96b', textAlign: 'center', fontWeight: 'bold' }}>🎉 القرآن محفوظ بالكامل — مبارك!</Text>
            </View>
          )}

          {/* Daily review */}
          <View style={taskCard('#30363d', '#30363d')}>
            <View style={checkbox} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#8b949e', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
                🔁 المراجعة اليومية — {eighthsToLabel(dailyReview)}
              </Text>
              <Text style={{ color: '#e6edf3', fontSize: 13, lineHeight: 22 }}>
                {memorizedEighths === 0
                  ? 'لا يوجد محفوظ بعد'
                  : todaySchedule.eighths.length > 0
                    ? todaySchedule.eighths.map(e => absEighthLabel(e)).join(' · ')
                    : '—'
                }
              </Text>
            </View>
          </View>
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

// ─── Style helpers (avoids className on non-NativeWind-aware props) ──────────
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
};
function taskCard(bg: string, border: string): object {
  return {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: border,
    borderRadius: 12,
    padding: 14,
  };
}
