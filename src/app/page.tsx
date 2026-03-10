import Link from "next/link";
import {
  Cpu,
  ShieldCheck,
  BarChart3,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle2,
  Layers,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "BOM Management",
    description:
      "Import, enrich, and manage Bills of Materials with automatic part matching and lifecycle tracking.",
  },
  {
    icon: ShieldCheck,
    title: "Risk Intelligence",
    description:
      "Proactively identify supply chain risks with real-time lifecycle, compliance, and availability monitoring.",
  },
  {
    icon: TrendingUp,
    title: "Sourcing & Pricing",
    description:
      "Compare distributor pricing, track lead times, and find cost-effective alternatives instantly.",
  },
  {
    icon: BarChart3,
    title: "Executive Dashboards",
    description:
      "Get actionable insights with rich analytics across your entire component portfolio.",
  },
  {
    icon: Globe,
    title: "Supplier Network",
    description:
      "Access data from major distributors like DigiKey, Mouser, and more — all in one place.",
  },
  {
    icon: Zap,
    title: "Smart Automation",
    description:
      "Automatically enrich parts data, flag obsolescence, and suggest drop-in replacements.",
  },
];

const stats = [
  { value: "10M+", label: "Components Tracked" },
  { value: "500+", label: "Manufacturers" },
  { value: "99.9%", label: "Uptime" },
  { value: "<2s", label: "Avg Response Time" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600">
              <Cpu className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Chipora</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              <Zap className="size-3.5" />
              Supply Chain Intelligence Platform
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Master your
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {" "}
                electronic supply chain
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
              Chipora gives hardware teams full visibility into component
              lifecycle, risk, pricing, and sourcing — so you can build
              products without supply chain surprises.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30"
              >
                Start Free
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#features"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-8 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                See Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-gray-50/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage components
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              From BOM import to executive reporting, Chipora covers the
              entire lifecycle of your electronic components.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Benefits */}
      <section className="border-t bg-gray-50/50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Built for hardware engineering teams
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Stop firefighting supply chain issues. Chipora turns reactive
                component management into a proactive advantage.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Real-time obsolescence alerts before it impacts your design",
                  "Multi-distributor pricing comparison in seconds",
                  "Automatic compliance checking (RoHS, REACH, conflict minerals)",
                  "Drop-in replacement suggestions powered by parametric matching",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-blue-600" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-white p-8 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">73%</div>
                    <div className="text-sm text-gray-500">
                      Reduction in supply chain disruptions
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <TrendingUp className="size-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">40%</div>
                    <div className="text-sm text-gray-500">
                      Faster sourcing decisions
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Zap className="size-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      $2.1M
                    </div>
                    <div className="text-sm text-gray-500">
                      Avg. annual savings per customer
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Ready to take control of your supply chain?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
            Join hardware teams who use Chipora to ship products on time,
            every time.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30"
          >
            Get Started Now
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-blue-600">
              <Cpu className="size-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Chipora</span>
          </div>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Chipora. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
