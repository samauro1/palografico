/**
 * Utilitários para formatação e manipulação de telefones
 */

/**
 * Remove todos os caracteres não numéricos do telefone
 * @param phone - Telefone com ou sem formatação
 * @returns Telefone apenas com números
 */
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Formata o telefone para exibição visual (11) 99999-9999
 * @param phone - Telefone limpo (apenas números)
 * @returns Telefone formatado para exibição
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = cleanPhone(phone);
  
  if (cleaned.length === 11) {
    // Celular: (11) 99999-9999
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    // Fixo: (11) 9999-9999
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone; // Retorna original se não conseguir formatar
}

/**
 * Aplica máscara de entrada em tempo real
 * @param value - Valor atual do input
 * @returns Valor com máscara aplicada
 */
export function applyPhoneMask(value: string): string {
  const cleaned = cleanPhone(value);
  
  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 7) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  } else if (cleaned.length <= 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  
  // Limita a 11 dígitos
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}

/**
 * Valida se o telefone tem formato válido
 * @param phone - Telefone para validar
 * @returns true se o telefone é válido
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = cleanPhone(phone);
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Gera link do WhatsApp para o telefone
 * @param phone - Telefone limpo (apenas números)
 * @param message - Mensagem opcional
 * @returns Link do WhatsApp
 */
export function generateWhatsAppLink(phone: string, message?: string): string {
  const cleaned = cleanPhone(phone);
  const baseUrl = `https://wa.me/55${cleaned}`;
  
  if (message) {
    const encodedMessage = encodeURIComponent(message);
    return `${baseUrl}?text=${encodedMessage}`;
  }
  
  return baseUrl;
}

