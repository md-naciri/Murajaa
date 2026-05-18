import React from 'react';
import { Platform, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

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
 * On Web: renders a native <select> styled for dark mode.
 * On iOS/Android: uses the native Picker wheel/dropdown.
 */
export function Select({ selectedValue, onValueChange, options }: SelectProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={{ backgroundColor: '#21262d', borderRadius: 8, borderWidth: 1, borderColor: '#30363d', overflow: 'hidden' }}>
        <select
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

  return (
    <View style={{ backgroundColor: '#21262d', borderRadius: 8, borderWidth: 1, borderColor: '#30363d', overflow: 'hidden' }}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        dropdownIconColor="#d4a843"
        style={{ color: '#e6edf3' }}
      >
        {options.map((opt) => (
          <Picker.Item key={opt.value} label={"\u200F" + opt.label} value={opt.value} />
        ))}
      </Picker>
    </View>
  );
}
