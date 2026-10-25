'use server';

/**
 * @fileOverview Server actions for NimbusPost shipping integration.
 * Handles authentication and shipment creation securely.
 */

const NIMBUS_EMAIL = process.env.NIMBUSPOST_EMAIL || '';
const NIMBUS_PASSWORD = process.env.NIMBUSPOST_PASSWORD || '';
const API_URL = 'https://api.nimbuspost.com/v1';

/**
 * Authenticates with NimbusPost to get a temporary bearer token.
 */
async function getNimbusToken() {
  try {
    const res = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: NIMBUS_EMAIL, password: NIMBUS_PASSWORD }),
    });
    const data = await res.json();
    return data.status ? data.data : null;
  } catch (error) {
    console.error('NimbusPost Auth Error:', error);
    return null;
  }
}

/**
 * Creates a shipment in NimbusPost.
 * Called after successful payment.
 */
export async function createShipment(orderData: any) {
  try {
    if (!orderData || !orderData.shippingAddress) {
      return { success: false, error: 'Missing shipping address or order data' };
    }

    const token = await getNimbusToken();
    if (!token) throw new Error('Failed to authenticate with shipping partner.');

    const shipAddr = orderData.shippingAddress || {};
    const items = Array.isArray(orderData.items) ? orderData.items : [];
    const isCod = orderData.paymentMethod === 'Cash on Delivery';
    const streetAddress = shipAddr.address || shipAddr.addressLine1 || shipAddr.street || 'Address not specified';

    const payload = {
      order_number: orderData.orderId || `VF-${Date.now()}`,
      shipping_charges: 0,
      discount: 0,
      cod: isCod ? (Number(orderData.totalAmount) || 0) : 0,
      payment_method: isCod ? 'COD' : 'Prepaid',
      consignee: {
        name: shipAddr.name || 'Valued Customer',
        address: streetAddress,
        address_2: '',
        city: shipAddr.city || '',
        state: shipAddr.state || '',
        pincode: (shipAddr.pincode || '').replace(/\D/g, '').slice(0, 6),
        phone: (shipAddr.phone || '').replace(/\D/g, '').slice(-10),
        email: orderData.userEmail || '',
      },
      order_items: items.map((item: any) => ({
        name: item.name || 'Organic Farm Product',
        qty: Number(item.qty) || 1,
        price: Number(item.price) || 0,
        sku: String(item.id || item.sku || 'SKU'),
      })),
      package_weight: 500, // Default weight in grams
      package_length: 10,
      package_width: 10,
      package_height: 10,
    };

    const res = await fetch(`${API_URL}/shipments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (result.status) {
      return {
        success: true,
        shipmentId: result.data.shipment_id,
        trackingId: result.data.awb_number,
        courierName: result.data.courier_name,
      };
    } else {
      console.error('NimbusPost Create Shipment Error:', result.message);
      return { success: false, error: result.message || 'Shipment creation failed' };
    }
  } catch (error: any) {
    console.error('Shipping Action Error:', error);
    return { success: false, error: error.message };
  }
}
