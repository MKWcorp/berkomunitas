import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - Berkomunitas',
  description: 'Terms of Service for Berkomunitas platform. Read our terms and conditions carefully before using our service.',
  keywords: 'terms of service, terms and conditions, user agreement, legal, community platform',
  openGraph: {
    title: 'Terms of Service - Berkomunitas',
    description: 'Terms of Service for Berkomunitas platform. Read our terms and conditions carefully before using our service.',
    type: 'website',
    url: 'https://berkomunitas.com/terms-of-service',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service - Berkomunitas',
    description: 'Terms of Service for Berkomunitas platform. Read our terms and conditions carefully before using our service.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-blue-600">Berkomunitas</h1>
            </div>
            <nav className="flex space-x-6">
              <Link href="/" className="text-gray-600 hover:text-blue-600 font-medium">
                Home
              </Link>
              <Link href="/privacy-policy" className="text-gray-600 hover:text-blue-600 font-medium">
                Privacy Policy
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <span>›</span>
              <span className="text-gray-900">Terms of Service</span>
            </div>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              Last updated: October 28, 2025
            </p>

            <p className="text-gray-700 mb-4">
              Please read these Terms of Service carefully before using Our Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Interpretation and Definitions</h2>

            <h3 className="text-xl font-medium text-gray-900 mb-4">Interpretation</h3>
            <p className="text-gray-700 mb-4">
              The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-4">Definitions</h3>
            <p className="text-gray-700 mb-4">For the purposes of these Terms of Service:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Affiliate</strong> means an entity that controls, is controlled by or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.</li>
              <li><strong>Country</strong> refers to: Indonesia</li>
              <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Berkomunitas.</li>
              <li><strong>Device</strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.</li>
              <li><strong>Service</strong> refers to the Website and Platform.</li>
              <li><strong>Terms of Service</strong> (also referred as "Terms") mean these Terms of Service that form the entire agreement between You and the Company regarding the use of the Service.</li>
              <li><strong>Third-party Social Media Service</strong> means any services or content (including data, information, products or services) provided by a third-party that may be displayed, included or made available by the Service, including but not limited to TikTok.</li>
              <li><strong>Website</strong> refers to Berkomunitas, accessible from <a href="https://berkomunitas.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">https://berkomunitas.com</a></li>
              <li><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Acknowledgment</h2>
            <p className="text-gray-700 mb-4">
              These are the Terms of Service governing the use of this Service and the agreement that operates between You and the Company. These Terms of Service set out the rights and obligations of all users regarding the use of the Service.
            </p>
            <p className="text-gray-700 mb-4">
              Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms of Service. These Terms of Service apply to all visitors, users and others who access or use the Service.
            </p>
            <p className="text-gray-700 mb-4">
              By accessing or using the Service You agree to be bound by these Terms of Service. If You disagree with any part of these Terms of Service then You may not access the Service.
            </p>
            <p className="text-gray-700 mb-4">
              You represent that you are over the age of 18. The Company does not permit those under 18 to use the Service.
            </p>
            <p className="text-gray-700 mb-4">
              Your access to and use of the Service is also conditioned on Your acceptance of and compliance with the Privacy Policy of the Company. Our Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your personal information when You use the Service and tells You about Your privacy rights and how the law protects You. Please read Our <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</Link> carefully before using Our Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">User Accounts</h2>
            <p className="text-gray-700 mb-4">
              When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.
            </p>
            <p className="text-gray-700 mb-4">
              You are responsible for safeguarding the password that You use to access the Service and for any activities or actions under Your password, whether Your password is with Our Service or a Third-Party Social Media Service.
            </p>
            <p className="text-gray-700 mb-4">
              You agree not to disclose Your password to any third party. You must notify Us immediately upon becoming aware of any breach of security or unauthorized use of Your account.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Third-Party Social Media Integration</h2>
            <p className="text-gray-700 mb-4">
              Our Service allows You to connect and interact with Third-Party Social Media Services, including TikTok. By connecting Your account to these services, You acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>We may access, store, and use certain information from Your Third-Party Social Media Service account in accordance with our Privacy Policy.</li>
              <li>You are responsible for Your interactions with Third-Party Social Media Services and their terms of service.</li>
              <li>We are not responsible for the privacy practices or content of Third-Party Social Media Services.</li>
              <li>You grant Us permission to access and display content from Your Third-Party Social Media accounts as necessary for the Service.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Content</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-4">Your Content</h3>
            <p className="text-gray-700 mb-4">
              Our Service allows You to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that You post to the Service, including its legality, reliability, and appropriateness.
            </p>
            <p className="text-gray-700 mb-4">
              By posting Content to the Service, You grant Us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service. You retain any and all of Your rights to any Content You submit, post or display on or through the Service and You are responsible for protecting those rights.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-4">Content Restrictions</h3>
            <p className="text-gray-700 mb-4">The Company is not responsible for the content of the Service's users. You expressly understand and agree that You are solely responsible for the Content and for all activity that occurs under Your account, whether done so by You or any third person using Your account.</p>
            <p className="text-gray-700 mb-4">You may not transmit any Content that is unlawful, offensive, upsetting, intended to disgust, threatening, libelous, defamatory, obscene or otherwise objectionable. Examples of such objectionable Content include, but are not limited to, the following:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>Unlawful or promoting unlawful activity</li>
              <li>Defamatory, discriminatory, or mean-spirited content, including references or commentary about religion, race, sexual orientation, gender, national/ethnic origin, or other targeted groups</li>
              <li>Spam, machine – or randomly – generated, constituting unauthorized or unsolicited advertising, chain letters, any other form of unauthorized solicitation, or any form of lottery or gambling</li>
              <li>Containing or installing any viruses, worms, malware, trojan horses, or other content that is designed or intended to disrupt, damage, or limit the functioning of any software, hardware or telecommunications equipment or to damage or obtain unauthorized access to any data or other information of a third person</li>
              <li>Infringing on any proprietary rights of any party, including patent, trademark, trade secret, copyright, right of publicity or other rights</li>
              <li>Impersonating any person or entity including the Company and its employees or representatives</li>
              <li>Violating the privacy of any third person</li>
              <li>False information and features</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The Service and its original content (excluding Content provided by You or other users), features and functionality are and will remain the exclusive property of the Company and its licensors.
            </p>
            <p className="text-gray-700 mb-4">
              The Service is protected by copyright, trademark, and other laws of both the Country and foreign countries.
            </p>
            <p className="text-gray-700 mb-4">
              Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of the Company.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Links to Other Websites</h2>
            <p className="text-gray-700 mb-4">
              Our Service may contain links to third-party web sites or services that are not owned or controlled by the Company.
            </p>
            <p className="text-gray-700 mb-4">
              The Company has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that the Company shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods or services available on or through any such web sites or services.
            </p>
            <p className="text-gray-700 mb-4">
              We strongly advise You to read the terms and conditions and privacy policies of any third-party web sites or services that You visit.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend Your Account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms of Service.
            </p>
            <p className="text-gray-700 mb-4">
              Upon termination, Your right to use the Service will cease immediately. If You wish to terminate Your Account, You may simply discontinue using the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              Notwithstanding any damages that You might incur, the entire liability of the Company and any of its suppliers under any provision of these Terms and Your exclusive remedy for all of the foregoing shall be limited to the amount actually paid by You through the Service or 100 USD if You haven't purchased anything through the Service.
            </p>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by applicable law, in no event shall the Company or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever (including, but not limited to, damages for loss of profits, loss of data or other information, for business interruption, for personal injury, loss of privacy arising out of or in any way related to the use of or inability to use the Service, third-party software and/or third-party hardware used with the Service, or otherwise in connection with any provision of these Terms), even if the Company or any supplier has been advised of the possibility of such damages and even if the remedy fails of its essential purpose.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">"AS IS" and "AS AVAILABLE" Disclaimer</h2>
            <p className="text-gray-700 mb-4">
              The Service is provided to You "AS IS" and "AS AVAILABLE" and with all faults and defects without warranty of any kind. To the maximum extent permitted under applicable law, the Company, on its own behalf and on behalf of its Affiliates and its and their respective licensors and service providers, expressly disclaims all warranties, whether express, implied, statutory or otherwise, with respect to the Service, including all implied warranties of merchantability, fitness for a particular purpose, title and non-infringement, and warranties that may arise out of course of dealing, course of performance, usage or trade practice.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Governing Law</h2>
            <p className="text-gray-700 mb-4">
              The laws of the Country, excluding its conflicts of law rules, shall govern these Terms and Your use of the Service. Your use of the Service may also be subject to other local, state, national, or international laws.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Disputes Resolution</h2>
            <p className="text-gray-700 mb-4">
              If You have any concern or dispute about the Service, You agree to first try to resolve the dispute informally by contacting the Company.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">For European Union (EU) Users</h2>
            <p className="text-gray-700 mb-4">
              If You are a European Union consumer, you will benefit from any mandatory provisions of the law of the country in which You are resident.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Severability and Waiver</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-4">Severability</h3>
            <p className="text-gray-700 mb-4">
              If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law and the remaining provisions will continue in full force and effect.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-4">Waiver</h3>
            <p className="text-gray-700 mb-4">
              Except as provided herein, the failure to exercise a right or to require performance of an obligation under these Terms shall not affect a party's ability to exercise such right or require such performance at any time thereafter nor shall the waiver of a breach constitute a waiver of any subsequent breach.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Changes to These Terms of Service</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.
            </p>
            <p className="text-gray-700 mb-4">
              By continuing to access or use Our Service after those revisions become effective, You agree to be bound by the revised terms. If You do not agree to the new terms, in whole or in part, please stop using the website and the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Us</h2>
            <p className="text-gray-700 mb-4">If you have any questions about these Terms of Service, You can contact us:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>By email: hai@berkomunitas.com</li>
              <li>By visiting this page on our website: <a href="https://berkomunitas.com/contact" className="text-blue-600 hover:text-blue-800 underline">https://berkomunitas.com/contact</a></li>
            </ul>

            {/* Back to Home Link */}
            <div className="border-t border-gray-200 pt-8">
              <Link 
                href="/"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
