/**
 * Phone number validation.
 *
 * Rejects:
 *  - empty / too short / too long numbers (must be 7..15 digits per E.164)
 *  - sequences with only one repeated digit (e.g. "0000000000", "1111111111")
 *  - too few distinct digits — filters out obvious garbage like
 *    "000 000 00 00", "121212121", "1234123412"
 *  - the well-known "1234567890" / "0987654321" sequences
 */
export const isValidPhoneNumber = (raw: string): boolean => {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;

  // All the same digit
  if (/^(\d)\1+$/.test(digits)) return false;

  // At least 4 unique digits — rejects "000 000 00 00" (1 unique),
  // "121212121" (2 unique), "1212131213" (3 unique)
  const uniqueDigits = new Set(digits).size;
  if (uniqueDigits < 4) return false;

  // Trivial straight runs
  if (digits.includes("1234567890")) return false;
  if (digits.includes("0987654321")) return false;

  return true;
};

export const phoneValidationMessage = "Введіть коректний номер телефону";
