import Image from "next/image";
import { brandIcons } from "@/lib/site";

export function Icon() {
  return (
    <Image
      src={brandIcons.svg}
      alt="Total Charm Dent"
      width={24}
      height={24}
      unoptimized
      style={{ width: 24, height: 24 }}
    />
  );
}

export default Icon;
