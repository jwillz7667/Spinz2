const axios = require('axios');
const config = require('config');

const API_KEY = config.get('exchangeRateApiKey');
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

async function getExchangeRate(fromCurrency, toCurrency) {
  try {
    const response = await axios.get(`${BASE_URL}/${API_KEY}/pair/${fromCurrency}/${toCurrency}`);
    return response.data.conversion_rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw new Error('Unable to fetch exchange rate');
  }
}

async function convertCurrency(amount, fromCurrency, toCurrency) {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

module.exports = {
  getExchangeRate,
  convertCurrency
};
