'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Heart,
  Target,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

const values = [
  {
    icon: Heart,
    title: 'Patient-Centric',
    description: 'We believe great patient care starts with great practice management. Every feature is designed to help you deliver exceptional experiences.'
  },
  {
    icon: Shield,
    title: 'Security First',
    description: 'HIPAA compliance and data security are not optional. We build trust through encryption, audit logging, and rigorous security standards.'
  },
  {
    icon: Zap,
    title: 'Innovation',
    description: 'We leverage cutting-edge AI and automation to help aesthetic practices stay ahead in a competitive market.'
  },
  {
    icon: Target,
    title: 'Customer Success',
    description: 'Your success is our success. We provide exceptional support, training, and resources to help you thrive.'
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/marketing" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">SpaStream</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/marketing#features">
              <Button variant="ghost">Features</Button>
            </Link>
            <Link href="/marketing#pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost">About</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
            <Heart className="w-3 h-3 mr-1" />
            Our Story
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent">
            Built by Med Spa Owners, For Med Spa Owners
          </h1>

          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            SpaStream started from a simple frustration: managing a medical spa shouldn't require juggling 5+ different software tools. We built the all-in-one solution we always wished existed.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container mx-auto max-w-5xl">
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Our Mission</h2>
                  <p className="text-blue-600 font-medium">Empowering aesthetic practices worldwide</p>
                </div>
              </div>
              <p className="text-lg text-slate-700 leading-relaxed">
                Our mission is to empower medical spas and aesthetic practices to deliver exceptional patient care while running profitable, efficient businesses. We combine powerful technology with beautiful design to create software that practice owners actually love using. By automating administrative tasks and providing data-driven insights, we give practitioners more time to focus on what matters most: their patients.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
              Our Values
            </Badge>
            <h2 className="text-4xl font-bold mb-4">What Drives Us</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              These core values guide every decision we make and every feature we build
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-2 hover:border-blue-300 transition-all hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="w-14 h-14 mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <value.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{value.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-bold mb-6">
            Join the SpaStream Family
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Discover why hundreds of medical spas trust SpaStream to run their practices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/marketing#features">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent text-white border-white hover:bg-white/10">
                View Features
              </Button>
            </Link>
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">SpaStream</span>
              </div>
              <p className="text-slate-400 text-sm">
                Complete practice management for medical spas and aesthetic practices.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/marketing#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/marketing#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/" className="hover:text-white">Demo</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><a href="mailto:hello@medspaflow.com" className="hover:text-white">Contact</a></li>
                <li><a href="mailto:support@medspaflow.com" className="hover:text-white">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2025 SpaStream. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
