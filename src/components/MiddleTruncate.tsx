import {
  FC,
  HTMLAttributes,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useResizeObserver } from "@/hooks/useResizeObserver";
import { Stack, StackProps } from "@/toolkits/Stack";

type MiddleTruncateProps = StackProps &
  Omit<HTMLAttributes<HTMLElement>, "children"> & { children: string };

export const MiddleTruncate: FC<MiddleTruncateProps> = ({
  children: text,
  $style = {},
  ...rest
}) => {
  const [ellipsis, setEllipsis] = useState(text);
  const containerRef = useRef<HTMLElement | null>(null);
  const { width: containerWidth } = useResizeObserver(containerRef);

  const divider = "...";
  const maxVisibleCharsPerSide = useMemo(
    () => Math.ceil(text.length / 2),
    [text.length]
  );

  useLayoutEffect(() => {
    if (!containerRef.current || !containerWidth) return;

    // Create a hidden span for measurement
    const measureSpan = document.createElement("span");
    measureSpan.style.position = "absolute";
    measureSpan.style.visibility = "hidden";
    measureSpan.style.whiteSpace = "nowrap";
    containerRef.current.appendChild(measureSpan);

    // Check if full text fits
    measureSpan.textContent = text;

    if (measureSpan.scrollWidth <= containerWidth) {
      setEllipsis(text);
      containerRef.current.removeChild(measureSpan);
      return;
    }

    // Binary search truncation
    let left = 0;
    let right = maxVisibleCharsPerSide;
    let bestFit = divider;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const sliceLen = maxVisibleCharsPerSide - mid;
      const candidate = `${text.slice(0, sliceLen)}${divider}${text.slice(
        -sliceLen
      )}`;

      measureSpan.textContent = candidate;

      if (measureSpan.scrollWidth <= containerWidth) {
        bestFit = candidate;
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    containerRef.current.removeChild(measureSpan);

    setEllipsis(bestFit);
  }, [containerWidth, text, maxVisibleCharsPerSide]);

  return (
    <Stack
      as="span"
      ref={containerRef}
      $style={{
        ...$style,
        display: "block",
        position: "relative",
        whiteSpace: "nowrap",
      }}
      {...rest}
    >
      {ellipsis}
    </Stack>
  );
};
