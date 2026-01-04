import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 4, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using Mingree ("the Platform"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mingree is an influencer marketing platform that connects Instagram creators with brands and sponsors for promotional campaigns. Our services include campaign discovery, content submission, payment processing, and wallet management.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              Users must register for an account to access our services. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Creator Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              Creators must have a valid Instagram account with a minimum of 500 followers to participate in campaigns. Creators agree to submit original content that complies with campaign requirements and Instagram's community guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Sponsor/Brand Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sponsors must maintain sufficient wallet balance to fund campaigns. Campaign payments are processed through our secure payment system. Sponsors agree to review and approve/reject submissions within a reasonable timeframe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Payments and Fees</h2>
            <p className="text-muted-foreground leading-relaxed">
              All payments are processed in Indian Rupees (INR). A 10% platform fee applies to campaign payments. GST at 18% applies to wallet deposits and creator withdrawals as per Indian tax regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              Content submitted by creators remains their intellectual property. By submitting content, creators grant sponsors a license to use the content for promotional purposes as specified in the campaign.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Prohibited Activities</h2>
            <p className="text-muted-foreground leading-relaxed">
              Users may not engage in fraudulent activities, create fake accounts, submit plagiarized content, or violate any applicable laws. Violation of these terms may result in account suspension or termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mingree shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For any questions regarding these terms, please contact us at support@mingree.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
