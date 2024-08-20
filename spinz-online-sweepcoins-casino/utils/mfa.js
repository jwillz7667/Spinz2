const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate MFA secret
const generateMFASecret = async (user) => {
  const secret = speakeasy.generateSecret({
    name: `Spinz Online Casino (${user.email})`
  });
  
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
  
  return { secret: secret.base32, qrCodeUrl };
};

// Verify MFA token
const verifyMFAToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token
  });
};

module.exports = { generateMFASecret, verifyMFAToken };
