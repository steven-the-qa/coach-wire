import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react-native';
import { initStripe, presentPaymentSheet } from '@/lib/stripe';

export default function ClassDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [classDetails, setClassDetails] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    fetchClassDetails();
  }, [id]);

  const fetchClassDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setUserRole(profile?.role);

      const { data: classData } = await supabase
        .from('classes')
        .select(`
          *,
          gyms (
            name,
            coach_id,
            profiles (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', id)
        .single();

      setClassDetails(classData);

      if (profile?.role === 'client') {
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('*')
          .eq('class_id', id)
          .eq('client_id', user.id)
          .single();

        setBooking(bookingData);
      }
    } catch (error) {
      console.error('Error fetching class details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClass = async () => {
    try {
      setLoading(true);

      const { error: stripeError, paymentIntent } = await initStripe({
        amount: classDetails.price * 100, // Convert to cents
        currency: 'usd',
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        throw new Error(presentError.message);
      }

      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          class_id: id,
          client_id: userId,
          status: 'confirmed',
          stripe_payment_id: paymentIntent.id,
        });

      if (bookingError) {
        throw new Error(bookingError.message);
      }

      await fetchClassDetails();
      Alert.alert('Success', 'Class booked successfully!');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    if (classDetails?.gyms?.profiles?.id) {
      router.push(`/messages/${classDetails.gyms.profiles.id}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading class details...</Text>
      </View>
    );
  }

  if (!classDetails) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Class not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{classDetails.name}</Text>
        <Text style={styles.price}>${classDetails.price.toFixed(2)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Class Details</Text>
          <Text style={styles.gymName}>
            at {classDetails.gyms.name} with {classDetails.gyms.profiles.full_name}
          </Text>
          <Text style={styles.datetime}>
            {format(new Date(classDetails.start_time), 'EEEE, MMMM d, yyyy')}
          </Text>
          <Text style={styles.time}>
            {format(new Date(classDetails.start_time), 'h:mm a')} ({classDetails.duration.replace(':', 'h ')}m)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{classDetails.description || 'No description provided.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <Text style={styles.availability}>
            {classDetails.capacity} spots available
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        {userRole === 'client' && !booking && (
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookClass}
            disabled={loading}
          >
            <Text style={styles.bookButtonText}>
              {loading ? 'Processing...' : 'Book Class'}
            </Text>
          </TouchableOpacity>
        )}

        {userRole === 'client' && booking && (
          <View style={styles.bookedContainer}>
            <Text style={styles.bookedText}>You're booked for this class!</Text>
            <TouchableOpacity
              style={styles.messageButton}
              onPress={handleMessage}
            >
              <MessageSquare size={20} color="#0891b2" />
              <Text style={styles.messageButtonText}>Message Coach</Text>
            </TouchableOpacity>
          </View>
        )}
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#0891b2',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  gymName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 8,
  },
  datetime: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  time: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    lineHeight: 24,
  },
  availability: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bookButton: {
    backgroundColor: '#0891b2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  bookedContainer: {
    alignItems: 'center',
  },
  bookedText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#059669',
    marginBottom: 12,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#0891b2',
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
  },
});