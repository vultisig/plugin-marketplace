import { Rate as DefaultRate, RateProps } from "antd";
import { FC } from "react";

import { StarIcon } from "@/icons/StarIcon";

export const Rate: FC<RateProps> = (props) => (
  <DefaultRate character={<StarIcon fill="currentColor" />} {...props} />
);
