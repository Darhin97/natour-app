/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51OtTcdG6UYdWX5atf1fTUhpoE11g3V7FSyTdKg5VLm5glFYR8KvpJ1mnQGduAaqBcNKCJTmjIyKKURuvsyDGUbAz001FKevpGV',
  );
  try {
    // 1 Get get checkout session from api
    const session = await axios(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`,
    );
    console.log(session);

    // 2 create checkout form + charge card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
