import type { Metadata } from "next";
import { brandIcons } from "@/lib/site";
import "../../globals.css";
import "./strategy.css";

export const metadata: Metadata = {
  title: "ერთად დავგეგმოთ შემდეგი ნაბიჯი · Total Charm Dent",
  description: "კლინიკის ციფრული განვითარების სამუშაო კითხვარი.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
  icons: { icon: { url: brandIcons.svg, sizes: "any", type: "image/svg+xml" } },
};
// Deliberately outside [lang]: no marketing pixels, consent banner, public
// navigation, locale redirect, or analytics configuration fetches.
export default function StrategyLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ka"><body className="strategy-body">
    <a href="#strategy-main" className="strategy-skip">კითხვარზე გადასვლა</a>
    {children}
  </body></html>;
}
