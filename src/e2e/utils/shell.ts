import shell, { ShellString } from "shelljs";
import { log } from "signale";
import { EndStatus, verbose, silent as globalSilent, EndStatusType } from "./constants";
shell.config.silent = true;

export interface LineInfo {
  lineNumber: number;
  lineContent: string;
}

export const run = (command: string, silent = true): string => {
  silent = silent && globalSilent;
  const rawResults: ShellString = shell.exec(command);
  const results = stripAnsi(rawResults.trim());
  if (!silent) {
    const successLines = extractStatus(results, EndStatus.success);
    const failureLines = extractStatus(results, EndStatus.error);
    const statusLines = [...successLines, ...failureLines];
    log(command);
    printLines(statusLines);
    if (verbose && failureLines.length > 0) log(results);
  }
  return results;
};

export const extractStatus = (results: string, expectedStatus: EndStatusType, expectedMessage = ""): LineInfo[] => {
  const expectedString = `${expectedStatus}   ${expectedMessage}`;
  let lineInfo = extractLine(results, expectedString);
  if (!lineInfo) lineInfo = [];
  return lineInfo;
};

const printLines = (lines: LineInfo[]): void => {
  lines.sort((a: LineInfo, b: LineInfo): number => {
    return a.lineNumber - b.lineNumber;
  });
  for (const line of lines) {
    log(`${line.lineNumber}: ${line.lineContent}`);
  }
};

const extractLine = (result: string, query: string): LineInfo[] | void => {
  const splitResults = result.trim().split("\n");
  const matchedLines = [];
  for (let count = 0; count < splitResults.length; count++) {
    const line = splitResults[count].trim();
    const containsQueryString = line.includes(query);
    if (containsQueryString) {
      matchedLines.push({
        lineNumber: count,
        lineContent: line,
      });
    }
  }
  if (matchedLines.length > 0) return matchedLines;
  else return;
};

// https://github.com/chalk/strip-ansi/blob/main/index.js
const stripAnsi = (ansiString: string): string => {
  if (typeof ansiString !== "string") {
    const errorMessage = `Expected a \`string\`, got \`${typeof ansiString}\``;
    throw new TypeError(errorMessage);
  }
  return ansiString.replace(ansiRegex(), "");
};

// https://github.com/chalk/ansi-regex/blob/main/index.js
const ansiRegex = ({ onlyFirst = false } = {}): RegExp => {
  const pattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
  ].join("|");

  return new RegExp(pattern, onlyFirst ? undefined : "g");
};

// export { shell, ShellString };
