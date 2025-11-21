'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, BookOpen, CheckCircle2 } from 'lucide-react';
import { generateQuickStartGuide } from '@/lib/quick-start-guide-generator';
import { useState } from 'react';

export default function QuickStartGuidePage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateQuickStartGuide();
    } catch (error) {
      console.error('Failed to generate guide:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <BookOpen className="w-16 h-16 text-teal-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            SpaStream Quick Start Guide
          </h1>
          <p className="text-lg text-gray-600">
            A comprehensive guide to help your clients get started with SpaStream
          </p>
        </div>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle>What's Inside</CardTitle>
            <CardDescription>
              This professional PDF guide includes everything your clients need to know
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Getting Started</h3>
                  <p className="text-sm text-gray-600">First login, profile setup, and initial configuration</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Dashboard Overview</h3>
                  <p className="text-sm text-gray-600">Navigation menu and quick stats cards explained</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Managing Clients</h3>
                  <p className="text-sm text-gray-600">Add, import, and manage client profiles</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Scheduling Appointments</h3>
                  <p className="text-sm text-gray-600">Create, reschedule, and manage bookings</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Services & Pricing</h3>
                  <p className="text-sm text-gray-600">Set up services, packages, and dynamic pricing</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Processing Payments</h3>
                  <p className="text-sm text-gray-600">Take payments, create invoices, and send payment links</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Pro Tips</h3>
                  <p className="text-sm text-gray-600">Best practices to maximize your SpaStream experience</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Support & Resources</h3>
                  <p className="text-sm text-gray-600">Contact information and additional help resources</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-white border-0">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Ready to Download?</h2>
              <p className="mb-6 text-teal-50">
                Generate a professional PDF guide to share with your clients
              </p>
              <Button
                onClick={handleDownload}
                disabled={isGenerating}
                size="lg"
                className="bg-white text-teal-600 hover:bg-teal-50 font-semibold shadow-lg"
              >
                <Download className="w-5 h-5 mr-2" />
                {isGenerating ? 'Generating...' : 'Download Quick Start Guide'}
              </Button>
              <p className="mt-4 text-sm text-teal-50">
                The PDF will be automatically downloaded to your device
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Questions? Contact us at{' '}
            <a href="mailto:support@spastream.net" className="text-teal-600 hover:underline">
              support@spastream.net
            </a>
            {' '}or call{' '}
            <a href="tel:4046603648" className="text-teal-600 hover:underline">
              404-660-3648
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
