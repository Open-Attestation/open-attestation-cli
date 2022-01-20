import { getErrorMessage } from "../utils";
import { BigNumber, ethers } from "ethers";

class CircRef {
  "val": null | CircRef;
}

describe("error-handling", () => {
  it("should handle error types", async () => {
    // Normal JS error
    const errorMessage: string = await getErrorMessage(new Error("Error"));
    expect(errorMessage).toBe("Error");

    // Ethers errors
    const ethersErrorType = ethers.errors.INSUFFICIENT_FUNDS;
    const ethersError = ethers.logger.makeError("Insufficient funds to send transaction", ethersErrorType);
    const ethersErrorMessage: string = await getErrorMessage(ethersError);
    expect(ethersErrorMessage).toBe("Insufficient funds to send transaction");
  }),
    it("should handle primitive types", async () => {
      // Primitive Types
      const stringErrorMessage: string = await getErrorMessage("string type");
      expect(stringErrorMessage).toBe('"string type"');

      const numberErrorMessage: string = await getErrorMessage(1);
      expect(numberErrorMessage).toBe("1");

      // Ethers.js Types
      const bigNumErrorMessage: string = await getErrorMessage(BigNumber.from(42));
      expect(bigNumErrorMessage).toBe('{"type":"BigNumber","hex":"0x2a"}');
    }),
    it("should handle circular reference gracefully", async () => {
      const ref2: CircRef = { val: null };
      const ref3: CircRef = { val: ref2 };
      ref2.val = ref3;
      ref3.val = ref2;

      const circRefErrorMessage: string = await getErrorMessage(ref2);
      expect(circRefErrorMessage).toBe("[object Object]");
    });
});
