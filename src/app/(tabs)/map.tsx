import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useHifzStore } from '@/features/hifz/hooks/useHifzStore';
import { PageContainer } from '@/components/ui/PageContainer';
import { TOTAL_HIZB, EIGHTHS_PER_HIZB, TOTAL_EIGHTHS, eighthsToLabel } from '@/core/domain/hizbMath';
import { Ionicons } from '@expo/vector-icons';

export default function MapScreen() {
  const memorizedEighths = useHifzStore(s => s.memorizedEighths);
  const [selectedHizb, setSelectedHizb] = useState<number | null>(null);

  const hizbCount = Math.floor(memorizedEighths / EIGHTHS_PER_HIZB);
  const remEighths = memorizedEighths % EIGHTHS_PER_HIZB;
  const pct = Math.round((memorizedEighths / TOTAL_EIGHTHS) * 100);

  const renderCell = (index: number) => {
    // index is 0 to 59
    const hizbNumber = index + 1;
    let bgColor = '#161b22'; // Unmemorized
    let borderColor = '#30363d';
    let progress = 0; // 0 to 8

    if (hizbNumber <= hizbCount) {
      // Fully memorized
      bgColor = 'rgba(212,168,67,0.15)'; // Gold tint
      borderColor = '#d4a843';
      progress = 8;
    } else if (hizbNumber === hizbCount + 1 && remEighths > 0) {
      // Partially memorized
      bgColor = 'rgba(46,160,67,0.15)'; // Green tint
      borderColor = '#2ea043';
      progress = remEighths;
    }

    return (
      <TouchableOpacity
        key={index}
        activeOpacity={0.7}
        onPress={() => setSelectedHizb(hizbNumber)}
        style={{
          width: '18%',
          aspectRatio: 1,
          backgroundColor: bgColor,
          borderWidth: 1,
          borderColor: borderColor,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Progress Fill Background for Partial */}
        {progress > 0 && progress < 8 && (
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${(progress / 8) * 100}%`,
            backgroundColor: 'rgba(46,160,67,0.3)',
          }} />
        )}
        <Text style={{ color: progress === 8 ? '#f0c96b' : progress > 0 ? '#2ea043' : '#8b949e', fontWeight: 'bold', fontSize: 16 }}>
          {hizbNumber}
        </Text>
      </TouchableOpacity>
    );
  };

  const selectedData = selectedHizb ? {
    number: selectedHizb,
    isFull: selectedHizb <= hizbCount,
    isPartial: selectedHizb === hizbCount + 1 && remEighths > 0,
    eighths: selectedHizb <= hizbCount ? 8 : (selectedHizb === hizbCount + 1 ? remEighths : 0)
  } : null;

  return (
    <PageContainer noPadding>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 24, paddingTop: 16 }}>
          <Ionicons name="map-outline" size={44} color="#d4a843" />
          <Text style={{ color: '#f0c96b', fontSize: 22, fontWeight: 'bold', marginTop: 12, marginBottom: 4 }}>
            خريطة الختمة
          </Text>
          <Text style={{ color: '#8b949e', fontSize: 13 }}>تتبع تقدمك البصري في الحفظ</Text>
        </View>

        {/* Legend */}
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 12, height: 12, backgroundColor: 'rgba(212,168,67,0.15)', borderWidth: 1, borderColor: '#d4a843', borderRadius: 3 }} />
            <Text style={{ color: '#8b949e', fontSize: 12 }}>محفوظ ({hizbCount})</Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 12, height: 12, backgroundColor: 'rgba(46,160,67,0.15)', borderWidth: 1, borderColor: '#2ea043', borderRadius: 3 }} />
            <Text style={{ color: '#8b949e', fontSize: 12 }}>قيد الحفظ</Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 12, height: 12, backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 3 }} />
            <Text style={{ color: '#8b949e', fontSize: 12 }}>غير محفوظ ({TOTAL_HIZB - hizbCount - (remEighths > 0 ? 1 : 0)})</Text>
          </View>
        </View>

        {/* Global Progress */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ color: '#e6edf3', fontSize: 32, fontWeight: 'bold' }}>{pct}%</Text>
          <Text style={{ color: '#8b949e', fontSize: 14 }}>نسبة إتمام الختمة</Text>
        </View>

        {/* 60 Hizb Grid */}
        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {Array.from({ length: TOTAL_HIZB }).map((_, i) => renderCell(i))}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      {selectedData && (
        <Modal
          transparent={true}
          visible={!!selectedHizb}
          animationType="fade"
          onRequestClose={() => setSelectedHizb(null)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: selectedData.isFull ? 'rgba(212,168,67,0.15)' : selectedData.isPartial ? 'rgba(46,160,67,0.15)' : '#21262d', borderWidth: 2, borderColor: selectedData.isFull ? '#d4a843' : selectedData.isPartial ? '#2ea043' : '#30363d', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Text style={{ color: selectedData.isFull ? '#f0c96b' : selectedData.isPartial ? '#2ea043' : '#8b949e', fontSize: 24, fontWeight: 'bold' }}>
                  {selectedData.number}
                </Text>
              </View>
              
              <Text style={{ color: '#e6edf3', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
                الحزب {selectedData.number}
              </Text>
              
              <Text style={{ color: '#8b949e', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
                {selectedData.isFull 
                  ? 'تم حفظ هذا الحزب بالكامل (8 أثمان).' 
                  : selectedData.isPartial 
                    ? `قيد الحفظ: تم حفظ ${selectedData.eighths} من 8 أثمان.`
                    : 'لم يتم حفظ هذا الحزب بعد.'}
              </Text>

              <TouchableOpacity 
                style={{ backgroundColor: '#30363d', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, width: '100%', alignItems: 'center' }}
                onPress={() => setSelectedHizb(null)}
              >
                <Text style={{ color: '#e6edf3', fontWeight: 'bold' }}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </PageContainer>
  );
}
