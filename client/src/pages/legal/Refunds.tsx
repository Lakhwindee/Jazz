import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Refunds() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Refund and Cancellation Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 4, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Wallet Deposits</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wallet deposits are non-refundable once credited to your account. The deposited amount can be used for campaign payments or withdrawn to your bank account (subject to withdrawal terms).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Campaign Payments</h2>
            <p className="text-muted-foreground leading-relaxed">
              Campaign payments are held in escrow until content is approved. If a submission is rejected, the creator does not receive payment and the spot is returned to the campaign. If a campaign expires without all spots being filled, unused funds are returned to the sponsor's wallet.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Subscription Refunds</h2>
            <p className="text-muted-foreground leading-relaxed">
              Subscription payments are non-refundable. If you cancel your subscription, you will continue to have access to premium features until the end of your billing period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Withdrawal Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sponsors and creators can withdraw their wallet balance to their registered bank account. A minimum withdrawal amount of INR 500 applies. 18% GST is deducted from withdrawal amounts as per Indian tax regulations. Withdrawals are processed within 2-3 business days after admin approval.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Failed Transactions</h2>
            <p className="text-muted-foreground leading-relaxed">
              If a payment fails but the amount is debited from your account, it will be automatically refunded to your original payment method within 5-7 business days. If you don't receive the refund, please contact our support team.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Dispute Resolution</h2>
            <p className="text-muted-foreground leading-relaxed">
              In case of disputes between creators and sponsors regarding content quality or campaign requirements, our team will review the case and make a fair decision. Decisions made by the Mingree team are final.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Refund Processing Time</h2>
            <p className="text-muted-foreground leading-relaxed">
              Approved refunds are processed within 5-7 business days. The time for the refund to reflect in your account depends on your bank or payment provider.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact for Refund Requests</h2>
            <p className="text-muted-foreground leading-relaxed">
              For refund-related inquiries or to request a refund (where applicable), please contact us at support@mingree.com with your transaction details and reason for the refund request.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
