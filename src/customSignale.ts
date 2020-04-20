import { Signale, SignaleOptions } from "signale";

//this custom signale.error will not be disabled by signale.disable() as the disabled option is set to false by default
const options = {
  types: {
    error: {
      badge: "❌",
      label: "error"
    }
  }
};

export const customSignale = new Signale(options as SignaleOptions<"error">);
