import { Resend } from "resend";
import logger from "./logger";

const apiKey = process.env.EMAIL_PASS;
const fromAddress = process.env.EMAIL_USER || "support@aloo.abhiraj0x.me";

export const resend = apiKey ? new Resend(apiKey) : null;

type StaffCredentialsParams = {
    to: string;
    shopName: string;
    password: string;
    loginUrl: string;
};

export const sendStaffCredentialsEmail = async ({
    to,
    shopName,
    password,
    loginUrl,
}: StaffCredentialsParams) => {
    if (!resend) {
        throw new Error("Resend not configured (missing EMAIL_PASS env)");
    }

    const subject = `Your staff account for ${shopName}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
            <h2 style="margin-top: 0;">Welcome to ${shopName}</h2>
            <p>You've been added as a staff member at <strong>${shopName}</strong>.</p>
            <p>Use the credentials below to sign in to the dashboard:</p>
            <table style="border-collapse: collapse; margin: 16px 0;">
                <tr>
                    <td style="padding: 6px 12px; background: #f3f4f6; font-weight: 600;">Email</td>
                    <td style="padding: 6px 12px; background: #f9fafb;"><code>${to}</code></td>
                </tr>
                <tr>
                    <td style="padding: 6px 12px; background: #f3f4f6; font-weight: 600;">Password</td>
                    <td style="padding: 6px 12px; background: #f9fafb;"><code>${password}</code></td>
                </tr>
            </table>
            <p>
                <a href="${loginUrl}" style="display: inline-block; background: #ef4444; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">Sign in</a>
            </p>
            <p style="color: #6b7280; font-size: 13px;">
                For security, please change your password after signing in.
            </p>
        </div>
    `;

    const { data, error } = await resend.emails.send({
        from: `${shopName} <${fromAddress}>`,
        to,
        subject,
        html,
    });

    if (error) {
        logger.error("Resend send failed", { error });
        throw new Error(error.message || "Failed to send email");
    }

    return data;
};
