"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  Gamepad2,
  Sword,
  Users,
  Trophy,
  Briefcase,
  ShoppingBag,
  ArrowRight,
  Shield,
  Star,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="w-full">
      {/* Navigation */}
      <Navbar isAuthenticated={isAuthenticated} />

      {/* Hero */}
      <HeroSection />

      {/* Stats */}
      <StatsSection />

      {/* Features */}
      <FeaturesSection />

      {/* CTA */}
      <CTASection isAuthenticated={isAuthenticated} />

      {/* Footer */}
      <Footer />
    </div>
  );
}

function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <nav className="fixed top-0 z-50 w-full bg-surface-950/80 backdrop-blur-md border-b border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="h-8 w-8 text-brand-500" />
            <span className="text-xl font-bold text-slate-100">
              Gamers<span className="text-brand-500">.SG</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-slate-200 transition-colors">
              Features
            </a>
            <Link href="/about" className="text-slate-400 hover:text-slate-200 transition-colors">
              About
            </Link>
            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {isAuthenticated ? "Dashboard" : "Sign In"}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors"
            >
              {isAuthenticated ? "Dashboard" : "Sign In"}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-brand-500/10" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-brand-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="h-4 w-4 text-brand-400" />
              <span className="text-sm text-brand-400 font-medium">
                Powered by SCOGA
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 leading-tight tracking-tight">
              Your Gaming Identity{" "}
              <span className="bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent">
                Starts Here
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-lg">
              Building an inclusive future where esports and gaming empower
              individuals to develop skills, succeed in careers, and contribute
              meaningfully to society.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg shadow-brand-500/25"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 bg-surface-800 hover:bg-surface-700 text-slate-300 font-semibold px-6 py-3 rounded-lg border border-surface-700 transition-all duration-200"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Hero graphic */}
          <div className="hidden lg:block relative">
            <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-surface-800 to-surface-900 border border-surface-700 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4 p-8">
                {[Trophy, Sword, Users, Star, Shield, Gamepad2].map(
                  (Icon, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center hover:border-brand-500/50 transition-colors"
                    >
                      <Icon className="h-8 w-8 text-brand-500" />
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: "500+", label: "Events Hosted" },
    { value: "500K+", label: "Community Members" },
    { value: "18 Yrs", label: "Esports Legacy" },
    { value: "1M+", label: "Total Attendees" },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-100 text-center mb-12">
          What Makes Us Different?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 rounded-xl bg-surface-900 border border-surface-800 hover:border-brand-500/30 transition-all duration-200"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-brand-500 mb-2">
                {stat.value}
              </div>
              <div className="text-slate-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "Verified Identity",
      description:
        "One person, one account. SingPass-verified identity ensures authentic gaming profiles you can trust across the community.",
    },
    {
      icon: Users,
      title: "Team Management",
      description:
        "Create or join teams, manage rosters, and compete together. Build your squad and climb the ranks as a unit.",
    },
    {
      icon: Trophy,
      title: "Tournaments & Events",
      description:
        "Compete in official tournaments, track your match history, and earn achievements that showcase your skill.",
    },
    {
      icon: Briefcase,
      title: "Jobs Board",
      description:
        "Discover career opportunities in esports and gaming. From casting to coaching, find your next role in the industry.",
    },
    {
      icon: ShoppingBag,
      title: "Members Store",
      description:
        "Exclusive members-only deals on gaming gear, merchandise, and event tickets. Earn and redeem loyalty points.",
    },
    {
      icon: Gamepad2,
      title: "Gaming Profiles",
      description:
        "Build your competitive gaming CV. Track your stats, achievements, and game history across all platforms.",
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">
            Everything You Need, All In One Place
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            From competitive play to career growth, Gamers.SG is the platform
            that grows with you through every stage of your gaming journey.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl bg-surface-900 border border-surface-800 hover:border-brand-500/30 hover:bg-surface-800/50 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6 text-brand-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-brand-500/10 to-brand-600/5 border border-brand-500/20">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">
            Ready to Level Up?
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Join Singapore&apos;s national gaming platform. Verify your identity,
            build your profile, and unlock the full gaming ecosystem.
          </p>
          {!isAuthenticated && (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg shadow-brand-500/25"
            >
              Join Now — It&apos;s Free <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg shadow-brand-500/25"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const socials = [
    { label: "Discord", href: "https://discord.gg/mUGTgZTcqw" },
    { label: "Facebook", href: "https://www.facebook.com/SingaporeCybersports/" },
    { label: "Instagram", href: "https://www.instagram.com/singaporecybersports/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/scoga-org/" },
    { label: "Twitch", href: "https://www.twitch.tv/scoga" },
    { label: "TikTok", href: "https://www.tiktok.com/@singaporecybersports" },
  ];

  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-surface-900 border-t border-surface-800">
      <div className="max-w-7xl mx-auto">
        {/* Socials */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-surface-800 border border-surface-700 text-slate-400 hover:text-brand-400 hover:border-brand-500/30 transition-all text-sm"
            >
              {s.label}
            </a>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-surface-800 mb-8" />

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 mb-6">
          <span>Powered by SCOGA</span>
          <span>|</span>
          <span>Singapore Cybersports and Online Gaming Association</span>
        </div>

        <p className="text-center text-slate-600 text-sm">
          &copy; {new Date().getFullYear()} Gamers.SG — All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
