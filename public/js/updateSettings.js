import axios from 'axios';
import { showAlert } from './alerts';

//type is either 'password' or 'data'
export const updateUserSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url: url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated`);
    }
  } catch (e) {
    showAlert('error', e.response.data.message);
    console.log(e.response.data);
  }
};
