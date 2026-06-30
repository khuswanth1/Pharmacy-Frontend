import axios from "axios";

// ─── API base URL ────────────────────────────────────────────────────────────
// All requests go through the API Gateway (port 8089) which routes:
//   /api/payments/** → Payment Service (port 8085)
// This matches Step 7 of the tutorial but uses the gateway instead of
// hitting port 8085 directly so JWT + CORS headers are handled centrally.
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8089";

// Helper: backend wraps all responses as { success, message, data }
// Unwrap to get the actual payload.
const unwrap = (res) => res?.data?.data ?? res?.data;

// Helper: attach JWT token if logged in
const authHeader = () => {
  const token = localStorage.getItem("pharmacy_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 7 — Create Razorpay payment order
//
// POST /api/payments/create-order
// Body    : { orderId: "101", amount: 49900 }   (amount in paise)
// Returns : { razorpayOrderId, keyId, amount, currency }
// ─────────────────────────────────────────────────────────────────────────────
export const createPaymentOrder = async ({ orderId, amount, paymentMethod }) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/payments/create-order`,
      { orderId: String(orderId), amount: Number(amount), paymentMethod },
      { headers: { "Content-Type": "application/json", ...authHeader() } }
    );
    // unwrap ApiResponse<PaymentOrderResponse>
    return unwrap(response);
  } catch (error) {
    const msg = error.response?.data?.message
              || error.response?.data?.error
              || error.message
              || "Failed to create payment order.";
    console.error("[paymentService] createPaymentOrder error:", msg);
    throw msg;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 9 — Verify Razorpay payment signature
//
// POST /api/payments/verify
// Body    : { razorpayOrderId, razorpayPaymentId, razorpaySignature }
// Returns : { status: "SUCCESS" | "FAILED" }
// ─────────────────────────────────────────────────────────────────────────────
export const verifyPayment = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/payments/verify`,
      { razorpayOrderId, razorpayPaymentId, razorpaySignature },
      { headers: { "Content-Type": "application/json", ...authHeader() } }
    );
    // unwrap ApiResponse<{ status: "SUCCESS" | "FAILED" }>
    return unwrap(response);
  } catch (error) {
    const msg = error.response?.data?.message
              || error.message
              || "Payment verification failed.";
    console.error("[paymentService] verifyPayment error:", msg);
    throw msg;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get all payment records (admin / debug)
// GET /api/payments
// ─────────────────────────────────────────────────────────────────────────────
export const getPayments = async () => {
  try {
    const response = await axios.get(
      `${API_BASE}/api/payments`,
      { headers: authHeader() }
    );
    return unwrap(response) || [];
  } catch (error) {
    console.error("[paymentService] getPayments error:", error.message);
    return [];
  }
};

// Get Payment by ID
// GET /api/payments/{id}
export const getPaymentById = async (id) => {
  try {
    const response = await axios.get(
      `${API_BASE}/api/payments/${id}`,
      { headers: authHeader() }
    );
    return unwrap(response);
  } catch (error) {
    console.error("[paymentService] getPaymentById error:", error.message);
    throw error.response?.data?.message || "Failed to fetch payment by ID.";
  }
};

// Get Payment by Order ID
// GET /api/payments/order/{orderId}
export const getPaymentByOrderId = async (orderId) => {
  try {
    const response = await axios.get(
      `${API_BASE}/api/payments/order/${orderId}`,
      { headers: authHeader() }
    );
    return unwrap(response);
  } catch (error) {
    console.error("[paymentService] getPaymentByOrderId error:", error.message);
    throw error.response?.data?.message || "Failed to fetch payment by Order ID.";
  }
};

// Update Payment Status
// PUT /api/payments/{id}/status?status={status}
export const updatePaymentStatus = async (id, status) => {
  try {
    const response = await axios.put(
      `${API_BASE}/api/payments/${id}/status`,
      null,
      {
        params: { status },
        headers: authHeader()
      }
    );
    return unwrap(response);
  } catch (error) {
    console.error("[paymentService] updatePaymentStatus error:", error.message);
    throw error.response?.data?.message || "Failed to update payment status.";
  }
};
