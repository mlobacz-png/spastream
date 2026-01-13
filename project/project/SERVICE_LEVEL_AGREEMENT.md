# SPASTREAM SERVICE LEVEL AGREEMENT (SLA)

**IMPORTANT LEGAL NOTICE**: This is a template document for discussion purposes only. It must be reviewed and customized by a qualified attorney licensed in your jurisdiction before use. This template does not constitute legal advice and should not be used without professional legal review.

**Effective Date**: [DATE]

**Last Updated**: November 2025

---

## 1. INTRODUCTION AND SCOPE

**1.1 Purpose**

This Service Level Agreement ("SLA") defines the level of service that SpaStream commits to provide to its clients, including uptime guarantees, support response times, and remedies for failure to meet commitments.

**1.2 Agreement**

This SLA is incorporated into and forms part of the Master Service Agreement ("MSA") between SpaStream and Client. All capitalized terms not defined in this SLA have the meanings given in the MSA.

**1.3 Applicability**

This SLA applies to:
- All clients with active, paid subscriptions
- All features and services included in your Subscription Tier
- Support services as specified for your tier

**1.4 Service Tiers**

Different SLA commitments apply based on your Subscription Tier:
- **Starter Tier**: Standard SLA
- **Professional Tier**: Standard SLA with enhanced support
- **Premium Tier**: Enhanced SLA with priority support
- **Enterprise Tier**: Premium SLA with dedicated support and custom terms

---

## 2. DEFINITIONS

**2.1 Key Terms**

- **"Uptime"** means the percentage of time during a calendar month that the Platform is available and accessible to Client for use.

- **"Downtime"** means the total number of minutes during a calendar month that the Platform is unavailable due to a Service Failure.

- **"Service Failure"** means the Platform is completely unavailable or substantially non-functional such that Client cannot access core features (scheduling, client records, or appointment booking) for a continuous period of at least 5 minutes.

- **"Monthly Uptime Percentage"** means:
  ```
  [(Total Minutes in Month - Downtime Minutes) / Total Minutes in Month] × 100
  ```

- **"Service Credit"** means a credit toward future subscription fees issued as a remedy for failing to meet Uptime commitments.

- **"Emergency Maintenance"** means unscheduled maintenance required to address critical security vulnerabilities, system failures, or other urgent issues.

- **"Scheduled Maintenance"** means planned maintenance activities that are announced at least 7 days in advance.

**2.2 Business Hours**

- **Business Hours**: Monday through Friday, 9:00 AM to 6:00 PM Eastern Time, excluding U.S. federal holidays
- **Business Days**: Monday through Friday, excluding U.S. federal holidays

**2.3 Severity Levels**

**Severity 1 (Critical):**
- Platform completely unavailable
- Data loss or corruption
- Security breach or PHI exposure
- No workaround available
- Impact: All users unable to work

**Severity 2 (High):**
- Major feature not functioning (e.g., scheduling, payments)
- Significant performance degradation
- Limited workaround available
- Impact: Multiple users significantly affected

**Severity 3 (Medium):**
- Minor feature not functioning
- Moderate performance issues
- Workaround available
- Impact: Some users affected, business can continue

**Severity 4 (Low):**
- Cosmetic issues
- Minor bugs or inconveniences
- Full workaround available
- Impact: Minimal business impact

---

## 3. UPTIME COMMITMENTS

**3.1 Uptime Guarantees by Tier**

| Subscription Tier | Monthly Uptime Commitment | Maximum Allowed Downtime/Month |
|-------------------|---------------------------|--------------------------------|
| **Starter** | 99.5% | ~3 hours 37 minutes |
| **Professional** | 99.5% | ~3 hours 37 minutes |
| **Premium** | 99.9% | ~43 minutes |
| **Enterprise** | 99.9% | ~43 minutes |

**3.2 Uptime Measurement**

Uptime is measured:
- Automatically by SpaStream's monitoring systems
- From multiple geographic locations
- Using synthetic transactions that test core Platform functionality
- 24 hours a day, 7 days a week
- Published in real-time at: status.spastream.com

**3.3 Service Failures**

A Service Failure occurs when:
- The Platform login page is inaccessible
- Core features (scheduling, client records, booking portal) are completely unavailable
- API calls return error rates exceeding 5% for 5+ consecutive minutes
- Response times exceed 10 seconds for 5+ consecutive minutes

**3.4 Exclusions from Uptime Calculation**

Uptime commitments do NOT include downtime resulting from:

a) **Scheduled Maintenance**:
   - Planned maintenance with 7+ days' advance notice
   - Maximum 4 hours per month
   - Scheduled during off-peak hours (typically 2-6 AM ET)

b) **Emergency Maintenance**:
   - Critical security patches
   - Urgent infrastructure repairs
   - System failures beyond SpaStream's control
   - Maximum 2 hours per month (counted if advance notice not provided)

c) **Force Majeure**:
   - Natural disasters
   - War, terrorism, civil unrest
   - Government actions
   - Internet or telecommunications failures beyond SpaStream's control
   - Pandemics or public health emergencies

d) **Client-Caused Issues**:
   - Client's internet or equipment failures
   - Client's misconfiguration or misuse
   - Client's violation of the Acceptable Use Policy
   - DDoS or other attacks targeting Client specifically

e) **Third-Party Service Failures**:
   - Payment processor (Stripe) outages
   - SMS provider (Twilio) outages
   - Email provider (Resend) outages
   - Cloud infrastructure provider failures (if beyond SpaStream's control)

f) **Beta Features**:
   - Features marked as "beta" or "experimental"
   - Preview features not yet generally available

g) **Announced Outages**:
   - Planned outages with 48+ hours' advance notice for major upgrades

**3.5 Maintenance Windows**

**Scheduled Maintenance:**
- Announced at least 7 days in advance via email and status page
- Conducted during low-traffic periods (typically 2-6 AM ET on weekends)
- Limited to 4 hours per month
- Status updates provided every 30 minutes during maintenance

**Emergency Maintenance:**
- Announced as soon as possible (may be concurrent with or after start)
- Conducted only when necessary for security or system integrity
- Completed as quickly as possible
- Status updates provided every 15-30 minutes

---

## 4. SUPPORT COMMITMENTS

**4.1 Support Channels by Tier**

| Tier | Email | Chat | Phone | Slack/Teams | Dedicated Manager |
|------|-------|------|-------|-------------|-------------------|
| **Starter** | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Professional** | ✓ | ✓ | ✓ (Business Hours) | ✗ | ✗ |
| **Premium** | ✓ | ✓ | ✓ (Extended) | ✓ | ✓ (Quarterly) |
| **Enterprise** | ✓ | ✓ | ✓ (24/7) | ✓ | ✓ (Dedicated) |

**4.2 Support Response Times**

### Starter Tier

| Severity | Initial Response Time | Resolution Target |
|----------|----------------------|-------------------|
| Severity 1 | 4 business hours | 24 business hours |
| Severity 2 | 8 business hours | 72 business hours |
| Severity 3 | 24 business hours | 5 business days |
| Severity 4 | 48 business hours | Best effort |

**Support Hours:** Business hours only (9 AM - 6 PM ET, Monday-Friday)

### Professional Tier

| Severity | Initial Response Time | Resolution Target |
|----------|----------------------|-------------------|
| Severity 1 | 2 business hours | 12 business hours |
| Severity 2 | 4 business hours | 48 business hours |
| Severity 3 | 8 business hours | 3 business days |
| Severity 4 | 24 business hours | Best effort |

**Support Hours:** Business hours + phone support during business hours

### Premium Tier

| Severity | Initial Response Time | Resolution Target |
|----------|----------------------|-------------------|
| Severity 1 | 1 hour (24/7) | 8 hours |
| Severity 2 | 2 hours | 24 hours |
| Severity 3 | 4 hours | 48 hours |
| Severity 4 | 8 hours | 72 hours |

**Support Hours:** 24/7 for Severity 1 and 2, extended hours (7 AM - 10 PM ET) for Severity 3 and 4

### Enterprise Tier

| Severity | Initial Response Time | Resolution Target |
|----------|----------------------|-------------------|
| Severity 1 | 30 minutes (24/7) | 4 hours |
| Severity 2 | 1 hour (24/7) | 12 hours |
| Severity 3 | 2 hours | 24 hours |
| Severity 4 | 4 hours | 48 hours |

**Support Hours:** 24/7/365 for all severity levels
**Additional:** Dedicated account manager and technical architect

**4.3 Response Time Measurement**

**Initial Response** means:
- Acknowledgment that support ticket has been received
- Assignment to support agent
- Initial diagnostic or troubleshooting steps
- Does NOT require full resolution

**Resolution** means:
- Issue is resolved or permanently fixed, OR
- Workaround is provided that restores functionality, OR
- Issue is determined to be caused by client's environment (with documentation), OR
- Issue requires feature enhancement (added to product roadmap)

**4.4 Support Availability**

Support is provided via:

**Email Support:**
- support@spastream.com
- Available to all tiers
- Tickets tracked and monitored for SLA compliance

**Chat Support:**
- In-app chat widget
- Available to all tiers during business hours
- Real-time assistance for quick questions

**Phone Support:**
- 1-XXX-XXX-XXXX
- Professional tier: Business hours only
- Premium tier: Extended hours (7 AM - 10 PM ET)
- Enterprise tier: 24/7/365

**Priority Channels (Premium/Enterprise):**
- Dedicated Slack or Microsoft Teams channel
- Direct email to dedicated support team
- Expedited routing and escalation

**4.5 Support Scope**

**Included Support:**
- Technical issues with the Platform
- Account setup and configuration assistance
- Feature usage questions
- Integration troubleshooting
- Performance issues
- Bug reports and resolution
- Security incident response
- Data export assistance

**Not Included (Professional Services):**
- Custom development or feature requests
- Extensive training (beyond onboarding)
- On-site visits (except Enterprise tier)
- Third-party software troubleshooting
- Hardware or network troubleshooting
- Data migration from legacy systems (except as included in tier)
- Custom workflow design (except as included in tier)

Professional services are available for additional fees as specified in the MSA.

**4.6 Support Best Practices**

To receive optimal support:

a) **Provide Complete Information:**
   - Detailed description of the issue
   - Steps to reproduce
   - Screenshots or screen recordings
   - Error messages
   - Impact on business operations (for severity classification)
   - Contact information and preferred communication method

b) **Accurate Severity Classification:**
   - Assign severity level accurately
   - Escalate only when genuinely urgent
   - Abuse of priority channels may result in restrictions

c) **Responsiveness:**
   - Respond promptly to support inquiries
   - Be available for troubleshooting during business hours
   - Provide requested information and access as needed

d) **Single Point of Contact:**
   - Designate primary support contact
   - Avoid multiple team members opening duplicate tickets
   - Consolidate related issues into single ticket when possible

**4.7 Escalation Process**

If you are not satisfied with support response:

**Level 1:** Support Agent
- Initial contact and troubleshooting

**Level 2:** Senior Support Engineer
- Escalate if issue not resolved within response time
- Request escalation via ticket or phone

**Level 3:** Support Manager
- Escalate for complex technical issues or SLA concerns
- Email: support-manager@spastream.com

**Level 4:** VP Customer Success (Premium/Enterprise)
- Escalate for critical business impact issues
- Available via dedicated account manager

**Level 5:** Executive Team (Enterprise only)
- Escalate for existential business threats
- Email: executive-escalation@spastream.com

---

## 5. PERFORMANCE COMMITMENTS

**5.1 Page Load Time**

SpaStream commits to:
- Average page load time < 2 seconds (95th percentile)
- Measured from SpaStream servers (excludes client network latency)
- For standard pages with typical data volumes

**5.2 API Performance**

For clients with API access:
- Average API response time < 500ms (95th percentile)
- API error rate < 1%
- Rate limits as specified in API documentation

**5.3 Data Processing**

- Report generation: < 30 seconds for standard reports
- Data export: < 5 minutes for datasets up to 50,000 records
- Bulk imports: < 10 minutes for datasets up to 10,000 records

**5.4 Performance Monitoring**

Clients can monitor performance at:
- status.spastream.com
- In-app performance dashboard (Premium/Enterprise)

---

## 6. DATA PROTECTION COMMITMENTS

**6.1 Data Backup**

SpaStream commits to:
- Automated daily backups
- Backup retention: 30 days
- Geographic redundancy (backups in multiple regions)
- Backup testing: Monthly
- Backup restoration: Available within 4 hours upon request

**6.2 Data Recovery**

**Recovery Point Objective (RPO):**
- Maximum data loss: < 1 hour
- Continuous replication to standby systems

**Recovery Time Objective (RTO):**
- Premium/Enterprise: < 4 hours
- Starter/Professional: < 8 hours

**6.3 Data Security**

SpaStream commits to:
- AES-256 encryption at rest
- TLS 1.3 encryption in transit
- Annual security audits
- SOC 2 Type II certification (in progress)
- 24/7 security monitoring
- Vulnerability scanning and patching

**6.4 Data Availability**

Upon termination or request:
- Data export available within 24 hours
- Multiple format options (CSV, JSON, PDF)
- Assisted export for Premium/Enterprise tiers

---

## 7. SERVICE CREDITS AND REMEDIES

**7.1 Service Credit Eligibility**

You are eligible for Service Credits if:
- You have an active, paid subscription
- Uptime falls below the committed level for your tier
- You request Service Credits within 30 days of the month in which the failure occurred
- Your account is in good standing (no payment issues or AUP violations)

**7.2 Service Credit Calculation**

### Starter and Professional Tiers (99.5% Commitment)

| Monthly Uptime Achieved | Service Credit |
|-------------------------|----------------|
| 99.0% to < 99.5% | 10% of monthly fee |
| 95.0% to < 99.0% | 25% of monthly fee |
| < 95.0% | 50% of monthly fee |

### Premium and Enterprise Tiers (99.9% Commitment)

| Monthly Uptime Achieved | Service Credit |
|-------------------------|----------------|
| 99.5% to < 99.9% | 10% of monthly fee |
| 99.0% to < 99.5% | 25% of monthly fee |
| 95.0% to < 99.0% | 50% of monthly fee |
| < 95.0% | 100% of monthly fee |

**7.3 Service Credit Terms**

- **Maximum Credit:** 100% of one month's subscription fee
- **Application:** Credits applied to future monthly invoices
- **No Cash Value:** Credits have no cash value and cannot be refunded
- **No Transfer:** Credits cannot be transferred to other accounts
- **Expiration:** Unused credits expire 12 months after issuance

**7.4 How to Request Service Credits**

To request Service Credits:

1. **Submit Request:**
   - Email: sla-credits@spastream.com
   - Subject: "Service Credit Request - [Account Name]"
   - Include: Account details, month of service failure, description of impact

2. **Timeline:**
   - Submit within 30 days of the end of the month in which failure occurred
   - SpaStream will respond within 15 business days
   - Credits applied to next monthly invoice (if approved)

3. **Documentation:**
   - SpaStream's uptime monitoring data is authoritative
   - Client-provided data may be considered but is not determinative

**7.5 Service Credit Limitations**

Service Credits are NOT available for:
- Downtime excluded from Uptime calculation (Section 3.4)
- Free trials or free tiers
- Support response time failures (separate remedy below)
- Performance issues not constituting Service Failures
- Issues caused by Client or third parties

**7.6 Support Response Time Credits**

If SpaStream fails to meet support response time commitments:

**Premium Tier:**
- Failure to meet Severity 1 response time: 5% monthly credit per incident (max 20% per month)

**Enterprise Tier:**
- Failure to meet Severity 1 response time: 10% monthly credit per incident (max 40% per month)
- Failure to meet Severity 2 response time: 5% monthly credit per incident (max 20% per month)

To claim support response credits:
- Email: sla-credits@spastream.com within 30 days
- Include support ticket number and timestamp of submission
- SpaStream will verify via support system logs

**7.7 Sole Remedy**

**Service Credits are your sole and exclusive remedy for SpaStream's failure to meet SLA commitments.** SpaStream's total liability for all SLA failures in any calendar month shall not exceed 100% of the monthly subscription fee for that month.

---

## 8. CLIENT OBLIGATIONS

**8.1 Notification**

Client must:
- Promptly notify SpaStream of service issues via proper support channels
- Provide detailed information about issues
- Cooperate with troubleshooting efforts
- Respond to SpaStream inquiries within reasonable time

**8.2 Proper Use**

Client must:
- Use the Platform in accordance with the MSA and AUP
- Maintain compatible hardware and internet connectivity
- Keep account information current
- Not abuse support channels or submit false SLA claims

**8.3 Payment**

Client must:
- Maintain current payment information
- Pay invoices on time
- Maintain good standing (accounts past due not eligible for SLA commitments)

**8.4 Cooperation**

Client must:
- Cooperate with investigations of service failures
- Provide access to systems/logs if failure may be client-side
- Implement reasonable workarounds when provided
- Not intentionally trigger service failures

---

## 9. MONITORING AND REPORTING

**9.1 Status Page**

Real-time status information available at:
- **URL:** status.spastream.com
- **Information:** Current system status, uptime statistics, planned maintenance, incident history
- **Updates:** Real-time for incidents, daily for metrics

**9.2 Incident Communications**

During service incidents:

**Severity 1:**
- Initial notice: Within 15 minutes of detection
- Updates: Every 30 minutes until resolution
- Post-incident report: Within 48 hours

**Severity 2:**
- Initial notice: Within 30 minutes of detection
- Updates: Every hour until resolution
- Post-incident report: Within 72 hours

**Channels:**
- Email to all affected clients
- Status page updates
- In-app notifications
- SMS alerts (for Premium/Enterprise)

**9.3 Monthly Reports**

SpaStream provides:

**Starter/Professional:**
- Uptime statistics available on status page

**Premium:**
- Monthly email report with:
  - Uptime percentage
  - Support ticket summary
  - Planned maintenance schedule

**Enterprise:**
- Comprehensive monthly report with:
  - Uptime percentage
  - Performance metrics (page load times, API response times)
  - Support ticket analysis
  - Security incidents (if any)
  - Upcoming maintenance schedule
  - Platform updates and enhancements

**9.4 Custom Reporting**

Enterprise clients may request:
- Custom uptime reports
- Integration-specific metrics
- API usage analytics
- Security event logs

---

## 10. CHANGES TO SLA

**10.1 Right to Modify**

SpaStream may modify this SLA by:
- Posting updated SLA on website and providing via email
- Providing 60 days' advance notice for material changes
- Updating "Last Updated" date

**10.2 Material Changes**

Material changes include:
- Reduction in uptime commitments
- Increase in support response times
- Reduction in Service Credits
- Reduction in support availability

**10.3 Non-Material Changes**

Non-material changes (effective immediately or with notice < 60 days):
- Clarifications or corrections
- Additional services or improved commitments
- Changes required by law or regulation
- Changes to measurement methodologies (if no impact on commitments)

**10.4 Acceptance**

Continued use after effective date constitutes acceptance. If you do not agree:
- You may terminate the MSA per Section 11.1 without penalty
- You will not receive refund of prepaid fees

---

## 11. EXCLUSIONS AND LIMITATIONS

**11.1 Beta Features**

Features marked as "beta," "experimental," "preview," or "early access":
- Are excluded from SLA commitments
- Are provided "as is" without warranties
- May be changed or discontinued without notice
- Are intended for testing and feedback only

**11.2 Third-Party Services**

SLA commitments do not apply to:
- Third-party payment processors
- Third-party SMS or email services
- Third-party integrations or APIs
- Client's own systems, networks, or equipment

SpaStream will use commercially reasonable efforts to maintain integrations but is not liable for third-party service failures.

**11.3 Client-Caused Issues**

SLA commitments do not apply to issues caused by:
- Client's internet service provider or equipment
- Client's misconfiguration or improper use
- Client's violations of AUP or MSA
- Client's customizations or integrations
- Client's excessive or abusive use

**11.4 Force Majeure**

SLA commitments are suspended during force majeure events as defined in the MSA Section 13.4.

---

## 12. ENTERPRISE CUSTOM TERMS

**12.1 Custom SLA Negotiation**

Enterprise clients may negotiate custom SLA terms, including:
- Higher uptime commitments (up to 99.95%)
- Faster support response times
- Custom Service Credit structures
- Dedicated infrastructure
- Custom RTO/RPO commitments
- On-site support commitments

**12.2 Custom Terms Process**

To negotiate custom terms:
1. Contact: enterprise-sales@spastream.com
2. Provide requirements and use cases
3. Negotiate terms during contract discussions
4. Execute custom SLA addendum to MSA

**12.3 Custom SLA Addendum**

Custom terms must be documented in written addendum:
- Signed by authorized representatives
- Attached to and incorporated into MSA
- Takes precedence over standard SLA for that client

---

## 13. GENERAL PROVISIONS

**13.1 Entire Agreement**

This SLA is incorporated into the MSA and forms part of the agreement between SpaStream and Client.

**13.2 Severability**

If any provision is found invalid or unenforceable, remaining provisions remain in full force.

**13.3 No Waiver**

Failure to enforce any provision does not constitute a waiver.

**13.4 Governing Law**

This SLA is governed by the same law as the MSA (Delaware law).

**13.5 Interpretation**

In case of conflict:
1. Custom SLA Addendum (for Enterprise clients)
2. This SLA
3. MSA general terms

**13.6 Questions**

For SLA questions:
- General: support@spastream.com
- Service Credits: sla-credits@spastream.com
- Enterprise Custom Terms: enterprise-sales@spastream.com

---

## 14. KEY COMMITMENTS SUMMARY

### Uptime Guarantees
- **Starter/Professional:** 99.5% (max ~3.6 hours downtime/month)
- **Premium/Enterprise:** 99.9% (max ~43 minutes downtime/month)

### Support Response Times
- **Starter:** 4 hours (Severity 1), business hours only
- **Professional:** 2 hours (Severity 1), business hours + phone
- **Premium:** 1 hour (Severity 1), 24/7 for critical issues
- **Enterprise:** 30 minutes (Severity 1), 24/7/365 for all

### Service Credits
- 10-50% monthly fee credit depending on uptime achieved
- Maximum 100% monthly fee for catastrophic failures
- Request within 30 days, applied to future invoices

### Data Protection
- Daily backups, 30-day retention
- RPO < 1 hour, RTO < 4-8 hours
- SOC 2 Type II certification (in progress)

### Status and Reporting
- Real-time status: status.spastream.com
- Incident updates every 15-30 minutes
- Monthly reports for Premium/Enterprise

---

**END OF SERVICE LEVEL AGREEMENT**

**Document Version**: 1.0
**Last Updated**: November 2025
**Next Review Date**: November 2026

**IMPORTANT REMINDER**: This is a template document. It must be reviewed and customized by a qualified attorney before use. Do not use this template without professional legal review.

---

**QUICK REFERENCE: SUPPORT RESPONSE TIMES**

| Tier | Severity 1 | Severity 2 | Severity 3 | Severity 4 | Hours |
|------|-----------|-----------|-----------|-----------|-------|
| **Starter** | 4 hrs | 8 hrs | 24 hrs | 48 hrs | Business |
| **Professional** | 2 hrs | 4 hrs | 8 hrs | 24 hrs | Business+ |
| **Premium** | 1 hr | 2 hrs | 4 hrs | 8 hrs | 24/7* |
| **Enterprise** | 30 min | 1 hr | 2 hrs | 4 hrs | 24/7 |

*24/7 for Severity 1-2, extended hours for Severity 3-4

---

**QUICK REFERENCE: SERVICE CREDITS**

| Uptime Achieved | Starter/Pro Credit | Premium/Enterprise Credit |
|-----------------|-------------------|--------------------------|
| 99.5% to < 99.9% | - | 10% |
| 99.0% to < 99.5% | 10% | 25% |
| 95.0% to < 99.0% | 25% | 50% |
| < 95.0% | 50% | 100% |
