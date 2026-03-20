/**
 * Sovereign Legal Bundle Generator
 * Auto-generates Privacy Policy and Terms of Service
 * based on hardware features used by the app.
 */

interface LegalConfig {
  appName: string;
  companyName: string;
  contactEmail: string;
  websiteUrl: string;
  features: string[];
  permissions: string[];
  usesAnalytics: boolean;
  usesAuth: boolean;
  usesPayment: boolean;
  usesLocation: boolean;
  usesCamera: boolean;
  usesStorage: boolean;
  usesNotifications: boolean;
}

function detectFeatures(featureNames: string[]): Partial<LegalConfig> {
  const lower = featureNames.map(f => f.toLowerCase());
  return {
    usesAnalytics: lower.some(f => f.includes("analytics")),
    usesAuth: lower.some(f => f.includes("auth")),
    usesPayment: lower.some(f => f.includes("payment") || f.includes("stripe")),
    usesLocation: lower.some(f => f.includes("location") || f.includes("gps") || f.includes("maps")),
    usesCamera: lower.some(f => f.includes("camera") || f.includes("photo") || f.includes("qr")),
    usesStorage: lower.some(f => f.includes("storage") || f.includes("file")),
    usesNotifications: lower.some(f => f.includes("notification") || f.includes("push")),
  };
}

export function generatePrivacyPolicy(config: Partial<LegalConfig>): string {
  const app = config.appName || "Our Application";
  const company = config.companyName || "The Developer";
  const email = config.contactEmail || "contact@example.com";
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const detected = detectFeatures(config.features || []);
  const cfg = { ...detected, ...config };

  let policy = `# Privacy Policy for ${app}

**Last Updated:** ${date}

${company} ("we", "us", or "our") operates ${app} (the "Application"). This page informs you of our policies regarding the collection, use, and disclosure of personal information when you use our Application.

## Information Collection and Use

We collect information to provide and improve our Application. We will not use or share your information with anyone except as described in this Privacy Policy.

### Types of Data Collected

**Personal Data:** While using our Application, we may ask you to provide certain personally identifiable information that can be used to contact or identify you.
`;

  if (cfg.usesAuth) {
    policy += `
**Authentication Data:** We collect email addresses and authentication credentials to provide secure account access. Passwords are hashed and never stored in plain text.
`;
  }

  if (cfg.usesLocation) {
    policy += `
**Location Data:** We collect and process information about your actual location when you grant permission. This data is used solely to provide location-based features within the Application and is not shared with third parties without your explicit consent.
`;
  }

  if (cfg.usesCamera) {
    policy += `
**Camera and Media Data:** Our Application accesses your device camera and/or photo library only when you explicitly grant permission. Photos and media are processed on-device and are not transmitted to external servers unless you initiate a specific upload action.
`;
  }

  if (cfg.usesStorage) {
    policy += `
**Device Storage:** The Application stores data locally on your device for offline functionality. This data remains under your control and can be deleted by clearing the app data or uninstalling the Application.
`;
  }

  if (cfg.usesNotifications) {
    policy += `
**Push Notifications:** We may send you push notifications to provide updates and important information. You can opt out of receiving notifications at any time through your device settings.
`;
  }

  if (cfg.usesAnalytics) {
    policy += `
**Analytics Data:** We collect anonymized usage data to understand how our Application is used and to improve its performance. This data does not personally identify you.
`;
  }

  if (cfg.usesPayment) {
    policy += `
**Payment Information:** Payment processing is handled by trusted third-party payment processors. We do not store your complete payment card details on our servers.
`;
  }

  policy += `
## Data Security

We value your trust and strive to use commercially acceptable means of protecting your personal information. All data transmitted between the Application and our servers is encrypted using industry-standard TLS/SSL protocols. Sensitive data stored locally is encrypted using AES-256 encryption.

## Data Retention

We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy. You may request deletion of your data at any time by contacting us.

## Children's Privacy

Our Application does not address anyone under the age of 13. We do not knowingly collect personal information from children under 13.

## Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy within the Application. Changes are effective immediately upon posting.

## Contact Us

If you have any questions about this Privacy Policy, please contact us at: **${email}**
`;

  return policy;
}

export function generateTermsOfService(config: Partial<LegalConfig>): string {
  const app = config.appName || "Our Application";
  const company = config.companyName || "The Developer";
  const email = config.contactEmail || "contact@example.com";
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return `# Terms of Service for ${app}

**Last Updated:** ${date}

## Acceptance of Terms

By downloading, installing, or using ${app} (the "Application"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Application.

## Description of Service

${company} provides ${app} as a mobile and web application. The Application is provided "as is" and "as available" without any warranties of any kind.

## User Accounts

You are responsible for safeguarding the credentials used to access the Application and for any activities under your account. You must notify us immediately upon becoming aware of any breach of security.

## Acceptable Use

You agree not to:
- Use the Application for any unlawful purpose
- Attempt to gain unauthorized access to any portion of the Application
- Interfere with or disrupt the Application's infrastructure
- Reverse engineer, decompile, or disassemble the Application
- Use the Application to transmit harmful code or malware

## Intellectual Property

The Application and its original content, features, and functionality are owned by ${company} and are protected by international copyright, trademark, and other intellectual property laws.

## Limitation of Liability

In no event shall ${company} be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Application.

## Termination

We may terminate or suspend your access to the Application immediately, without prior notice, for any reason whatsoever, including but not limited to a breach of these Terms.

## Governing Law

These Terms shall be governed by and construed in accordance with the applicable laws, without regard to conflict of law provisions.

## Changes to Terms

We reserve the right to modify these Terms at any time. We will provide notice of significant changes within the Application. Continued use constitutes acceptance of modified Terms.

## Contact Us

If you have any questions about these Terms, please contact us at: **${email}**
`;
}

/** Download legal document as markdown file */
export function downloadLegalDocument(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
