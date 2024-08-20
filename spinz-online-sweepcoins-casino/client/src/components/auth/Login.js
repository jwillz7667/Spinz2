import React, { useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { login } from '../../actions/auth';

const Login = ({ login, isAuthenticated }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { email, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    login(email, password);
  };

  if (isAuthenticated) {
    return <Redirect to="/games" />;
  }

  return (
    <div className="auth-form">
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
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
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Sign Up</Link>
      </p>
    </div>
  );
};

Login.propTypes = {
  login: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated
});

export default connect(mapStateToProps, { login })(Login);
import React, { useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { login, verifyMFA, verifyDevice } from '../../actions/auth';
import { setAlert } from '../../actions/alert';

const Login = ({ login, verifyMFA, verifyDevice, isAuthenticated, mfaRequired, deviceVerificationRequired, tempEmail, tempDeviceId }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mfaToken: '',
    deviceVerificationCode: ''
  });

  const { email, password, mfaToken, deviceVerificationCode } = formData;

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    if (mfaRequired) {
      verifyMFA(tempEmail, mfaToken);
    } else if (deviceVerificationRequired) {
      verifyDevice(tempEmail, tempDeviceId, deviceVerificationCode);
    } else {
      const deviceId = localStorage.getItem('deviceId') || Math.random().toString(36).substring(7);
      localStorage.setItem('deviceId', deviceId);
      login(email, password, deviceId);
    }
  };

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="login-form">
      <h1 className="large text-primary">Sign In</h1>
      <p className="lead">
        <i className="fas fa-user"></i> Sign Into Your Account
      </p>
      <form className="form" onSubmit={onSubmit}>
        {!mfaRequired && !deviceVerificationRequired && (
          <>
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
              />
            </div>
          </>
        )}
        {mfaRequired && (
          <div className="form-group">
            <input
              type="text"
              placeholder="MFA Token"
              name="mfaToken"
              value={mfaToken}
              onChange={onChange}
              required
            />
          </div>
        )}
        {deviceVerificationRequired && (
          <div className="form-group">
            <input
              type="text"
              placeholder="Device Verification Code"
              name="deviceVerificationCode"
              value={deviceVerificationCode}
              onChange={onChange}
              required
            />
          </div>
        )}
        <input type="submit" className="btn btn-primary" value="Login" />
      </form>
      <p className="my-1">
        Don't have an account? <Link to="/register">Sign Up</Link>
      </p>
    </div>
  );
};

Login.propTypes = {
  login: PropTypes.func.isRequired,
  verifyMFA: PropTypes.func.isRequired,
  verifyDevice: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
  mfaRequired: PropTypes.bool,
  deviceVerificationRequired: PropTypes.bool,
  tempEmail: PropTypes.string,
  tempDeviceId: PropTypes.string
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  mfaRequired: state.auth.mfaRequired,
  deviceVerificationRequired: state.auth.deviceVerificationRequired,
  tempEmail: state.auth.tempEmail,
  tempDeviceId: state.auth.tempDeviceId
});

export default connect(mapStateToProps, { login, verifyMFA, verifyDevice, setAlert })(Login);
