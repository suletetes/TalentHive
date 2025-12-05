/**
 * Payment Debug Logger
 * Comprehensive logging for payment operations
 */

export class PaymentDebugLogger {
  private static prefix = '[PAYMENT_DEBUG]';

  static logReleaseStart(transactionId: string, user: any) {
    console.log('🔓 ' + this.prefix, 'Starting payment release');
    console.log('  Transaction ID:', transactionId);
    console.log('  User:', user?.email, 'Role:', user?.role);
    console.log('  Timestamp:', new Date().toISOString());
  }

  static logTransactionFound(transaction: any) {
    console.log('✅ ' + this.prefix, 'Transaction found');
    console.log('  ID:', transaction._id);
    console.log('  Status:', transaction.status);
    console.log('  Amount:', transaction.amount);
    console.log('  Freelancer Amount:', transaction.freelancerAmount);
    console.log('  Platform Commission:', transaction.platformCommission);
    console.log('  Currency:', transaction.currency);
    console.log('  Created:', transaction.createdAt);
  }

  static logTransactionNotFound(transactionId: string) {
    console.error('❌ ' + this.prefix, 'Transaction not found');
    console.error('  Transaction ID:', transactionId);
  }

  static logInvalidStatus(currentStatus: string, expectedStatus: string) {
    console.error('❌ ' + this.prefix, 'Invalid transaction status');
    console.error('  Current Status:', currentStatus);
    console.error('  Expected Status:', expectedStatus);
  }

  static logFreelancerInfo(freelancer: any) {
    console.log('💳 ' + this.prefix, 'Freelancer information');
    console.log('  ID:', freelancer._id);
    console.log('  Email:', freelancer.email);
    console.log('  Name:', freelancer.profile?.firstName, freelancer.profile?.lastName);
    console.log('  Has Stripe Account:', !!freelancer.stripeConnectedAccountId);
    console.log('  Stripe Account ID:', freelancer.stripeConnectedAccountId || 'Not connected');
  }

  static logStripeTransferStart(amount: number, currency: string, destination: string) {
    console.log('💸 ' + this.prefix, 'Creating Stripe transfer');
    console.log('  Amount (cents):', Math.round(amount * 100));
    console.log('  Amount (dollars):', amount);
    console.log('  Currency:', currency);
    console.log('  Destination:', destination);
  }

  static logStripeTransferSuccess(transferId: string) {
    console.log('✅ ' + this.prefix, 'Stripe transfer successful');
    console.log('  Transfer ID:', transferId);
  }

  static logStripeTransferSkipped() {
    console.log('⚠️ ' + this.prefix, 'Stripe transfer skipped - No connected account');
  }

  static logStripeTransferError(error: any) {
    console.error('❌ ' + this.prefix, 'Stripe transfer failed');
    console.error('  Error:', error.message);
    console.error('  Type:', error.type);
    console.error('  Code:', error.code);
    if (error.raw) {
      console.error('  Raw:', JSON.stringify(error.raw, null, 2));
    }
  }

  static logTransactionUpdate() {
    console.log('💾 ' + this.prefix, 'Updating transaction status to released');
  }

  static logTransactionUpdated() {
    console.log('✅ ' + this.prefix, 'Transaction updated successfully');
  }

  static logNotificationStart(freelancerId: string) {
    console.log('🔔 ' + this.prefix, 'Sending notification');
    console.log('  Freelancer ID:', freelancerId);
  }

  static logNotificationSuccess() {
    console.log('✅ ' + this.prefix, 'Notification sent successfully');
  }

  static logNotificationError(error: any) {
    console.error('❌ ' + this.prefix, 'Notification failed');
    console.error('  Error:', error.message);
  }

  static logEmailStart(email: string) {
    console.log('📧 ' + this.prefix, 'Sending email');
    console.log('  To:', email);
  }

  static logEmailSuccess() {
    console.log('✅ ' + this.prefix, 'Email sent successfully');
  }

  static logEmailError(error: any) {
    console.error('❌ ' + this.prefix, 'Email failed');
    console.error('  Error:', error.message);
  }

  static logReleaseComplete() {
    console.log('🎉 ' + this.prefix, 'Payment release completed successfully');
    console.log('  Timestamp:', new Date().toISOString());
  }

  static logReleaseError(error: any) {
    console.error('❌ ' + this.prefix, 'Payment release error');
    console.error('  Error:', error.message);
    console.error('  Stack:', error.stack);
  }

  // Payment Intent Logging
  static logPaymentIntentStart(contractId: string, milestoneId: string) {
    console.log('💳 ' + this.prefix, 'Creating payment intent');
    console.log('  Contract ID:', contractId);
    console.log('  Milestone ID:', milestoneId);
  }

  static logPaymentIntentCreated(paymentIntentId: string, amount: number) {
    console.log('✅ ' + this.prefix, 'Payment intent created');
    console.log('  Payment Intent ID:', paymentIntentId);
    console.log('  Amount:', amount);
  }

  // Payment Confirmation Logging
  static logConfirmPaymentStart(paymentIntentId: string) {
    console.log('✅ ' + this.prefix, 'Confirming payment');
    console.log('  Payment Intent ID:', paymentIntentId);
  }

  static logConfirmPaymentSuccess(transactionId: string) {
    console.log('✅ ' + this.prefix, 'Payment confirmed');
    console.log('  Transaction ID:', transactionId);
  }

  // Refund Logging
  static logRefundStart(transactionId: string, reason?: string) {
    console.log('💰 ' + this.prefix, 'Processing refund');
    console.log('  Transaction ID:', transactionId);
    console.log('  Reason:', reason || 'Not specified');
  }

  static logRefundSuccess(refundId: string) {
    console.log('✅ ' + this.prefix, 'Refund processed');
    console.log('  Refund ID:', refundId);
  }
}
