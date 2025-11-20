import { FC, SVGProps } from "react";

export const CrossIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M4.75 4.75L19.25 19.25M19.25 4.75L4.75 19.25" />
  </svg>
);
