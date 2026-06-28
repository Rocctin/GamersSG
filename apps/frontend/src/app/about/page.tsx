"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  Gamepad2,
  Shield,
  Users,
  Trophy,
  Briefcase,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Zap,
  FileText,
  ExternalLink,
  Target,
  Eye,
  Heart,
  Globe,
} from "lucide-react";

export default function AboutPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Navigation */}
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
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-slate-400 hover:text-slate-200 transition-colors text-sm"
              >
                Home
              </Link>
              <Link
                href={isAuthenticated ? "/dashboard" : "/login"}
                className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
              >
                {isAuthenticated ? "Dashboard" : "Sign In"}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-8 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          {/* Hero */}
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="h-4 w-4 text-brand-400" />
              <span className="text-sm text-brand-400 font-medium">
                Powered by SCOGA
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-100 leading-tight tracking-tight mb-6">
              About{" "}
              <span className="bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent">
                Gamers.SG
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
              Gamers.SG is Singapore&apos;s national digital membership platform
              for gamers — built under the stewardship of SCOGA (Singapore
              Cybersports and Online Gaming Association). Think of it as
              &ldquo;LinkedIn for gamers&rdquo; — a verified identity and
              services hub that connects competitive gaming profiles,
              achievements, team management, tournaments, a jobs board, and
              members-only e-commerce into one unified ecosystem.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid sm:grid-cols-2 gap-6 mb-16">
            <div className="p-6 rounded-xl bg-surface-900 border border-surface-800">
              <div className="w-12 h-12 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-brand-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Our Mission
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                To build an inclusive digital ecosystem where esports and gaming
                empower individuals to develop skills, succeed in careers, and
                contribute meaningfully to Singapore&apos;s digital society.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-surface-900 border border-surface-800">
              <div className="w-12 h-12 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-brand-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Our Vision
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                To be the main source of networking & connecting for gaming identity in
                Singapore, where every gamer has one verified profile that
                follows them across teams, tournaments, and perhaps career
                opportunities.
              </p>
            </div>
          </div>

          {/* Platform Pillars */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-slate-100 mb-8">
              Platform Pillars
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  icon: Shield,
                  title: "Verified Identity",
                  desc: "One person, one account. SingPass/Myinfo integration ensures authentic, trustworthy gaming profiles across the community.",
                },
                {
                  icon: Users,
                  title: "Team Management",
                  desc: "Create or join teams, manage rosters, and compete together. Build your squad and climb the ranks as a unit.",
                },
                {
                  icon: Trophy,
                  title: "Tournaments & Events",
                  desc: "Compete in official tournaments, track match history, and earn achievements that showcase your competitive skill.",
                },
                {
                  icon: Briefcase,
                  title: "Jobs & Career Board",
                  desc: "Discover career opportunities in esports and gaming — from casting to coaching, find your next role in the industry.",
                },
                {
                  icon: ShoppingBag,
                  title: "Members Store",
                  desc: "Exclusive members-only deals on gaming gear, merchandise, and event tickets. Earn and redeem loyalty points.",
                },
                {
                  icon: Heart,
                  title: "Community First",
                  desc: "Built for the community, by the community. Every feature is designed to create compounding value for gamers, organisers, and partners.",
                },
              ].map((pillar) => (
                <div
                  key={pillar.title}
                  className="p-5 rounded-xl bg-surface-900 border border-surface-800 hover:border-brand-500/30 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                      <pillar.icon className="h-5 w-5 text-brand-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200 mb-1">
                        {pillar.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* About SCOGA */}
          <div className="mb-16 p-8 rounded-2xl bg-surface-900 border border-surface-800">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-7 w-7 text-brand-500" />
              <h2 className="text-2xl font-bold text-slate-100">
                About SCOGA
              </h2>
            </div>
            <p className="text-slate-400 leading-relaxed mb-4">
              The Singapore Cybersports and Online Gaming Association (SCOGA) is
              a national not-for-profit organisation that serves as the
              governing body for esports in Singapore. Established to develop
              and support the local esports ecosystem, SCOGA champions the
              interests of gamers, organisers, and industry stakeholders through
              advocacy, education, and community-building initiatives.
            </p>
            <p className="text-slate-400 leading-relaxed mb-4">
              SCOGA&apos;s key initiatives include the Singapore Esports League
              (SEL), campus outreach programmes, talent development pathways,
              and national team representation at international competitions.
              Gamers.SG represents the next evolution of SCOGA&apos;s mission —
              a unified digital platform that brings all of these efforts under
              one roof.
            </p>
            <a
              href="https://scoga.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors text-sm"
            >
              Visit SCOGA.org <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* CTA */}
          <div className="text-center p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-brand-500/10 to-brand-600/5 border border-brand-500/20">
            <h2 className="text-2xl font-bold text-slate-100 mb-3">
              Ready to Join?
            </h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Create your verified gaming profile and become part of
              Singapore&apos;s national gaming community.
            </p>
            {!isAuthenticated ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg shadow-brand-500/25"
              >
                Get Started — It&apos;s Free <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg shadow-brand-500/25"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-surface-900 border-t border-surface-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { label: "Discord", href: "https://discord.gg/mUGTgZTcqw" },
              {
                label: "Facebook",
                href: "https://www.facebook.com/SingaporeCybersports/",
              },
              {
                label: "Instagram",
                href: "https://www.instagram.com/singaporecybersports/",
              },
              {
                label: "LinkedIn",
                href: "https://www.linkedin.com/company/scoga-org/",
              },
              { label: "Twitch", href: "https://www.twitch.tv/scoga" },
              {
                label: "TikTok",
                href: "https://www.tiktok.com/@singaporecybersports",
              },
            ].map((s) => (
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
          <div className="border-t border-surface-800 mb-8" />
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
    </div>
  );
}
