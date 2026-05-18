import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useHifzStore } from '@/features/hifz/hooks/useHifzStore';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { eighthsToLabel, absEighthLabel, formatEighthsRange } from '@/core/domain/hizbMath';
import { getWeekDates, buildWeekSchedule, formatDateLong, todayStr } from '@/core/domain/dateHelpers';
import { Ionicons } from '@expo/vector-icons';

export default function WeekScreen() {
  const memorizedEighths  = useHifzStore(s => s.memorizedEighths);
  const izharDay          = useHifzStore(s => s.izharDay);

  const today = todayStr();
  const weekDates = getWeekDates(izharDay);
  const weekSchedule = buildWeekSchedule(memorizedEighths, weekDates);

  return (
    <PageContainer noPadding>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 24, paddingTop: 16 }}>
          <Ionicons name="calendar-outline" size={44} color="#d4a843" />
          <Text style={{ color: '#f0c96b', fontSize: 22, fontWeight: 'bold', marginTop: 12, marginBottom: 4 }}>
            البرنامج الأسبوعي
          </Text>
          <Text style={{ color: '#8b949e', fontSize: 13, textAlign: 'center' }}>
            توزيع المراجعة من الاستظهار القادم وحتى الاستظهار الذي يليه
          </Text>
        </View>

        {memorizedEighths === 0 ? (
          <View style={{ backgroundColor: 'rgba(138,106,32,0.1)', borderWidth: 1, borderColor: '#8a6a20', padding: 14, borderRadius: 12 }}>
            <Text style={{ color: '#f0c96b', fontSize: 13, textAlign: 'center', lineHeight: 22 }}>
              لا يوجد محفوظ لجدولته. الرجاء ضبط إعدادات المحفوظ من تبويب الإعدادات.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {weekSchedule.map((day, index) => {
              const isToday = day.date === today;
              const isIzhar = index === 0;

              return (
                <View 
                  key={day.date}
                  style={{
                    backgroundColor: isToday ? 'rgba(46,160,67,0.1)' : '#161b22',
                    borderWidth: 1,
                    borderColor: isToday ? '#2ea043' : '#30363d',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: isToday ? '#2ea043' : '#d4a843', fontWeight: 'bold', fontSize: 14 }}>
                        {formatDateLong(day.date)}
                      </Text>
                      {isToday && (
                        <View style={{ backgroundColor: '#2ea043', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>اليوم</Text>
                        </View>
                      )}
                    </View>
                    {isIzhar && (
                      <View style={{ backgroundColor: 'rgba(168,85,247,0.15)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                        <Text style={{ color: '#c084fc', fontSize: 10, fontWeight: 'bold' }}>استظهار</Text>
                      </View>
                    )}
                  </View>

                  {day.isOptional ? (
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 6 }}>
                      <Ionicons name="leaf-outline" size={16} color="#8b949e" style={{ marginTop: 2 }} />
                      <Text style={{ flex: 1, color: '#8b949e', fontSize: 13, textAlign: 'right', lineHeight: 20 }}>
                        راجع ما تراه يحتاج إلى تثبيت (تمت مراجعة المحفوظ بالكامل هذا الأسبوع)
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <Text style={{ color: '#e6edf3', fontSize: 13, marginBottom: 8, textAlign: 'right' }}>
                        المقدار: {eighthsToLabel(day.amount)}
                      </Text>
                      <Text style={{ color: '#8b949e', fontSize: 12, lineHeight: 22, textAlign: 'right' }}>
                        {formatEighthsRange(day.eighths)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </PageContainer>
  );
}
