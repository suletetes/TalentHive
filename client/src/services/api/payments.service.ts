import { apiCore } from './core';

export interface Payment {
  _id: string;
  contract: string;
  milestone?: string;
  payer: string;
  payee: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ProcessPaymentDto {
  contractId: string;
  milestoneId?: string;
  amount: number;
  paymentMethodId: string;
}

export interface PayoutRequest {
  amount: number;
  bankAccountId: string;
}

export class PaymentsService {
  private basePath = '/payments';

  async processPayment(data: ProcessPaymentDto): Promise<{ data: Payment }> {
    return apiCore.post<{ data: Payment }>(this.basePath, data);
  }

  async getPaymentHistory(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: Payment[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiCore.get<{ data: Payment[]; pagination: any }>(
      `${this.basePath}/history?${queryParams.toString()}`
    );
  }

  async getEscrowBalance(): Promise<{ data: { balance: number; currency: string } }> {
    return apiCore.get<{ data: { balance: number; currency: string } }>(
      `${this.basePath}/escrow`
    );
  }

  async requestPayout(data: PayoutRequest): Promise<{ data: any }> {
    return apiCore.post<{ data: any }>(`${this.basePath}/payout`, data);
  }

  async getPaymentMethods(): Promise<{ data: any[] }> {
    return apiCore.get<{ data: any[] }>(`${this.basePath}/methods`);
  }

  async addPaymentMethod(data: { paymentMethodId: string }): Promise<{ data: any }> {
    return apiCore.post<{ data: any }>(`${this.basePath}/methods`, data);
  }

  async removePaymentMethod(methodId: string): Promise<{ message: string }> {
    return apiCore.delete<{ message: string }>(`${this.basePath}/methods/${methodId}`);
  }
}

export const paymentsService = new PaymentsService();
