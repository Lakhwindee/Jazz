import nodemailer from "nodemailer";
import { storage } from "./storage";

interface EmailConfig {
  smtpEmail: string;
  smtpPassword: string;
}

async function getEmailConfig(): Promise<EmailConfig | null> {
  const smtpEmailSetting = await storage.getSetting("gmail_user");
  const smtpPasswordSetting = await storage.getSetting("gmail_app_password");
  
  if (!smtpEmailSetting || !smtpPasswordSetting) {
    return null;
  }
  
  return { 
    smtpEmail: smtpEmailSetting.value, 
    smtpPassword: smtpPasswordSetting.value 
  };
}

export async function isEmailConfigured(): Promise<boolean> {
  const config = await getEmailConfig();
  return config !== null;
}

export async function sendOTPEmail(
  toEmail: string,
  otp: string,
  userName?: string
): Promise<boolean> {
  try {
    const config = await getEmailConfig();
    
    if (!config) {
      console.error("Email not configured - SMTP credentials missing");
      return false;
    }
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.smtpEmail,
        pass: config.smtpPassword,
      },
    });
    
    const mailOptions = {
      from: `"Mingree" <${config.smtpEmail}>`,
      to: toEmail,
      subject: "Your OTP for Email Verification - Mingree",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">Mingree</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            <p style="color: #666; font-size: 16px;">
              Hello${userName ? ` ${userName}` : ""},
            </p>
            <p style="color: #666; font-size: 16px;">
              Your One-Time Password (OTP) for email verification is:
            </p>
            <div style="background: #667eea; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #999; font-size: 14px;">
              This OTP is valid for <strong>10 minutes</strong>. Please do not share it with anyone.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              If you didn't request this OTP, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${toEmail}`);
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send admin notification email for new signup
export async function sendNewSignupNotification(
  adminEmail: string,
  newUser: { name: string; email: string; role: string; handle?: string; companyName?: string; country?: string }
): Promise<boolean> {
  try {
    const config = await getEmailConfig();
    
    if (!config) {
      console.log("Email not configured - skipping admin notification");
      return false;
    }
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.smtpEmail,
        pass: config.smtpPassword,
      },
    });
    
    const isCreator = newUser.role === "creator";
    const roleLabel = isCreator ? "Creator" : "Sponsor";
    const roleColor = isCreator ? "#667eea" : "#22c55e";
    
    const mailOptions = {
      from: `"Mingree" <${config.smtpEmail}>`,
      to: adminEmail,
      subject: `New ${roleLabel} Signup - ${newUser.name} | Mingree`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">Mingree</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; text-align: center; font-size: 14px;">New Signup Alert</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="display: inline-block; background: ${roleColor}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 15px;">
              ${roleLabel.toUpperCase()}
            </div>
            <h2 style="color: #333; margin-top: 0;">${newUser.name}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee; width: 120px;">Email:</td>
                <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee; font-weight: 500;">${newUser.email}</td>
              </tr>
              ${newUser.handle ? `
              <tr>
                <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Handle:</td>
                <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee; font-weight: 500;">${newUser.handle}</td>
              </tr>
              ` : ''}
              ${newUser.companyName ? `
              <tr>
                <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Company:</td>
                <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee; font-weight: 500;">${newUser.companyName}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Country:</td>
                <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee; font-weight: 500;">${newUser.country || 'IN'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666;">Signup Time:</td>
                <td style="padding: 10px 0; color: #333; font-weight: 500;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
              </tr>
            </table>
            <div style="margin-top: 25px; text-align: center;">
              <a href="https://mingree.com/admin/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold;">View in Admin Dashboard</a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated notification from Mingree.
            </p>
          </div>
        </div>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`New signup notification sent to admin: ${adminEmail}`);
    return true;
  } catch (error) {
    console.error("Failed to send signup notification email:", error);
    return false;
  }
}

// Send welcome email to new users after signup
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  role: string
): Promise<boolean> {
  try {
    const config = await getEmailConfig();
    
    if (!config) {
      console.log("Email not configured - skipping welcome email");
      return false;
    }
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.smtpEmail,
        pass: config.smtpPassword,
      },
    });
    
    const isCreator = role === "creator";
    const roleLabel = isCreator ? "Creator" : "Brand / Sponsor";
    const gradientColor = isCreator ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";
    
    const creatorContent = `
      <p style="color: #444; font-size: 16px; line-height: 1.6;">
        You're now part of a growing community of influencers and creators who collaborate with top brands across 25+ countries.
      </p>
      <h3 style="color: #333; margin-top: 25px;">Here's what you can do next:</h3>
      <div style="margin: 15px 0;">
        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <div style="min-width: 30px; height: 30px; background: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 30px; font-weight: bold; margin-right: 12px;">1</div>
          <div>
            <strong style="color: #333;">Link your Instagram</strong>
            <p style="color: #666; margin: 4px 0 0 0;">Connect your Instagram account to get matched with the right campaigns.</p>
          </div>
        </div>
        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <div style="min-width: 30px; height: 30px; background: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 30px; font-weight: bold; margin-right: 12px;">2</div>
          <div>
            <strong style="color: #333;">Browse Campaigns</strong>
            <p style="color: #666; margin: 4px 0 0 0;">Find brand campaigns that match your niche and follower count.</p>
          </div>
        </div>
        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <div style="min-width: 30px; height: 30px; background: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 30px; font-weight: bold; margin-right: 12px;">3</div>
          <div>
            <strong style="color: #333;">Earn Money</strong>
            <p style="color: #666; margin: 4px 0 0 0;">Complete campaigns and get paid directly to your wallet. Withdraw anytime via UPI!</p>
          </div>
        </div>
      </div>
    `;
    
    const sponsorContent = `
      <p style="color: #444; font-size: 16px; line-height: 1.6;">
        You're now part of a powerful influencer marketing platform connecting brands with creators across 25+ countries.
      </p>
      <h3 style="color: #333; margin-top: 25px;">Here's what you can do next:</h3>
      <div style="margin: 15px 0;">
        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <div style="min-width: 30px; height: 30px; background: #22c55e; color: white; border-radius: 50%; text-align: center; line-height: 30px; font-weight: bold; margin-right: 12px;">1</div>
          <div>
            <strong style="color: #333;">Add Funds to Wallet</strong>
            <p style="color: #666; margin: 4px 0 0 0;">Deposit funds to your sponsor wallet to start creating campaigns.</p>
          </div>
        </div>
        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <div style="min-width: 30px; height: 30px; background: #22c55e; color: white; border-radius: 50%; text-align: center; line-height: 30px; font-weight: bold; margin-right: 12px;">2</div>
          <div>
            <strong style="color: #333;">Create Campaigns</strong>
            <p style="color: #666; margin: 4px 0 0 0;">Launch campaigns targeting specific tiers and countries to find the perfect creators.</p>
          </div>
        </div>
        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <div style="min-width: 30px; height: 30px; background: #22c55e; color: white; border-radius: 50%; text-align: center; line-height: 30px; font-weight: bold; margin-right: 12px;">3</div>
          <div>
            <strong style="color: #333;">Review & Approve</strong>
            <p style="color: #666; margin: 4px 0 0 0;">Review content submissions from creators and approve the best ones.</p>
          </div>
        </div>
      </div>
    `;
    
    const mailOptions = {
      from: `"Mingree" <${config.smtpEmail}>`,
      to: userEmail,
      subject: `Welcome to Mingree, ${userName}! 🎉`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <div style="background: ${gradientColor}; padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">Mingree</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 15px;">Influencer Marketing Platform</p>
          </div>
          <div style="background: #f8f9fa; padding: 35px 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #333; margin-top: 0; font-size: 22px;">Welcome aboard, ${userName}!</h2>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              Thank you for joining Mingree as a <strong>${roleLabel}</strong>. We're excited to have you!
            </p>
            ${isCreator ? creatorContent : sponsorContent}
            <div style="margin-top: 30px; text-align: center;">
              <a href="https://mingree.com" style="display: inline-block; background: ${gradientColor}; color: white; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: bold; font-size: 16px;">Get Started</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 13px; text-align: center; line-height: 1.5;">
              Need help? Reply to this email or visit our <a href="https://mingree.com/contact" style="color: #667eea;">Contact Page</a>.<br/>
              <a href="https://mingree.com" style="color: #667eea;">mingree.com</a>
            </p>
          </div>
        </div>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return false;
  }
}

// Generic email sending function for newsletters and other emails
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    const config = await getEmailConfig();
    
    if (!config) {
      console.error("Email not configured - SMTP credentials missing");
      return false;
    }
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.smtpEmail,
        pass: config.smtpPassword,
      },
    });
    
    const mailOptions = {
      from: `"Mingree" <${config.smtpEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
