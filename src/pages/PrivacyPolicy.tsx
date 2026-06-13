
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p className="text-muted-foreground">Last updated: June 2023</p>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p>At NTS Tool Solution PRO, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.</p>
            <p>Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.</p>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-medium mt-4 mb-2">Personal Data</h3>
            <p>We may collect personally identifiable information, such as:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your name</li>
              <li>Email address</li>
              <li>Company information</li>
              <li>Job title</li>
              <li>Payment information</li>
            </ul>
            
            <h3 className="text-lg font-medium mt-4 mb-2">Usage Data</h3>
            <p>We may also collect information on how you use our service, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your computer's Internet Protocol address (IP address)</li>
              <li>Browser type and version</li>
              <li>Pages of our service that you visit</li>
              <li>Time and date of your visit</li>
              <li>Time spent on those pages</li>
              <li>Tool designs and parameters used (in anonymized form)</li>
            </ul>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>NTS Tool Solution PRO may use the information we collect for various purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To allow you to participate in interactive features when you choose to do so</li>
              <li>To provide customer support</li>
              <li>To gather analysis to improve our service</li>
              <li>To monitor the usage of our service</li>
              <li>To detect, prevent and address technical issues</li>
              <li>To process payments and fulfill your order</li>
            </ul>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">4. Data Retention</h2>
            <p>NTS Tool Solution PRO will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.</p>
            <p>We will also retain Usage Data for internal analysis purposes. Usage Data is generally retained for a shorter period, except when this data is used to strengthen the security or to improve the functionality of our service, or we are legally obligated to retain this data for longer time periods.</p>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">5. Transfer of Data</h2>
            <p>Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ from those of your jurisdiction.</p>
            <p>If you are located outside the United States and choose to provide information to us, please note that we transfer the data, including Personal Data, to the United States and process it there.</p>
            <p>Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.</p>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">6. Cookies</h2>
            <p>We use cookies and similar tracking technologies to track the activity on our service and hold certain information.</p>
            <p>Cookies are files with small amount of data which may include an anonymous unique identifier. Cookies are sent to your browser from a website and stored on your device. Tracking technologies also used are beacons, tags, and scripts to collect and track information and to improve and analyze our service.</p>
            <p>You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.</p>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
            <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Request access to your personal data</li>
              <li>Request correction of your personal data</li>
              <li>Request erasure of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
              <li>Request transfer of your personal data</li>
              <li>Right to withdraw consent</li>
            </ul>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">8. Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.</p>
            <p>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">9. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@ntstoolsolution.com</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
