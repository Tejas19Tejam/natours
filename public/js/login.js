import axios from 'axios';
import { showAlert } from './alert.js';

// Login
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      console.log(res);
      showAlert('success', `Login Successful!`);
      window.setTimeout(() => {
        location.assign('/');
      }, 150);
    }
  } catch (err) {
    showAlert('error', `${err.response.data.message}`);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: `/api/v1/users/logout`,
    });
    // console.log(res);
    if (res.data.data.status === 'success') {
      showAlert('success', 'Log out successfully !');
      window.setTimeout(() => {
        location.assign('/');
      }, 150);
    }
  } catch (err) {
    showAlert('error', 'Error Occurred !');
    console.log(err);
  }
};

export const signup = async (name, email, password, confirmedPassword) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        confirmedPassword,
      },
    });

    if (res.data.status === 'success') {
      console.log(res);
      showAlert('success', `Account created Successful!`);
      window.setTimeout(() => {
        location.assign('/');
      }, 150);
    }
  } catch (err) {
    showAlert('error', `${err.response.data.message}`);
  }
};
