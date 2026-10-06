import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Figtree, IBM_Plex_Mono } from "next/font/google";
import Dock from "@/components/Dock";
import { NamesProvider } from "@/components/Named";
import Nav from "@/components/Nav";
import Toaster from "@/components/Toaster";
import { MODELS, model, names } from "@/lib/queries";
import { current } from "@/lib/runs";
import { store } from "@/lib/store";
import { usage } from "@/lib/usage";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "Job",
  description: "Your profile, and every job it is being matched against.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const chosen = (await cookies()).get("theme")?.value;
  const theme = chosen === "readout" || chosen === "night" ? chosen : undefined;
  const run = current();
  const preferred = model();

  return (
    <html
      lang="en"
      data-theme={theme}
      suppressHydrationWarning
      className={`${figtree.variable} ${plexMono.variable}
            h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-base-200 text-base-content" suppressHydrationWarning>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50
             focus:rounded-box focus:bg-base-100 focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        <NamesProvider names={names()}>
          <Dock
            run={run}
            models={MODELS}
            model={preferred}
            nav={<Nav key="nav" store={store()} limits={usage()} models={MODELS} model={preferred} />}
          >
            <main id="content" className="mx-auto w-full min-w-0 max-w-[104rem] flex-1 px-4 py-6 md:px-6 md:py-7">
              {children}
            </main>
          </Dock>
        </NamesProvider>
        <Toaster />
      </body>
    </html>
  );
}
