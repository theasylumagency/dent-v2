import type { Metadata } from "next";
import { Noto_Sans_Georgian } from "next/font/google";
import "../../globals.css";
import "./strategy.css";

const font = Noto_Sans_Georgian({ subsets: ["georgian"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--strategy-font", preload: false });
export const metadata: Metadata = {
  title: "ერთად დავგეგმოთ შემდეგი ნაბიჯი · Total Charm Dent",
  description: "კლინიკის ციფრული განვითარების სამუშაო კითხვარი.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
  icons: { icon: "/brand/icon.svg" },
};
// Deliberately outside [lang]: no marketing pixels, consent banner, public
// navigation, locale redirect, or analytics configuration fetches.
export default function StrategyLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ka" className={font.variable}><body className="strategy-body">
    <a href="#strategy-main" className="strategy-skip">კითხვარზე გადასვლა</a>
    {children}
  </body></html>;
}
