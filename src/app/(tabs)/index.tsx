import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useHifzStore } from '@/features/hifz/hooks/useHifzStore';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { eighthsToLabel, absEighthLabel, calcDailyReview, TOTAL_EIGHTHS } from '@/core/domain/hizbMath';
import { todayStr, formatDateLong, getWeekDates, buildWeekSchedule } from '@/core/domain/dateHelpers';
import { Ionicons } from '@expo/vector-icons';

export default function TodayScreen() {
  const { memorizedEighths, weeklyGoalEighths, izharDay, reviewCursor } = useHifzStore();
  
  const today = todayStr();
  const weekDates = getWeekDates(izharDay);
  const izharDate = weekDates[0];
  const isIzharDay = today === izharDate;
  
  const dailyReview = calcDailyReview(memorizedEighths);
  const weekSchedule = buildWeekSchedule(memorizedEighths, reviewCursor, weekDates);
  const todaySchedule = weekSchedule.find(d => d.date === today) || { eighths: [], amount: 0 };
  
  const izharFrom = memorizedEighths;
  const izharTo = Math.min(TOTAL_EIGHTHS, memorizedEighths + weeklyGoalEighths);
  
  return (
    <ScrollView className="flex-1 bg-[#0d1117] p-4 pt-12">
      {/* Header */}
      <View className="items-center mb-8">
        <Ionicons name="book-outline" size={44} color="#d4a843" className="mb-2" />
        <Text className="text-gold-light text-2xl font-bold font-serif mb-1">متابعة حفظ القرآن</Text>
        <Text className="text-gray-400 text-sm">نظام مبني على يوم الاستظهار الأسبوعي</Text>
      </View>

      {/* Stats Summary */}
      <View className="flex-row justify-between mb-4 flex-wrap">
        <View className="bg-surface-2 border border-surface-2 p-3 rounded-lg flex-1 mx-1 items-center">
          <Text className="text-gold-light font-bold text-lg">{eighthsToLabel(memorizedEighths) || "—"}</Text>
          <Text className="text-gray-400 text-xs mt-1">المحفوظ</Text>
        </View>
        <View className="bg-surface-2 border border-surface-2 p-3 rounded-lg flex-1 mx-1 items-center">
          <Text className="text-gold-light font-bold text-lg">{eighthsToLabel(weeklyGoalEighths)}</Text>
          <Text className="text-gray-400 text-xs mt-1">هدف الأسبوع</Text>
        </View>
        <View className="bg-surface-2 border border-surface-2 p-3 rounded-lg flex-1 mx-1 items-center">
          <Text className="text-gold-light font-bold text-lg">{eighthsToLabel(dailyReview)}</Text>
          <Text className="text-gray-400 text-xs mt-1">مراجعة يومية</Text>
        </View>
      </View>

      {/* Progress */}
      <Card>
        <ProgressBar current={memorizedEighths} total={TOTAL_EIGHTHS} label="التقدم في الحفظ" />
      </Card>

      {/* Today's Tasks */}
      <View className="bg-[#161b22] border border-[#8a6a20] rounded-2xl p-5 mb-10 shadow-lg">
        <View className="flex-row items-center flex-wrap gap-2 mb-4">
          <Text className="text-[#d4a843] font-bold">📅 {formatDateLong(today)}</Text>
          {isIzharDay && (
            <View className="bg-purple-500/15 px-3 py-1 rounded-full">
              <Text className="text-purple-400 text-xs font-bold">◆ يوم الاستظهار</Text>
            </View>
          )}
        </View>

        {memorizedEighths === 0 && (
          <View className="bg-[#8a6a20]/10 border border-[#8a6a20] p-3 rounded-lg mb-4">
            <Text className="text-[#f0c96b] text-sm">🌟 ابدأ بضبط إعداداتك وتحديد ما حفظته حتى الآن من تبويب الإعدادات.</Text>
          </View>
        )}

        <View className="gap-3">
          {isIzharDay && (
            <TouchableOpacity className="flex-row items-start gap-3 bg-surface-2 border border-purple-500/30 rounded-xl p-4">
              <View className="w-6 h-6 rounded-full border-2 border-gray-600 items-center justify-center mt-0.5" />
              <View className="flex-1">
                <Text className="text-purple-400 text-xs font-bold mb-1">
                  ◆ استظهار الحفظ الجديد — {eighthsToLabel(weeklyGoalEighths)}
                </Text>
                <Text className="text-white text-sm">
                  {izharFrom < TOTAL_EIGHTHS
                    ? `من ${absEighthLabel(izharFrom)} إلى ${absEighthLabel(Math.min(TOTAL_EIGHTHS - 1, izharTo - 1))}`
                    : "🎉 القرآن محفوظ بالكامل!"
                  }
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity className="flex-row items-start gap-3 bg-surface-2 border border-surface-2 rounded-xl p-4">
            <View className="w-6 h-6 rounded-full border-2 border-gray-600 items-center justify-center mt-0.5" />
            <View className="flex-1">
              <Text className="text-gray-400 text-xs font-bold mb-1">
                🔁 المراجعة اليومية — {eighthsToLabel(dailyReview)}
              </Text>
              <Text className="text-white text-sm leading-6">
                {memorizedEighths === 0
                  ? "لا يوجد محفوظ بعد"
                  : todaySchedule.eighths.length > 0
                    ? todaySchedule.eighths.map(e => absEighthLabel(e)).join(" | ")
                    : "—"
                }
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
