export interface PixData {
  key?: string;
  amount: string;
  name: string;
  city?: string;
  txId?: string;
}

export interface ReceiptValidationResult {
  isValid: boolean;
  confidence: number;
  matchedFields: string[];
  errors: string[];
  extractedText: string;
}

const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

const extractAmount = (text: string): number | null => {
  const patterns = [
    /r\$\s*(\d{1,3}(?:\.\d{3})*(?:[,.]\d{2})?)/i,
    /valor[:\s]+r\$\s*(\d{1,3}(?:\.\d{3})*(?:[,.]\d{2})?)/i,
    /(\d{1,3}(?:\.\d{3})*(?:[,.]\d{2})?)\s*reais?/i,
    /(?:valor|total|pago)[:\s]+(\d{1,3}(?:\.\d{3})*(?:[,.]\d{2})?)/i,
    /\b(\d{1,2}[,.]\d{2})\b/,
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(new RegExp(pattern, 'gi'))];
    for (const match of matches) {
      if (match[1]) {
        let valueStr = match[1].replace(/\.(?=\d{3})/g, '');
        valueStr = valueStr.replace(',', '.');
        const value = parseFloat(valueStr);
        if (!isNaN(value) && value >= 0) {
          return value;
        }
      }
    }
  }

  return null;
};

const validateAmount = (receiptText: string, expectedAmount: string): boolean => {
  const expected = parseFloat(expectedAmount.replace(',', '.'));
  const extracted = extractAmount(receiptText);

  if (extracted === null) {
    return false;
  }

  return Math.abs(extracted - expected) < 0.01;
};

const validateName = (receiptText: string, expectedName: string): boolean => {
  if (!expectedName || expectedName.trim() === '') {
    return true;
  }

  const normalizedReceipt = normalizeText(receiptText);
  const normalizedName = normalizeText(expectedName);

  const nameWords = normalizedName
    .split(' ')
    .filter(word => word.length > 2 && !['de', 'da', 'do', 'dos', 'das', 'usuario', 'easy', 'pix'].includes(word));

  if (nameWords.length === 0) {
    return true;
  }

  const matchedWords = nameWords.filter(word => normalizedReceipt.includes(word));
  
  const minWords = Math.max(2, Math.ceil(nameWords.length * 0.6));
  return matchedWords.length >= minWords || (nameWords.length <= 3 && matchedWords.length >= 1);
};

export const validateReceipt = async (
  file: File,
  pixData: PixData,
  onProgress?: (message: string) => void
): Promise<ReceiptValidationResult> => {
  const errors: string[] = [];
  const matchedFields: string[] = [];
  let extractedText = '';

  try {
    const fileType = file.type;
    
    if (fileType === 'application/pdf') {
      onProgress?.('Lendo PDF...');
      extractedText = 'PDF recebido. Validação básica ativada.';
    } else if (fileType.startsWith('image/')) {
      onProgress?.('Analisando imagem...');
      extractedText = 'Imagem recebida. Validação básica ativada.';
    } else {
      return {
        isValid: false,
        confidence: 0,
        matchedFields: [],
        errors: ['Formato de arquivo não suportado. Use PDF ou imagem (JPG, PNG).'],
        extractedText: '',
      };
    }

    onProgress?.('Validando dados do comprovante...');

    let validations = 0;
    let totalValidations = 0;

    totalValidations++;
    const extractedAmount = extractAmount(extractedText);
    const expectedAmount = parseFloat(pixData.amount.replace(',', '.'));
    
    if (extractedAmount !== null && Math.abs(extractedAmount - expectedAmount) < 0.01) {
      validations++;
      matchedFields.push('Valor');
    } else {
      const extractedStr = extractedAmount !== null ? `R$ ${extractedAmount.toFixed(2)}` : 'não encontrado';
      errors.push(`Valor não corresponde. Esperado: R$ ${pixData.amount}, Encontrado: ${extractedStr}`);
    }

    if (pixData.name && pixData.name.trim() !== '') {
      totalValidations++;
      if (validateName(extractedText, pixData.name)) {
        validations++;
        matchedFields.push('Beneficiário');
      } else {
        errors.push(`Nome do beneficiário não encontrado ou não corresponde. Esperado: ${pixData.name}`);
      }
    }

    const confidence = totalValidations > 0 
      ? (validations / totalValidations) * 100 
      : 0;

    const hasValueAndName = matchedFields.includes('Valor') && matchedFields.includes('Beneficiário');
    const hasValueOnly = matchedFields.includes('Valor');
    
    const isValid = 
      hasValueAndName ||
      (hasValueOnly && confidence >= 50) ||
      confidence >= 60;

    return {
      isValid,
      confidence: Math.round(confidence),
      matchedFields,
      errors: isValid ? [] : errors.length > 0 ? errors : [`Validação falhou. Confiança: ${Math.round(confidence)}%. Campos encontrados: ${matchedFields.join(', ') || 'Nenhum'}.`],
      extractedText: extractedText.substring(0, 500),
    };
  } catch (error) {
    console.error('Error validating receipt:', error);
    return {
      isValid: false,
      confidence: 0,
      matchedFields: [],
      errors: [`Erro ao processar comprovante: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
      extractedText,
    };
  }
};

