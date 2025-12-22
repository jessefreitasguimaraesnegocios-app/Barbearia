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

// Normalizar texto para comparação
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

// Extrair texto de PDF usando PDF.js com fallback
const extractTextFromPDF = async (file: File, onProgress?: (message: string) => void): Promise<string> => {
  try {
    onProgress?.('Carregando processador de PDF...');
    
    // Importar PDF.js dinamicamente
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configurar worker usando múltiplas estratégias
    if (typeof window !== 'undefined') {
      // Tentar diferentes URLs de worker
      const workerUrls = [
        `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '5.4.449'}/build/pdf.worker.min.mjs`,
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '5.4.449'}/build/pdf.worker.min.mjs`,
        `https://unpkg.com/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs`,
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs`,
      ];
      
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrls[0];
      }
    }
    
    onProgress?.('Lendo PDF...');
    const arrayBuffer = await file.arrayBuffer();
    
    // Carregar PDF com opções que permitem continuar mesmo com erros
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
      verbosity: 0,
      stopAtErrors: false,
      maxImageSize: 1024 * 1024 * 10, // 10MB
    });
    
    const pdf = await loadingTask.promise;
    onProgress?.(`PDF carregado. Processando ${pdf.numPages} página(s)...`);
    
    let fullText = '';
    
    // Extrair texto de todas as páginas
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        onProgress?.(`Processando página ${pageNum} de ${pdf.numPages}...`);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extrair strings
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .filter((str: string) => str && str.trim().length > 0)
          .join(' ');
        
        if (pageText.trim().length > 0) {
          fullText += pageText + '\n';
        }
      } catch (pageError) {
        console.warn(`Erro ao processar página ${pageNum}:`, pageError);
        // Continua com outras páginas
      }
    }
    
    if (!fullText || fullText.trim().length === 0) {
      throw new Error('PDF não contém texto extraível. Pode ser uma imagem escaneada.');
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    
    // Mensagens de erro específicas
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('worker') || errorMsg.includes('fetch')) {
        throw new Error('Erro ao carregar processador PDF. Verifique sua conexão.');
      } else if (errorMsg.includes('invalid') || errorMsg.includes('corrupt')) {
        throw new Error('PDF inválido ou corrompido.');
      } else if (errorMsg.includes('password') || errorMsg.includes('senha')) {
        throw new Error('PDF protegido por senha. Remova a proteção.');
      }
      throw error;
    }
    
    throw new Error('Erro desconhecido ao processar PDF.');
  }
};

// Extrair texto de imagem usando Tesseract.js (OCR)
const extractTextFromImage = async (file: File, onProgress?: (message: string) => void): Promise<string> => {
  try {
    onProgress?.('Iniciando reconhecimento de texto (OCR)...');
    
    // Importar Tesseract.js dinamicamente
    const Tesseract = await import('tesseract.js');
    
    // Configurar worker para OCR
    const { data } = await Tesseract.recognize(file, 'por', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          onProgress?.(`Reconhecendo texto... ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    
    const extractedText = data.text;
    
    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error('Não foi possível extrair texto suficiente da imagem.');
    }
    
    return extractedText;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Não foi possível extrair')) {
        throw error;
      }
      throw new Error(`Erro no OCR: ${error.message}`);
    }
    
    throw new Error('Erro ao processar imagem.');
  }
};

// Melhorado: Extrair valores monetários de várias formas
const extractAmount = (text: string): number | null => {
  // Padrões mais abrangentes para diferentes formatos de comprovantes
  const patterns = [
    // Formato padrão: R$ 1.234,56 ou R$ 1234,56
    /r\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i,
    /r\$\s*(\d+,\d{2})/i,
    // Formato com ponto decimal: R$ 1234.56
    /r\$\s*(\d{1,3}(?:\.\d{3})*\.\d{2})/i,
    /r\$\s*(\d+\.\d{2})/i,
    // Sem símbolo R$, apenas número com vírgula
    /valor[:\s]+(\d{1,3}(?:\.\d{3})*,\d{2})/i,
    /valor[:\s]+(\d+,\d{2})/i,
    // Formato comum em comprovantes: "0,01" ou "0.01"
    /\b(\d{1,2}[,.]\d{2})\b/,
    // Valores maiores
    /(\d{1,3}(?:\.\d{3})*,\d{2})\s*reais?/i,
    /(\d{1,3}(?:\.\d{3})*\.\d{2})\s*reais?/i,
    // Padrão específico para PicPay: "R$ 0,01"
    /r\$\s*0[,.]0[1-9]\d?/i,
    /r\$\s*0[,.]\d{2}/i,
  ];

  const foundValues: Array<{ value: number; pattern: string }> = [];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(new RegExp(pattern, 'gi'))];
    for (const match of matches) {
      if (match[1]) {
        let valueStr = match[1]
          .replace(/\.(?=\d{3})/g, '') // Remove separador de milhar
          .replace(',', '.'); // Converte vírgula para ponto
        
        const value = parseFloat(valueStr);
        if (!isNaN(value) && value >= 0 && value <= 1000000) {
          foundValues.push({ value, pattern: pattern.toString() });
        }
      }
    }
  }

  // Se encontrou valores, retornar o mais provável (geralmente o primeiro)
  // Para valores muito pequenos (< 1), priorizar
  if (foundValues.length > 0) {
    const smallValues = foundValues.filter(v => v.value < 1);
    if (smallValues.length > 0) {
      return smallValues[0].value;
    }
    return foundValues[0].value;
  }

  return null;
};

// Validar nome do beneficiário com maior flexibilidade
const validateName = (receiptText: string, expectedName: string): boolean => {
  if (!expectedName || expectedName.trim() === '') {
    return true; // Sem nome para validar
  }

  const normalizedReceipt = normalizeText(receiptText);
  const normalizedName = normalizeText(expectedName);

  // Separar palavras significativas do nome
  const nameWords = normalizedName
    .split(/\s+/)
    .filter(word => 
      word.length > 2 && 
      !['de', 'da', 'do', 'dos', 'das', 'para', 'usuario', 'easy', 'pix', 'sao', 'instituicao', 'pagamento'].includes(word)
    );

  if (nameWords.length === 0) {
    return true; // Nome muito curto ou apenas palavras comuns
  }

  // Buscar palavras no comprovante
  const matchedWords = nameWords.filter(word => normalizedReceipt.includes(word));
  
  // Critério flexível: aceitar se pelo menos 40% das palavras forem encontradas
  // Para nomes curtos (1-2 palavras), exigir 100%
  // Para nomes médios (3-4 palavras), exigir 50%
  // Para nomes longos (5+ palavras), exigir 40%
  const minWords = nameWords.length <= 2 
    ? nameWords.length
    : nameWords.length <= 4
    ? Math.max(2, Math.ceil(nameWords.length * 0.5))
    : Math.max(2, Math.ceil(nameWords.length * 0.4));
  
  return matchedWords.length >= minWords;
};

// Validar ID da transação (se disponível)
const validateTransactionId = (receiptText: string, expectedTxId: string | undefined): boolean => {
  if (!expectedTxId || expectedTxId.trim() === '') {
    return true; // Opcional
  }

  // Normalizar IDs removendo caracteres especiais
  const normalizedReceipt = normalizeText(receiptText).replace(/[^a-z0-9]/g, '');
  const normalizedTxId = normalizeText(expectedTxId).replace(/[^a-z0-9]/g, '');

  // Buscar por parte do ID (últimos 8-12 caracteres)
  if (normalizedTxId.length >= 8) {
    const txIdSuffix = normalizedTxId.slice(-Math.min(12, normalizedTxId.length));
    return normalizedReceipt.includes(txIdSuffix);
  }

  return normalizedReceipt.includes(normalizedTxId);
};

// Função principal de validação
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
    
    // Extrair texto baseado no tipo de arquivo
    if (fileType === 'application/pdf') {
      onProgress?.('Processando PDF...');
      try {
        extractedText = await extractTextFromPDF(file, onProgress);
        onProgress?.('PDF processado. Validando dados...');
      } catch (pdfError) {
        const errorMsg = pdfError instanceof Error ? pdfError.message : 'Erro desconhecido';
        return {
          isValid: false,
          confidence: 0,
          matchedFields: [],
          errors: [`Erro ao processar PDF: ${errorMsg}`],
          extractedText: '',
        };
      }
    } else if (fileType.startsWith('image/')) {
      onProgress?.('Processando imagem...');
      try {
        extractedText = await extractTextFromImage(file, onProgress);
        onProgress?.('Imagem processada. Validando dados...');
      } catch (imageError) {
        const errorMsg = imageError instanceof Error ? imageError.message : 'Erro desconhecido';
        return {
          isValid: false,
          confidence: 0,
          matchedFields: [],
          errors: [`Erro ao processar imagem: ${errorMsg}. Certifique-se de que a imagem está nítida.`],
          extractedText: '',
        };
      }
    } else {
      return {
        isValid: false,
        confidence: 0,
        matchedFields: [],
        errors: ['Formato não suportado. Use PDF ou imagem (JPG, PNG, WEBP).'],
        extractedText: '',
      };
    }

    // Verificar se extraiu texto suficiente
    if (!extractedText || extractedText.trim().length < 10) {
      return {
        isValid: false,
        confidence: 0,
        matchedFields: [],
        errors: ['Não foi possível extrair texto suficiente. Verifique se o arquivo está legível.'],
        extractedText: '',
      };
    }

    onProgress?.('Validando dados do comprovante...');

    let validations = 0;
    let totalValidations = 0;

    // 1. Validar VALOR (obrigatório)
    totalValidations++;
    const extractedAmount = extractAmount(extractedText);
    const expectedAmount = parseFloat(pixData.amount.replace(',', '.'));
    
    if (extractedAmount !== null && Math.abs(extractedAmount - expectedAmount) < 0.01) {
      validations++;
      matchedFields.push('Valor');
    } else {
      const extractedStr = extractedAmount !== null 
        ? `R$ ${extractedAmount.toFixed(2).replace('.', ',')}` 
        : 'não encontrado';
      errors.push(`Valor não corresponde. Esperado: R$ ${pixData.amount}, Encontrado: ${extractedStr}`);
    }

    // 2. Validar NOME (quando disponível)
    if (pixData.name && pixData.name.trim() !== '') {
      totalValidations++;
      if (validateName(extractedText, pixData.name)) {
        validations++;
        matchedFields.push('Beneficiário');
      } else {
        errors.push(`Nome do beneficiário não encontrado. Esperado: ${pixData.name}`);
      }
    }

    // 3. Validar ID da transação (opcional, mas aumenta confiança)
    if (pixData.txId && pixData.txId.trim() !== '') {
      if (validateTransactionId(extractedText, pixData.txId)) {
        matchedFields.push('ID Transação');
        // Bônus na validação se ID corresponder
        if (matchedFields.includes('Valor')) {
          validations += 0.5;
          totalValidations += 0.5;
        }
      }
    }

    // Calcular confiança
    const confidence = totalValidations > 0 
      ? Math.round((validations / totalValidations) * 100)
      : 0;

    // Critérios de validação (mais flexíveis)
    const hasValue = matchedFields.includes('Valor');
    const hasName = matchedFields.includes('Beneficiário');
    const hasTxId = matchedFields.includes('ID Transação');
    
    // Válido se:
    // - Tem valor + nome OU
    // - Tem valor + ID transação OU  
    // - Tem apenas valor mas com confiança >= 50% (caso comum quando nome não aparece no comprovante)
    const isValid = 
      (hasValue && hasName) ||
      (hasValue && hasTxId) ||
      (hasValue && confidence >= 50);

    return {
      isValid,
      confidence,
      matchedFields,
      errors: isValid ? [] : errors.length > 0 ? errors : [
        `Validação falhou. Confiança: ${confidence}%. ` +
        `Campos encontrados: ${matchedFields.join(', ') || 'Nenhum'}.`
      ],
      extractedText: extractedText.substring(0, 500), // Limitar tamanho
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