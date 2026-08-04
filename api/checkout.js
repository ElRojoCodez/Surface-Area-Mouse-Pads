// This file goes in: /api/checkout.js in your Vercel project
// Handles Stripe checkout session creation

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if API key exists
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('ERROR: STRIPE_SECRET_KEY is not set in environment variables');
    return res.status(500).json({ 
      error: 'Server configuration error: Stripe API key not set. Check Vercel environment variables.' 
    });
  }

  try {
    const { lineItems } = req.body;

    // Validate input
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'Invalid line items' });
    }

    // Create Stripe checkout session
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: lineItems.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
      },
      unit_amount: item.price,
    },
    quantity: item.quantity,
  })),
  mode: 'payment',
  success_url: `${process.env.DOMAIN}/success.html`,
  cancel_url: `${process.env.DOMAIN}/cancel.html`,
  
  shipping_address_collection: {
    allowed_countries: ['US'], 
  },
  collect_email: true,
});

    // Return the checkout URL
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error.message);
    res.status(500).json({ 
      error: error.message || 'Checkout failed' 
    });
  }
}
