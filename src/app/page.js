import { Analytics } from "@vercel/analytics/react";
import HomeShell from "../component/HomeShell";

export default function HomePage() {
  return (
    <>
      <Analytics />
      <HomeShell />
    </>
  );
}

