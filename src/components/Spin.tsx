import { Spin as DefaultSpin, SpinProps } from "antd";
import { FC } from "react";
import styled, { css } from "styled-components";

type Props = SpinProps & {
  centered?: boolean;
};

const StyledSpin = styled(DefaultSpin)<Props>`
  color: currentColor;

  ${({ centered }) =>
    centered &&
    css`
      align-items: center;
      display: flex;
      flex-grow: 1;
      justify-content: center;
    `}

  .ant-spin-dot-holder {
    color: currentColor;
  }
`;

export const Spin: FC<Props> = (props) => <StyledSpin {...props} />;
