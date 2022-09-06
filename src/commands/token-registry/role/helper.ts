import { constants } from "@govtechsg/token-registry";

export const rolesInput = [
  ["default-admin", constants.roleHash.DefaultAdmin],
  ["minter", constants.roleHash.MinterRole],
  ["accepter", constants.roleHash.AccepterRole],
  ["restorer", constants.roleHash.RestorerRole],
  ["minter-admin", constants.roleHash.MinterAdminRole],
  ["accepter-admin", constants.roleHash.AccepterAdminRole],
  ["restorer-admin", constants.roleHash.RestorerAdminRole],
];

export const getAllRolesInput = (): string[] => {
  return [...adminRolesInput, ...normalRolesInput];
};

export const adminRolesInput = ["default-admin", "minter-admin", "accepter-admin", "restorer-admin"];
export const normalRolesInput = ["minter", "accepter", "restorer"];

export const getRoleEnumValue = (roleNameInString: string): string => {
  for (const roleIndex in rolesInput) {
    if (rolesInput[roleIndex][0] === roleNameInString) {
      return rolesInput[roleIndex][1];
    }
  }
  throw new Error("Invalid Role");
};
