import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useHifzStore } from '@/features/hifz/hooks/useHifzStore';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { PageContainer } from '@/components/ui/PageContainer';
import { TOTAL_EIGHTHS, UNIT_OPTIONS, eighthsToLabel, EIGHTHS_PER_HIZB } from '@/core/domain/hizbMath';
import { DAY_NAMES_AR } from '@/core/domain/dateHelpers';
import { Ionicons } from '@expo/vector-icons';

const DAY_OPTIONS = DAY_NAMES_AR.map((name, i) => ({ label: name, value: i }));

export default function SettingsScreen() {
  // Individual selectors for React 19 Compiler compatibility
  const memorizedEighths  = useHifzStore(s => s.memorizedEighths);
  const weeklyGoalEighths = useHifzStore(s => s.weeklyGoalEighths);
  const izharDay          = useHifzStore(s => s.izharDay);
  const setMemorizedEighths = useHifzStore(s => s.setMemorizedEighths);
  const setWeeklyGoal       = useHifzStore(s => s.setWeeklyGoal);
  const setIzharDay         = useHifzStore(s => s.setIzharDay);
  const addMemorizedEighths = useHifzStore(s => s.addMemorizedEighths);

  // Local input — completely independent from store until user taps "حفظ"
  const [rawInput, setRawInput] = useState('');
  const [addAmt, setAddAmt] = useState<number>(2);

  const handleSave = () => {
    const val = parseInt(rawInput, 10);
    if (!isNaN(val) && val >= 0) {
      setMemorizedEighths(Math.min(TOTAL_EIGHTHS, val));
    }
    setRawInput(''); // clear after save
  };

  const hizbCount = Math.floor(memorizedEighths / EIGHTHS_PER_HIZB);
  const remEighths = memorizedEighths % EIGHTHS_PER_HIZB;
  const pct = Math.round((memorizedEighths / TOTAL_EIGHTHS) * 100);

  // Live preview of what user typed
  const previewVal = parseInt(rawInput, 10);
  const previewLabel = rawInput.length > 0 && !isNaN(previewVal)
    ? eighthsToLabel(Math.min(TOTAL_EIGHTHS, Math.max(0, previewVal)))
    : null;

  return (
    <PageContainer>
      {/* Header */}
      <View style={{ marginBottom: 24, alignItems: 'flex-end' }}>
        <Text style={{ color: '#f0c96b', fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>الإعدادات</Text>
        <Text style={{ color: '#8b949e', fontSize: 13, textAlign: 'right' }}>إدارة الخطة وتحديث بيانات المحفوظ</Text>
      </View>

      {/* Plan Settings */}
      <Card title="إعدادات الخطة" icon={<Ionicons name="options-outline" size={20} color="#d4a843" />}>
        <View style={{ marginBottom: 20 }}>
          <Text style={label}>يوم الاستظهار الأسبوعي:</Text>
          <Select selectedValue={izharDay} onValueChange={setIzharDay} options={DAY_OPTIONS} />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={label}>مقدار الحفظ الأسبوعي:</Text>
          <Select selectedValue={weeklyGoalEighths} onValueChange={setWeeklyGoal} options={UNIT_OPTIONS} />
        </View>

        <View style={{ backgroundColor: 'rgba(168,85,247,0.1)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#c084fc', fontSize: 12, textAlign: 'center', lineHeight: 20 }}>
            ◆ يوم {DAY_NAMES_AR[izharDay]}: استظهار + مراجعة | باقي الأيام: مراجعة فقط
          </Text>
        </View>
      </Card>

      {/* Current Status */}
      <Card title="الوضع الحالي" icon={<Ionicons name="stats-chart-outline" size={20} color="#d4a843" />}>
        <View style={{ backgroundColor: '#21262d', borderWidth: 1, borderColor: '#30363d', borderRadius: 10, padding: 16 }}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={label}>إجمالي المحفوظ</Text>
            <Text style={{ color: '#f0c96b', fontWeight: 'bold' }}>
              {memorizedEighths === 0
                ? '—'
                : `${hizbCount > 0 ? hizbCount + ' حزب' : ''}${remEighths > 0 ? (hizbCount > 0 ? ' و' : '') + remEighths + ' ثمن' : ''}`
              }
            </Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
            <Text style={label}>بالأثمان</Text>
            <Text style={{ color: '#c9d1d9', fontSize: 13 }}>{memorizedEighths} / {TOTAL_EIGHTHS} ({pct}%)</Text>
          </View>
        </View>
      </Card>

      {/* Set Total */}
      <Card title="ضبط الإجمالي" icon={<Ionicons name="create-outline" size={20} color="#d4a843" />}>
        <Text style={{ color: '#8b949e', fontSize: 12, marginBottom: 4, textAlign: 'right' }}>
          💡 كل حزب = 8 أثمان. مثال: 16 ثمن = 2 حزب كاملان
        </Text>
        <Text style={[label, { marginTop: 12, marginBottom: 8 }]}>أدخل الإجمالي الجديد (بالأثمان):</Text>
        <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: '#21262d',
              borderWidth: 1,
              borderColor: '#30363d',
              color: '#e6edf3',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 8,
              fontSize: 16,
              textAlign: 'center',
            }}
            placeholder={memorizedEighths.toString()}
            placeholderTextColor="#8b949e"
            keyboardType="numeric"
            value={rawInput}
            onChangeText={setRawInput}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <TouchableOpacity
            onPress={handleSave}
            style={{ backgroundColor: '#d4a843', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, justifyContent: 'center' }}
          >
            <Text style={{ color: '#0d1117', fontWeight: 'bold', fontSize: 14 }}>حفظ</Text>
          </TouchableOpacity>
        </View>
        {previewLabel && (
          <Text style={{ color: '#d4a843', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
            = {previewLabel}
          </Text>
        )}
      </Card>

      {/* Add memorization */}
      <Card title="إضافة حفظ جديد" icon={<Ionicons name="add-circle-outline" size={20} color="#d4a843" />}>
        <Text style={[label, { marginBottom: 8 }]}>اختر المقدار وانقر إضافة:</Text>
        <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Select selectedValue={addAmt} onValueChange={setAddAmt} options={UNIT_OPTIONS} />
          </View>
          <TouchableOpacity
            onPress={() => addMemorizedEighths(addAmt)}
            style={{ backgroundColor: '#238636', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, justifyContent: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>+ أضف</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: '#8b949e', fontSize: 12, marginTop: 8, textAlign: 'right' }}>
          ستضيف {eighthsToLabel(addAmt)} إلى المجموع الحالي ({eighthsToLabel(memorizedEighths)}).
        </Text>
      </Card>
    </PageContainer>
  );
}

const label: object = { color: '#8b949e', fontSize: 13, marginBottom: 6, textAlign: 'right' };
