import { FC, HTMLAttributes, useEffect, useState } from "react";

import { useResizeObserver } from "@/hooks/useResizeObserver";
import { Stack, StackProps } from "@/toolkits/Stack";

type MiddleTruncateProps = StackProps &
  Omit<HTMLAttributes<HTMLElement>, "children"> & { children: string };

export const MiddleTruncate: FC<MiddleTruncateProps> = ({
  children: text,
  $style = {},
  ...rest
}) => {
  const [state, setState] = useState({
    counter: 0,
    ellipsis: "",
    truncating: true,
    wrapperWidth: 0,
  });
  const { counter, ellipsis, truncating, wrapperWidth } = state;
  const elmRef = useResizeObserver(({ width = 0 }) => {
    setState((prevState) => ({
      ...prevState,
      wrapperWidth: width,
      ellipsis: text,
      truncating: true,
    }));
  }, "width");

  useEffect(() => {
    if (elmRef.current) {
      const [child] = elmRef.current.children;
      const clientWidth = child?.clientWidth ?? 0;

      if (clientWidth > wrapperWidth) {
        const chunkLen = Math.ceil(text.length / 2) - counter;

        setState((prevState) => ({
          ...prevState,
          counter: counter + 1,
          ellipsis: `${text.slice(0, chunkLen)}...${text.slice(chunkLen * -1)}`,
        }));
      } else {
        setState((prevState) => ({
          ...prevState,
          counter: 0,
          truncating: false,
        }));
      }
    }
  }, [ellipsis, counter, elmRef, text, wrapperWidth]);

  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
      ellipsis: text,
      truncating: true,
    }));
  }, [text]);

  return (
    <Stack
      as="span"
      ref={elmRef}
      $style={{ ...$style, display: "block", position: "relative" }}
      {...rest}
    >
      {truncating ? (
        <Stack
          as="span"
          $style={{ position: "absolute", visibility: "hidden" }}
        >
          {ellipsis}
        </Stack>
      ) : (
        ellipsis
      )}
    </Stack>
  );
};
