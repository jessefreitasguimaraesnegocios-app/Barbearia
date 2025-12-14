import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ArrowLeft, AlertCircle, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { GeneratedPix } from '@/types/pix';
import { validateReceipt } from '@/services/receiptValidationService';

interface PaymentScreenProps {
  data: GeneratedPix;
  onConfirm: () => void;
  onBack: () => void;
}

export const PaymentScreen = ({ data, onConfirm, onBack }: PaymentScreenProps) => {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(data.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copiado!",
      description: "Código PIX copiado para a área de transferência.",
    });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingProgress('Processando comprovante...');

    try {
      const validation = await validateReceipt(file, data.data, (message) => {
        setProcessingProgress(message);
      });

      if (validation.isValid) {
        setProcessingProgress('Comprovante validado com sucesso!');
        toast({
          title: "Comprovante validado!",
          description: "Pagamento confirmado com sucesso.",
        });
        setTimeout(() => {
          onConfirm();
        }, 1000);
      } else {
        setProcessingProgress('');
        setErrorMessage(
          validation.errors.length > 0
            ? validation.errors.join(' ')
            : `Validação falhou. Confiança: ${validation.confidence}%. Campos encontrados: ${validation.matchedFields.join(', ') || 'Nenhum'}`
        );
        setIsProcessing(false);
        toast({
          variant: "destructive",
          title: "Validação falhou",
          description: "O comprovante não pôde ser validado. Verifique se a imagem está nítida e tente novamente.",
        });
      }
    } catch (error) {
      console.error('Error validating receipt:', error);
      setProcessingProgress('');
      setErrorMessage('Erro ao processar comprovante. Tente novamente com uma imagem mais nítida.');
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível processar o comprovante. Tente novamente.",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <div className="w-full flex justify-start">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar e editar
        </Button>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-1">Pague com PIX</h2>
        <p className="text-muted-foreground text-sm">Abra o app do seu banco e escaneie o código.</p>
      </div>

      <Card className="p-4 border-2 border-primary/20 !bg-white dark:!bg-white">
        <CardContent className="p-0 flex justify-center !bg-white dark:!bg-white">
          <div className="!bg-white dark:!bg-white">
            <QRCodeSVG 
              value={data.payload} 
              size={220} 
              level="M"
              imageSettings={{
                src: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo%E2%80%94pix_powered_by_Banco_Central_%28Brazil%2C_2020%29.svg",
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="pt-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Valor a pagar</span>
            <span className="font-bold text-lg">R$ {parseFloat(data.data.amount.replace(',', '.')).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Beneficiário</span>
            <span className="font-medium text-sm truncate max-w-[150px]">{data.data.name || 'Não informado'}</span>
          </div>
        </CardContent>
      </Card>

      <div className="w-full space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Pix Copia e Cola
        </label>
        <div className="flex items-center gap-2">
          <Input 
            type="text" 
            readOnly 
            value={data.payload} 
            className="flex-1 text-xs font-mono"
          />
          
          <Button 
            variant={copied ? "default" : "outline"}
            size="icon"
            onClick={handleCopy}
            className={copied ? "bg-green-500 hover:bg-green-600" : ""}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </Button>
        </div>
        {copied && <p className="text-green-600 text-xs text-center animate-pulse">Código copiado!</p>}
      </div>

      <div className="w-full space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <Button 
          onClick={handleButtonClick} 
          disabled={isProcessing}
          className="w-full"
          variant="hero"
        >
          {isProcessing ? (
            <>
              <Upload className="w-5 h-5 mr-2 animate-pulse" />
              {processingProgress || 'Processando...'}
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2" />
              Já paguei, enviar comprovante
            </>
          )}
        </Button>

        {selectedFile && !isProcessing && (
          <p className="text-center text-xs text-muted-foreground">
            Arquivo selecionado: {selectedFile.name}
          </p>
        )}
        
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-destructive font-semibold mb-1">Validação falhou</p>
              <p className="text-destructive/80 text-xs">{errorMessage}</p>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Envie uma foto ou PDF do comprovante de pagamento PIX
        </p>
      </div>
    </div>
  );
};

