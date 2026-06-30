import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  Activity,
  Zap,
  Shield,
  HelpCircle,
} from "lucide-react";

export default function Home() {
  return (
    <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground relative min-h-screen overflow-x-hidden">
      <header className="border-border/40 bg-background/80 fixed top-0 z-50 w-full border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
              <Sparkles className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Metricon</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="ghost" className="cursor-pointer">
                Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button className="shadow-primary/20 cursor-pointer shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32">
        <div className="from-primary/10 absolute inset-x-0 top-0 -z-10 h-[500px] bg-gradient-to-b via-transparent to-transparent opacity-60" />
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="border-primary/20 bg-primary/5 text-primary mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="size-3.5" />
            Empowering Next-Gen Short Links
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
            Intelligent Link Routing <br />
            <span className="from-primary bg-gradient-to-r to-emerald-500 bg-clip-text text-transparent">
              With Deep Analytics
            </span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg sm:text-xl">
            Redirect based on devices, target by country, protect with absolute
            password controls, and measure dynamic visitor engagement instantly.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/auth">
              <Button
                size="lg"
                className="w-full cursor-pointer gap-2 sm:w-auto"
              >
                Start For Free <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="w-full cursor-pointer sm:w-auto"
              >
                Explore Analytics
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-border/40 bg-card/40 border-t py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Engineered for Hyper-Growth
            </h2>
            <p className="text-muted-foreground mt-4 text-base">
              All the tools required to track campaigns and secure redirects
              seamlessly.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="border-border/50 bg-background hover:border-primary/30 rounded-2xl border p-8 shadow-xs transition-all hover:shadow-md">
              <div className="bg-primary/10 text-primary mb-6 flex size-12 items-center justify-center rounded-xl">
                <Zap className="size-6" />
              </div>
              <h3 className="text-xl font-bold">Dynamic Routing</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Reroute your iOS, Android, and Desktop users to unique
                destinations with zero-latency overhead.
              </p>
            </div>
            <div className="border-border/50 bg-background hover:border-primary/30 rounded-2xl border p-8 shadow-xs transition-all hover:shadow-md">
              <div className="bg-primary/10 text-primary mb-6 flex size-12 items-center justify-center rounded-xl">
                <Activity className="size-6" />
              </div>
              <h3 className="text-xl font-bold">Rich Analytics</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Uncover country distributions, tracking referrer websites, and
                instant client-side browser footprints.
              </p>
            </div>
            <div className="border-border/50 bg-background hover:border-primary/30 rounded-2xl border p-8 shadow-xs transition-all hover:shadow-md">
              <div className="bg-primary/10 text-primary mb-6 flex size-12 items-center justify-center rounded-xl">
                <Shield className="size-6" />
              </div>
              <h3 className="text-xl font-bold">Password & Expiration</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Enforce security by password gating specific shortcodes or
                restricting operations via strict click counts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-border/40 border-t py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground mt-4 text-base">
              Select the absolute configuration tier suitable for your workspace
              operations.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 md:max-w-none md:grid-cols-2">
            <div className="border-border/50 bg-background flex flex-col justify-between rounded-3xl border p-8 shadow-xs">
              <div>
                <h3 className="text-lg font-bold">Free Plan</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Perfect for personal experiments and hobbyists.
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">$0</span>
                </div>
                <ul className="mt-8 space-y-4 text-sm">
                  <li className="text-muted-foreground flex items-center gap-2">
                    ✓ Up to 10 active tracking links
                  </li>
                  <li className="text-muted-foreground flex items-center gap-2">
                    ✓ Standard analytics tracking
                  </li>
                  <li className="text-muted-foreground flex items-center gap-2">
                    ✓ Default static redirection
                  </li>
                </ul>
              </div>
              <Link href="/auth" className="mt-8">
                <Button variant="outline" className="w-full cursor-pointer">
                  Get Started Free
                </Button>
              </Link>
            </div>
            <div className="border-primary bg-background relative flex flex-col justify-between rounded-3xl border p-8 shadow-xl">
              <div className="bg-primary/10 text-primary absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold">
                RECOMMENDED
              </div>
              <div>
                <h3 className="text-lg font-bold">Pro Plan</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Engineered for professionals requiring deep insight tools.
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">$29</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <ul className="mt-8 space-y-4 text-sm">
                  <li className="flex items-center gap-2">
                    ✓ Unlimited tracking link capabilities
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ Device Targeting & Geo-Routing
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ Password Protection & Click Limits
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ Lifetime retention of insights history
                  </li>
                </ul>
              </div>
              <Link href="/auth" className="mt-8">
                <Button className="shadow-primary/35 w-full cursor-pointer shadow-lg">
                  Upgrade Workspace Pro
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-border/40 bg-card/40 border-t py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-6">
            <div className="border-border bg-background rounded-2xl border p-6">
              <h4 className="flex items-center gap-2 text-base font-bold">
                <HelpCircle className="text-primary size-5" /> How does
                Geo-Targeting function?
              </h4>
              <p className="text-muted-foreground mt-2 pl-7 text-sm leading-relaxed">
                Our redirection servers dynamically look up client
                country-origin metrics during redirects, sending users to
                specific target domains instantly.
              </p>
            </div>
            <div className="border-border bg-background rounded-2xl border p-6">
              <h4 className="flex items-center gap-2 text-base font-bold">
                <HelpCircle className="text-primary size-5" /> Are cookies
                required to trace users?
              </h4>
              <p className="text-muted-foreground mt-2 pl-7 text-sm leading-relaxed">
                Metricon uses a non-invasive IP hash mechanism to determine
                unique visits without storing tracking cookies.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-border/40 border-t py-8">
        <div className="text-muted-foreground mx-auto max-w-7xl px-6 text-center text-xs">
          © {new Date().getFullYear()} Metricon. All Rights Reserved. Pure
          English, Worldwide Operation.
        </div>
      </footer>
    </div>
  );
}
