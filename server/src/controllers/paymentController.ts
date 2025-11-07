import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { Payment, EscrowAccount, Transaction } from '@/models/Payment';
import { Contract } from '@/models/Contract';
import { User } from '@/models/User';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { stripe, STRIPE_CONFIG } from '@/config/stripe';
import { deleteCache } from '@/config/redis';

interface AuthRequest extends Request {
  user?: any;
}

export const createPaymentIntentValidation = [
  body('contractId').isMongoId().withMessage('Valid contract ID is required'),
  body('milestoneId').isMongoId().withMessage('Valid milestone ID is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be a positive number'),
];

export const createPaymentIntent = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400));
  }

  const { contractId, milestoneId, amount, paymentMethodId } = req.body;

  // Get contract and validate
  const contract = await Contract.findById(contractId)
    .populate('client')
    .populate('freelancer');

  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  // Check if user is the client
  if (contract.client._id.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the client can make payments', 403));
  }

  // Validate milestone
  const milestone = contract.milestones.id(milestoneId);
  if (!milestone) {
    return next(new AppError('Milestone not found', 404));
  }

  if (milestone.status !== 'approved') {
    return next(new AppError('Only approved milestones can be paid', 400));
  }

  // Check if payment already exists
  const existingPayment = await Payment.findOne({
    contract: contractId,
    milestone: milestoneId,
    status: { $in: ['pending', 'processing', 'completed'] },
  });

  if (existingPayment) {
    return next(new AppError('Payment already exists for this milestone', 400));
  }

  // Create payment record
  const payment = new Payment({
    contract: contractId,
    milestone: milestoneId,
    client: contract.client._id,
    freelancer: contract.freelancer._id,
    amount,
    type: 'milestone_payment',
    metadata: {
      description: `Payment for milestone: ${milestone.title}`,
    },
  });

  // Create Stripe payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: STRIPE_CONFIG.CURRENCY.toLowerCase(),
    payment_method: paymentMethodId,
    confirmation_method: 'manual',
    confirm: true,
    return_url: `${process.env.CLIENT_URL}/payments/return`,
    metadata: {
      paymentId: payment._id.toString(),
      contractId: contractId,
      milestoneId: milestoneId,
      type: 'milestone_payment',
    },
  });

  payment.stripePaymentIntentId = paymentIntent.id;
  payment.status = 'processing';
  await payment.save();

  // Update milestone status
  milestone.status = 'paid';
  milestone.paidAt = new Date();
  await contract.save();

  res.status(201).json({
    status: 'success',
    data: {
      payment,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret,
      },
    },
  });
});

export const confirmPayment = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { paymentIntentId } = req.params;

  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  // Retrieve payment intent from Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status === 'succeeded') {
    payment.status = 'completed';
    await payment.save();

    // Create transaction record
    await Transaction.create({
      payment: payment._id,
      type: 'charge',
      amount: payment.amount,
      currency: payment.currency,
      status: 'succeeded',
      stripeTransactionId: paymentIntent.id,
      description: `Milestone payment: ${payment.metadata.description}`,
      metadata: {
        paymentIntentId: paymentIntent.id,
      },
    });

    // Clear cache
    await deleteCache('payments:*');
    await deleteCache('contracts:*');
  } else if (paymentIntent.status === 'payment_failed') {
    payment.status = 'failed';
    await payment.save();
  }

  res.json({
    status: 'success',
    data: {
      payment,
      paymentIntent: {
        status: paymentIntent.status,
      },
    },
  });
});

export const getPaymentHistory = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10, status, type } = req.query;

  const query: any = {
    $or: [
      { client: req.user._id },
      { freelancer: req.user._id },
    ],
  };

  if (status) {
    query.status = status;
  }

  if (type) {
    query.type = type;
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('client', 'profile')
      .populate('freelancer', 'profile')
      .populate('contract', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    Payment.countDocuments(query),
  ]);

  res.json({
    status: 'success',
    data: {
      payments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const createEscrowAccount = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { accountType } = req.body;

  // Check if account already exists
  const existingAccount = await EscrowAccount.findOne({ user: req.user._id });
  if (existingAccount) {
    return next(new AppError('Escrow account already exists', 400));
  }

  // Create Stripe Connect account
  const stripeAccount = await stripe.accounts.create({
    type: 'express',
    country: 'US', // This should be dynamic based on user location
    email: req.user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    metadata: {
      userId: req.user._id.toString(),
      accountType,
    },
  });

  // Create escrow account record
  const escrowAccount = new EscrowAccount({
    user: req.user._id,
    stripeAccountId: stripeAccount.id,
    accountType,
    status: 'pending',
  });

  await escrowAccount.save();

  // Create account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccount.id,
    refresh_url: `${process.env.CLIENT_URL}/payments/setup/refresh`,
    return_url: `${process.env.CLIENT_URL}/payments/setup/return`,
    type: 'account_onboarding',
  });

  res.status(201).json({
    status: 'success',
    data: {
      escrowAccount,
      onboardingUrl: accountLink.url,
    },
  });
});

export const getEscrowAccount = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const escrowAccount = await EscrowAccount.findOne({ user: req.user._id });

  if (!escrowAccount) {
    return next(new AppError('Escrow account not found', 404));
  }

  // Get account details from Stripe
  const stripeAccount = await stripe.accounts.retrieve(escrowAccount.stripeAccountId);

  res.json({
    status: 'success',
    data: {
      escrowAccount,
      stripeAccount: {
        id: stripeAccount.id,
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted,
      },
    },
  });
});

export const addPayoutMethod = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { type, stripePaymentMethodId } = req.body;

  const escrowAccount = await EscrowAccount.findOne({ user: req.user._id });
  if (!escrowAccount) {
    return next(new AppError('Escrow account not found', 404));
  }

  // Get payment method details from Stripe
  const paymentMethod = await stripe.paymentMethods.retrieve(stripePaymentMethodId);

  let details: any = {};
  if (paymentMethod.type === 'us_bank_account') {
    details = {
      last4: paymentMethod.us_bank_account?.last4,
      bankName: paymentMethod.us_bank_account?.bank_name,
      accountType: paymentMethod.us_bank_account?.account_type,
    };
  } else if (paymentMethod.type === 'card') {
    details = {
      last4: paymentMethod.card?.last4,
      brand: paymentMethod.card?.brand,
    };
  }

  // Set all other methods as non-default if this is default
  if (req.body.isDefault) {
    escrowAccount.payoutMethods.forEach(method => {
      method.isDefault = false;
    });
  }

  const payoutMethod = {
    type,
    stripePaymentMethodId,
    isDefault: req.body.isDefault || escrowAccount.payoutMethods.length === 0,
    details,
    status: 'active',
  };

  escrowAccount.payoutMethods.push(payoutMethod as any);
  await escrowAccount.save();

  res.status(201).json({
    status: 'success',
    data: {
      payoutMethod: escrowAccount.payoutMethods[escrowAccount.payoutMethods.length - 1],
    },
  });
});

export const requestPayout = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { amount, payoutMethodId } = req.body;

  if (req.user.role !== 'freelancer') {
    return next(new AppError('Only freelancers can request payouts', 403));
  }

  const escrowAccount = await EscrowAccount.findOne({ user: req.user._id });
  if (!escrowAccount) {
    return next(new AppError('Escrow account not found', 404));
  }

  if (escrowAccount.balance < amount) {
    return next(new AppError('Insufficient balance', 400));
  }

  const payoutMethod = escrowAccount.payoutMethods.id(payoutMethodId);
  if (!payoutMethod) {
    return next(new AppError('Payout method not found', 404));
  }

  // Create Stripe transfer
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: escrowAccount.currency.toLowerCase(),
    destination: escrowAccount.stripeAccountId,
    metadata: {
      userId: req.user._id.toString(),
      payoutMethodId: payoutMethodId,
      type: 'freelancer_payout',
    },
  });

  // Create payment record
  const payment = new Payment({
    contract: null, // No specific contract for payouts
    milestone: null,
    client: null,
    freelancer: req.user._id,
    amount,
    type: 'withdrawal',
    status: 'processing',
    stripeTransferId: transfer.id,
    platformFee: 0, // No fee for withdrawals
    freelancerAmount: amount,
    metadata: {
      description: 'Freelancer payout',
    },
  });

  await payment.save();

  // Update escrow balance
  escrowAccount.balance -= amount;
  await escrowAccount.save();

  res.status(201).json({
    status: 'success',
    data: {
      payment,
      transfer: {
        id: transfer.id,
        amount: transfer.amount,
        status: transfer.status,
      },
    },
  });
});

export const releaseEscrowPayment = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId)
    .populate('contract')
    .populate('freelancer');

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  if (payment.status !== 'completed') {
    return next(new AppError('Payment must be completed before release', 400));
  }

  // Check if user is authorized (client or admin)
  const contract = payment.contract as any;
  const isAuthorized = req.user.role === 'admin' || 
                      contract.client.toString() === req.user._id.toString();

  if (!isAuthorized) {
    return next(new AppError('Not authorized to release this payment', 403));
  }

  // Get freelancer's escrow account
  const freelancerAccount = await EscrowAccount.findOne({ user: payment.freelancer });
  if (!freelancerAccount) {
    return next(new AppError('Freelancer escrow account not found', 404));
  }

  // Add to freelancer's balance
  freelancerAccount.balance += payment.freelancerAmount;
  await freelancerAccount.save();

  // Create transaction record
  await Transaction.create({
    payment: payment._id,
    type: 'transfer',
    amount: payment.freelancerAmount,
    currency: payment.currency,
    status: 'succeeded',
    stripeTransactionId: `escrow_release_${payment._id}`,
    description: `Escrow release for milestone payment`,
    metadata: {
      originalPaymentId: payment._id,
      freelancerAccountId: freelancerAccount._id,
    },
  });

  res.json({
    status: 'success',
    message: 'Payment released to freelancer',
    data: {
      payment,
      freelancerBalance: freelancerAccount.balance,
    },
  });
});

export const refundPayment = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { paymentId } = req.params;
  const { reason, amount } = req.body;

  const payment = await Payment.findById(paymentId).populate('contract');
  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  if (!payment.canBeRefunded()) {
    return next(new AppError('Payment cannot be refunded', 400));
  }

  const contract = payment.contract as any;
  const isAuthorized = req.user.role === 'admin' || 
                      contract.client.toString() === req.user._id.toString();

  if (!isAuthorized) {
    return next(new AppError('Not authorized to refund this payment', 403));
  }

  const refundAmount = amount || payment.amount;

  // Create Stripe refund
  const refund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentIntentId!,
    amount: Math.round(refundAmount * 100),
    reason: 'requested_by_customer',
    metadata: {
      originalPaymentId: payment._id.toString(),
      refundReason: reason,
    },
  });

  // Update payment status
  payment.status = 'refunded';
  payment.metadata.adminNotes = reason;
  await payment.save();

  // Create transaction record
  await Transaction.create({
    payment: payment._id,
    type: 'refund',
    amount: refundAmount,
    currency: payment.currency,
    status: 'succeeded',
    stripeTransactionId: refund.id,
    description: `Refund for milestone payment: ${reason}`,
    metadata: {
      refundId: refund.id,
      reason,
    },
  });

  res.json({
    status: 'success',
    message: 'Payment refunded successfully',
    data: {
      payment,
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
      },
    },
  });
});