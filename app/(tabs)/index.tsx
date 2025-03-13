import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop' }}
          style={styles.headerImage}
        />
        <View style={styles.headerOverlay}>
          <Text style={styles.title}>Welcome to CoachWire</Text>
          <Text style={styles.subtitle}>Connect with top coaches and transform your fitness journey</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Featured Coaches</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coachesScroll}>
          {/* Placeholder for featured coaches - will be populated from Supabase */}
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.coachCard}>
              <Image
                source={{ uri: `https://images.unsplash.com/photo-${i === 1 ? '1571019613454-1cb2f99b2d8b' : i === 2 ? '1571731261589-d0c1f7b60bca' : '1549476464-37392f717541'}?w=400&auto=format&fit=crop` }}
                style={styles.coachImage}
              />
              <Text style={styles.coachName}>Coach {i}</Text>
              <Text style={styles.coachSpecialty}>Fitness Expert</Text>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Upcoming Classes</Text>
        {/* Placeholder for upcoming classes - will be populated from Supabase */}
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.classCard}>
            <Text style={styles.className}>HIIT Workout {i}</Text>
            <Text style={styles.classTime}>Tomorrow at 9:00 AM</Text>
            <Text style={styles.classPrice}>$20</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  coachesScroll: {
    marginBottom: 24,
  },
  coachCard: {
    width: 200,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coachImage: {
    width: '100%',
    height: 150,
  },
  coachName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    padding: 12,
    paddingBottom: 4,
  },
  coachSpecialty: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  className: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  classTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 8,
  },
  classPrice: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#0891b2',
  },
});