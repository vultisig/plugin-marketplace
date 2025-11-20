import { FC, SVGProps } from "react";

export const MacbookIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M3.75 5.75C3.75 4.64543 4.64543 3.75 5.75 3.75H18.25C19.3546 3.75 20.25 4.64543 20.25 5.75V16.75H3.75V5.75Z" />
    <path d="M1.75 16.75H22.25V18.25C22.25 19.3546 21.3546 20.25 20.25 20.25H3.75C2.64543 20.25 1.75 19.3546 1.75 18.25V16.75Z" />
  </svg>
);
