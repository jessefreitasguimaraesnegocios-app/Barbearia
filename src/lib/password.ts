const normalizePassword = (value: string) => value.normalize("NFKC").trim();

const reverseString = (value: string) => value.split("").reverse().join("");

const base64Encode = (value: string) => {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(value);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf-8").toString("base64");
  }

  return value;
};

export const hashPassword = (raw: string) => {
  const normalized = normalizePassword(raw);
  const reversed = reverseString(normalized);
  return base64Encode(reversed);
};

export const verifyPassword = (raw: string, hashed: string) => {
  return hashPassword(raw) === hashed;
};


