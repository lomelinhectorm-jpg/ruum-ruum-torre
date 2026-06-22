import Stripe from 'stripe'

// Cliente de Stripe exclusivo del servidor. La llave secreta nunca debe
// importarse desde componentes que se ejecuten en el navegador.
const secretKey = process.env.STRIPE_SECRET_KEY

export function getStripeServerClient() {
  if (!secretKey) {
    throw new Error('Falta configurar STRIPE_SECRET_KEY en el servidor.')
  }
  return new Stripe(secretKey)
}
