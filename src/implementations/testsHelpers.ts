import { BaseContract, BigNumber, constants, providers } from "ethers";

export const AddressZero = constants.AddressZero;
export const BurnAddress = "0x000000000000000000000000000000000000dEaD";
export const EmptyTokenID = "0x0000000000000000000000000000000000000000000000000000000000000000";
type defaultMockType = jest.Mock<any, any>;
type SmartContractDataTypes = BigNumber | number | boolean | string; // bytes and unused not included
type EthersResponseType = SmartContractDataTypes | Error;

export const mockResolve = (value?: EthersResponseType): defaultMockType => {
  const fn = jest.fn();
  if (value instanceof Error) {
    fn.mockRejectedValue(value);
  } else {
    fn.mockResolvedValue(value);
  }
  return fn;
};

export const mockReturn = (value?: EthersResponseType): defaultMockType => {
  const fn = jest.fn();
  if (value instanceof Error) {
    fn.mockImplementation(() => {
      throw value;
    });
  } else {
    fn.mockRejectedValue(value);
  }
  return fn;
};

export const getMockCode = (): defaultMockType => {
  const fn = jest.fn();
  fn.mockResolvedValue(true);
  return fn;
};

export interface ValidContractMockParameters {
  supportInterfaceValue?: boolean | Error;
}

interface MockContractInterface {
  supportInterface: jest.Mock;
  callStatic: {
    supportInterface: jest.Mock;
  };
}

export const getMockContract = ({
  supportInterfaceValue = true,
}: ValidContractMockParameters): MockContractInterface => {
  const supportInterface = mockResolve(supportInterfaceValue);
  return {
    supportInterface,
    callStatic: {
      supportInterface,
    },
  };
};

export interface TokenRegistryMockParameters extends ValidContractMockParameters {
  ownerOfValue?: string | Error;
  address?: string;
  titleEscrowFactoryAddress?: string;
}

interface MockTokenRegistryInterface {
  ownerOf: jest.Mock;
  genesis: jest.Mock;
  titleEscrowFactory: jest.Mock;
  supportInterfaces: jest.Mock;
  callStatic: {
    ownerOf: jest.Mock;
    genesis: jest.Mock;
    titleEscrowFactory: jest.Mock;
    supportInterfaces: jest.Mock;
  };
}

export const getMockTokenRegistry = ({
  ownerOfValue = AddressZero,
  supportInterfaceValue = true,
  address = AddressZero,
  titleEscrowFactoryAddress = AddressZero,
}: TokenRegistryMockParameters): MockTokenRegistryInterface => {
  const validContract = getMockContract({ supportInterfaceValue });
  const ownerOf = mockResolve(ownerOfValue);
  const genesis = mockResolve(BigNumber.from(0));
  const titleEscrowFactory = mockResolve(titleEscrowFactoryAddress);
  const contractFunctions = {
    ownerOf,
    genesis,
    titleEscrowFactory,
  };
  const mockTokenRegistry = {
    ...contractFunctions,
    address: address,
    callStatic: contractFunctions,
  };
  return mergeMockSmartContract({ base: validContract, override: mockTokenRegistry });
};

export interface TokenRegistryMockParameters extends ValidContractMockParameters {
  getAddressValue?: string | Error;
}

interface MockTitleEscrowFactoryInterface {
  getAddress: jest.Mock;
  supportInterfaces: jest.Mock;
  callStatic: {
    getAddress: jest.Mock;
    supportInterfaces: jest.Mock;
  };
}

export const getMockTitleEscrowFactory = ({
  getAddressValue = AddressZero,
  supportInterfaceValue = true,
}: TokenRegistryMockParameters): MockTitleEscrowFactoryInterface => {
  const validContract = getMockContract({ supportInterfaceValue });
  const getAddress = mockResolve(getAddressValue);
  const contractFunctions = {
    getAddress,
  };
  const mockTokenRegistry = {
    ...contractFunctions,
    callStatic: contractFunctions,
  };
  return mergeMockSmartContract({ base: validContract, override: mockTokenRegistry });
};

export interface TitleEscrowMockParameters extends ValidContractMockParameters {
  beneficiaryValue?: string | Error;
  holderValue?: string | Error;
  nomineeValue?: string | Error;
  activeValue?: boolean | Error;
}

interface MockTitleEscrowInterface {
  active: jest.Mock;
  beneficiary: jest.Mock;
  holder: jest.Mock;
  nominee: jest.Mock;
  supportInterfaces: jest.Mock;
  callStatic: {
    active: jest.Mock;
    beneficiary: jest.Mock;
    holder: jest.Mock;
    nominee: jest.Mock;
    supportInterfaces: jest.Mock;
  };
}

export const getMockTitleEscrow = ({
  beneficiaryValue = AddressZero,
  holderValue = AddressZero,
  nomineeValue = AddressZero,
  activeValue = true,
  supportInterfaceValue = true,
}: TitleEscrowMockParameters): MockTitleEscrowInterface => {
  const validContract = getMockContract({ supportInterfaceValue });
  const active = mockResolve(activeValue);
  const beneficiary = mockResolve(beneficiaryValue);
  const holder = mockResolve(holderValue);
  const nominee = mockResolve(nomineeValue);
  const contractFunctions = {
    active,
    beneficiary,
    holder,
    nominee,
  };
  const mockTitleEscrow = {
    ...contractFunctions,
    callStatic: contractFunctions,
  };
  return mergeMockSmartContract({ base: validContract, override: mockTitleEscrow });
};

export const initMockGetCode = (fn?: jest.Mock): void => {
  if (!fn) {
    const fn = jest.fn();
    fn.mockResolvedValue(`0x`);
  }
  jest.spyOn(providers.BaseProvider.prototype, "getCode").mockImplementation(fn);
};
export interface WalletMockParameters {
  codeValue?: string | Error;
}

export const getValidWalletContract = ({
  codeValue = `0x`,
}: WalletMockParameters): { provider: { getCode: jest.Mock } } => {
  const getCode = mockResolve(codeValue);
  return {
    provider: {
      getCode,
    },
  };
};

export interface MergeObjectParameters {
  base: any;
  override: any;
}

export const mergeMockSmartContract = ({ base, override }: MergeObjectParameters): any => {
  override = mergeMockBaseContract(base, override, "functions");
  override = mergeMockBaseContract(base, override, "callStatic");
  override = mergeMockBaseContract(base, override, "estimateGas");
  override = mergeMockBaseContract(base, override, "populateTransaction");
  override = mergeMockBaseContract(base, override, "filters");
  override = mergeMockBaseContract(base, override, "_runningEvents");
  override = mergeMockBaseContract(base, override, "_wrappedEmits");
  return {
    ...base,
    ...override,
  };
};

const mergeMockBaseContract = <key extends keyof BaseContract>(base: any, override: any, keyName: key): any => {
  if (keyName in override && keyName in base) {
    if (typeof base[keyName] === "object" && typeof override[keyName] === "object") {
      override[keyName] = {
        ...base[keyName],
        ...override[keyName],
      };
    }
  }
  return override;
};
