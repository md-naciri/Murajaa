import { AppText as Text } from '@/components/ui/AppText';
import { PageContainer } from '@/components/ui/PageContainer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';

export default function IntroScreen() {
  const router = useRouter();

  return (
    <PageContainer noScroll noPadding>
      <ScrollView contentContainerStyle={{ padding: 24, paddingVertical: 48, alignItems: 'center' }}>

        <Image
          source={require('../../assets/images/app-icon.png')}
          style={{ width: 100, height: 100, marginBottom: 24, resizeMode: 'contain', borderWidth: 1.75, borderRadius: 50, borderColor: '#d4a843', shadowColor: '#d4a843', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16, overflow: 'hidden' }}
        />

        <Text style={{ color: '#f0c96b', fontSize: 26, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
          أهلاً بك في مُرَاجَعَة
        </Text>

        <Text style={{ color: '#e6edf3', fontSize: 16, textAlign: 'center', lineHeight: 26, marginBottom: 32 }}>
          تطبيق مصمم لمساعدتك على تثبيت حفظك للقرآن الكريم من خلال نظام مراجعة أسبوعي منظم.
        </Text>

        <View style={{ width: '100%', gap: 16, marginBottom: 32 }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#161b22', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#30363d' }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(212,168,67,0.1)', alignItems: 'center', justifyContent: 'center', marginLeft: 16 }}>
              <Ionicons name="book-outline" size={24} color="#d4a843" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#e6edf3', fontSize: 15, fontWeight: 'bold', textAlign: 'right', marginBottom: 4 }}>مراجعة شاملة لحفظك</Text>
              <Text style={{ color: '#8b949e', fontSize: 13, textAlign: 'right', lineHeight: 20 }}>
                يقوم التطبيق بجدولة جميع محفوظاتك لمراجعتها <Text style={{ color: '#d4a843' }}>أسبوعياً</Text>. كلما زاد حفظك، زاد ورد المراجعة اليومي تلقائياً.
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#161b22', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#30363d' }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(46,160,67,0.1)', alignItems: 'center', justifyContent: 'center', marginLeft: 16 }}>
              <Ionicons name="compass-outline" size={24} color="#2ea043" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#e6edf3', fontSize: 15, fontWeight: 'bold', textAlign: 'right', marginBottom: 4 }}>يتكيف مع اتجاه حفظك</Text>
              <Text style={{ color: '#8b949e', fontSize: 13, textAlign: 'right', lineHeight: 20 }}>سواء كنت تحفظ من الحزب 1 إلى الحزب 60 (تصاعدي) أو من الحزب 60 إلى الحزب 1 (تنازلي)، يتكيف التطبيق مع مسارك.</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#161b22', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#30363d' }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(192,132,252,0.1)', alignItems: 'center', justifyContent: 'center', marginLeft: 16 }}>
              <Ionicons name="add-circle-outline" size={24} color="#c084fc" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#e6edf3', fontSize: 15, fontWeight: 'bold', textAlign: 'right', marginBottom: 4 }}>سجل حفظك الجديد</Text>
              <Text style={{ color: '#8b949e', fontSize: 13, textAlign: 'right', lineHeight: 20 }}>كلما حفظت شيئاً جديداً، أدخله في التطبيق ليتم دمجه تلقائياً في دورة المراجعة الأسبوعية القادمة.</Text>
            </View>
          </View>
        </View>

        {/* Battery Optimization Note */}
        <View style={{ width: '100%', backgroundColor: 'rgba(210,153,34,0.1)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(210,153,34,0.4)', marginBottom: 32 }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="warning-outline" size={20} color="#d4a843" style={{ marginLeft: 8 }} />
            <Text style={{ color: '#f0c96b', fontSize: 14, fontWeight: 'bold', textAlign: 'right' }}>تحسين عمل التنبيهات على بعض الأجهزة</Text>
          </View>
          <Text style={{ color: '#e6edf3', fontSize: 13, textAlign: 'right', lineHeight: 22 }}>
            إذا كانت التنبيهات لا تصل في وقتها، فقد يكون السبب إعدادات توفير البطارية في بعض الهواتف (مثل Xiaomi/MIUI). في هذه الحالة، يُنصح بالسماح لـ Murajaa بالعمل بدون قيود على البطارية (No restrictions).          </Text>
        </View>

      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={{ padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#30363d', backgroundColor: '#0d1117' }}>
        <TouchableOpacity
          onPress={() => router.replace('/optional-auth')}
          style={{
            backgroundColor: '#d4a843',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            shadowColor: '#d4a843',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text style={{ color: '#0d1117', fontSize: 18, fontWeight: 'bold' }}>التالي</Text>
        </TouchableOpacity>
      </View>
    </PageContainer>
  );
}
