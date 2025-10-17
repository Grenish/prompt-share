"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils"; // Assuming you have shadcn's cn utility

interface FolderProps {
  color?: string; // Can be hex, tailwind color (e.g., "blue-500"), or shadcn theme color (e.g., "primary")
  size?: number;
  items?: React.ReactNode[];
  className?: string;
}

// Helper to determine color type and generate appropriate styles
const getColorStyles = (color: string) => {
  // Check if it's a hex color
  if (color.startsWith("#")) {
    return {
      type: "hex",
      styles: {
        "--folder-color": color,
        "--folder-back-color": color,
      },
      className: "",
    };
  }

  // Check if it's a shadcn UI theme color
  const themeColors = [
    "primary",
    "secondary",
    "destructive",
    "muted",
    "accent",
    "card",
    "popover",
  ];
  if (themeColors.includes(color)) {
    return {
      type: "theme",
      styles: {
        "--folder-color": `hsl(var(--${color}))`,
        "--folder-back-color": `hsl(var(--${color}))`,
      },
      className: "",
    };
  }

  // Assume it's a Tailwind color (e.g., "blue-500", "red-600")
  const [colorName, shade] = color.split("-");
  if (colorName && shade) {
    // Map common Tailwind colors to CSS variables or use bg classes
    return {
      type: "tailwind",
      styles: {},
      className: `bg-${color}`,
      colorClass: color,
    };
  }

  // Default fallback
  return {
    type: "hex",
    styles: {
      "--folder-color": "#5227FF",
      "--folder-back-color": "#5227FF",
    },
    className: "",
  };
};

const Folder: React.FC<FolderProps> = ({
  color = "primary",
  size = 1,
  items = [],
  className = "",
}) => {
  const maxItems = 3;
  const papers = items.slice(0, maxItems);
  while (papers.length < maxItems) {
    papers.push(null);
  }

  const [open, setOpen] = useState(false);
  const [paperOffsets, setPaperOffsets] = useState<{ x: number; y: number }[]>(
    Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })),
  );

  const colorConfig = getColorStyles(color);
  const isHex = colorConfig.type === "hex";
  const isTailwind = colorConfig.type === "tailwind";
  const isTheme = colorConfig.type === "theme";

  const handleClick = () => {
    setOpen((prev) => !prev);
    if (open) {
      setPaperOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
    }
  };

  const handlePaperMouseMove = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number,
  ) => {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.15;
    const offsetY = (e.clientY - centerY) * 0.15;
    setPaperOffsets((prev) => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: offsetX, y: offsetY };
      return newOffsets;
    });
  };

  const handlePaperMouseLeave = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number,
  ) => {
    setPaperOffsets((prev) => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: 0, y: 0 };
      return newOffsets;
    });
  };

  const scaleStyle = { transform: `scale(${size})` };

  const getOpenTransform = (index: number) => {
    if (index === 0) return "translate(-120%, -70%) rotate(-15deg)";
    if (index === 1) return "translate(10%, -70%) rotate(15deg)";
    if (index === 2) return "translate(-50%, -100%) rotate(5deg)";
    return "";
  };

  // Generate folder styles based on color type
  const getFolderStyles = () => {
    if (isHex) {
      return {
        backgroundColor: colorConfig.styles["--folder-color"],
      };
    }
    if (isTheme) {
      return {
        backgroundColor: colorConfig.styles["--folder-color"],
      };
    }
    return {};
  };

  const getFolderBackStyles = () => {
    if (isHex || isTheme) {
      return {
        backgroundColor: colorConfig.styles["--folder-back-color"],
        filter: "brightness(0.92)",
      };
    }
    return {};
  };

  const getFolderClassName = () => {
    if (isTailwind) {
      return `bg-${colorConfig.colorClass}`;
    }
    return "";
  };

  const getFolderBackClassName = () => {
    if (isTailwind) {
      return `bg-${colorConfig.colorClass} brightness-[0.92]`;
    }
    return "";
  };

  const getPaperStyles = (index: number) => {
    const baseStyles = {
      borderRadius: "10px",
    };

    // Paper colors with different opacities
    if (index === 0) {
      return { ...baseStyles, backgroundColor: "rgb(230, 230, 230)" };
    }
    if (index === 1) {
      return { ...baseStyles, backgroundColor: "rgb(242, 242, 242)" };
    }
    return { ...baseStyles, backgroundColor: "rgb(255, 255, 255)" };
  };

  return (
    <div style={scaleStyle} className={className}>
      <div
        className={cn(
          "group relative transition-all duration-200 ease-in cursor-pointer",
          !open ? "hover:-translate-y-2" : "",
        )}
        style={{
          ...colorConfig.styles,
          transform: open ? "translateY(-8px)" : undefined,
        }}
        onClick={handleClick}
      >
        <div
          className={cn(
            "relative w-[100px] h-[80px] rounded-tl-0 rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px]",
            getFolderBackClassName(),
          )}
          style={getFolderBackStyles()}
        >
          <span
            className={cn(
              "absolute z-0 bottom-[98%] left-0 w-[30px] h-[10px] rounded-tl-[5px] rounded-tr-[5px] rounded-bl-0 rounded-br-0",
              getFolderBackClassName(),
            )}
            style={getFolderBackStyles()}
          ></span>
          {papers.map((item, i) => {
            let sizeClasses = "";
            if (i === 0)
              sizeClasses = open ? "w-[70%] h-[80%]" : "w-[70%] h-[80%]";
            if (i === 1)
              sizeClasses = open ? "w-[80%] h-[80%]" : "w-[80%] h-[70%]";
            if (i === 2)
              sizeClasses = open ? "w-[90%] h-[80%]" : "w-[90%] h-[60%]";

            const transformStyle = open
              ? `${getOpenTransform(i)} translate(${paperOffsets[i].x}px, ${paperOffsets[i].y}px)`
              : undefined;

            return (
              <div
                key={i}
                onMouseMove={(e) => handlePaperMouseMove(e, i)}
                onMouseLeave={(e) => handlePaperMouseLeave(e, i)}
                className={cn(
                  "absolute z-20 bottom-[10%] left-1/2 transition-all duration-300 ease-in-out",
                  !open
                    ? "transform -translate-x-1/2 translate-y-[10%] group-hover:translate-y-0"
                    : "hover:scale-110",
                  sizeClasses,
                )}
                style={{
                  ...(!open ? {} : { transform: transformStyle }),
                  ...getPaperStyles(i),
                }}
              >
                {item}
              </div>
            );
          })}
          <div
            className={cn(
              "absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out rounded-[5px_10px_10px_10px]",
              !open ? "group-hover:[transform:skew(15deg)_scaleY(0.6)]" : "",
              getFolderClassName(),
            )}
            style={{
              ...getFolderStyles(),
              ...(open && { transform: "skew(15deg) scaleY(0.6)" }),
            }}
          ></div>
          <div
            className={cn(
              "absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out rounded-[5px_10px_10px_10px]",
              !open ? "group-hover:[transform:skew(-15deg)_scaleY(0.6)]" : "",
              getFolderClassName(),
            )}
            style={{
              ...getFolderStyles(),
              ...(open && { transform: "skew(-15deg) scaleY(0.6)" }),
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Folder;
