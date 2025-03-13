import { initStripe as initStripeSDK, presentPaymentSheet as presentStripePaymentSheet } from '@stripe/stripe-react-native';

export async function initStripe({ amount, currency = 'usd' }) {
  try {
    await initStripeSDK({
      publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    });

    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
      }),
    });

    const { paymentIntent, ephemeralKey, customer } = await response.json();

    await initStripeSDK({
      publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      merchantIdentifier: 'merchant.com.coachwire',
      urlScheme: 'coachwire',
    });

    return {
      paymentIntent,
      ephemeralKey,
      customer,
    };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
      },
    };
  }
}

export async function presentPaymentSheet() {
  try {
    const { error } = await presentStripePaymentSheet();
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
      },
    };
  }
}