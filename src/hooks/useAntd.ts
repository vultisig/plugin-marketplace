import { useContext } from "react";

import { AntdContext } from "@/context/Antd";

export const useAntd = () => {
  const context = useContext(AntdContext);

  if (!context) throw new Error("useAntd must be used within an AntdProvider");

  return context;
};
