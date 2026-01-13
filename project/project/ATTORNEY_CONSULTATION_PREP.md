# Attorney Consultation Preparation Guide
## Healthcare Technology Legal Review - SpaStream

**Purpose:** Initial consultation with healthcare technology attorney for SaaS platform legal review and HIPAA compliance

---

## 📋 **INFORMATION TO HAVE READY**

### **1. Business Overview (30-second pitch)**

**Your Elevator Pitch:**
> "SpaStream is a HIPAA-compliant practice management platform built exclusively for medical spas. We provide scheduling, client records, payment processing, and AI-powered practice optimization. We're a B2B SaaS platform charging $299-$1,499/month plus a 2% platform fee on payment processing over $50k/month. We're pre-launch, targeting 60 customers in year one."

### **2. Company Information**

**Have This Ready:**
- [ ] **Business Structure:** LLC / C-Corp / S-Corp / Sole Proprietorship (specify which)
- [ ] **Formation Date:** When you incorporated
- [ ] **State of Incorporation:** Where you're registered
- [ ] **EIN (Employer Identification Number):** Your tax ID
- [ ] **Founders:** How many, equity split, roles
- [ ] **Current Employees/Contractors:** Number and roles
- [ ] **Funding Status:** Bootstrapped / Angel / VC (amount raised if any)
- [ ] **Current Stage:** Pre-launch / Beta / Live customers

**If Pre-Incorporation:**
- Be ready to discuss whether you need help incorporating
- Know if you have co-founders and planned equity split

### **3. Product & Technology Details**

**Core Platform:**
- Cloud-based SaaS (subscription model)
- Built on: Supabase (PostgreSQL database), Next.js, hosted on Vercel/AWS
- Stores Protected Health Information (PHI) - client medical records, photos, treatment notes
- HIPAA compliance is critical
- Multi-tenant architecture (each customer has isolated data)

**Data We Store:**
- Patient/client names, DOB, contact info, photos
- Medical history, treatment records, consent forms
- Appointment history, treatment notes
- Payment and billing information
- Before/after photos

**Third-Party Services (Subprocessors):**
- Supabase: Database and hosting (needs BAA)
- Stripe: Payment processing
- Twilio: SMS notifications
- Resend: Email notifications
- Vercel/AWS: Application hosting

### **4. Target Customers**

**Primary Market:**
- Medical spas, aesthetic clinics, wellness centers
- Licensed healthcare providers (NPs, PAs, MDs)
- 6,000 potential customers in US market
- Customers operate in all 50 states

**Customer Jurisdictions:**
- You will serve customers nationwide (multi-state operation)
- Customers may have clients in multiple states
- Need to understand state-by-state compliance requirements

### **5. Revenue Model**

**Pricing Structure:**
- Subscription tiers: $299 - $1,499/month
- Platform fee: 2% on payment processing volume over $50,000/month
- Additional: SMS credits, professional services, training

**Payment Flow:**
- Customers process client payments through our platform (via Stripe Connect)
- We collect platform fee automatically
- Customers receive net settlement

**Revenue Projections:**
- Year 1: $176k-$353k
- Year 2: $1.3M-$2.7M
- Year 5: $8M-$13M

### **6. Current Legal Documents**

**What You Have:**
- Master Service Agreement (MSA) - template
- Data Processing Agreement (DPA) - template
- Service Level Agreement (SLA) - template
- Acceptable Use Policy (AUP) - template
- Terms of Service (public-facing)
- Privacy Policy (HIPAA-focused)

**All documents include disclaimer:** "Template for discussion purposes only. Must be reviewed by qualified healthcare technology attorney."

**What You DON'T Have (why you're here):**
- Business Associate Agreement (BAA) with customers
- BAA with Supabase (infrastructure provider)
- Payment processing terms/addendum
- Founder agreement (if applicable)
- Employment/contractor templates
- NDA template

---

## ❓ **QUESTIONS YOU'LL BE ASKED**

### **Business & Compliance Questions**

**1. "Are you currently handling any PHI or do you have paying customers?"**
- **Answer honestly:** "No, we're pre-launch. I want to get everything legally compliant before onboarding our first customer."
- **Why they ask:** Determines urgency and potential liability exposure

**2. "What is your business entity structure?"**
- **Answer:** LLC / C-Corp / Not yet incorporated
- **Be ready to discuss:** If not incorporated, they may recommend structuring (C-Corp for VC funding, LLC for bootstrapped)

**3. "Do you have co-founders? What's the equity split?"**
- **Answer:** Solo founder / 2 founders with X/Y split / etc.
- **Why they ask:** Need founder/shareholder agreement if multiple founders

**4. "What states will your customers operate in?"**
- **Answer:** "All 50 states potentially. Starting with California, Texas, Florida, New York (top med spa markets)."
- **Why they ask:** Multi-state operation has compliance implications

**5. "Have you signed any agreements with Supabase, Stripe, or other vendors?"**
- **Answer:** "Using standard service agreements. Haven't executed a BAA with Supabase yet."
- **Why they ask:** Need to review vendor agreements for liability and BAA requirements

### **HIPAA & Healthcare Compliance**

**6. "How are you handling HIPAA compliance technically?"**
- **Your Answer:**
  - "Data encrypted at rest (AES-256) and in transit (TLS 1.3)"
  - "Role-based access controls"
  - "Audit logging of all PHI access"
  - "Automatic session timeouts"
  - "Planning SOC 2 audit within 12-18 months"

**7. "Do you understand you're a Business Associate under HIPAA?"**
- **Answer:** "Yes. My customers (medical spas) are Covered Entities, and I'm their Business Associate. I need a BAA with each customer before they can store PHI. I also need a BAA with Supabase since they're my subcontractor."
- **Why they ask:** Testing your HIPAA knowledge

**8. "What's your breach notification plan?"**
- **Answer:** "Not yet formalized. I know HIPAA requires notification within 60 days. Need help creating incident response procedures."
- **Why they ask:** Required by HIPAA; shows you're thinking ahead

**9. "Are your customers' clients receiving direct medical treatment?"**
- **Answer:** "Yes, injectables (Botox, fillers), laser treatments, body contouring, etc. These are medical procedures performed by licensed providers."
- **Why they ask:** Confirms HIPAA applies (vs. wellness/beauty services)

**10. "What licenses do your customers need?"**
- **Answer:** "Medical spas must be owned or supervised by licensed physicians. Providers are typically NPs, PAs, or MDs with appropriate state licenses and DEA numbers for controlled substances."
- **Why they ask:** Liability question - are you giving medical advice or just software?

### **Payment Processing & Contracts**

**11. "Explain your payment processing model."**
- **Your Answer:**
  - "Using Stripe Connect platform model"
  - "Customers connect their Stripe accounts"
  - "We charge 2% platform fee on volume over $50k/month"
  - "First $50k/month is free"
  - "Stripe handles actual payment processing (we don't touch credit card data)"

**12. "How do you handle payment disputes and chargebacks?"**
- **Answer:** "Not yet defined. Need help determining our liability vs. customer liability for disputes."
- **Why they ask:** This is a major liability area for payment platforms

**13. "What happens if a customer cancels their subscription?"**
- **Answer:** "Month-to-month billing. Access continues through end of billing period. Customer has 30 days to export data, then we delete after 90-day retention period."
- **Why they ask:** Data retention and customer rights

**14. "What are your refund policies?"**
- **Answer:** "Currently: no refunds on subscription fees, no refunds on annual prepayments. But open to guidance."
- **Why they ask:** Consumer protection laws, dispute prevention

### **Intellectual Property & Liability**

**15. "Who owns the IP in your platform?"**
- **Answer:** "I do (or the company does). Customers own their data. AI models trained on anonymized aggregate data."
- **Why they ask:** IP ownership clarity is critical

**16. "What's your liability cap in customer agreements?"**
- **Answer:** "Currently 12 months of fees paid, with exceptions for data breaches (capped at $2M), indemnification, and gross negligence."
- **Why they ask:** Assessing risk exposure and insurance needs

**17. "Do you have any insurance?"**
- **Answer likely:** "Not yet. Planning to get cyber liability insurance and E&O insurance once we have revenue."
- **Why they ask:** Insurance is critical for healthcare tech

### **Future Plans**

**18. "Are you planning to raise venture capital?"**
- **Answer:** Bootstrapped / Seed round in 6-12 months / Already raised
- **Why they ask:** Affects entity structure, equity, and agreement complexity

**19. "Do you plan to hire employees or contractors?"**
- **Answer:** "Yes, likely 1-2 contractors within 6 months for support/sales."
- **Why they ask:** Need employment agreements

**20. "Any plans for international expansion?"**
- **Answer:** "Not immediately. Canada possibly in years 2-3. Focus is US market first."
- **Why they ask:** International compliance (GDPR, etc.) is complex

---

## 🎯 **YOUR QUESTIONS FOR THE ATTORNEY**

### **Critical Questions to Ask:**

**HIPAA & Compliance:**
1. "What's the process for getting a BAA with Supabase? Do I need their enterprise plan?"
2. "Do I need a separate BAA for each customer, or can I have one standard BAA template?"
3. "What are my breach notification obligations specifically?"
4. "Do I need to register as a Business Associate anywhere, or is just having BAAs enough?"
5. "Should I get a HIPAA compliance audit before launching?"

**Contracts & Agreements:**
6. "Can you review and customize my existing agreement templates?"
7. "What's missing from my current legal documents?"
8. "Do I need separate Terms of Service for the app vs. website?"
9. "Should my payment processing terms be part of the MSA or separate?"

**Payment Processing:**
10. "What's my liability for customer payment disputes?"
11. "How should I structure my platform fee legally?"
12. "Do I need to register as a payment facilitator or money transmitter anywhere?"
13. "What disclosures do I need for the 2% platform fee?"

**Liability & Insurance:**
14. "What insurance do I absolutely need before launching?" (Cyber liability, E&O, general liability)
15. "Are my liability caps in the MSA appropriate?"
16. "Should I form a separate entity for liability protection?"

**Operational:**
17. "What's the process if I need to hire contractors? What agreements do I need?"
18. "Do I need an NDA template for customer demos and investor meetings?"
19. "If I have a co-founder, what should be in our founder agreement?"

**Cost & Timeline:**
20. "What will it cost to get my documents production-ready?"
21. "What's the timeline to get BAAs and other critical documents finalized?"
22. "Do you offer ongoing legal support/retainer, and what does that cost?"

---

## 💼 **WHAT TO BRING TO THE CONSULTATION**

### **Digital Documents to Share:**
- [ ] Your existing legal documents (MSA, DPA, SLA, AUP)
- [ ] Links to your website/app (if live)
- [ ] One-page business summary (revenue model, target market)
- [ ] This preparation document
- [ ] Company formation documents (articles of incorporation, operating agreement)

### **Be Ready to Discuss Budget:**

**Typical Costs for Healthcare SaaS Legal Work:**
- Initial document review & consultation: $500-$2,000
- BAA template creation: $2,000-$5,000
- Full MSA/contract customization: $3,000-$7,000
- Ongoing monthly retainer: $500-$1,500/month

**Your Budget Question:**
- "What will it cost to get launch-ready?" (BAA + contract review)
- "Can we phase the work?" (critical documents first, optional later)

---

## ✅ **CONSULTATION SUCCESS CHECKLIST**

**Before the call:**
- [ ] Review this document thoroughly
- [ ] Have all company info accessible (EIN, formation docs, etc.)
- [ ] Review your existing legal documents one more time
- [ ] Write down your specific concerns/questions
- [ ] Know your budget range

**During the call:**
- [ ] Take notes (or record if permitted)
- [ ] Ask for clarification if you don't understand something
- [ ] Get specific timeline for deliverables
- [ ] Understand exactly what you're paying for
- [ ] Ask about their healthcare tech experience specifically

**After the call:**
- [ ] Send thank you email with any follow-up questions
- [ ] Review proposal/engagement letter carefully
- [ ] Check references if engaging for major work
- [ ] Set clear deadlines for critical documents (BAA before first customer)

---

## 🚩 **RED FLAGS TO WATCH FOR**

**Warning signs of wrong attorney:**
- ❌ Not familiar with HIPAA or healthcare tech
- ❌ Treats SaaS like a general business (not specialized)
- ❌ Can't explain BAA requirements clearly
- ❌ Suggests launching without BAAs ("we'll handle it later")
- ❌ Extremely expensive with no itemization
- ❌ No experience with Stripe Connect or payment platforms
- ❌ Pushes services you don't need right now

**Green flags (right attorney):**
- ✅ Has other healthcare SaaS clients
- ✅ Familiar with Stripe, Supabase, modern SaaS stack
- ✅ Explains things clearly without excessive legal jargon
- ✅ Prioritizes BAA and critical compliance first
- ✅ Reasonable pricing with clear scope
- ✅ Offers ongoing support options
- ✅ Asks good questions about your technical setup

---

## 📞 **EXPECTED CONSULTATION OUTCOME**

**What You Should Walk Away With:**

1. **Clear understanding** of what documents you need immediately vs. later
2. **Cost estimate** for getting launch-ready legally
3. **Timeline** for BAA creation and contract review
4. **Action items** ranked by priority
5. **Engagement proposal** or next steps

**Typical Next Steps After Consultation:**
1. Attorney sends engagement letter and proposal
2. You sign and pay retainer (typically 50% upfront)
3. Attorney customizes your templates and creates BAA
4. You review drafts and provide feedback
5. Final documents delivered in 2-4 weeks
6. Ongoing support as needed (optional retainer)

---

## 🎓 **BONUS: SOUND KNOWLEDGEABLE**

**Terms to Use Confidently:**

- "Business Associate Agreement" (not "BAA contract")
- "Protected Health Information" or "PHI" (not just "medical data")
- "Covered Entity" (your customers) vs. "Business Associate" (you)
- "Subprocessor" (vendors who process data on your behalf)
- "Multi-tenant SaaS architecture" (not just "cloud software")
- "Stripe Connect platform model" (not just "payment processing")
- "AES-256 encryption at rest" and "TLS 1.3 in transit"
- "Role-based access control (RBAC)"
- "SOC 2 Type II certification" (for future compliance)

**How to Discuss Technical Implementation:**
- "We've implemented encryption, audit logging, and access controls"
- "Our infrastructure provider is HIPAA-capable and offers BAA"
- "We don't store credit card data - Stripe handles that"
- "Each customer's data is logically isolated in our multi-tenant architecture"
- "We follow OWASP security best practices"

---

## 💡 **FINAL TIPS**

**Do:**
- ✅ Be honest about what you don't know
- ✅ Ask "dumb questions" - better now than after a breach
- ✅ Take notes - you'll reference this conversation
- ✅ Follow up in writing with key takeaways
- ✅ Act on their recommendations promptly

**Don't:**
- ❌ Pretend to know more than you do
- ❌ Try to negotiate fixed fees in first consultation
- ❌ Rush to hire the first attorney you talk to
- ❌ Skip reviewing their work carefully
- ❌ Launch without critical BAAs in place

**Remember:**
This attorney relationship could last years. Find someone who:
- Understands your business model
- Explains things clearly
- Responds promptly
- Prices fairly
- Makes you feel confident, not confused

---

**Last Updated:** November 25, 2025

**Next Steps:**
1. Review this document
2. Schedule attorney consultation
3. Send this prep document to attorney 24-48 hours before call
4. Have your questions ready
5. Take good notes during consultation
6. Follow up with any clarifications needed

**Good luck! You've got this. 🚀**
