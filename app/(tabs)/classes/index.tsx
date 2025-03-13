import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Plus } from 'lucide-react-native';
import { format } from 'date-fns';

export default function ClassesScreen() {
  const [classes, setClasses] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setUserRole(profile?.role);

      let query = supabase
        .from('classes')
        .select(`
          *,
          gyms (
            name,
            coach_id,
            profiles (
              full_name
            )
          )
        `)
        .gte('start_time', new Date().toISOString());

      if (profile?.role === 'coach') {
        query = query.eq('gyms.coach_id', user.id);
      }

      const { data } = await query.order('start_time');
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClasses();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading classes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {userRole === 'coach' ? 'My Classes' : 'Available Classes'}
        </Text>
        {userRole === 'coach' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/classes/new')}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.classList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {classes.map((classItem) => (
          <TouchableOpacity
            key={classItem.id}
            style={styles.classCard}
            onPress={() => router.push(`/classes/${classItem.id}`)}
          >
            <View style={styles.classHeader}>
              <Text style={styles.className}>{classItem.name}</Text>
              <Text style={styles.classPrice}>
                ${classItem.price.toFixed(2)}
              </Text>
            </View>
            
            <Text style={styles.gymName}>
              at {classItem.gyms.name} with {classItem.gyms.profiles.full_name}
            </Text>
            
            <View style={styles.classDetails}>
              <Text style={styles.classTime}>
                {format(new Date(classItem.start_time), 'MMM d, yyyy h:mm a')}
              </Text>
              <Text style={styles.classDuration}>
                {classItem.duration.replace(':', 'h ')}m
              </Text>
            </View>

            <View style={styles.classFooter}>
              <Text style={styles.classCapacity}>
                {classItem.capacity} spots available
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {classes.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {userRole === 'coach'
                ? "You haven't created any classes yet"
                : 'No classes available'}
            </Text>
            {userRole === 'coach' && (
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push('/classes/new')}
              >
                <Text style={styles.emptyStateButtonText}>
                  Create your first class
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  addButton: {
    backgroundColor: '#0891b2',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  classList: {
    padding: 20,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  className: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  classPrice: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#0891b2',
  },
  gymName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 12,
  },
  classDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  classTime: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  classDuration: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  classFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 12,
  },
  classCapacity: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#fff',
  },
});