import nodemailer from "nodemailer";

/**
 * Creates and returns a Nodemailer transporter instance using environment variables.
 */
const getTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("⚠️ Email warning: SMTP_USER or SMTP_PASS is missing in server/.env");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for port 465, false for other ports (587)
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Formats a Date object or string into a readable string (e.g., Monday, Aug 12, 2026 at 4:00 PM).
 */
const formatDate = (dateStr) => {
  if (!dateStr) return "TBA";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return String(dateStr);
  }
};

/**
 * Sends an event registration confirmation email to the attendee.
 *
 * @param {Object} params
 * @param {string} params.recipientEmail - Receiver email address
 * @param {string} params.recipientName - Receiver full name
 * @param {Object} params.event - Event document details
 * @param {string} params.registrationStatus - "REGISTERED" or "WAITLISTED"
 */
export const sendEventRegistrationEmail = async ({
  recipientEmail,
  recipientName = "Attendee",
  event,
  registrationStatus = "REGISTERED",
}) => {
  try {
    if (!recipientEmail) {
      console.warn("⚠️ Email warning: No recipient email provided for registration notification.");
      return false;
    }

    const fromAddress = process.env.EMAIL_FROM || `"Clubviews Events" <${process.env.SMTP_USER || "noreply@clubviews.com"}>`;
    const transporter = getTransporter();

    const isRegistered = registrationStatus === "REGISTERED";
    const statusColor = isRegistered ? "#16a34a" : "#d97706";
    const statusBg = isRegistered ? "#f0fdf4" : "#fffbe6";
    const statusBorder = isRegistered ? "#bbf7d0" : "#fef08a";
    const statusText = isRegistered ? "Registration Confirmed" : "Added to Waitlist";

    const clubName = event.club?.name || event.organizerName || "Campus Club";
    const venue = event.venue || event.location || "Main Auditorium / Campus";
    const startTimeFormatted = formatDate(event.startTime || event.date);
    const endTimeFormatted = event.endTime ? formatDate(event.endTime) : null;
    const entryFeeText = event.entryFee ? `₹${event.entryFee}` : "Free";

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Event Registration Confirmation</title>
    </head>
    <body style="margin:0; padding:0; background-color:#09090b; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#e4e4e7;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090b; padding:40px 10px;">
        <tr>
          <td align="center">
            <!-- Container Box -->
            <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; background-color:#18181b; border-radius:16px; border:1px solid #27272a; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
              
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg, #18181b 0%, #09090b 100%); padding:32px 32px 24px 32px; border-bottom:1px solid #27272a; text-align:left;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <span style="font-size:22px; font-weight:800; tracking-wide; color:#ffffff; letter-spacing:1px; font-family:sans-serif;">
                          CLUB<span style="color:#ea580c;">VIEWS</span>
                        </span>
                      </td>
                      <td align="right">
                        <span style="display:inline-block; padding:6px 14px; background-color:${statusBg}; color:${statusColor}; border:1px solid ${statusBorder}; border-radius:20px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">
                          ${statusText}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Greeting & Headline -->
              <tr>
                <td style="padding:32px 32px 16px 32px;">
                  <h1 style="margin:0 0 8px 0; font-size:24px; font-weight:700; color:#ffffff; line-height:1.3;">
                    ${isRegistered ? "You're registered!" : "You've been added to the waitlist"}
                  </h1>
                  <p style="margin:0; font-size:15px; color:#a1a1aa; line-height:1.5;">
                    Hello <strong style="color:#ffffff;">${recipientName}</strong>, your spot for <strong style="color:#ea580c;">${event.title || "the event"}</strong> has been confirmed on Clubviews.
                  </p>
                </td>
              </tr>

              <!-- Event Details Card -->
              <tr>
                <td style="padding:0 32px 32px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090b; border:1px solid #27272a; border-radius:12px; padding:20px;">
                    
                    <!-- Event Title -->
                    <tr>
                      <td colspan="2" style="padding-bottom:16px; border-bottom:1px solid #18181b;">
                        <span style="font-size:11px; text-transform:uppercase; font-weight:700; color:#71717a; letter-spacing:1px;">Event Name</span>
                        <div style="font-size:18px; font-weight:700; color:#ffffff; margin-top:4px;">${event.title || "Campus Event"}</div>
                        <div style="font-size:13px; color:#ea580c; margin-top:2px; font-weight:600;">Organized by ${clubName}</div>
                      </td>
                    </tr>

                    <!-- Date & Time -->
                    <tr>
                      <td style="padding-top:16px; padding-bottom:12px; width:50%; vertical-align:top;">
                        <span style="font-size:11px; text-transform:uppercase; font-weight:700; color:#71717a; letter-spacing:1px;">🗓️ Date & Time</span>
                        <div style="font-size:14px; font-weight:600; color:#e4e4e7; margin-top:4px;">${startTimeFormatted}</div>
                        ${endTimeFormatted ? `<div style="font-size:12px; color:#a1a1aa;">to ${endTimeFormatted}</div>` : ""}
                      </td>
                      <td style="padding-top:16px; padding-bottom:12px; width:50%; vertical-align:top;">
                        <span style="font-size:11px; text-transform:uppercase; font-weight:700; color:#71717a; letter-spacing:1px;">📍 Venue</span>
                        <div style="font-size:14px; font-weight:600; color:#e4e4e7; margin-top:4px;">${venue}</div>
                      </td>
                    </tr>

                    <!-- Category & Fee -->
                    <tr>
                      <td style="padding-top:12px; width:50%; vertical-align:top; border-top:1px solid #18181b;">
                        <span style="font-size:11px; text-transform:uppercase; font-weight:700; color:#71717a; letter-spacing:1px;">Category</span>
                        <div style="font-size:14px; font-weight:600; color:#e4e4e7; margin-top:4px;">${event.category || "General"}</div>
                      </td>
                      <td style="padding-top:12px; width:50%; vertical-align:top; border-top:1px solid #18181b;">
                        <span style="font-size:11px; text-transform:uppercase; font-weight:700; color:#71717a; letter-spacing:1px;">Entry Fee</span>
                        <div style="font-size:14px; font-weight:700; color:#22c55e; margin-top:4px;">${entryFeeText}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Instructions / Notes -->
              <tr>
                <td style="padding:0 32px 32px 32px;">
                  <div style="background-color:#18181b; border-left:3px solid #ea580c; padding:14px 16px; border-radius:0 8px 8px 0;">
                    <div style="font-size:13px; font-weight:700; color:#ffffff; margin-bottom:4px;">Important Note for Attendees</div>
                    <div style="font-size:13px; color:#a1a1aa; line-height:1.4;">
                      Please arrive 15 minutes prior to the start time and bring your student ID card or registration confirmation for smooth check-in.
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#09090b; padding:24px 32px; border-top:1px solid #27272a; text-align:center;">
                  <p style="margin:0 0 6px 0; font-size:12px; color:#71717a;">
                    You received this email because you registered for an event on <strong style="color:#a1a1aa;">Clubviews</strong>.
                  </p>
                  <p style="margin:0; font-size:11px; color:#52525b;">
                    © ${new Date().getFullYear()} Clubviews Event Portal. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    const mailOptions = {
      from: fromAddress,
      to: recipientEmail,
      subject: isRegistered
        ? `🎟️ Registration Confirmed: ${event.title || "Event"}`
        : `⌛ Waitlisted: ${event.title || "Event"}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${recipientEmail} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send registration email:", error.message);
    return false;
  }
};
