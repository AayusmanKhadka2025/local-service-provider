import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Home, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Users,
  CreditCard,
  Lock,
  Globe,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  ArrowLeft,
  Star
} from "lucide-react";

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const lastUpdated = "May 22, 2026";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              ServEase
            </h1>
          </Link>
          
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Terms and Conditions
          </h1>
          <p className="text-gray-500">
            Last Updated: {lastUpdated}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
              <CheckCircle className="w-3 h-3" />
              Active
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
              <Shield className="w-3 h-3" />
              Legal Agreement
            </span>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            Quick Navigation
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { href: "#acceptance", text: "Acceptance of Terms" },
              { href: "#services", text: "Services" },
              { href: "#user-accounts", text: "User Accounts" },
              { href: "#provider-accounts", text: "Provider Accounts" },
              { href: "#bookings", text: "Bookings & Payments" },
              { href: "#privacy", text: "Privacy" },
              { href: "#liability", text: "Liability" },
              { href: "#termination", text: "Termination" },
              { href: "#contact", text: "Contact" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3" />
                {item.text}
              </a>
            ))}
          </div>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            {/* Section 1: Acceptance of Terms */}
            <section id="acceptance">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                1. Acceptance of Terms
              </h2>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>
                  By accessing or using ServEase ("the Platform"), you agree to be bound by these Terms and Conditions. 
                  If you do not agree to these terms, please do not use our services.
                </p>
                <p>
                  We reserve the right to update or modify these terms at any time without prior notice. 
                  Your continued use of the Platform after any changes constitutes acceptance of the new terms.
                </p>
              </div>
            </section>

            {/* Section 2: Description of Services */}
            <section id="services">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                2. Description of Services
              </h2>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>
                  ServEase is an online platform that connects customers ("Users") with local service providers ("Service Providers"). 
                  Our services include but are not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Connecting Users with verified Service Providers</li>
                  <li>Facilitating booking and scheduling of services</li>
                  <li>Processing payments and handling transactions</li>
                  <li>Providing review and rating systems</li>
                  <li>Offering customer support and dispute resolution</li>
                </ul>
              </div>
            </section>

            {/* Section 3: User Accounts */}
            <section id="user-accounts">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                3. User Accounts
              </h2>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>
                  To use our services, you must create an account. You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain the security of your password and accept all risks of unauthorized access</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Be at least 18 years old to create an account</li>
                  <li>Not share your account credentials with any third party</li>
                </ul>
                <p className="mt-3">
                  You are solely responsible for all activities that occur under your account. 
                  ServEase reserves the right to suspend or terminate accounts that violate these terms.
                </p>
              </div>
            </section>

            {/* Section 4: Service Provider Accounts */}
            <section id="provider-accounts">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                4. Service Provider Accounts
              </h2>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>
                  Service Providers must undergo a verification process before being approved to offer services. 
                  By registering as a Service Provider, you agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide valid government-issued identification for verification</li>
                  <li>Submit accurate information about your qualifications and experience</li>
                  <li>Maintain appropriate licenses and insurance as required by law</li>
                  <li>Provide quality services and honor all accepted bookings</li>
                  <li>Respond to customer inquiries and booking requests in a timely manner</li>
                  <li>Maintain professional conduct at all times</li>
                </ul>
                <p className="mt-3">
                  Failure to comply with these requirements may result in account suspension or termination.
                </p>
              </div>
            </section>

            {/* Section 5: Bookings and Payments */}
            <section id="bookings">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                5. Bookings and Payments
              </h2>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>
                  <strong className="text-gray-800">Booking Process:</strong> Users can request bookings through the Platform. 
                  Service Providers may accept or reject booking requests. Once accepted, the booking becomes confirmed.
                </p>
                <p>
                  <strong className="text-gray-800">Cancellation Policy:</strong> Users may cancel pending bookings at any time. 
                  Cancellation fees may apply based on the timing of cancellation. Service Providers who cancel confirmed 
                  bookings may face penalties.
                </p>
                <p>
                  <strong className="text-gray-800">Payment Processing:</strong> Payments are processed through our secure payment gateway. 
                  Service Providers are paid according to the agreed-upon rates, minus our service fee.
                </p>
                <p>
                  <strong className="text-gray-800">Refunds:</strong> Refund requests are evaluated on a case-by-case basis. 
                  Please contact customer support for refund inquiries.
                </p>
              </div>
            </section>

            {/* Section 6: Privacy and Data Protection */}
            <section id="privacy">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                6. Privacy and Data Protection
              </h2>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>
                  We take your privacy seriously. Your personal information is protected and never shared with third parties 
                  without your consent, except as required to provide our services or by law.
                </p>
                <p>
                  We implement appropriate security measures to protect your information from unauthorized access, 
                  alteration, disclosure, or destruction.
                </p>
              </div>
            </section>

            {/* Section 7: User Conduct */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                7. User Conduct
              </h2>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the Platform for any illegal purpose</li>
                  <li>Harass, abuse, or harm another person</li>
                  <li>Post false, misleading, or fraudulent information</li>
                  <li>Interfere with or disrupt the Platform's operation</li>
                  <li>Attempt to gain unauthorized access to any portion of the Platform</li>
                  <li>Use automated systems to access the Platform</li>
                  <li>Impersonate any person or entity</li>
                </ul>
              </div>
            </section>

            {/* Section 8: Reviews and Ratings */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                8. Reviews and Ratings
              </h2>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>
                  Users may leave reviews and ratings for Service Providers. Reviews must be honest, accurate, 
                  and based on actual experiences. We reserve the right to remove reviews that are false, misleading, 
                  or violate our content guidelines.
                </p>
                <p>
                  Service Providers have the right to respond to reviews. However, retaliatory behavior is strictly prohibited.
                </p>
              </div>
            </section>

            {/* Section 9: Limitation of Liability */}
            <section id="liability">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                9. Limitation of Liability
              </h2>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>
                  To the maximum extent permitted by law, ServEase shall not be liable for any indirect, incidental, 
                  special, consequential, or punitive damages, including without limitation, loss of profits, data, 
                  use, goodwill, or other intangible losses, resulting from:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your use or inability to use the Platform</li>
                  <li>Any conduct or content of any third party on the Platform</li>
                  <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                  <li>Services provided by Service Providers</li>
                </ul>
              </div>
            </section>

            {/* Section 10: Termination */}
            <section id="termination">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                10. Termination
              </h2>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>
                  We may terminate or suspend your account immediately, without prior notice or liability, 
                  for any reason whatsoever, including without limitation if you breach these Terms.
                </p>
                <p>
                  Upon termination, your right to use the Platform will immediately cease. If you wish to terminate 
                  your account, you may simply discontinue using the Platform or contact us to request account deletion.
                </p>
              </div>
            </section>

            {/* Section 11: Governing Law */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                11. Governing Law
              </h2>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>
                  These Terms shall be governed and construed in accordance with the laws of Nepal, 
                  without regard to its conflict of law provisions.
                </p>
                <p>
                  Any disputes arising under or in connection with these Terms shall be subject to the exclusive 
                  jurisdiction of the courts located in Kathmandu, Nepal.
                </p>
              </div>
            </section>

            {/* Section 12: Contact Information */}
            <section id="contact">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                12. Contact Us
              </h2>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>If you have any questions about these Terms, please contact us:</p>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <a href="mailto:servease2082@gmail.com" className="text-blue-600 hover:underline">
                      servease2082@gmail.com
                    </a>
                  </p>
                  <p className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <a href="tel:+9779812021764" className="text-blue-600 hover:underline">
                      +977 9812021764
                    </a>
                  </p>
                  <p className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    San Basantapur, Kathmandu, Nepal
                  </p>
                </div>
              </div>
            </section>

            {/* Acknowledgment */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    By using ServEase, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                  </p>
                  <p className="text-xs text-green-700 mt-2">
                    Last updated: {lastUpdated}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-center gap-4">
         
          <Link
            to="/signup"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition shadow-md"
          >
            Back to Sign Up
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-400 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm">
          <p>© 2026 ServEase. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/terms" className="hover:text-white transition">Terms</Link>
            <Link to="/privacy" className="hover:text-white transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsAndConditions;