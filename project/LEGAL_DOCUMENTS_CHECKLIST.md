# SpaStream Legal Documents Checklist

## ✅ **DOCUMENTS YOU ALREADY HAVE**

### **Core Legal Documents (4)**

| Document | Status | Location | Last Updated | Purpose |
|----------|--------|----------|--------------|---------|
| **Master Service Agreement (MSA)** | ✅ Complete | `/MASTER_SERVICE_AGREEMENT.md` | Nov 2025 | Primary customer contract covering all services, pricing, IP rights, liability, and terms |
| **Data Processing Agreement (DPA)** | ✅ Complete | `/DATA_PROCESSING_AGREEMENT.md` | - | GDPR/CCPA compliance for data processing activities |
| **Service Level Agreement (SLA)** | ✅ Complete | `/SERVICE_LEVEL_AGREEMENT.md` | - | Uptime guarantees, support response times, service credits |
| **Acceptable Use Policy (AUP)** | ✅ Complete | `/ACCEPTABLE_USE_POLICY.md` | - | Rules for appropriate platform usage |

### **Consumer-Facing Legal Pages (2)**

| Document | Status | Location | Format | Purpose |
|----------|--------|----------|--------|---------|
| **Terms of Service** | ✅ Complete | `/app/terms/page.tsx` | Live page | Public-facing terms for website/app users |
| **Privacy Policy** | ✅ Complete | `/app/privacy/page.tsx` | Live page | HIPAA-compliant privacy policy for all users |

---

## ⚠️ **CRITICAL DOCUMENTS YOU NEED**

### **Healthcare Compliance (2 documents)**

| Document | Priority | Why You Need It |
|----------|----------|-----------------|
| **Business Associate Agreement (BAA)** | 🔴 **CRITICAL** | **Legally required by HIPAA** before handling any PHI. Must be executed with every customer who will store patient data. Without this, you cannot legally operate. |
| **BAA with Supabase** | 🔴 **CRITICAL** | You need a signed BAA with Supabase (your infrastructure provider) since they process PHI on your behalf. Supabase offers BAA for enterprise customers. |

### **Payment Processing (2 documents)**

| Document | Priority | Why You Need It |
|----------|----------|-----------------|
| **Stripe Connected Account Agreement** | 🔴 **CRITICAL** | Required for payment processing. Defines platform liability, fee structure, dispute handling. This is typically Stripe's standard agreement but you need to review it. |
| **Payment Processing Terms Addendum** | 🟡 **Important** | Clarifies your 2% platform fee, when it applies, how it's calculated, and customer responsibilities for payment disputes. |

### **Operational & Protection (5 documents)**

| Document | Priority | Why You Need It |
|----------|----------|-----------------|
| **Founder/Shareholder Agreement** | 🟡 **Important** | Defines equity split, vesting schedules, roles, decision-making authority, exit scenarios. Critical if you have co-founders. |
| **Employee/Contractor Agreement Template** | 🟡 **Important** | Standard agreement for hiring employees and contractors. Includes IP assignment, confidentiality, non-compete (if applicable). |
| **Non-Disclosure Agreement (NDA)** | 🟡 **Important** | For sharing sensitive business information with potential investors, partners, contractors, or beta customers. |
| **Cookie Policy** | 🟢 **Recommended** | Required if you use cookies on your website (analytics, marketing, etc.). GDPR/CCPA compliance. |
| **Subprocessor List** | 🟢 **Recommended** | Formal list of all third-party services that process customer data (Twilio, Stripe, Supabase, Resend, etc.). Referenced in your DPA. |

### **Customer Relations (3 documents)**

| Document | Priority | Why You Need It |
|----------|----------|-----------------|
| **Refund & Cancellation Policy** | 🟢 **Recommended** | Clear policy on refunds, pro-rated cancellations, final billing. Reduces disputes. |
| **Security & Incident Response Policy** | 🟢 **Recommended** | Documents how you handle security incidents, breach notification procedures, customer communication. Required for SOC 2. |
| **Data Breach Notification Template** | 🟢 **Recommended** | Pre-written template for notifying customers and authorities in case of a data breach. HIPAA requires notification within 60 days. |

---

## 📋 **OPTIONAL BUT VALUABLE DOCUMENTS**

| Document | When You Need It |
|----------|------------------|
| **Investor Term Sheet** | When raising funding (seed round, Series A) |
| **API Terms of Service** | When you offer API access (Premium/Enterprise tiers) |
| **Reseller/Partner Agreement** | If you work with channel partners or consultants who resell your software |
| **White-Label Agreement** | For Enterprise customers who want branded versions |
| **Professional Services Agreement** | For custom development, training, or consulting work |
| **Trademark License Agreement** | If partners use your logo/brand |
| **HIPAA Compliance Certification** | Third-party audit/certification (expensive but valuable for enterprise sales) |
| **SOC 2 Type II Certification** | Security audit report (required by many enterprise customers) |
| **Cyber Insurance Policy** | Protects against data breach liability (highly recommended) |

---

## 🚨 **IMMEDIATE ACTION ITEMS**

### **Before Launching to Customers:**

1. **Create Business Associate Agreement (BAA)** 🔴
   - Must be signed by EVERY customer who stores PHI
   - Must be executed BEFORE they upload any patient data
   - Template available from healthcare attorneys (~$2,000-5,000)

2. **Execute BAA with Supabase** 🔴
   - Contact Supabase to sign their BAA
   - Typically requires Enterprise plan or custom pricing
   - Cannot legally store PHI without this

3. **Review Stripe Connected Accounts Agreement** 🔴
   - Understand your liability for payment disputes
   - Ensure compliance with Stripe's platform fee rules
   - Add payment terms to customer agreements

4. **Create Payment Processing Addendum** 🟡
   - Clarify 2% platform fee structure
   - Define threshold ($50k free processing)
   - Explain fee calculation and billing

### **Before Hiring First Employee/Contractor:**

5. **Create Employment/Contractor Agreements** 🟡
   - Include IP assignment clause
   - Confidentiality obligations
   - Non-compete if applicable

6. **Establish NDA** 🟡
   - For beta customers
   - For contractor/consultant discussions
   - For investor meetings

### **For GDPR/CCPA Compliance:**

7. **Add Cookie Policy** 🟢
   - If using Google Analytics, Facebook Pixel, etc.
   - Link from footer on website

8. **Document Subprocessors** 🟢
   - List all third-party services
   - Update when adding new services
   - Referenced in DPA

---

## 💡 **LEGAL REVIEW RECOMMENDATIONS**

### **Critical Reminder:**

All documents you have include this disclaimer:
> "This is a template document for discussion purposes only. It must be reviewed and customized by a qualified healthcare technology attorney licensed in your jurisdiction before use."

### **Recommended Legal Budget:**

| Service | Estimated Cost | Priority |
|---------|---------------|----------|
| Healthcare attorney review of all agreements | $5,000-$10,000 | 🔴 **Critical** |
| BAA template creation | $2,000-$5,000 | 🔴 **Critical** |
| Payment processing legal review | $1,500-$3,000 | 🟡 **Important** |
| Ongoing legal retainer (monthly) | $500-$1,500/mo | 🟢 **Recommended** |
| SOC 2 audit & certification | $15,000-$50,000 | 🟢 Later stage |

### **Where to Find Legal Help:**

1. **Healthcare Tech Attorneys**: Firms specializing in digital health, SaaS, and HIPAA compliance
2. **LegalZoom/Rocket Lawyer**: Budget option for standard templates (NOT recommended for BAA)
3. **Cooley GO**: Free startup legal resources and document templates
4. **YC Legal Library**: Free templates if you're part of Y Combinator ecosystem
5. **UpCounsel**: Marketplace for attorneys (good for one-off reviews)

---

## ✅ **SUMMARY**

**You have: 6 legal documents** ✅
**You need immediately: 4 documents** 🔴
**You should create soon: 8 documents** 🟡🟢
**Optional for later: 9+ documents** 📋

**Priority 1 (Before ANY customers):**
- Business Associate Agreement (BAA) with customers
- BAA with Supabase
- Stripe payment terms review
- Payment processing addendum

**Priority 2 (Before hiring/raising funds):**
- Founder agreement (if applicable)
- Employee/contractor templates
- NDA template

**Priority 3 (For compliance & growth):**
- Cookie policy
- Subprocessor list
- Security policies
- Refund policy

**Your existing documents are comprehensive and well-structured. Get them reviewed by a healthcare tech attorney before using them with actual customers.**

---

## 📞 **NEXT STEPS**

1. ✅ Print or bookmark this checklist
2. 🔴 Schedule consultation with healthcare tech attorney (within 2 weeks)
3. 🔴 Contact Supabase about BAA for HIPAA compliance
4. 🔴 Review Stripe Connected Accounts documentation
5. 🟡 Create BAA template with attorney before first customer signs up
6. 🟡 Draft payment processing addendum
7. 🟢 Begin documenting subprocessors list
8. 🟢 Add cookie policy to website

**Last Updated:** November 25, 2025
