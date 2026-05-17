import React, { useState } from 'react';
import { View, Text, SectionList, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PageContainer } from '@/components/ui/PageContainer';
import { DatabaseService, HifzLog } from '@/data/db/DatabaseService';
import { eighthsToLabel } from '@/core/domain/hizbMath';
import { formatDateLong } from '@/core/domain/dateHelpers';

interface LogGroup {
  title: string;
  data: HifzLog[];
}

export default function LogScreen() {
  const [logs, setLogs] = useState<LogGroup[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    const rawLogs = await DatabaseService.getAllLogs();
    
    // Group logs by date
    const grouped = rawLogs.reduce((acc, log) => {
      if (!acc[log.date]) {
        acc[log.date] = [];
      }
      acc[log.date].push(log);
      return acc;
    }, {} as Record<string, HifzLog[]>);

    const sections = Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a)) // sort descending
      .map(date => ({
        title: date,
        data: grouped[date],
      }));

    setLogs(sections);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchLogs();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: HifzLog }) => {
    const isIzhar = item.task_type === 'izhar';
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#161b22', padding: 16, borderBottomWidth: 1, borderBottomColor: '#30363d' }}>
        <View style={{ width: 40, alignItems: 'center' }}>
          <Ionicons 
            name={isIzhar ? 'star' : 'sync'} 
            size={20} 
            color={isIzhar ? '#c084fc' : '#2ea043'} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#e6edf3', fontSize: 14, fontWeight: 'bold' }}>
            {isIzhar ? 'استظهار حفظ جديد' : 'مراجعة يومية'}
          </Text>
          <Text style={{ color: '#8b949e', fontSize: 12, marginTop: 4 }}>
            المقدار: {eighthsToLabel(item.eighths_amount)}
          </Text>
        </View>
        <View>
          <Text style={{ color: '#8b949e', fontSize: 11 }}>
            {item.created_at ? new Date(item.created_at).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={{ backgroundColor: '#21262d', paddingVertical: 8, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#30363d', borderBottomWidth: 1, borderBottomColor: '#30363d' }}>
      <Text style={{ color: '#d4a843', fontWeight: 'bold', fontSize: 13 }}>
        {formatDateLong(title)}
      </Text>
    </View>
  );

  return (
    <PageContainer noPadding>
      <View style={{ paddingTop: 32, paddingHorizontal: 16, marginBottom: 16 }}>
        <Text style={{ color: '#f0c96b', fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>سجل الإنجازات</Text>
        <Text style={{ color: '#8b949e', fontSize: 13 }}>تاريخ الحفظ والمراجعة</Text>
      </View>

      {logs.length === 0 ? (
        <View style={{ padding: 32, alignItems: 'center' }}>
          <Ionicons name="document-text-outline" size={48} color="#30363d" style={{ marginBottom: 12 }} />
          <Text style={{ color: '#8b949e', fontSize: 14 }}>لا يوجد سجل حتى الآن.</Text>
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: '#0d1117', borderWidth: 1, borderColor: '#30363d', borderRadius: 12, overflow: 'hidden', marginHorizontal: 16, marginBottom: 32 }}>
          <SectionList
            sections={logs}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4a843" />}
            stickySectionHeadersEnabled={false}
          />
        </View>
      )}
    </PageContainer>
  );
}
