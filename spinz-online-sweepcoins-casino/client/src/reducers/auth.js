import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  ACCOUNT_DELETED,
  MFA_REQUIRED,
  DEVICE_VERIFICATION_REQUIRED
} from '../actions/types';

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: null,
  loading: true,
  user: null,
  mfaRequired: false,
  deviceVerificationRequired: false,
  tempEmail: null,
  tempDeviceId: null
};

export default function(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: payload
      };
    case REGISTER_SUCCESS:
    case LOGIN_SUCCESS:
      localStorage.setItem('token', payload.token);
      return {
        ...state,
        ...payload,
        isAuthenticated: true,
        loading: false,
        mfaRequired: false,
        deviceVerificationRequired: false
      };
    case MFA_REQUIRED:
      return {
        ...state,
        mfaRequired: true,
        tempEmail: payload.email
      };
    case DEVICE_VERIFICATION_REQUIRED:
      return {
        ...state,
        deviceVerificationRequired: true,
        tempEmail: payload.email,
        tempDeviceId: payload.deviceId
      };
    case REGISTER_FAIL:
    case AUTH_ERROR:
    case LOGIN_FAIL:
    case LOGOUT:
    case ACCOUNT_DELETED:
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        mfaRequired: false,
        deviceVerificationRequired: false,
        tempEmail: null,
        tempDeviceId: null
      };
    default:
      return state;
  }
}
