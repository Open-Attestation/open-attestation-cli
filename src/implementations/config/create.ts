import { ethers } from "ethers";
import inquirer from "inquirer";
import path from "path";
import signale from "signale";
import { highlight } from "../../utils";
import fs from "fs";
import { CreateConfigFileCommand } from "../../commands/config/config.type";
import { progress as defaultProgress } from "../../implementations/utils/progress";
import fetch from "node-fetch";
import { create as createWallet } from "../wallet/create"

export const createConfig = async ({
  fund,
  outputFile,
}: CreateConfigFileCommand ): Promise<string> => {
    // return "hohoh";
    return createWallet({fund, outputFile});
};

