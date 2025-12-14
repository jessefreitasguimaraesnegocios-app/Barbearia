export interface PixData {
  key: string;
  amount: string;
  name: string;
  city: string;
  txId: string;
}

const calculateCRC16 = (payload: string): string => {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
  }

  crc &= 0xFFFF;
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

const formatField = (id: string, value: string): string => {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
};

const removeAccents = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const sanitizeText = (text: string, maxLength: number = 25): string => {
  const normalized = removeAccents(text);
  const clean = normalized.replace(/[^a-zA-Z0-9 ]/g, '');
  return clean.substring(0, maxLength);
};

const cleanPixKey = (key: string): string => {
    if (key.includes('@')) return key.trim();
    
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) {
        return key.trim();
    }

    return key.replace(/[^a-zA-Z0-9+]/g, '');
}

export const generatePixCode = (data: PixData): string => {
  const { key, amount, name, city, txId } = data;
  
  const cleanAmountStr = amount.replace(',', '.');
  const amountVal = parseFloat(cleanAmountStr);
  const formattedAmount = isNaN(amountVal) ? '0.00' : amountVal.toFixed(2);
  
  const cleanKey = cleanPixKey(key);

  const payloadFormat = formatField('00', '01');
  
  const gui = formatField('00', 'br.gov.bcb.pix');
  const pixKey = formatField('01', cleanKey);
  const merchantAccount = formatField('26', `${gui}${pixKey}`);
  
  const merchantCategory = formatField('52', '0000');
  
  const transactionCurrency = formatField('53', '986');
  
  const transactionAmount = formatField('54', formattedAmount);
  
  const countryCode = formatField('58', 'BR');
  
  const merchantName = formatField('59', sanitizeText(name || 'Nao Informado', 25));
  
  const merchantCity = formatField('60', sanitizeText(city || 'Brasilia', 15));
  
  let cleanTxId = (txId || '***').replace(/[^a-zA-Z0-9]/g, '');
  if (!cleanTxId) cleanTxId = '***';
  
  const additionalDataContent = formatField('05', cleanTxId);
  const additionalData = formatField('62', additionalDataContent);
  
  let rawPayload = `${payloadFormat}${merchantAccount}${merchantCategory}${transactionCurrency}${transactionAmount}${countryCode}${merchantName}${merchantCity}${additionalData}6304`;
  
  const crc = calculateCRC16(rawPayload);
  
  return `${rawPayload}${crc}`;
};

