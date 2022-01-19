import { ethers } from "ethers";

export interface ErrorHandlerFunction {
  (error: any): Promise<string>;
}

export const getSolidityErrorHandler = function errorHandling(network: string): ErrorHandlerFunction {
  return async function (error: any): Promise<string> {
    const txParams = {
      to: error.tx.to,
      data: error.tx.data,
      blockTag: "latest",
    };
    let reason = error.message;
    const provider = ethers.getDefaultProvider(network);
    try {
      const code = await provider.call(txParams);
      reason = hex_to_ascii(code.substr(138));
    } finally {
      return reason;
    }
  };
};

function hex_to_ascii(str1: string): string {
  const hex = str1.toString();
  let str = "";
  for (let n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}
