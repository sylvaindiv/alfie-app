// Utilitaire de validation pour les formulaires

/**
 * Valide une adresse email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone français
 * Formats acceptés: 0123456789, 01 23 45 67 89, 01.23.45.67.89, +33123456789
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone);
};

/**
 * Valide une URL de site web
 */
export const validateWebsite = (url: string): boolean => {
  const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  return urlRegex.test(url);
};

/**
 * Formatte un numéro de téléphone au format français
 * Ex: 0123456789 -> 01 23 45 67 89
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('33')) {
    // +33 ou 0033
    const withoutPrefix = cleaned.substring(2);
    return `+33 ${withoutPrefix.substring(0, 1)} ${withoutPrefix.substring(1, 3)} ${withoutPrefix.substring(3, 5)} ${withoutPrefix.substring(5, 7)} ${withoutPrefix.substring(7, 9)}`.trim();
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    // 0X XX XX XX XX
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
  }

  return phone; // Retourne tel quel si format non reconnu
};

/**
 * Assure qu'une URL commence par http:// ou https://
 */
export const ensureUrlProtocol = (url: string): string => {
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};
