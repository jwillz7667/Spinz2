import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { setAlert } from '../../actions/alert';
import { register } from '../../actions/auth';
import PropTypes from 'prop-types';
import ReCAPTCHA from "react-google-recaptcha";
import { GoogleLogin } from 'react-google-login';
import { FacebookLogin } from 'react-facebook-login';

const Register = ({ setAlert, register, isAuthenticated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: ''
  });

  const [captchaToken, setCaptchaToken] = useState('');

  const { name, email, password, password2 } = formData;

  useEffect(() => {
    // Pre-fill form if data is available from social login
    const socialData = localStorage.getItem('socialLoginData');
    if (socialData) {
      const parsedData = JSON.parse(socialData);
      setFormData(prevState => ({
        ...prevState,
        name: parsedData.name || '',
        email: parsedData.email || ''
      }));
      localStorage.removeItem('socialLoginData');
    }
  }, []);

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    if (password !== password2) {
      setAlert('Passwords do not match', 'danger');
    } else if (!captchaToken) {
      setAlert('Please complete the CAPTCHA', 'danger');
    } else {
      register({ name, email, password, captchaToken });
    }
  };

  const onCaptchaChange = (value) => {
    setCaptchaToken(value);
  };

  const onSocialLoginSuccess = (response) => {
    const { name, email } = response.profileObj;
    localStorage.setItem('socialLoginData', JSON.stringify({ name, email }));
    window.location.reload();
  };

  const onSocialLoginFailure = (error) => {
    console.error('Social login failed:', error);
    setAlert('Social login failed. Please try again.', 'danger');
  };

  if (isAuthenticated) {
    return <Redirect to="/games" />;
  }

  return (
    <div className="auth-form">
      <h2>Sign Up</h2>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Name"
            name="name"
            value={name}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email Address"
            name="email"
            value={email}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={password}
            onChange={onChange}
            minLength="6"
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Confirm Password"
            name="password2"
            value={password2}
            onChange={onChange}
            minLength="6"
            required
          />
        </div>
        <ReCAPTCHA
          sitekey="YOUR_RECAPTCHA_SITE_KEY"
          onChange={onCaptchaChange}
        />
        <button type="submit" className="btn btn-primary">Register</button>
      </form>
      <div className="social-login">
        <GoogleLogin
          clientId="YOUR_GOOGLE_CLIENT_ID"
          buttonText="Sign up with Google"
          onSuccess={onSocialLoginSuccess}
          onFailure={onSocialLoginFailure}
          cookiePolicy={'single_host_origin'}
        />
        <FacebookLogin
          appId="YOUR_FACEBOOK_APP_ID"
          autoLoad={false}
          fields="name,email,picture"
          callback={onSocialLoginSuccess}
          onFailure={onSocialLoginFailure}
          cssClass="facebook-button"
          textButton="Sign up with Facebook"
        />
      </div>
      <p>
        Already have an account? <Link to="/login">Sign In</Link>
      </p>
    </div>
  );
};

Register.propTypes = {
  setAlert: PropTypes.func.isRequired,
  register: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated
});

export default connect(mapStateToProps, { setAlert, register })(Register);
