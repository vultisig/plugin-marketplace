import { Collapse as DefaultCollapse, CollapseProps } from "antd";
import { FC } from "react";
import styled from "styled-components";

const StyledCollapse = styled(DefaultCollapse)`
  &.ant-collapse {
    .ant-collapse-item {
      .ant-collapse-header {
        align-items: center;
        padding: 0;

        .ant-collapse-header-text {
          font-size: 16px;
          font-weight: 500;
          line-height: 24px;
        }
      }

      .ant-collapse-content {
        .ant-collapse-content-box {
          color: ${({ theme }) => theme.textSecondary.toHex()};
          padding: 16px 0 0;
        }
      }
    }
  }
`;
export const Collapse: FC<CollapseProps> = (props) => (
  <StyledCollapse {...props} />
);
