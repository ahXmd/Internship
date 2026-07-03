"use client";
import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

export default function Avatar({ name, color, size = "md" }: AvatarProps) {
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 shadow-sm`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
