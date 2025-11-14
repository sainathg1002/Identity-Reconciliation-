// Utility functions for input validation

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  // Accept phone numbers with digits, spaces, hyphens, and plus
  const phoneRegex = /^[+]?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.length >= 7;
};

export const validateIdentifyRequest = (
  email?: string,
  phoneNumber?: string
): { valid: boolean; error?: string } => {
  // At least one must be provided
  if (!email && !phoneNumber) {
    return {
      valid: false,
      error: "At least one of email or phoneNumber must be provided",
    };
  }

  // If email is provided, validate it
  if (email && !isValidEmail(email)) {
    return {
      valid: false,
      error: "Invalid email format",
    };
  }

  // If phone is provided, validate it
  if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
    return {
      valid: false,
      error: "Invalid phone number format",
    };
  }

  return { valid: true };
};
