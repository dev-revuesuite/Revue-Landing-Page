// Razorpay Key ID (public key - safe to use in frontend)
const RAZORPAY_KEY_ID = 'rzp_test_SoqMlCOrbDbjLs';

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

// Open Razorpay checkout
function openCheckout(orderDetails, userEmail, planName, onSuccess, onFailure, onDismiss) {
    const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderDetails.amount,
        currency: orderDetails.currency,
        name: 'Revue',
        description: `${planName} - Early Access`,
        image: '/assets/logo-dark.webp',
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
