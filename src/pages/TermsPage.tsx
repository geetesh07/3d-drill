
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Terms and Conditions</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p className="text-muted-foreground">Last updated: June 2023</p>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p>Welcome to NTS Tool Solution PRO ("we," "our," or "us"). These Terms and Conditions govern your use of our website and services.</p>
            <p>By accessing or using NTS Tool Solution PRO, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access the service.</p>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">2. License</h2>
            <p>NTS Tool Solution PRO grants you a limited, non-exclusive, non-transferable license to use our software for designing cutting tools according to your subscription plan.</p>
            <p>You may not:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Modify or copy the materials except as provided by the functionality of the service</li>
              <li>Use the materials for any commercial purpose not authorized by your subscription</li>
              <li>Attempt to decompile or reverse engineer any software contained in NTS Tool Solution PRO</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
            <p>When you create an account with us, you must provide accurate, complete, and up-to-date information at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.</p>
            <p>You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</p>
            <p>You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">4. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are and will remain the exclusive property of NTS Tool Solution PRO and its licensors.</p>
            <p>Designs created by users using our software:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>The user retains ownership of designs created using our tools</li>
              <li>We do not claim intellectual property rights over materials you create using our service</li>
              <li>We may use anonymous usage data to improve our services</li>
            </ul>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">5. Limitation of Liability</h2>
            <p>In no event shall NTS Tool Solution PRO, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your access to or use of or inability to access or use the service</li>
              <li>Any conduct or content of any third party on the service</li>
              <li>Any content obtained from the service</li>
              <li>Unauthorized access, use or alteration of your transmissions or content</li>
            </ul>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">6. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
            <p>Upon termination, your right to use the service will immediately cease. If you wish to terminate your account, you may simply discontinue using the service.</p>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">7. Changes</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect.</p>
            <p>What constitutes a material change will be determined at our sole discretion.</p>
          </section>
          
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">8. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at support@ntstoolsolution.com</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsPage;
