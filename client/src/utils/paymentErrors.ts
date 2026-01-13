/**
 * Payment-specific error handling utilities
 */

export interface PaymentError {
  code?: string;
  type?: string;
  message: string;
  decline_code?: string;
  param?: string;
}

/**
 * Map Stripe error codes to user-friendly messages
 */
export function getPaymentErrorMessage(error: any): string {
  // Handle Stripe-specific errors
  if (error.type === 'StripeCardError' || error.code) {
    const stripeCode = error.code || error.decline_code;
    
    switch (stripeCode) {
      case 'card_declined':
        return 'Your card was declined. Please try a different payment method or contact your bank.';
      case 'insufficient_funds':
        return 'Your card has insufficient funds. Please try a different payment method.';
      case 'expired_card':
        return 'Your card has expired. Please update your payment method.';
      case 'incorrect_cvc':
        return 'The security code (CVC) is incorrect. Please check and try again.';
      case 'incorrect_number':
        return 'The card number is incorrect. Please check and try again.';
      case 'invalid_expiry_month':
      case 'invalid_expiry_year':
        return 'The expiration date is invalid. Please check and try again.';
      case 'processing_error':
        return 'An error occurred while processing your payment. Please try again.';
      case 'authentication_required':
        return 'Your payment requires additional authentication. Please complete the verification.';
      case 'amount_too_large':
        return 'The payment amount is too large. Please contact support for assistance.';
      case 'amount_too_small':
        return 'The payment amount is too small. Please check the amount and try again.';
      case 'currency_not_supported':
        return 'This currency is not supported. Please contact support.';
      case 'duplicate_transaction':
        return 'This payment has already been processed.';
      case 'fraudulent':
        return 'This payment was declined for security reasons. Please contact your bank.';
      case 'generic_decline':
        return 'Your payment was declined. Please try a different payment method.';
      case 'invalid_account':
        return 'The payment account is invalid. Please contact support.';
      case 'lost_card':
      case 'stolen_card':
        return 'This card has been reported as lost or stolen. Please use a different payment method.';
      case 'merchant_blacklist':
        return 'Your payment was declined. Please contact support for assistance.';
      case 'new_account_information_available':
        return 'Please update your payment information and try again.';
      case 'no_action_taken':
        return 'No payment was processed. Please try again.';
      case 'not_permitted':
        return 'This type of payment is not permitted. Please try a different payment method.';
      case 'pickup_card':
        return 'Your card cannot be used for this payment. Please contact your bank.';
      case 'pin_try_exceeded':
        return 'Too many PIN attempts. Please contact your bank.';
      case 'restricted_card':
        return 'Your card has restrictions that prevent this payment. Please contact your bank.';
      case 'revocation_of_all_authorizations':
        return 'All authorizations have been revoked. Please contact your bank.';
      case 'revocation_of_authorization':
        return 'Authorization has been revoked. Please contact your bank.';
      case 'security_violation':
        return 'A security violation occurred. Please contact your bank.';
      case 'service_not_allowed':
        return 'This service is not allowed for your card. Please try a different payment method.';
      case 'stop_payment_order':
        return 'A stop payment order is in place. Please contact your bank.';
      case 'testmode_decline':
        return 'This is a test payment that was declined.';
      case 'transaction_not_allowed':
        return 'This transaction is not allowed. Please contact your bank.';
      case 'try_again_later':
        return 'Please try your payment again later.';
      case 'withdrawal_count_limit_exceeded':
        return 'You have exceeded the withdrawal limit. Please try again later.';
      default:
        return error.message || 'Payment failed. Please try again or contact support.';
    }
  }
  
  // Handle API errors
  if (error.response?.status) {
    switch (error.response.status) {
      case 400:
        return 'Invalid payment information. Please check your details and try again.';
      case 402:
        return 'Payment required. Please complete the payment to continue.';
      case 403:
        return 'Payment not authorized. Please contact support.';
      case 404:
        return 'Payment information not found. Please try again.';
      case 409:
        return 'Payment already processed. Please refresh the page.';
      case 429:
        return 'Too many payment attempts. Please wait a moment and try again.';
      case 500:
        return 'Payment service temporarily unavailable. Please try again later.';
      default:
        return 'Payment failed. Please try again or contact support.';
    }
  }
  
  // Handle network errors
  if (!error.response) {
    return 'Network error occurred. Please check your connection and try again.';
  }
  
  // Fallback
  return error.message || 'Payment failed. Please try again or contact support.';
}

/**
 * Check if error is a payment-related error
 */
export function isPaymentError(error: any): boolean {
  return error.type === 'StripeCardError' ||
         error.type === 'StripeInvalidRequestError' ||
         error.type === 'StripeAPIError' ||
         error.type === 'StripeConnectionError' ||
         error.type === 'StripeAuthenticationError' ||
         error.type === 'StripeRateLimitError' ||
         (error.response?.status >= 400 && error.response?.status < 500);
}

/**
 * Check if payment error is retryable
 */
export function isRetryablePaymentError(error: any): boolean {
  const retryableCodes = [
    'processing_error',
    'try_again_later',
    'service_not_allowed',
    'issuer_not_available',
    'reenter_transaction',
  ];
  
  const retryableStatuses = [429, 500, 502, 503, 504];
  
  return retryableCodes.includes(error.code) ||
         retryableStatuses.includes(error.response?.status) ||
         error.type === 'StripeConnectionError' ||
         error.type === 'StripeRateLimitError';
}

/**
 * Get suggested action for payment error
 */
export function getPaymentErrorAction(error: any): string {
  if (isRetryablePaymentError(error)) {
    return 'retry';
  }
  
  const cardUpdateCodes = [
    'expired_card',
    'incorrect_cvc',
    'incorrect_number',
    'invalid_expiry_month',
    'invalid_expiry_year',
  ];
  
  if (cardUpdateCodes.includes(error.code)) {
    return 'update_payment_method';
  }
  
  const contactBankCodes = [
    'card_declined',
    'insufficient_funds',
    'lost_card',
    'stolen_card',
    'restricted_card',
    'pickup_card',
  ];
  
  if (contactBankCodes.includes(error.code)) {
    return 'contact_bank';
  }
  
  return 'contact_support';
}

/**
 * Format payment error for display
 */
export function formatPaymentError(error: any): {
  message: string;
  action: string;
  severity: 'error' | 'warning' | 'info';
} {
  const message = getPaymentErrorMessage(error);
  const action = getPaymentErrorAction(error);
  
  let severity: 'error' | 'warning' | 'info' = 'error';
  
  if (isRetryablePaymentError(error)) {
    severity = 'warning';
  } else if (action === 'update_payment_method') {
    severity = 'info';
  }
  
  return { message, action, severity };
}