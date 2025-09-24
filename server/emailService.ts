let mailService: any = null;

async function initializeMailService(): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY not set - email notifications will be disabled");
    return false;
  }
  
  if (!mailService) {
    try {
      const sendgrid = await import('@sendgrid/mail');
      mailService = new sendgrid.MailService();
      mailService.setApiKey(process.env.SENDGRID_API_KEY);
    } catch (error) {
      console.warn("SendGrid package not available - email notifications disabled:", error);
      return false;
    }
  }
  
  return true;
}

interface EmailParams {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!(await initializeMailService())) {
    console.log('Email service not available - skipping email send');
    return false;
  }
  
  try {
    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };
    
    if (params.text) {
      emailData.text = params.text;
    }
    
    if (params.html) {
      emailData.html = params.html;
    }
    
    // Ensure at least one content type is provided
    if (!params.text && !params.html) {
      emailData.text = 'This is an automated email notification.';
    }
    
    await mailService!.send(emailData);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendAnnouncementToResidents(
  residents: { email: string; firstName: string; lastName?: string }[],
  announcement: {
    title: string;
    content: string;
    isUrgent: boolean;
    societyName: string;
  }
): Promise<boolean> {
  if (!(await initializeMailService())) {
    console.log('Email service not available - announcement notifications disabled');
    return false;
  }

  const recipientEmails = residents
    .map(resident => resident.email)
    .filter(email => email && email.trim() !== '');

  if (recipientEmails.length === 0) {
    console.log('No valid resident emails found to send announcement');
    return false;
  }

  const urgentPrefix = announcement.isUrgent ? '[URGENT] ' : '';
  const subject = `${urgentPrefix}${announcement.title} - ${announcement.societyName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${announcement.isUrgent ? '#dc2626' : '#3b82f6'}; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">
          ${announcement.isUrgent ? '🚨 URGENT ANNOUNCEMENT' : '📢 New Announcement'}
        </h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${announcement.societyName}</p>
      </div>
      
      <div style="padding: 30px; background: #f8fafc;">
        <h2 style="color: #1e293b; margin-top: 0;">${announcement.title}</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${announcement.isUrgent ? '#dc2626' : '#3b82f6'};">
          <p style="color: #334155; line-height: 1.6; margin: 0;">${announcement.content.replace(/\n/g, '<br>')}</p>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center; background: #e2e8f0; color: #64748b;">
        <p style="margin: 0; font-size: 14px;">
          This is an automated message from your society management system.<br>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  const text = `
${announcement.isUrgent ? 'URGENT ANNOUNCEMENT' : 'NEW ANNOUNCEMENT'}
${announcement.societyName}

${announcement.title}

${announcement.content}

---
This is an automated message from your society management system.
Please do not reply to this email.
  `;

  try {
    let successCount = 0;
    let failureCount = 0;
    
    // Send individual emails to protect privacy
    for (const email of recipientEmails) {
      const success = await sendEmail({
        to: email,
        from: process.env.EMAIL_FROM || 'noreply@societyhub.com', // Configure EMAIL_FROM in secrets
        subject,
        text,
        html,
      });
      
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Add small delay to avoid rate limiting
      if (recipientEmails.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Announcement emails: ${successCount} sent successfully, ${failureCount} failed`);
    return successCount > 0;
  } catch (error) {
    console.error('Failed to send announcement emails:', error);
    return false;
  }
}