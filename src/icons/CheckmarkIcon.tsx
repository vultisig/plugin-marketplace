import { FC, SVGProps } from "react";

export const CheckmarkIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M4.75 12.7768L10 19.25L19.25 4.75" />
  </svg>
);
