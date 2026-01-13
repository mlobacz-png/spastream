'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Users,
  DollarSign,
  Package,
  PackageOpen,
  Mail,
  Globe,
  CreditCard,
  FileText,
  MessageSquare,
  BarChart3,
  Sparkles,
  Check,
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  Star,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { TrustIndicators, CustomerTestimonials, ComparisonTable, ROICalculator } from '@/components/landing-page-enhancements';

const features = [
  {
    icon: Calendar,
    title: 'Smart Calendar',
    description: 'Intuitive scheduling with drag-and-drop, multiple views, and real-time availability.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Complete profiles with treatment history, photos, notes, and consent tracking.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: DollarSign,
    title: 'Revenue Tracking',
    description: 'Monitor payments, collection rates, and revenue by service in real-time.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Package,
    title: 'Treatment Packages',
    description: 'Create service bundles with automatic pricing and expiration tracking.',
    color: 'from-violet-500 to-purple-500'
  },
  {
    icon: PackageOpen,
    title: 'Inventory Management',
    description: 'Track products, supplies, and stock levels with automatic low-stock alerts.',
    color: 'from-orange-500 to-amber-500'
  },
  {
    icon: Mail,
    title: 'Marketing Automation',
    description: 'Email campaigns, automated follow-ups, and client engagement tracking.',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: Users,
    title: 'Staff Management',
    description: 'Track schedules, performance, commissions, and optimize staffing levels.',
    color: 'from-green-500 to-teal-500'
  },
  {
    icon: Globe,
    title: 'Online Booking',
    description: 'Beautiful booking page for clients to schedule appointments 24/7.',
    color: 'from-blue-500 to-sky-500'
  },
  {
    icon: CreditCard,
    title: 'Payment Processing',
    description: 'Integrated Stripe payments with deposits, installments, and transaction history.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: FileText,
    title: 'Invoice Generation',
    description: 'Professional invoices with PDF export and automatic email delivery.',
    color: 'from-blue-500 to-indigo-500'
  },
  {
    icon: MessageSquare,
    title: 'SMS Communication',
    description: 'Two-way texting with clients, automated reminders, and conversation threads.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Client lifetime value, retention rates, peak hours, and business intelligence.',
    color: 'from-amber-500 to-orange-500'
  },
  {
    icon: Sparkles,
    title: 'AI Treatment Recommender',
    description: 'Personalized treatment suggestions based on client history and demographics.',
    color: 'from-violet-500 to-purple-500'
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Suite',
    description: '6 AI features: compliance auditor, pricing optimizer, no-show predictor, and more.',
    color: 'from-violet-500 to-purple-500'
  }
];

const pricingTiers = [
  {
    name: 'Starter',
    price: 299,
    description: 'Perfect for solo practitioners',
    features: [
      'Up to 100 clients',
      '1 provider',
      'Calendar & scheduling',
      'Client management',
      'Revenue tracking',
      'Email reminders',
      'Online booking page'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Professional',
    price: 599,
    description: 'Most popular for growing practices',
    features: [
      'Up to 500 clients',
      'Up to 3 providers',
      'Everything in Starter, plus:',
      'Stripe payment processing',
      'Invoice generation',
      'SMS communications (100/mo)',
      'Treatment packages',
      'AI features (limited)',
      'Basic analytics'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Premium',
    price: 999,
    description: 'For established multi-provider spas',
    features: [
      'Unlimited clients',
      'Up to 10 providers',
      'Everything in Professional, plus:',
      'Unlimited SMS',
      'Advanced analytics',
      'Full AI suite',
      'Priority support',
      'Custom integrations',
      'Dedicated account manager'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Enterprise',
    price: 1499,
    description: 'For multi-location operations',
    features: [
      'Unlimited everything',
      'Unlimited providers',
      'Everything in Premium, plus:',
      'Multi-location support',
      'White-label options',
      'Custom development',
      'SLA guarantee',
      '24/7 phone support',
      'Onboarding & training'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

const benefits = [
  {
    icon: Clock,
    title: 'Save 10+ Hours Per Week',
    description: 'Automate scheduling, reminders, and record-keeping. Focus on clients, not admin work.'
  },
  {
    icon: TrendingUp,
    title: 'Increase Revenue 20-40%',
    description: 'Reduce no-shows, optimize pricing, sell packages, and make data-driven decisions.'
  },
  {
    icon: Star,
    title: 'Improve Client Experience',
    description: 'Professional communication, personalized recommendations, and convenient online booking.'
  },
  {
    icon: Shield,
    title: 'HIPAA Compliant',
    description: 'Encrypted storage, audit logging, and secure data handling built into every feature.'
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">SpaStream</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#features">
              <Button variant="ghost">Features</Button>
            </Link>
            <Link href="#pricing">
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
        <div className="container mx-auto text-center max-w-5xl">
          <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
            <Zap className="w-3 h-3 mr-1" />
            14-Day Free Trial • No Credit Card Required
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent">
            Complete Med Spa Management System
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Calendar, Payments, SMS, AI & Analytics in One Platform
          </p>

          <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto">
            Everything you need to run your medical spa efficiently and profitably.
            Designed specifically for aesthetic practices.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/app">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg px-8 py-6">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                View Features
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                <p className="text-slate-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
              Complete Feature Set
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Everything You Need in One Platform</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              14 powerful features designed specifically for medical spas and aesthetic practices
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-blue-300 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className={`w-12 h-12 mb-4 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <TrustIndicators />
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-700 border-0">
              Calculate Your Savings
            </Badge>
            <h2 className="text-4xl font-bold mb-4">See Your Return on Investment</h2>
            <p className="text-xl text-slate-600">
              Most practices save over $200,000 annually with SpaStream
            </p>
          </div>
          <ROICalculator />
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-yellow-100 text-yellow-700 border-0">
              <Star className="w-3 h-3 mr-1 inline" />
              Trusted by Med Spa Owners
            </Badge>
            <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Join hundreds of successful medical spas using SpaStream
            </p>
          </div>
          <CustomerTestimonials />
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
              Why SpaStream Wins
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Compare SpaStream vs Competitors</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              See why leading med spas are switching to SpaStream
            </p>
          </div>
          <ComparisonTable />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 border-0">
              Simple, Transparent Pricing
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Start with a 14-day free trial. No credit card required. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <Card
                key={index}
                className={`relative ${tier.popular ? 'border-blue-500 border-2 shadow-xl scale-105' : 'border-2'}`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${tier.price}</span>
                    <span className="text-slate-600">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/app">
                    <Button
                      className={`w-full ${tier.popular ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : ''}`}
                      variant={tier.popular ? 'default' : 'outline'}
                      size="lg"
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-600 mb-4">Need custom pricing or have questions?</p>
            <Button variant="outline" size="lg">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Med Spa?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of aesthetic practices using SpaStream to streamline operations and increase revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/app">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent text-white border-white hover:bg-white/10">
                Learn More
              </Button>
            </Link>
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
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/" className="hover:text-white">Demo</a></li>
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
