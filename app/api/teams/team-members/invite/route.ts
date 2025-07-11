import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email sending function using Resend
async function sendInviteEmail(email: string, name: string, inviteLink: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: email,
      subject: 'You\'ve been invited to join Builder App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🏗️ Builder App</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Construction Project Management</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to the Team!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Hi <strong>${name}</strong>,
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              You've been invited to join our team on Builder App. This platform helps construction teams manage projects, track progress, and collaborate effectively.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" 
                 style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                🚀 Set Up Your Account
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">What you can do:</h3>
              <ul style="color: #666; line-height: 1.6;">
                <li>📋 Manage project tasks and timelines</li>
                <li>📊 Track budgets and finances</li>
                <li>📝 Create and view project documents</li>
                <li>👥 Collaborate with team members</li>
                <li>📅 Schedule and track project events</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 10px;">
              <strong>Important:</strong> This invitation link will expire in 7 days for security reasons.
            </p>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
              If you didn't expect this invitation, you can safely ignore this email. 
              If you have any questions, please contact your team administrator.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('📧 Email sent successfully to:', email);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, role, permissions } = await req.json();
    
    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'Name, email, and role are required' 
      }, { status: 400 });
    }

    // Check if a team member with this email already exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { email }
    });

    if (existingMember) {
      return NextResponse.json({ 
        error: 'Email already exists', 
        details: `A team member with email ${email} already exists.` 
      }, { status: 409 });
    }

    // Check if a user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Email already exists', 
        details: `A user with email ${email} already exists. Please use the "Convert to User" feature instead.` 
      }, { status: 409 });
    }

    // Generate a unique invite token
    const inviteToken = randomBytes(24).toString('hex');
    const invitedAt = new Date();
    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invite/${inviteToken}`;
    
    // Create the invited team member
    const member = await prisma.teamMember.create({
      data: {
        name,
        email,
        role,
        status: 'invited',
        inviteToken,
        invitedAt,
        permissions: permissions ? JSON.stringify(permissions) : null,
      },
    });
    
    // Send invite email
    try {
      await sendInviteEmail(email, name, inviteLink);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the entire request if email fails, but log it
      return NextResponse.json({ 
        success: true, 
        member, 
        inviteToken,
        inviteLink,
        warning: 'Team member created but email failed to send. You can manually share the invite link.',
        emailError: emailError.message
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      member, 
      inviteToken,
      inviteLink,
      message: 'Invitation sent successfully! The user will receive an email with the invite link.'
    });
  } catch (error) {
    console.error('Invite error:', error);
    
    // Handle Prisma unique constraint error specifically
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Email already exists', 
        details: 'A user or team member with this email address already exists.' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to invite user', 
      details: error?.message || error 
    }, { status: 500 });
  }
} 