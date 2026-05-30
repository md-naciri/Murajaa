import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';

export function RecoveryConfirmModal() {
  const router = useRouter();
  const pendingIdToken = useAuthStore(s => s.pendingIdToken);
  const confirmRecoveryLogin = useAuthStore(s => s.confirmRecoveryLogin);
  const cancelRecovery = useAuthStore(s => s.cancelRecovery);

  const isVisible = !!pendingIdToken;

  if (!isVisible) return null;

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="fade"
      onRequestClose={cancelRecovery}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 16, padding: 24, width: '100%', maxWidth: 360 }}>
          {/* Icon & Title */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(46, 160, 67, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="refresh-circle-outline" size={32} color="#2ea043" />
            </View>
            <Text style={{ color: '#e6edf3', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
              هذا الحساب مرتبط ببيانات محفوظة
            </Text>
          </View>

          <Text style={{ color: '#8b949e', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 22 }}>
            تسجيل الدخول بهذا الحساب سيؤدي إلى استرجاع بياناته المحفوظة، ولن تبقى البيانات المحلية الحالية مرتبطة به.
          </Text>

          {/* Actions */}
          <View style={{ flexDirection: 'row-reverse', gap: 12 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: '#2ea043', paddingVertical: 14, borderRadius: 8, alignItems: 'center' }}
              onPress={async () => {
                const success = await confirmRecoveryLogin();
                if (success) {
                  router.replace('/(tabs)');
                }
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>متابعة وتسجيل الدخول</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, backgroundColor: '#30363d', paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#8b949e' }}
              onPress={cancelRecovery}
            >
              <Text style={{ color: '#e6edf3', fontWeight: 'bold', fontSize: 15 }}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
