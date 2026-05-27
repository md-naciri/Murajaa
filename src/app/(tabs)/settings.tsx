import { AppText as Text } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/ui/PageContainer';
import { Select } from '@/components/ui/Select';
import { DAY_NAMES_AR, todayStr } from '@/core/domain/dateHelpers';
import { TOTAL_EIGHTHS, eighthsToLabel } from '@/core/domain/hizbMath';
import { DatabaseService } from '@/data/db/DatabaseService';
import * as NotificationService from '@/data/services/NotificationService';
import { useHifzStore } from '@/features/hifz/hooks/useHifzStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Platform, Switch, TextInput, TouchableOpacity, View } from 'react-native';

const DAY_OPTIONS = DAY_NAMES_AR.map((name, i) => ({ label: name, value: i }));

const MODE_OPTIONS = [
  { label: 'من الحزب 1 إلى الحزب 60 (تصاعدي)', value: 0 },
  { label: 'من الحزب 60 إلى الحزب 1 (تنازلي)', value: 1 },
];

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
  const memorizedEighths = useHifzStore(s => s.memorizedEighths);
  const memorizationMode = useHifzStore(s => s.memorizationMode);
  const izharDay = useHifzStore(s => s.izharDay);

  const setMemorizationMode = useHifzStore(s => s.setMemorizationMode);
  const setMemorizedAtWeekStart = useHifzStore(s => s.setMemorizedAtWeekStart);
  const setIzharDay = useHifzStore(s => s.setIzharDay);
  const setStoreMemorized = useHifzStore(s => s.setMemorizedEighths);

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

  // Custom warning and guided re-entry modal states
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showReenterModal, setShowReenterModal] = useState(false);
  const [pendingMode, setPendingMode] = useState<'forward' | 'reverse'>('forward');
  const [reenterAmount, setReenterAmount] = useState('');

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

  const handleModeChange = (newVal: number) => {
    const newMode = newVal === 0 ? 'forward' : 'reverse';
    if (newMode !== memorizationMode) {
      setPendingMode(newMode);
      setShowResetConfirmModal(true);
    }
  };

  const handleConfirmModeChange = async () => {
    // 1. Change mode in store
    setMemorizationMode(pendingMode);
    // 2. Reset counts
    setStoreMemorized(0);
    setMemorizedAtWeekStart(0);
    // 3. Clear reminders schedule
    const logs = await DatabaseService.getLogsForDate(todayStr(0));
    const isReviewDoneToday = logs.some(l => l.task_type === 'review');
    await NotificationService.updateSchedule(remindersEnabled, reminderTime, isReviewDoneToday);

    // 4. Hide warning modal and open guided re-entry modal
    setShowResetConfirmModal(false);
    setReenterAmount('');
    setShowReenterModal(true);
  };

  const handleSaveReenter = async () => {
    let amount = parseInt(reenterAmount, 10);
    if (isNaN(amount) || amount < 0) amount = 0;
    amount = Math.min(TOTAL_EIGHTHS, amount);

    // Save to both store counts
    setStoreMemorized(amount);
    setMemorizedAtWeekStart(amount);

    setShowReenterModal(false);

    // Sync notification schedule
    const logs = await DatabaseService.getLogsForDate(todayStr(0));
    const isReviewDoneToday = logs.some(l => l.task_type === 'review');
    await NotificationService.updateSchedule(remindersEnabled, reminderTime, isReviewDoneToday);

    if (Platform.OS !== 'web') {
      Alert.alert('تم التحديث بنجاح 🎉', 'تم حفظ محفوظك بالاتجاه الجديد وتحديث خطة مراجعتك.', [{ text: 'حسناً' }]);
    }
  };

  const previewReenterVal = parseInt(reenterAmount, 10);
  const previewReenterLabel = reenterAmount.length > 0 && !isNaN(previewReenterVal)
    ? eighthsToLabel(Math.min(TOTAL_EIGHTHS, Math.max(0, previewReenterVal)))
    : null;

  const handleToggleReminders = async (value: boolean) => {
    if (Platform.OS === 'web') {
      window.alert('تنبيهات المراجعة مدعومة حالياً على أجهزة أندرويد فقط.');
      setRemindersEnabled(false);
      return;
    }

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

  const pct = Math.round((memorizedEighths / TOTAL_EIGHTHS) * 100);

  const modeVal = memorizationMode === 'forward' ? 0 : 1;

  return (
    <PageContainer>
      {/* Header */}
      <View style={{ marginBottom: 24, alignItems: 'flex-end' }}>
        <Text style={{ color: '#f0c96b', fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>الإعدادات</Text>
        <Text style={{ color: '#8b949e', fontSize: 13, textAlign: 'right' }}>إدارة الخطة وتحديث بيانات المحفوظ</Text>
      </View>

      {/* Plan Settings */}
      <Card title="إعدادات الخطة" icon={<Ionicons name="options-outline" size={20} color="#d4a843" />}>
        {/* Week Start Day */}
        <View style={{ marginBottom: 20 }}>
          <Text style={label}>يوم بداية المراجعة الأسبوعية:</Text>
          <Select selectedValue={izharDay} onValueChange={setIzharDay} options={DAY_OPTIONS} />
        </View>

        {/* Direction Mode Selector */}
        <View style={{ marginBottom: 16 }}>
          <Text style={label}>اتجاه الحفظ والمراجعة:</Text>
          <Select selectedValue={modeVal} onValueChange={handleModeChange} options={MODE_OPTIONS} />
        </View>

        <View style={{ backgroundColor: 'rgba(168,85,247,0.1)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#c084fc', fontSize: 12, textAlign: 'center', lineHeight: 20 }}>
            ◆ يوم {DAY_NAMES_AR[izharDay]}: يوم بداية دورة المراجعة الأسبوعية وتحديث أورادك
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
          تلقي تذكير يومي للمراجعة.
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
              onPress={async () => {
                setStoreMemorized(editAmount);
                setMemorizedAtWeekStart(editAmount); // Force weekly target sync on correction
                setShowEditModal(false);

                // Update reminders schedule
                const logs = await DatabaseService.getLogsForDate(todayStr(0));
                const isReviewDoneToday = logs.some(l => l.task_type === 'review');
                await NotificationService.updateSchedule(remindersEnabled, reminderTime, isReviewDoneToday);
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

      {/* Custom Reset Confirmation Modal */}
      <Modal
        transparent={true}
        visible={showResetConfirmModal}
        animationType="fade"
        onRequestClose={() => setShowResetConfirmModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 16, padding: 24, width: '100%', maxWidth: 360 }}>
            {/* Warning Icon & Title */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="warning-outline" size={32} color="#ef4444" />
              </View>
              <Text style={{ color: '#e6edf3', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>تغيير اتجاه الحفظ</Text>
            </View>

            <Text style={{ color: '#8b949e', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              سيؤدي تغيير اتجاه الحفظ والمراجعة إلى إعادة تعيين تقدم حفظك الحالي بالكامل لكي يتم حساب خطة المراجعة بشكل صحيح بالاتجاه الجديد.
            </Text>

            <Text style={{ color: '#c084fc', fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20, backgroundColor: 'rgba(168,85,247,0.1)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' }}>
              ◆ بعد التأكيد، ستقوم بإدخال حفظك الجديد مباشرة لمتابعة خطتك دون انقطاع.
            </Text>

            {/* Actions */}
            <View style={{ flexDirection: 'row-reverse', gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#da3633', paddingVertical: 14, borderRadius: 8, alignItems: 'center' }}
                onPress={handleConfirmModeChange}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>تأكيد وإعادة التعيين</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#30363d', paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#8b949e' }}
                onPress={() => {
                  setShowResetConfirmModal(false);
                }}
              >
                <Text style={{ color: '#e6edf3', fontWeight: 'bold', fontSize: 15 }}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Re-entry Modal */}
      <Modal
        transparent={true}
        visible={showReenterModal}
        animationType="fade"
        onRequestClose={() => {
          setShowReenterModal(false);
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 16, padding: 24, width: '100%', maxWidth: 360 }}>
            {/* Logo / Book Icon */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(212,168,67,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#d4a843' }}>
                <Ionicons name="book-outline" size={28} color="#d4a843" />
              </View>
              <Text style={{ color: '#f0c96b', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>تحديد حفظك الجديد</Text>
            </View>

            <Text style={{ color: '#8b949e', fontSize: 13, textAlign: 'right', marginBottom: 12 }}>
              أدخل مقدار ما تحفظه حالياً بالاتجاه الجديد ({pendingMode === 'forward' ? 'من 1 إلى 60' : 'من 60 إلى 1'}):
            </Text>

            <TextInput
              style={{
                backgroundColor: '#0d1117',
                borderWidth: 1,
                borderColor: '#30363d',
                color: '#e6edf3',
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 8,
                fontSize: 18,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 8,
              }}
              placeholder="0"
              placeholderTextColor="#8b949e"
              keyboardType="numeric"
              value={reenterAmount}
              onChangeText={setReenterAmount}
              returnKeyType="done"
            />

            {previewReenterLabel ? (
              <Text style={{ color: '#d4a843', fontSize: 13, textAlign: 'center', marginBottom: 20, fontWeight: '500' }}>
                يعادل: {previewReenterLabel}
              </Text>
            ) : (
              <View style={{ marginBottom: 20 }} />
            )}

            <TouchableOpacity
              style={{
                backgroundColor: '#d4a843',
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: 'center',
                shadowColor: '#d4a843',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={handleSaveReenter}
            >
              <Text style={{ color: '#0d1117', fontWeight: 'bold', fontSize: 16 }}>تأكيد وحفظ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </PageContainer>
  );
}

const label: object = { color: '#8b949e', fontSize: 13, marginBottom: 6, textAlign: 'right' };
