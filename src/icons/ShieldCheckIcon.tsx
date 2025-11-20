import { FC, SVGProps } from "react";

export const ShieldCheckIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M8.75 12.0001L10.9167 14.2501L15.25 9.75007M3.75 13.0001V7.07412C3.75 6.27141 4.22993 5.54646 4.9689 5.23296L11.2189 2.58145C11.7181 2.36966 12.2819 2.36966 12.7811 2.58145L19.0311 5.23296C19.7701 5.54646 20.25 6.27141 20.25 7.07412V13.0001C20.25 17.5564 16.5563 21.2501 12 21.2501C7.44365 21.2501 3.75 17.5564 3.75 13.0001Z" />
  </svg>
);
