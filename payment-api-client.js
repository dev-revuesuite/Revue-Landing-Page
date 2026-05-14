// API Base URL - Update this with your deployed backend URL
const API_BASE_URL = 'https://revuesuite.com'; // Production backend URL

// Create order
async function createOrder(plan, email) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ plan, email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to create order');
        }

        return data.data;
    } catch (error) {
        throw error;
    }
}

// Verify payment
async function verifyPayment(paymentData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/payment/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Payment verification failed');
        }

        return data;
    } catch (error) {
        throw error;
    }
}
