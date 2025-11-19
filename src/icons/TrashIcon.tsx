import { FC, SVGProps } from "react";

export const TrashIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M4.75 6.5L5.65512 19.3901C5.72868 20.4377 6.6 21.25 7.6502 21.25H16.3498C17.4 21.25 18.2713 20.4377 18.3449 19.3901L19.25 6.5" />
    <path d="M10 10.5V16.25" />
    <path d="M14 10.5V16.25" />
    <path d="M3.25 5.75H20.75" />
    <path d="M8.52539 5.58289C8.73158 3.84652 10.2089 2.5 12.0008 2.5C13.7927 2.5 15.27 3.84652 15.4762 5.58289" />
  </svg>
);
