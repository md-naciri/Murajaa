import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 bg-[#0d1117] items-center justify-center p-5">
        <Text className="text-white text-xl font-bold mb-4">الصفحة غير موجودة</Text>
        <Link href="/" className="text-gold">العودة للرئيسية</Link>
      </View>
    </>
  );
}

