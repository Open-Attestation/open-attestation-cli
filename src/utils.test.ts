// import { TradeTrustERC721__factory } from "@govtechsg/token-registry/contracts";
// import { Wallet } from "ethers";

import { BigNumber, constants } from "ethers";
import { calculateMaxFee, convertWeiFiatDollars, scaleBigNumber, request, getSpotRate } from "./utils";

describe("utils", () => {
    describe("scaleBigNumber", () => {
        // scaleBigNumber(wei: BigNumber | null | undefined, multiplier: number, precision = 2): BigNumber
        it("should be able to scale multiplier > 1", () => {
            const results: BigNumber = scaleBigNumber(BigNumber.from(10), 1.3)
            expect(results.eq(BigNumber.from(13))).toBe(true);
        })
        it("should be able to scale multiplier < 1", () => {
            const results: BigNumber = scaleBigNumber(BigNumber.from(10), 0.5)
            expect(results.eq(BigNumber.from(5))).toBe(true);
        })
        it("should be able to scale multiplier < 0", () => {
            const results: BigNumber = scaleBigNumber(BigNumber.from(10), -0.5)
            expect(results.eq(BigNumber.from(-5))).toBe(true);
        })
    });

    describe("calculateMaxFee", () => {
        it("should return valid max fee", () => {
            const results: BigNumber = calculateMaxFee(BigNumber.from(20), BigNumber.from(10), 1.2)
            expect(results.eq(BigNumber.from(22))).toBe(true);
        })
    });
    
    describe("convertWeiFiatDollars", () => {
        const oneEther: BigNumber = constants.WeiPerEther;
        it("should convert with valid values",() => {
            const exchangeRate = 3000000;
            const results = convertWeiFiatDollars(oneEther, exchangeRate);
            expect(results).toBe(exchangeRate);
        })

        it("should convert with expected precision",() => {
            const exchangeRate = 0.123456;
            const results = convertWeiFiatDollars(oneEther, exchangeRate);
            expect(results).toBe(0.12346); // Rounded up from 0.12345
        })

        it("should truncate precision when exceeded",() => {
            const exchangeRate = 0.123456;
            const results = convertWeiFiatDollars(oneEther, exchangeRate, 6);
            expect(results).toBe(0.123456);
        })

    });
});
