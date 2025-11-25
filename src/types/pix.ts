import { PixData } from '@/services/pixService';

export interface GeneratedPix {
  payload: string;
  data: PixData;
}

export enum PixPaymentState {
  FORM = 'FORM',
  PAYMENT = 'PAYMENT',
  SUCCESS = 'SUCCESS'
}

