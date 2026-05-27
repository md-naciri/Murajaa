import { AppText as Text } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/ui/PageContainer';
import { Select } from '@/components/ui/Select';
import { DAY_NAMES_AR, getWeekDates, todayStr } from '@/core/domain/dateHelpers';
import { TOTAL_EIGHTHS, eighthsToLabel } from '@/core/domain/hizbMath';
import { useHifzStore } from '@/features/hifz/hooks/useHifzStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, TextInput, TouchableOpacity, View } from 'react-native';

const DAY_OPTIONS = DAY_NAMES_AR.map((name, i) => ({ label: name, value: i }));

const MODE_OPTIONS = [
  { label: 'من الحزب 1 إلى الحزب 60 (تصاعدي)', value: 0 },
  { label: 'من الحزب 60 إلى الحزب 1 (تنازلي)', value: 1 },
];

export default function OnboardingScreen() {
  const router = useRouter();

  // Local state for the setup form
  const [memorized, setMemorized] = useState('');
  const [modeVal, setModeVal] = useState<number>(0); // 0 = forward, 1 = reverse
  const [izharDay, setIzharDay] = useState<number>(4); // Thursday default

  // Store actions
  const setMemorizedEighths = useHifzStore(s => s.setMemorizedEighths);
  const setMemorizationMode = useHifzStore(s => s.setMemorizationMode);
  const setMemorizedAtWeekStart = useHifzStore(s => s.setMemorizedAtWeekStart);
  const setWeekStartSavedDate = useHifzStore(s => s.setWeekStartSavedDate);
  const setStoreIzharDay = useHifzStore(s => s.setIzharDay);
  const completeOnboarding = useHifzStore(s => s.completeOnboarding);
  const setAppStartDate = useHifzStore(s => s.setAppStartDate);

  const handleStart = () => {
    // Validate memorized input
    let memVal = parseInt(memorized, 10);
    if (isNaN(memVal) || memVal < 0) memVal = 0;
    memVal = Math.min(TOTAL_EIGHTHS, memVal);

    const mode = modeVal === 0 ? 'forward' : 'reverse';
    const weekDates = getWeekDates(izharDay, 0);

    // Save everything to store
    setMemorizedEighths(memVal);
    setMemorizationMode(mode);
    setMemorizedAtWeekStart(memVal);
    setWeekStartSavedDate(weekDates[0]);
    setStoreIzharDay(izharDay);
    setAppStartDate(todayStr(0));

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
        <View style={{
          width: 90,
          height: 90,
          backgroundColor: '#161b22',
          borderRadius: 24,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#d4a843',
          shadowColor: '#d4a843',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 6,
          overflow: 'hidden'
        }}>
          <Image
            source={require('../../assets/images/app-icon.png')}
            style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
            defaultSource={require('../../assets/images/app-icon.png')}
          />
        </View>
        <Text style={{ color: '#f0c96b', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>مرحبا بك في Murajaa</Text>
        <Text style={{ color: '#8b949e', fontSize: 14, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 }}>
          تطبيقك الشخصي لمتابعة وتثبيت حفظ القرآن الكريم.
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

        {/* Memorization Mode */}
        <Text style={label}>اتجاه الحفظ والمراجعة:</Text>
        <View style={{ marginBottom: 20 }}>
          <Select selectedValue={modeVal} onValueChange={setModeVal} options={MODE_OPTIONS} />
        </View>

        {/* Izhar Day */}
        <Text style={label}>يوم بداية المراجعة الأسبوعية:</Text>
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
