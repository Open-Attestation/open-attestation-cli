import { BigNumber, ethers } from "ethers";
import fetch from "node-fetch";

export type GasStationFunction = (gasStationUrl: string) => () => Promise<GasStationFeeData | undefined>;
export type GasStationFeeData = { maxPriorityFeePerGas: BigNumber | null; maxFeePerGas: BigNumber | null };

export const gasStation: GasStationFunction =
  (gasStationUrl: string) => async (): Promise<GasStationFeeData | undefined> => {
    try {
      if (!gasStationUrl) return undefined;
      const res = await fetch(gasStationUrl);
      const data = await res.json();
      return {
        maxPriorityFeePerGas: safeParseUnits(data.standard.maxPriorityFee.toString(), 9),
        maxFeePerGas: safeParseUnits(data.standard.maxFee.toString(), 9),
      };
    } catch (e) {
      throw new Error("Failed to fetch gas station");
    }
  };

const safeParseUnits = (_value: number | string, decimals: number): BigNumber => {
  const value = String(_value);
  if (!value.match(/^[0-9.]+$/)) {
    throw new Error(`invalid gwei value: ${_value}`);
  }

  // Break into [ whole, fraction ]
  const comps = value.split(".");
  if (comps.length === 1) {
    comps.push("");
  }

  // More than 1 decimal point or too many fractional positions
  if (comps.length !== 2) {
    throw new Error(`invalid gwei value: ${_value}`);
  }

  // Pad the fraction to 9 decimal places
  while (comps[1].length < decimals) {
    comps[1] += "0";
  }

  // Too many decimals and some non-zero ending, take the ceiling
  if (comps[1].length > 9 && !comps[1].substring(9).match(/^0+$/)) {
    comps[1] = BigNumber.from(comps[1].substring(0, 9)).add(BigNumber.from(1)).toString();
  }

  return ethers.utils.parseUnits(`${comps[0]}.${comps[1]}`, decimals);
};
