import { FC, SVGProps } from "react";

export const TranslateIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M3.75 5.81641H12.25" />
    <path d="M8 5.75V3.75" />
    <path d="M12 14.25C7.93498 13.1983 5.84489 10.6138 5.25 6" />
    <path d="M4 14C8.06352 12.9798 10.1538 10.4735 10.75 6" />
    <path d="M14.3438 17.1249H19.6562M21.25 19.2499L17.9355 10.4762C17.6098 9.61405 16.3902 9.61405 16.0645 10.4762L12.75 19.2499" />
  </svg>
);
