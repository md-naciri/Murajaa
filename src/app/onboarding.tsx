import React, { useState } from 'react';
import { View,  TextInput, TouchableOpacity, Image } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useHifzStore } from '@/features/hifz/hooks/useHifzStore';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TOTAL_EIGHTHS, UNIT_OPTIONS, eighthsToLabel, EIGHTHS_PER_HIZB } from '@/core/domain/hizbMath';
import { DAY_NAMES_AR, todayStr } from '@/core/domain/dateHelpers';
import { Ionicons } from '@expo/vector-icons';

const DAY_OPTIONS = DAY_NAMES_AR.map((name, i) => ({ label: name, value: i }));

export default function OnboardingScreen() {
  const router = useRouter();
  
  // Local state for the setup form
  const [memorized, setMemorized] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState<number>(2);
  const [izharDay, setIzharDay] = useState<number>(4); // Thursday

  // Store actions
  const setMemorizedEighths = useHifzStore(s => s.setMemorizedEighths);
  const setStoreWeeklyGoal = useHifzStore(s => s.setWeeklyGoal);
  const setStoreIzharDay = useHifzStore(s => s.setIzharDay);
  const completeOnboarding = useHifzStore(s => s.completeOnboarding);
  const setAppStartDate = useHifzStore(s => s.setAppStartDate);
  const devDateOffset = useHifzStore(s => s.devDateOffset);

  const handleStart = () => {
    // Validate memorized input
    let memVal = parseInt(memorized, 10);
    if (isNaN(memVal) || memVal < 0) memVal = 0;
    memVal = Math.min(TOTAL_EIGHTHS, memVal);

    // Save everything to store
    setMemorizedEighths(memVal);
    setStoreWeeklyGoal(weeklyGoal);
    setStoreIzharDay(izharDay);
    setAppStartDate(todayStr(devDateOffset));
    
    // Mark onboarding complete and navigate to app
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const previewVal = parseInt(memorized, 10);
  const previewLabel = memorized.length > 0 && !isNaN(previewVal)
    ? eighthsToLabel(Math.min(TOTAL_EIGHTHS, Math.max(0, previewVal)))
    : null;

  return (
    <PageContainer>
      <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 40 }}>
        <View style={{ width: 80, height: 80, backgroundColor: '#161b22', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#d4a843' }}>
          <Ionicons name="book" size={40} color="#d4a843" />
        </View>
        <Text style={{ color: '#f0c96b', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>مرحبا بك في Murajaa</Text>
        <Text style={{ color: '#8b949e', fontSize: 14, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 }}>
          تطبيقك الشخصي لمتابعة وتثبيت حفظ القرآن الكريم بطريقة منهجية ومنظمة.
        </Text>
      </View>

      <Card title="إعداد الخطة الأولية" icon={<Ionicons name="settings-outline" size={20} color="#d4a843" />}>
        {/* Total Memorized */}
        <Text style={label}>أدخل مقدار ما تحفظه حالياً (بالأثمان):</Text>
        <TextInput
          style={{
            backgroundColor: '#0d1117',
            borderWidth: 1,
            borderColor: '#30363d',
            color: '#e6edf3',
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 8,
            fontSize: 16,
            textAlign: 'center',
            marginBottom: 4,
          }}
          placeholder="0"
          placeholderTextColor="#8b949e"
          keyboardType="numeric"
          value={memorized}
          onChangeText={setMemorized}
          returnKeyType="done"
        />
        {previewLabel ? (
          <Text style={{ color: '#d4a843', fontSize: 12, textAlign: 'center', marginBottom: 20 }}>
            = {previewLabel}
          </Text>
        ) : (
          <View style={{ marginBottom: 20 }} />
        )}

        {/* Weekly Goal */}
        <Text style={label}>مقدار الحفظ الأسبوعي:</Text>
        <View style={{ marginBottom: 20 }}>
          <Select selectedValue={weeklyGoal} onValueChange={setWeeklyGoal} options={UNIT_OPTIONS} />
        </View>

        {/* Izhar Day */}
        <Text style={label}>يوم الاستظهار الأسبوعي:</Text>
        <View style={{ marginBottom: 20 }}>
          <Select selectedValue={izharDay} onValueChange={setIzharDay} options={DAY_OPTIONS} />
        </View>
      </Card>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleStart}
        style={{
          backgroundColor: '#d4a843',
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: 'center',
          marginTop: 16,
          shadowColor: '#d4a843',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Text style={{ color: '#0d1117', fontSize: 18, fontWeight: 'bold' }}>أبدأ الآن</Text>
      </TouchableOpacity>
    </PageContainer>
  );
}

const label: object = { color: '#8b949e', fontSize: 13, marginBottom: 8, textAlign: 'right' };

