const retries = 10;
const usedTokenIds = new Set();
export const generateTokenId = (): string => {
  for (let count = 0; count < retries; count = count + 1) {
    const generatedTokenId = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    const unique = !usedTokenIds.has(generatedTokenId);
    if (unique) {
      usedTokenIds.add(generatedTokenId);
      return generatedTokenId;
    }
  }
  throw new Error("Unable to generate tokenIds");
};

export const isTokenId = (tokenId: string): boolean => {
  const hexRegex = /[0-9A-Fa-f]{64}/g;
  tokenId = tokenId.trim();
  const containsHexPrefix = tokenId.substring(0, 2) === "0x";
  if (containsHexPrefix) tokenId = tokenId.substring(2);
  if (tokenId.length <= 0) return false;
  const matchedString = tokenId.match(hexRegex);
  return matchedString?.length === 1;
};
