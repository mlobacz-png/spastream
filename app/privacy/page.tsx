export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
          <h1 className="text-4xl font-light text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mb-8">Last Updated: October 31, 2025</p>

          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Introduction</h2>
              <p className="leading-relaxed">
                SpaStream ("we," "our," or "us") is committed to protecting your privacy and maintaining the security of your protected health information (PHI). This Privacy Policy explains how we collect, use, disclose, and safeguard your information in compliance with the Health Insurance Portability and Accountability Act (HIPAA) and other applicable privacy laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">HIPAA Compliance</h2>
              <p className="leading-relaxed mb-4">
                As a platform serving healthcare providers, we maintain strict HIPAA compliance standards:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>All PHI is encrypted both in transit (TLS 1.3) and at rest (AES-256)</li>
                <li>Access to PHI is restricted through authentication and role-based access controls</li>
                <li>We maintain comprehensive audit logs of all PHI access and modifications</li>
                <li>Our infrastructure partner (Supabase) is HIPAA-compliant and operates under a Business Associate Agreement (BAA)</li>
                <li>Regular security assessments and vulnerability scanning</li>
                <li>Breach notification procedures as required by HIPAA</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Information We Collect</h2>

              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Protected Health Information (PHI)</h3>
              <p className="leading-relaxed mb-4">
                Healthcare providers using our platform may store the following PHI about their clients:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name, date of birth, contact information</li>
                <li>Medical history and treatment records</li>
                <li>Appointment history and notes</li>
                <li>Photos documenting treatment progress</li>
                <li>Consent forms and medical documentation</li>
                <li>Payment and billing information</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Account Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Email address and password (encrypted)</li>
                <li>Practice information and business details</li>
                <li>Usage data and application logs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">How We Use Your Information</h2>
              <p className="leading-relaxed mb-4">We use collected information for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Treatment:</strong> To enable healthcare providers to deliver and coordinate care</li>
                <li><strong>Payment:</strong> To process payments and manage billing</li>
                <li><strong>Operations:</strong> To provide, maintain, and improve our services</li>
                <li><strong>Communication:</strong> To send appointment reminders and system notifications</li>
                <li><strong>Security:</strong> To protect against fraud, unauthorized access, and security threats</li>
                <li><strong>Compliance:</strong> To meet legal and regulatory requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Information Sharing and Disclosure</h2>
              <p className="leading-relaxed mb-4">
                We do not sell your information. We may share information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>With Your Consent:</strong> When you explicitly authorize disclosure</li>
                <li><strong>Service Providers:</strong> With HIPAA-compliant vendors who assist in operating our platform (all operate under BAAs)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                <li><strong>Emergency Situations:</strong> To prevent serious harm or threat to health or safety</li>
                <li><strong>Business Transfers:</strong> In connection with a merger or acquisition (with continued privacy protections)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Data Security</h2>
              <p className="leading-relaxed mb-4">We implement comprehensive security measures:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>End-to-end encryption for all data transmission</li>
                <li>Encrypted database storage with AES-256</li>
                <li>Multi-factor authentication options</li>
                <li>Regular security audits and penetration testing</li>
                <li>Automatic session timeouts and access controls</li>
                <li>Employee training on HIPAA compliance</li>
                <li>Incident response and breach notification procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Your Rights Under HIPAA</h2>
              <p className="leading-relaxed mb-4">As a patient or client, you have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Review and obtain copies of your health information</li>
                <li><strong>Amendment:</strong> Request corrections to inaccurate information</li>
                <li><strong>Accounting:</strong> Receive a list of disclosures of your information</li>
                <li><strong>Restriction:</strong> Request limits on use or disclosure of your information</li>
                <li><strong>Confidential Communication:</strong> Request communication through alternative means</li>
                <li><strong>Breach Notification:</strong> Be notified of any breach of your PHI</li>
              </ul>
              <p className="leading-relaxed mt-4">
                To exercise these rights, contact your healthcare provider directly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Data Retention</h2>
              <p className="leading-relaxed">
                We retain your information as long as your account is active or as needed to provide services. Healthcare providers are responsible for maintaining records according to applicable state and federal laws (typically 7-10 years for medical records). When data is deleted, it is securely destroyed from all systems including backups.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Children's Privacy</h2>
              <p className="leading-relaxed">
                Our services are not directed to individuals under 18. We do not knowingly collect information from minors without parental consent as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">International Data Transfers</h2>
              <p className="leading-relaxed">
                Your information is stored on servers located in the United States. If you are accessing our services from outside the US, please be aware that your information may be transferred to, stored, and processed in the US where our servers are located.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Changes to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of material changes by email or through the application. Your continued use of our services after changes take effect constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Contact Us</h2>
              <p className="leading-relaxed mb-4">
                If you have questions about this Privacy Policy or our privacy practices:
              </p>
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <p className="font-semibold text-slate-900 mb-2">Privacy Officer</p>
                <p className="text-slate-700">Email: privacy@medspaflow.com</p>
                <p className="text-slate-700">Address: [Your Business Address]</p>
                <p className="text-slate-700 mt-4">
                  For HIPAA-related complaints, you may also contact the Office for Civil Rights at the U.S. Department of Health and Human Services.
                </p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <a
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
