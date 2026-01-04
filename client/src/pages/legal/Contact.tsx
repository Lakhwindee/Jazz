import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, MapPin, Phone, Clock } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-muted-foreground mb-8">We're here to help. Reach out to us through any of the following channels.</p>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">For general inquiries and support:</p>
              <a href="mailto:support@mingree.com" className="text-primary hover:underline font-medium">
                support@mingree.com
              </a>
              <p className="text-muted-foreground mt-4 mb-2">For business partnerships:</p>
              <a href="mailto:business@mingree.com" className="text-primary hover:underline font-medium">
                business@mingree.com
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We typically respond to all inquiries within 24-48 hours during business days. For urgent matters, please mention "URGENT" in your email subject.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Office Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Mingree Technologies<br />
                India
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Monday - Friday: 10:00 AM - 6:00 PM IST<br />
                Saturday: 10:00 AM - 2:00 PM IST<br />
                Sunday: Closed
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">How do I reset my password?</h3>
              <p className="text-muted-foreground">Click on "Forgot Password" on the login page and follow the instructions sent to your email.</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">How long does withdrawal take?</h3>
              <p className="text-muted-foreground">Withdrawals are processed within 2-3 business days after admin approval.</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">How do I link my Instagram account?</h3>
              <p className="text-muted-foreground">Go to your Profile page and click on "Link Instagram" to connect your account.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
