import { AppText as Text } from '@/components/ui/AppText';
import { PageContainer } from '@/components/ui/PageContainer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Linking, TouchableOpacity, View } from 'react-native';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <PageContainer>
      <View style={{ width: '100%', flexDirection: 'row-reverse', paddingTop: 16, paddingHorizontal: 16 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#161b22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#30363d' }}
        >
          <Ionicons name="close" size={24} color="#8b949e" />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40, paddingHorizontal: 16 }}>
        {/* App Icon Container */}
        <View style={{
          width: 140,
          height: 140,
          backgroundColor: '#161b22',
          borderRadius: 36,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
          borderWidth: 1,
          borderColor: '#d4a843',
          shadowColor: '#d4a843',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 8,
          overflow: 'hidden'
        }}>
          <Image
            source={require('../../assets/images/app-icon.png')}
            style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
            // Fallback to a placeholder icon if the actual icon isn't there yet
            defaultSource={require('../../assets/images/app-icon.png')}
          />
        </View>

        {/* App Name & Version */}
        <Text style={{ color: '#f0c96b', fontSize: 32, fontWeight: 'bold', marginBottom: 4 }}>
          Murajaa
        </Text>
        <Text style={{ color: '#8b949e', fontSize: 14, marginBottom: 24, letterSpacing: 1 }}>
          v1.0.0
        </Text>

        {/* Description */}
        <View style={{ backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 16, padding: 24, width: '100%', marginBottom: 32 }}>
          <Text style={{ color: '#e6edf3', fontSize: 16, textAlign: 'center', lineHeight: 26, marginBottom: 16 }}>
            تطبيق لمتابعة وتثبيت حفظ القرآن الكريم بطريقة منظمة تعتمد على المراجعة الأسبوعية.
          </Text>
          <View style={{ height: 1, backgroundColor: '#30363d', width: '50%', alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ color: '#8b949e', fontSize: 13, textAlign: 'center' }}>
            تم تصميمه ليكون رفيقك في رحلة الحفظ والمراجعة.
          </Text>
        </View>

        {/* Credits */}
        <View style={{ alignItems: 'center', marginTop: 'auto' }}>
          <Text style={{ color: '#8b949e', fontSize: 12, marginBottom: 6 }}>
            Developed by
          </Text>
          <Text style={{ color: '#e6edf3', fontSize: 15, fontWeight: 'bold', marginBottom: 8 }}>
            md_naciri
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:murajaa.quran@gmail.com')}
            style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 16 }}
            activeOpacity={0.7}
          >
            <Ionicons name="mail-outline" size={14} color="#8b949e" />
            <Text style={{ color: '#8b949e', fontSize: 13 }}>
              murajaa.quran@gmail.com
            </Text>
          </TouchableOpacity>
          <Text style={{ color: '#30363d', fontSize: 12 }}>
            © 2026 Murajaa
          </Text>
        </View>
      </View>
    </PageContainer>
  );
}
