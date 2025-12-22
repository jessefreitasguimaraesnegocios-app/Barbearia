import { PixData } from '@/services/pixService';

export type PaymentType = 'shop' | 'barbershop';

export interface GeneratedPix {
  payload: string;
  data: PixData;
  paymentType?: PaymentType; // Tipo de pagamento: 'shop' para loja, 'barbershop' para serviços
}

export enum PixPaymentState {
  FORM = 'FORM',
  PAYMENT = 'PAYMENT',
  SUCCESS = 'SUCCESS'
}

