import React from 'react';
import { CheckCircle2, RotateCw, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SuccessScreenProps {
  amount: string;
  onReset: () => void;
  paymentType?: 'shop' | 'barbershop';
}

export const SuccessScreen = ({ amount, onReset }: SuccessScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
        <CheckCircle2 className="w-24 h-24 text-green-500 relative z-10" />
      </div>
      
      <div>
        <h2 className="text-3xl font-bold mb-2">PIX Confirmado!</h2>
        <p className="text-muted-foreground max-w-xs mx-auto">
          O pagamento de <span className="font-bold">R$ {parseFloat(amount.replace(',', '.')).toFixed(2)}</span> foi confirmado com sucesso.
        </p>
      </div>

      <Card className="bg-green-50 border-green-100 w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-3 text-green-700 mb-2">
            <Receipt className="w-6 h-6" />
            <span className="font-semibold">Comprovante enviado</span>
          </div>
          <p className="text-green-600 text-sm">
            O lojista já recebeu a confirmação do seu pagamento.
          </p>
        </CardContent>
      </Card>

      <Button onClick={onReset} variant="outline" className="w-full">
        <RotateCw className="w-5 h-5 mr-2" />
        Gerar novo PIX
      </Button>
    </div>
  );
};

