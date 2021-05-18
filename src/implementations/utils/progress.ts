import { Signale } from "signale";

const interactive = new Signale({ interactive: true, scope: "" });

export const progress =
  (message: string) =>
  (progress: number): void => {
    if (process.env.DISABLE_PROGRESS_BAR) return;
    const stepInPercentage = 5; // one dot = 5%
    const numberOfSteps = 100 / stepInPercentage;
    const numberOfStepsDone = Math.floor((progress * 100) / stepInPercentage);
    const numberOfStepsLeft = numberOfSteps - numberOfStepsDone;
    interactive.await(
      `${message} [${"=".repeat(numberOfStepsDone)}${"-".repeat(numberOfStepsLeft)}] [%d/100%]`,
      (progress * 100).toFixed()
    );
  };
