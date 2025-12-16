import { AntdProvider } from "@/providers/Antd";
import { CoreProvider } from "@/providers/Core";
import { QueryProvider } from "@/providers/Query";
import { StyledProvider } from "@/providers/Styled";
import { Routes } from "@/Routes";

export const App = () => (
  <QueryProvider>
    <CoreProvider>
      <StyledProvider>
        <AntdProvider>
          <Routes />
        </AntdProvider>
      </StyledProvider>
    </CoreProvider>
  </QueryProvider>
);
