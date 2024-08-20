const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const crypto = require('crypto');
const config = require('config');

// PayPal SDK setup
let environment = new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
let paypalClient = new paypal.core.PayPalHttpClient(environment);

const processStripePayment = async (amount, currency, paymentMethodId, customerId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method: paymentMethodId,
      customer: customerId,
      confirm: true,
    });
    return paymentIntent;
  } catch (error) {
    throw new Error(`Stripe payment failed: ${error.message}`);
  }
};

const processPayPalPayment = async (amount, currency) => {
  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount
        }
      }]
    });

    const order = await paypalClient.execute(request);
    return order;
  } catch (error) {
    throw new Error(`PayPal payment failed: ${error.message}`);
  }
};

const processCryptoPayment = async (amount, currency, address) => {
  // This is a placeholder for cryptocurrency payment processing
  // In a real-world scenario, you would integrate with a cryptocurrency payment gateway
  console.log(`Processing crypto payment: ${amount} ${currency} to ${address}`);
  return {
    success: true,
    transactionId: crypto.randomBytes(16).toString('hex')
  };
};

module.exports = {
  processStripePayment,
  processPayPalPayment,
  processCryptoPayment
};
