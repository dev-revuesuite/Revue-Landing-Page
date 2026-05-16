// Razorpay Key ID (public key - safe to use in frontend)
const RAZORPAY_KEY_ID = 'rzp_live_Spyq7p9lfreyLg';

// Load Razorpay script
function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.body.appendChild(script);
    });
}

// Razorpay checkout runs on https://api.razorpay.com — image must be absolute HTTPS (not localhost).
function getCheckoutImageUrl() {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'https://revuesuite.com/assets/logo-dark.webp';
    }
    return `${window.location.origin}/assets/logo-dark.webp`;
}

// Open Razorpay checkout
function openCheckout(orderDetails, userEmail, planName, onSuccess, onFailure, onDismiss) {
    const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderDetails.amount,
        currency: orderDetails.currency,
        name: 'Revue',
        description: `${planName} - Early Access`,
        image: getCheckoutImageUrl(),
        order_id: orderDetails.orderId,
        prefill: {
            email: userEmail
        },
        theme: {
            color: '#3399cc'
        },
        handler: function (response) {
            onSuccess(response);
        },
        modal: {
            ondismiss: function () {
                onDismiss();
            }
        }
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', function (response) {
        onFailure(response.error);
    });

    rzp.open();
}
