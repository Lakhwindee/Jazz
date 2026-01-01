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
      from: `"InstaCreator Hub" <${config.smtpEmail}>`,
      to: toEmail,
      subject: "Your OTP for Email Verification - InstaCreator Hub",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">InstaCreator Hub</h1>
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
