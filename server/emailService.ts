let mailService: any = null;

async function initializeMailService(): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY not set - email notifications will be disabled");
    return false;
  }
  
  if (!mailService) {
    try {
      const sendgrid = await import('@sendgrid/mail');
      mailService = sendgrid.default;
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

export async function sendComplaintNotification(
  adminEmails: string[],
  complaint: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    residentName: string;
    flatNumber: string;
    societyName: string;
  }
): Promise<boolean> {
  if (!(await initializeMailService())) {
    console.log('Email service not available - complaint notifications disabled');
    return false;
  }

  const validEmails = adminEmails.filter(email => email && email.trim() !== '');
  if (validEmails.length === 0) return false;

  const priorityColors = { high: '#dc2626', medium: '#f59e0b', low: '#10b981' };
  const priorityColor = priorityColors[complaint.priority as keyof typeof priorityColors] || '#10b981';

  const subject = `🔧 New ${complaint.priority.toUpperCase()} Priority Complaint - ${complaint.societyName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${priorityColor}; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🔧 New Maintenance Request</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${complaint.societyName}</p>
      </div>
      
      <div style="padding: 30px; background: #f8fafc;">
        <h2 style="color: #1e293b; margin-top: 0;">${complaint.title}</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${priorityColor};">
          <p><strong>Category:</strong> ${complaint.category}</p>
          <p><strong>Priority:</strong> <span style="color: ${priorityColor}; font-weight: bold;">${complaint.priority.toUpperCase()}</span></p>
          <p><strong>Resident:</strong> ${complaint.residentName} (Flat ${complaint.flatNumber})</p>
          <p><strong>Description:</strong></p>
          <p style="color: #334155; line-height: 1.6; margin: 10px 0;">${complaint.description}</p>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center; background: #e2e8f0; color: #64748b;">
        <p style="margin: 0; font-size: 14px;">
          Please log in to the admin portal to review and assign this complaint.<br>
          Complaint ID: ${complaint.id}
        </p>
      </div>
    </div>
  `;

  try {
    let successCount = 0;
    for (const email of validEmails) {
      const success = await sendEmail({
        to: email,
        from: process.env.EMAIL_FROM || 'noreply@societyhub.com',
        subject,
        text: `New ${complaint.priority} priority complaint: ${complaint.title}\n\nResident: ${complaint.residentName} (Flat ${complaint.flatNumber})\nCategory: ${complaint.category}\nDescription: ${complaint.description}\n\nComplaint ID: ${complaint.id}`,
        html,
      });
      if (success) successCount++;
    }
    return successCount > 0;
  } catch (error) {
    console.error('Failed to send complaint notifications:', error);
    return false;
  }
}

export async function sendBookingNotification(
  residentEmail: string,
  booking: {
    id: string;
    facilityName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status: string;
    totalAmount: number;
    residentName: string;
    societyName: string;
  }
): Promise<boolean> {
  if (!(await initializeMailService())) {
    console.log('Email service not available - booking notifications disabled');
    return false;
  }

  if (!residentEmail || !residentEmail.trim()) return false;

  const statusColors = { approved: '#10b981', pending: '#f59e0b', rejected: '#dc2626', cancelled: '#6b7280' };
  const statusColor = statusColors[booking.status as keyof typeof statusColors] || '#f59e0b';
  const statusEmoji = { approved: '✅', pending: '⏳', rejected: '❌', cancelled: '🚫' };
  const emoji = statusEmoji[booking.status as keyof typeof statusEmoji] || '⏳';

  const subject = `${emoji} Facility Booking ${booking.status.toUpperCase()} - ${booking.societyName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${statusColor}; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">${emoji} Booking ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${booking.societyName}</p>
      </div>
      
      <div style="padding: 30px; background: #f8fafc;">
        <h2 style="color: #1e293b; margin-top: 0;">${booking.facilityName}</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColor};">
          <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
          <p><strong>Amount:</strong> ₹${(booking.totalAmount / 100).toFixed(2)}</p>
          <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${booking.status.toUpperCase()}</span></p>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center; background: #e2e8f0; color: #64748b;">
        <p style="margin: 0; font-size: 14px;">
          Booking ID: ${booking.id}<br>
          ${booking.status === 'approved' ? 'Please arrive on time for your booking.' : booking.status === 'rejected' ? 'Contact the admin for more information about rejection.' : 'You will receive another notification when status changes.'}
        </p>
      </div>
    </div>
  `;

  try {
    return await sendEmail({
      to: residentEmail,
      from: process.env.EMAIL_FROM || 'noreply@societyhub.com',
      subject,
      text: `Facility Booking ${booking.status}: ${booking.facilityName}\n\nDate: ${new Date(booking.bookingDate).toLocaleDateString()}\nTime: ${booking.startTime} - ${booking.endTime}\nAmount: ₹${(booking.totalAmount / 100).toFixed(2)}\nStatus: ${booking.status.toUpperCase()}\n\nBooking ID: ${booking.id}`,
      html,
    });
  } catch (error) {
    console.error('Failed to send booking notification:', error);
    return false;
  }
}

export async function sendVotingNotification(
  residents: { email: string; firstName: string }[],
  poll: {
    id: string;
    title: string;
    description: string;
    endDate: string;
    societyName: string;
    createdByName: string;
    isAnonymous: boolean;
  }
): Promise<boolean> {
  if (!(await initializeMailService())) {
    console.log('Email service not available - voting notifications disabled');
    return false;
  }

  const validEmails = residents
    .map(resident => resident.email)
    .filter(email => email && email.trim() !== '');
  
  if (validEmails.length === 0) return false;

  const subject = `🗳️ New Poll: ${poll.title} - ${poll.societyName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🗳️ New Community Poll</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${poll.societyName}</p>
      </div>
      
      <div style="padding: 30px; background: #f8fafc;">
        <h2 style="color: #1e293b; margin-top: 0;">${poll.title}</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p style="color: #334155; line-height: 1.6; margin: 0 0 15px 0;">${poll.description}</p>
          <p><strong>Created by:</strong> ${poll.createdByName}</p>
          <p><strong>Voting ends:</strong> ${new Date(poll.endDate).toLocaleDateString()} at ${new Date(poll.endDate).toLocaleTimeString()}</p>
          <p><strong>Type:</strong> ${poll.isAnonymous ? 'Anonymous voting' : 'Public voting'}</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <div style="display: inline-block; padding: 15px 30px; background: #3b82f6; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Cast Your Vote Now
          </div>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center; background: #e2e8f0; color: #64748b;">
        <p style="margin: 0; font-size: 14px;">
          Your participation matters! Log in to the resident portal to cast your vote.<br>
          Poll ID: ${poll.id}
        </p>
      </div>
    </div>
  `;

  try {
    let successCount = 0;
    for (const email of validEmails) {
      const success = await sendEmail({
        to: email,
        from: process.env.EMAIL_FROM || 'noreply@societyhub.com',
        subject,
        text: `New Community Poll: ${poll.title}\n\n${poll.description}\n\nCreated by: ${poll.createdByName}\nVoting ends: ${new Date(poll.endDate).toLocaleDateString()} at ${new Date(poll.endDate).toLocaleTimeString()}\nType: ${poll.isAnonymous ? 'Anonymous voting' : 'Public voting'}\n\nLog in to cast your vote!\nPoll ID: ${poll.id}`,
        html,
      });
      if (success) successCount++;
      
      if (validEmails.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    return successCount > 0;
  } catch (error) {
    console.error('Failed to send voting notifications:', error);
    return false;
  }
}