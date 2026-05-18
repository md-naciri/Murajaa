import React, { useState } from 'react';
import { Platform, View, TouchableOpacity, Modal, FlatList } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';

interface SelectOption {
  label: string;
  value: number;
}

interface SelectProps {
  selectedValue: number;
  onValueChange: (value: number) => void;
  options: SelectOption[];
}

/**
 * Cross-platform Select component.
 * On Web: renders a native <select> perfectly styled for dark mode with RTL support.
 * On iOS/Android: Renders a beautiful custom dark-themed Modal.
 * This completely bypasses Android's stubborn left-alignment native Picker bug.
 */
export function Select({ selectedValue, onValueChange, options }: SelectProps) {
  const [modalVisible, setModalVisible] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <View style={{ backgroundColor: '#21262d', borderRadius: 8, borderWidth: 1, borderColor: '#30363d', overflow: 'hidden' }}>
        <select
          dir="rtl"
          value={selectedValue}
          onChange={(e) => onValueChange(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '10px 14px',
            backgroundColor: '#21262d',
            color: '#e6edf3',
            border: 'none',
            fontSize: 14,
            outline: 'none',
            cursor: 'pointer',
            appearance: 'auto',
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ backgroundColor: '#21262d', color: '#e6edf3' }}>
              {opt.label}
            </option>
          ))}
        </select>
      </View>
    );
  }

  const selectedLabel = options.find((o) => o.value === selectedValue)?.label ?? '';

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        style={{
          flexDirection: 'row-reverse',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#21262d',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#30363d',
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <Text style={{ color: '#e6edf3', fontSize: 15, fontWeight: 'bold' }}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={18} color="#d4a843" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 }}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          {/* Prevent touches on the modal content from closing it */}
          <TouchableOpacity activeOpacity={1}>
            <View style={{ backgroundColor: '#161b22', borderRadius: 16, borderWidth: 1, borderColor: '#30363d', maxHeight: 400, overflow: 'hidden' }}>
              <FlatList
                data={options}
                keyExtractor={(item) => item.value.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: '#30363d',
                      backgroundColor: item.value === selectedValue ? 'rgba(212,168,67,0.1)' : 'transparent',
                      flexDirection: 'row-reverse',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onPress={() => {
                      onValueChange(item.value);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={{ color: item.value === selectedValue ? '#f0c96b' : '#e6edf3', fontSize: 16, fontWeight: item.value === selectedValue ? 'bold' : 'normal', textAlign: 'right' }}>
                      {item.label}
                    </Text>
                    {item.value === selectedValue && <Ionicons name="checkmark" size={22} color="#f0c96b" />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
