import React, { useState } from 'react';
import { View,  TextInput, TouchableOpacity, Modal } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
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
  const setStoreMemorized = useHifzStore(s => s.setMemorizedEighths);
  const addMemorizedEighths = useHifzStore(s => s.addMemorizedEighths);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editAmount, setEditAmount] = useState(memorizedEighths);

  // Sync edit amount when opening modal
  React.useEffect(() => {
    if (showEditModal) {
      setEditAmount(memorizedEighths);
    }
  }, [showEditModal, memorizedEighths]);

  const hizbCount = Math.floor(memorizedEighths / EIGHTHS_PER_HIZB);
  const remEighths = memorizedEighths % EIGHTHS_PER_HIZB;
  const pct = Math.round((memorizedEighths / TOTAL_EIGHTHS) * 100);

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

      {/* Memorization Balance */}
      <Card title="رصيد الحفظ" icon={<Ionicons name="book-outline" size={20} color="#d4a843" />}>
        <View style={{ backgroundColor: '#21262d', borderWidth: 1, borderColor: '#30363d', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: '#8b949e', fontSize: 13, marginBottom: 8 }}>الإجمالي الحالي</Text>
          <Text style={{ color: '#f0c96b', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
            {memorizedEighths === 0
              ? 'لم يتم حفظ أي شيء بعد'
              : `${hizbCount > 0 ? hizbCount + ' حزب' : ''}${remEighths > 0 ? (hizbCount > 0 ? ' و ' : '') + remEighths + ' ثمن' : ''}`
            }
          </Text>
          <Text style={{ color: '#c9d1d9', fontSize: 14 }}>{memorizedEighths} من {TOTAL_EIGHTHS} ثمن ({pct}%)</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowEditModal(true)}
          style={{ backgroundColor: '#30363d', paddingVertical: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'center', gap: 8 }}
        >
          <Ionicons name="create-outline" size={18} color="#e6edf3" />
          <Text style={{ color: '#e6edf3', fontWeight: 'bold', fontSize: 15 }}>تعديل الرصيد</Text>
        </TouchableOpacity>
      </Card>

      {/* Edit Balance Modal */}
      <Modal
        transparent={true}
        visible={showEditModal}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340 }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#e6edf3', fontSize: 18, fontWeight: 'bold' }}>تعديل رصيد الحفظ</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#8b949e" />
              </TouchableOpacity>
            </View>
            
            <Text style={{ color: '#8b949e', fontSize: 13, textAlign: 'right', marginBottom: 16, lineHeight: 20 }}>
              يمكنك زيادة أو إنقاص الأثمان، أو كتابة المجموع الكلي مباشرة للوصول السريع:
            </Text>

            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
              <TouchableOpacity 
                onPress={() => editAmount > 0 && setEditAmount(editAmount - 1)}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#30363d', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="remove" size={24} color="#e6edf3" />
              </TouchableOpacity>
              
              <View style={{ alignItems: 'center' }}>
                <TextInput
                  style={{
                    color: '#f0c96b',
                    fontSize: 32,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    minWidth: 80,
                    padding: 0
                  }}
                  keyboardType="numeric"
                  value={editAmount.toString()}
                  onChangeText={(val) => {
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) setEditAmount(Math.min(TOTAL_EIGHTHS, Math.max(0, num)));
                    else if (val === '') setEditAmount(0);
                  }}
                />
                <Text style={{ color: '#8b949e', fontSize: 12 }}>أثمان</Text>
              </View>

              <TouchableOpacity 
                onPress={() => editAmount < TOTAL_EIGHTHS && setEditAmount(editAmount + 1)}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#30363d', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="add" size={24} color="#e6edf3" />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: 'rgba(212,168,67,0.1)', padding: 12, borderRadius: 8, marginBottom: 24 }}>
              <Text style={{ color: '#f0c96b', textAlign: 'center', fontSize: 13 }}>
                يعادل: {eighthsToLabel(editAmount)}
              </Text>
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: '#2ea043', paddingVertical: 14, borderRadius: 8, alignItems: 'center' }}
              onPress={() => {
                setStoreMemorized(editAmount);
                setShowEditModal(false);
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>حفظ التعديلات</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </PageContainer>
  );
}

const label: object = { color: '#8b949e', fontSize: 13, marginBottom: 6, textAlign: 'right' };

