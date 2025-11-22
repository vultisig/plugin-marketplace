import { MessageInstance } from "antd/es/message/interface";
import { HookAPI } from "antd/es/modal/useModal";
import { createContext } from "react";

type AntdContextProps = {
  messageAPI: MessageInstance;
  modalAPI: HookAPI;
};

export const AntdContext = createContext<AntdContextProps | undefined>(
  undefined
);
