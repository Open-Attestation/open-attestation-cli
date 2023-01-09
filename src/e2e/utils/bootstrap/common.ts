import { EndStatus } from "../constants";
import { extractStatus } from "../shell";

export const checkFailure = (results: string, expectedErrorMessage: string) => { //}: Error | undefined => {
    const statusMessage = extractStatus(results, EndStatus.error);
    if(!(statusMessage.length > 0)) throw new Error(`!statusMessage.length > 0`);
    const errorMessage = statusMessage[0].lineContent.substring(13);
    if(!(errorMessage.includes(expectedErrorMessage))){throw new Error(`!errorMessage.includes(expectedErrorMessage)`)};
};