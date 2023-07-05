import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  try {
    const stripe = Stripe(
      'pk_test_51NPK87SEy00QzfQlZbKvXgHEQtmQWCqkojn82LYLYC5NvC4mPNE4HjUUQ6MwnTl998pWK2uwC468eon9gq8wjVyQ00B0DC7cRC'
    );
    // 1. ) Get checkout session from the API
    const session = await axios({
      method: 'GET',
      url: `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`,
    });

    console.log(session);
    // 2 .) Create checkout form and + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert(err);
  }
};
