import { createContext, useContext } from "react";
import type { AccountCache } from "../utils/accountCache";

export type AccountContextValue = {
  account: AccountCache | null;
  loading: boolean;
  refreshAccount: () => Promise<AccountCache | null>;
  mergeAccount: (patch: Partial<AccountCache>) => void;
  clearAccount: () => void;
};

export const AccountContext = createContext<AccountContextValue | null>(null);

export const useAccount = () => {
  const value = useContext(AccountContext);
  if (!value) {
    throw new Error("useAccount must be used inside AccountProvider");
  }

  return value;
};
