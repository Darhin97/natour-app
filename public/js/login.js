/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  console.log('loginjs log', { email, password });
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
      showAlert('success', 'Logged in successfully');

      //reload page
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }

    console.log('login, res', res);
  } catch (e) {
    showAlert('error', e.response.data.message);
    console.log(e.response.data);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });

    //reload page
    if (res.data.status === 'success') {
      window.location.assign('/');
    }
  } catch (e) {
    showAlert('error', 'Error logging out! try again.');
  }
};
