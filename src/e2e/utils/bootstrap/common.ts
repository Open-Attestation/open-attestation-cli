import { EndStatus } from "../constants";
import { extractStatus } from "../shell";

export const checkFailure = (results: string, expectedErrorMessage: string) => {
    const statusMessage = extractStatus(results, EndStatus.error);
    expect(statusMessage.length).toBeGreaterThan(0);
    const errorMessage = statusMessage[0].lineContent.substring(13);
    expect(errorMessage).toContain(expectedErrorMessage);
};