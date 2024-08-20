const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('config');
const { check, validationResult } = require('express-validator');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../services/emailService');
const { auth, requireMFA } = require('../../middleware/auth');
const { generateMFASecret, verifyMFAToken } = require('../../utils/mfa');
const rateLimit = require('express-rate-limit');
const { verifyCaptcha } = require('../../utils/captcha');

const User = require('../../models/User');
const Role = require('../../models/Role');
const ActivityLog = require('../../models/ActivityLog');

// Apply stricter rate limiting to authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

// Apply auth limiter to sensitive routes
router.use(['/login', '/register', '/verify-mfa-login', '/verify-device'], authLimiter);

// @route   POST api/users/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('captchaToken', 'CAPTCHA token is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, captchaToken } = req.body;

    try {
      // Verify CAPTCHA
      const captchaVerified = await verifyCaptcha(captchaToken);
      if (!captchaVerified) {
        return res.status(400).json({ errors: [{ msg: 'CAPTCHA verification failed' }] });
      }

      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      const defaultRole = await Role.findOne({ name: 'Regular Player' });

      user = new User({
        name,
        email,
        password,
        roles: [defaultRole._id],
        verificationToken: crypto.randomBytes(20).toString('hex')
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Log the registration activity
      await new ActivityLog({
        user: user._id,
        action: 'REGISTER',
        details: { name: user.name, email: user.email }
      }).save();

      sendVerificationEmail(user.email, user.verificationToken);

      res.json({ msg: 'User registered successfully. Please check your email to verify your account.' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, deviceId } = req.body;

    try {
      let user = await User.findOne({ email }).populate('roles');

      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      if (!user.isVerified) {
        return res.status(400).json({ errors: [{ msg: 'Please verify your email before logging in' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      // Check if the device is new
      const existingDevice = user.devices.find(device => device.deviceId === deviceId);
      if (!existingDevice) {
        user.devices.push({ deviceId, lastLogin: new Date(), isVerified: false });
        await user.save();
        return res.status(403).json({ msg: 'New device detected. Please verify your device.' });
      }

      if (!existingDevice.isVerified) {
        return res.status(403).json({ msg: 'Please verify your device.' });
      }

      const payload = {
        user: {
          id: user.id,
          roles: user.roles.map(role => role.name)
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: '5h' },
        (err, token) => {
          if (err) throw err;
          res.json({ 
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              roles: user.roles.map(role => role.name),
              mfaEnabled: user.mfaEnabled
            }
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/users/verify-device
// @desc    Verify a new device
// @access  Private
router.post('/verify-device', auth, async (req, res) => {
  const { deviceId, verificationCode } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const device = user.devices.find(d => d.deviceId === deviceId);

    if (!device) {
      return res.status(400).json({ msg: 'Device not found' });
    }

    // Here you would typically verify the code sent via email or SMS
    // For this example, we'll just mark it as verified
    device.isVerified = true;
    await user.save();

    res.json({ msg: 'Device verified successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/enable-mfa
// @desc    Enable MFA for a user
// @access  Private
router.post('/enable-mfa', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { secret, qrCodeUrl } = await generateMFASecret(user);
    
    user.mfaSecret = secret;
    await user.save();

    res.json({ secret, qrCodeUrl });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/verify-mfa
// @desc    Verify MFA token and enable MFA
// @access  Private
router.post('/verify-mfa', auth, async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findById(req.user.id);
    
    if (!user.mfaSecret) {
      return res.status(400).json({ msg: 'MFA not set up' });
    }

    const isValid = verifyMFAToken(user.mfaSecret, token);

    if (isValid) {
      user.mfaEnabled = true;
      await user.save();
      res.json({ msg: 'MFA enabled successfully' });
    } else {
      res.status(400).json({ msg: 'Invalid MFA token' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/verify-mfa-login
// @desc    Verify MFA token during login
// @access  Public
router.post('/verify-mfa-login', async (req, res) => {
  const { email, token } = req.body;

  try {
    const user = await User.findOne({ email }).populate('roles');
    
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return res.status(400).json({ msg: 'Invalid request' });
    }

    const isValid = verifyMFAToken(user.mfaSecret, token);

    if (isValid) {
      const payload = {
        user: {
          id: user.id,
          roles: user.roles.map(role => role.name)
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: '5h' },
        (err, token) => {
          if (err) throw err;
          res.json({ 
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              roles: user.roles.map(role => role.name)
            }
          });
        }
      );
    } else {
      res.status(400).json({ msg: 'Invalid MFA token' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Keep the existing routes for email verification, password reset, etc.

module.exports = router;
