interface AvatarProps {
  initials: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export default function Avatar({ initials, name, size = "md" }: AvatarProps) {
  return (
    <div
      aria-label={name}
      title={name}
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#FFF5D6] font-semibold text-emerald-800 ${sizeClasses[size]}`}
    >
      {initials}
    </div>
  );
}
