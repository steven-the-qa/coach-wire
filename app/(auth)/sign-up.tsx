import { View, StyleSheet } from 'react-native';
import { AuthForm } from '@/components/auth/AuthForm';

export default function SignUpScreen() {
  return (
    <View style={styles.container}>
      <AuthForm mode="sign-up" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});