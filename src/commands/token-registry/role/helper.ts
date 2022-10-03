import { constants } from "@govtechsg/token-registry";

export const rolesInput: Record<string, string> = {
  "default-admin": constants.roleHash.DefaultAdmin,
  minter: constants.roleHash.MinterRole,
  accepter: constants.roleHash.AccepterRole,
  restorer: constants.roleHash.RestorerRole,
  "minter-admin": constants.roleHash.MinterAdminRole,
  "accepter-admin": constants.roleHash.AccepterAdminRole,
  "restorer-admin": constants.roleHash.RestorerAdminRole,
};

export const getAllRolesInput = (): string[] => {
  return [...adminRolesInput, ...normalRolesInput];
};

export const adminRolesInput = ["default-admin", "minter-admin", "accepter-admin", "restorer-admin"];
export const normalRolesInput = ["minter", "accepter", "restorer"];

export const getRoleEnumValue = (roleNameInString: string): string => {
  if (!(roleNameInString in rolesInput)) {
    return rolesInput[roleNameInString];
  }
  throw new Error("Invalid Role");
};
