const axios = require('axios');
const config = require('config');

const verifyCaptcha = async (token) => {
  try {
    const secretKey = config.get('recaptchaSecretKey');
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    const response = await axios.post(verifyUrl);
    const data = response.data;

    return data.success;
  } catch (error) {
    console.error('Error verifying CAPTCHA:', error);
    return false;
  }
};

module.exports = { verifyCaptcha };
