const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const crypto = require('crypto');
const config = require('config');
const logger = require('../utils/logger');

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
    logger.info(`Stripe payment processed successfully: ${paymentIntent.id}`);
    return paymentIntent;
  } catch (error) {
    logger.error(`Stripe payment failed: ${error.message}`);
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
    logger.info(`PayPal order created successfully: ${order.result.id}`);
    return order;
  } catch (error) {
    logger.error(`PayPal payment failed: ${error.message}`);
    throw new Error(`PayPal payment failed: ${error.message}`);
  }
};

const processCryptoPayment = async (amount, currency, address) => {
  try {
    // This is a placeholder for cryptocurrency payment processing
    // In a real-world scenario, you would integrate with a cryptocurrency payment gateway
    logger.info(`Processing crypto payment: ${amount} ${currency} to ${address}`);
    const transactionId = crypto.randomBytes(16).toString('hex');
    return {
      success: true,
      transactionId: transactionId
    };
  } catch (error) {
    logger.error(`Crypto payment failed: ${error.message}`);
    throw new Error(`Crypto payment failed: ${error.message}`);
  }
};

const encryptPaymentData = (data) => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { iv: iv.toString('hex'), encryptedData: encrypted };
};

const decryptPaymentData = (encryptedData, iv) => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};

module.exports = {
  processStripePayment,
  processPayPalPayment,
  processCryptoPayment,
  encryptPaymentData,
  decryptPaymentData
};
