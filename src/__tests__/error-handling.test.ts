import { getErrorMessage } from "../utils";
import { BigNumber, ethers } from "ethers";

class CircRef {
  "val": null | CircRef;
}

describe("error-handling", () => {
  it("should handle error types", async () => {
    // Normal JS error
    const errorMessage: string = getErrorMessage(new Error("Error"));
    expect(errorMessage).toBe("Error");

    // Ethers errors
    const ethersErrorType = ethers.errors.INSUFFICIENT_FUNDS;
    const ethersError = ethers.logger.makeError("Insufficient funds to send transaction", ethersErrorType);
    const ethersErrorMessage: string = getErrorMessage(ethersError);
    expect(ethersErrorMessage).toContain(
      "Insufficient funds to send transaction (code=INSUFFICIENT_FUNDS, version=ethers/"
    );
  }),
    it("should handle primitive types", async () => {
      // Primitive Types
      const stringErrorMessage: string = getErrorMessage("string type");
      expect(stringErrorMessage).toBe('"string type"');

      const numberErrorMessage: string = getErrorMessage(1);
      expect(numberErrorMessage).toBe("1");

      // Ethers.js Types
      const bigNumErrorMessage: string = getErrorMessage(BigNumber.from(42));
      expect(bigNumErrorMessage).toBe('{"type":"BigNumber","hex":"0x2a"}');
    }),
    it("should handle circular reference gracefully", async () => {
      const ref2: CircRef = { val: null };
      const ref3: CircRef = { val: ref2 };
      ref2.val = ref3;
      ref3.val = ref2;

      const circRefErrorMessage: string = getErrorMessage(ref2);
      expect(circRefErrorMessage).toBe("[object Object]");
    });
});
