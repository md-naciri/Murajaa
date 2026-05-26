import React, { useState } from 'react';
import { View,  TextInput, TouchableOpacity, Modal, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText as Text } from '@/components/ui/AppText';
import { useHifzStore } from '@/features/hifz/hooks/useHifzStore';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { PageContainer } from '@/components/ui/PageContainer';
import { TOTAL_EIGHTHS, UNIT_OPTIONS, eighthsToLabel, EIGHTHS_PER_HIZB } from '@/core/domain/hizbMath';
import { DAY_NAMES_AR, todayStr } from '@/core/domain/dateHelpers';
import { DatabaseService } from '@/data/db/DatabaseService';
import { Ionicons } from '@expo/vector-icons';
import * as NotificationService from '@/data/services/NotificationService';

const DAY_OPTIONS = DAY_NAMES_AR.map((name, i) => ({ label: name, value: i }));

function formatTimeArabic(timeStr: string): string {
  const [hourStr, minStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);
  
  if (isNaN(hour) || isNaN(minute)) return timeStr;
  
  const isPm = hour >= 12;
  const amPmStr = isPm ? 'مساءً' : 'صباحاً';
  
  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
  }
  
  const minFormatted = String(minute).padStart(2, '0');
  return `${hour}:${minFormatted} ${amPmStr}`;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const isPm = i >= 12;
  const h12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
  const label = `${h12} ${isPm ? 'مساءً' : 'صباحاً'} (${String(i).padStart(2, '0')}:00)`;
  return { label, value: i };
});

const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const val = i * 5;
  const label = String(val).padStart(2, '0');
  return { label: `${label} دقيقة`, value: val };
});

export default function SettingsScreen() {
  const router = useRouter();
  
  // Individual selectors for React 19 Compiler compatibility
  const memorizedEighths  = useHifzStore(s => s.memorizedEighths);
  const weeklyGoalEighths = useHifzStore(s => s.weeklyGoalEighths);
  const izharDay          = useHifzStore(s => s.izharDay);
  const setMemorizedEighths = useHifzStore(s => s.setMemorizedEighths);
  const setWeeklyGoal       = useHifzStore(s => s.setWeeklyGoal);
  const setIzharDay         = useHifzStore(s => s.setIzharDay);
  const setStoreMemorized = useHifzStore(s => s.setMemorizedEighths);
  const addMemorizedEighths = useHifzStore(s => s.addMemorizedEighths);

  // Reminders store settings
  const remindersEnabled = useHifzStore(s => s.remindersEnabled);
  const reminderTime = useHifzStore(s => s.reminderTime);
  const setRemindersEnabled = useHifzStore(s => s.setRemindersEnabled);
  const setReminderTime = useHifzStore(s => s.setReminderTime);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editAmount, setEditAmount] = useState(memorizedEighths);

  // Time Picker Modal states
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState(20);
  const [selectedMinute, setSelectedMinute] = useState(0);

  // Sync edit amount when opening modal
  React.useEffect(() => {
    if (showEditModal) {
      setEditAmount(memorizedEighths);
    }
  }, [showEditModal, memorizedEighths]);

  // Sync time picker values when opening modal
  React.useEffect(() => {
    if (showTimeModal) {
      const [hStr, mStr] = reminderTime.split(':');
      setSelectedHour(parseInt(hStr, 10) || 20);
      setSelectedMinute(parseInt(mStr, 10) || 0);
    }
  }, [showTimeModal, reminderTime]);

  const handleToggleReminders = async (value: boolean) => {
    if (value) {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        setRemindersEnabled(true);
        const logs = await DatabaseService.getLogsForDate(todayStr(0));
        const isReviewDoneToday = logs.some(l => l.task_type === 'review');
        await NotificationService.updateSchedule(true, reminderTime, isReviewDoneToday);
      } else {
        Alert.alert(
          'تنبيهات المراجعة',
          'الرجاء تفعيل صلاحية التنبيهات من إعدادات النظام لتلقي التذكيرات اليومية.',
          [{ text: 'حسناً' }]
        );
        setRemindersEnabled(false);
      }
    } else {
      setRemindersEnabled(false);
      await NotificationService.updateSchedule(false, reminderTime, false);
    }
  };

  const handleSaveTime = async () => {
    const formattedHour = String(selectedHour).padStart(2, '0');
    const formattedMinute = String(selectedMinute).padStart(2, '0');
    const newTime = `${formattedHour}:${formattedMinute}`;
    
    setReminderTime(newTime);
    setShowTimeModal(false);

    const logs = await DatabaseService.getLogsForDate(todayStr(0));
    const isReviewDoneToday = logs.some(l => l.task_type === 'review');
    await NotificationService.updateSchedule(remindersEnabled, newTime, isReviewDoneToday);
  };

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
          <Text style={label}>يوم الاستظهار:</Text>
          <Select selectedValue={izharDay} onValueChange={setIzharDay} options={DAY_OPTIONS} />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={label}>مقدار الحفظ الأسبوعي:</Text>
          <Select selectedValue={weeklyGoalEighths} onValueChange={setWeeklyGoal} options={UNIT_OPTIONS} />
        </View>

        <View style={{ backgroundColor: 'rgba(168,85,247,0.1)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#c084fc', fontSize: 12, textAlign: 'center', lineHeight: 20 }}>
            ◆ يوم {DAY_NAMES_AR[izharDay]}: يوم الاستظهار ويوم بداية المراجعة الأسبوعية
          </Text>
        </View>
      </Card>

      {/* Review Reminders */}
      <Card title="تنبيهات المراجعة" icon={<Ionicons name="notifications-outline" size={20} color="#d4a843" />}>
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#e6edf3', fontSize: 15, fontWeight: 'bold' }}>تفعيل التنبيهات اليومية</Text>
          <Switch
            value={remindersEnabled}
            onValueChange={handleToggleReminders}
            trackColor={{ false: '#30363d', true: 'rgba(212,168,67,0.5)' }}
            thumbColor={remindersEnabled ? '#d4a843' : '#8b949e'}
          />
        </View>
        <Text style={{ color: '#8b949e', fontSize: 12, textAlign: 'right', marginBottom: remindersEnabled ? 16 : 0, lineHeight: 18 }}>
          تلقي تذكير يومي للمراجعة في الوقت الذي تحدده.
        </Text>

        {remindersEnabled && (
          <View style={{ borderTopWidth: 1, borderTopColor: '#30363d', paddingTop: 16, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#8b949e', fontSize: 13 }}>وقت التنبيه:</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowTimeModal(true)}
              style={{
                backgroundColor: '#21262d',
                borderWidth: 1,
                borderColor: '#30363d',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: '#f0c96b', fontWeight: 'bold', fontSize: 14 }}>
                {formatTimeArabic(reminderTime)}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Memorization Balance */}
      <Card title="رصيد الحفظ" icon={<Ionicons name="book-outline" size={20} color="#d4a843" />}>
        <View style={{ backgroundColor: '#21262d', borderWidth: 1, borderColor: '#30363d', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: '#8b949e', fontSize: 13, marginBottom: 8 }}>المحفوظ</Text>
          <Text style={{ color: '#f0c96b', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
            {memorizedEighths === 0
              ? 'لم يتم حفظ أي شيء بعد'
              : eighthsToLabel(memorizedEighths)
            }
          </Text>
          <Text style={{ color: '#c9d1d9', fontSize: 14 }}>{memorizedEighths} من {TOTAL_EIGHTHS} ثمن ({pct}%)</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowEditModal(true)}
          style={{ backgroundColor: '#30363d', paddingVertical: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'center', gap: 8 }}
        >
          <Ionicons name="create-outline" size={18} color="#e6edf3" />
          <Text style={{ color: '#e6edf3', fontWeight: 'bold', fontSize: 15 }}>تعديل المحفوظ</Text>
        </TouchableOpacity>
      </Card>

      {/* About App */}
      <Card title="حول" icon={<Ionicons name="information-circle-outline" size={20} color="#d4a843" />}>
        <TouchableOpacity
          onPress={() => router.push('/about')}
          style={{ backgroundColor: '#21262d', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#30363d', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
            <Ionicons name="phone-portrait-outline" size={20} color="#e6edf3" />
            <Text style={{ color: '#e6edf3', fontSize: 15, fontWeight: 'bold' }}>حول التطبيق</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#8b949e" />
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
                    width: 100,
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

      {/* Edit Reminder Time Modal */}
      <Modal
        transparent={true}
        visible={showTimeModal}
        animationType="fade"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340 }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#e6edf3', fontSize: 18, fontWeight: 'bold' }}>تعديل وقت التنبيه</Text>
              <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                <Ionicons name="close" size={24} color="#8b949e" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#8b949e', fontSize: 13, textAlign: 'right', marginBottom: 16, lineHeight: 20 }}>
              حدد الساعة والدقيقة لتلقي التنبيه اليومي:
            </Text>

            <View style={{ flexDirection: 'row-reverse', gap: 12, marginBottom: 24 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#8b949e', fontSize: 12, marginBottom: 6, textAlign: 'right' }}>الساعة:</Text>
                <Select
                  selectedValue={selectedHour}
                  onValueChange={setSelectedHour}
                  options={HOUR_OPTIONS}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#8b949e', fontSize: 12, marginBottom: 6, textAlign: 'right' }}>الدقيقة:</Text>
                <Select
                  selectedValue={selectedMinute}
                  onValueChange={setSelectedMinute}
                  options={MINUTE_OPTIONS}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: '#2ea043', paddingVertical: 14, borderRadius: 8, alignItems: 'center' }}
              onPress={handleSaveTime}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>حفظ وقت التنبيه</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </PageContainer>
  );
}

const label: object = { color: '#8b949e', fontSize: 13, marginBottom: 6, textAlign: 'right' };

