import { acceptE2Esurrender } from "./accept-surrender.e2e";
import { surrenderE2EToken } from "./surrender.e2e";
import { changeE2EHolder } from "./change-holder.e2e";
import { deployE2EDocumentStore, deployE2ETokenRegistry } from "./deploy.e2e";
import { endorseE2ETransfer } from "./endorse-transfer.e2e";
import { mintE2EToken } from "./mint.e2e";
import { nominateE2E } from "./nominate.e2e";
import { rejectE2ESurrender } from "./reject-surrender.e2e";
import { endorseE2EChangeOwner as endorseE2EChangeOwner } from "./endorse-change-owner.e2e";

const awaitForDuration = async (runFunction: () => void): Promise<void> => {
  await runFunction();
  console.log(runFunction.name);
};

awaitForDuration(deployE2EDocumentStore);
awaitForDuration(deployE2ETokenRegistry);

awaitForDuration(mintE2EToken);

awaitForDuration(surrenderE2EToken);
awaitForDuration(rejectE2ESurrender);
awaitForDuration(acceptE2Esurrender);

awaitForDuration(nominateE2E);
awaitForDuration(changeE2EHolder);
awaitForDuration(endorseE2EChangeOwner);
awaitForDuration(endorseE2ETransfer);
