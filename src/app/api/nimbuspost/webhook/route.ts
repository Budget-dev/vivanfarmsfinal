import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * NimbusPost Real-time Tracking Webhook Handler.
 * 
 * Top Indian D2C stores configure this webhook in NimbusPost Seller Panel
 * under Settings -> Webhook (URL: https://<domain>/api/nimbuspost/webhook).
 * 
 * Receives event triggers when shipment status changes:
 * - MANIFESTED / BOOKED
 * - PICKED_UP
 * - IN_TRANSIT
 * - OUT_FOR_DELIVERY
 * - DELIVERED
 * - RTO_INITIATED / CANCELLED
 */

// Initialize Firebase for serverless route handling
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // NimbusPost webhook payload properties
    const orderNumber = body.order_number || body.order_id || body.orderId || '';
    const awb = body.awb || body.awb_number || body.tracking_id || '';
    const rawStatus = (body.status || body.current_status || '').toLowerCase();
    const location = body.location || body.city || 'Transit Center';
    const message = body.message || body.activity || `Status updated to ${rawStatus}`;
    const eventTime = body.timestamp || body.event_time || new Date().toISOString();

    if (!orderNumber && !awb) {
      return NextResponse.json(
        { success: false, error: 'Missing order_number or awb reference' },
        { status: 400 }
      );
    }

    // Determine target order ID
    const targetOrderId = orderNumber;

    // Map carrier status to standard store status
    let mappedOrderStatus = 'Shipped';
    if (rawStatus.includes('deliver') || rawStatus === 'dl') {
      mappedOrderStatus = 'Delivered';
    } else if (rawStatus.includes('cancel') || rawStatus.includes('rto')) {
      mappedOrderStatus = 'Cancelled';
    } else if (rawStatus.includes('book') || rawStatus.includes('manifest')) {
      mappedOrderStatus = 'Processing';
    }

    const checkpoint = {
      status: rawStatus.toUpperCase(),
      message: message,
      location: location,
      timestamp: eventTime,
    };

    // If order number provided, update Firestore document directly
    if (targetOrderId) {
      const orderRef = doc(db, 'orders', targetOrderId);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        const updateData: any = {
          courierStatus: rawStatus.toUpperCase(),
          lastCourierUpdate: new Date().toISOString(),
          trackingCheckpoints: arrayUnion(checkpoint),
        };

        if (awb && !orderSnap.data().trackingId) {
          updateData.trackingId = awb;
          updateData.courierPartner = 'NimbusPost';
        }

        // Only promote status forward (e.g. don't demote Delivered)
        if (orderSnap.data().status !== 'Delivered') {
          updateData.status = mappedOrderStatus;
        }

        await updateDoc(orderRef, updateData);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'NimbusPost webhook processed successfully',
      order: orderNumber,
      status: mappedOrderStatus,
    });
  } catch (error: any) {
    console.error('[NimbusPost Webhook Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'NimbusPost Webhook Listener for Vivaan Farms',
    timestamp: new Date().toISOString(),
  });
}
