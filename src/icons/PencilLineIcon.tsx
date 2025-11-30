import { FC, SVGProps } from "react";

export const PencilLineIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    fill="none"
    height="1em"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path d="M12.75 21.25H21.25M2.75 17V21.25H7L20.67 7.54001C21.451 6.75896 21.451 5.52106 20.67 4.74001L19.26 3.33001C18.479 2.54896 17.241 2.54904 16.46 3.33009L2.75 17Z" />
  </svg>
);
