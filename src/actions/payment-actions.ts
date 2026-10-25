'use server';

import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayClient: InstanceType<typeof Razorpay> | null = null;

function getRazorpay(): InstanceType<typeof Razorpay> | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    return null;
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({ key_id, key_secret });
  }
  return razorpayClient;
}

export async function createRazorpayOrder(amount: number) {
  try {
    const validAmount = Number(amount);
    if (!Number.isFinite(validAmount) || validAmount <= 0) {
      return { success: false, error: 'Invalid payment amount specified.' };
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      console.error('Razorpay API keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing from environment');
      return { success: false, error: 'Payment gateway is currently unconfigured. Please configure Razorpay keys.' };
    }

    const options = {
      amount: Math.round(validAmount * 100), // amount in the smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return { success: true, order };
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create order' };
  }
}

export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
) {
  try {
    if (!orderId || !paymentId || !signature) {
      return { success: false, error: 'Payment verification parameters missing' };
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return { success: false, error: 'Payment verification secret is missing' };
    }
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    if (generated_signature === signature) {
      return { success: true };
    } else {
      return { success: false, error: 'Invalid signature' };
    }
  } catch (error) {
    console.error('Razorpay Verification Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Verification failed' };
  }
}
