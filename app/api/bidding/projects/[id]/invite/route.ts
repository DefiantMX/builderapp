import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

async function sendBidInvitationEmail(
  email: string,
  contactName: string,
  companyName: string,
  biddingProjectName: string,
  planTitle: string,
  planUrl: string,
  baseUrl: string
) {
  if (!resend) {
    console.log('📧 Resend not configured. Email details:')
    console.log('📧 To:', email)
    console.log('📧 Subject: Bid Invitation - ' + biddingProjectName)
    console.log('📧 Plan URL:', planUrl)
    return { success: true, message: 'Email logged (Resend not configured)' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: `Bid Invitation - ${biddingProjectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🏗️ Builder App</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Bid Invitation</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Bid Invitation</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Hi <strong>${contactName}</strong>,
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              You are invited to submit a bid for <strong>${biddingProjectName}</strong>.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Project Details:</h3>
              <p style="color: #666; margin: 5px 0;"><strong>Project:</strong> ${biddingProjectName}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Plan:</strong> ${planTitle}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${planUrl}" 
                 style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                📄 View Plans & Submit Bid
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
              If you have any questions, please contact the project administrator.
            </p>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    return { success: true, message: 'Email sent successfully' }
  } catch (error) {
    console.error('Email sending error:', error)
    throw error
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Verify bidding project belongs to user
    const biddingProject = await db.biddingProject.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!biddingProject) {
      return new NextResponse('Bidding project not found', { status: 404 })
    }

    const body = await request.json()
    const { bidderIds, biddingPlanIds } = body

    if (!bidderIds || !Array.isArray(bidderIds) || bidderIds.length === 0) {
      return new NextResponse('At least one bidder is required', { status: 400 })
    }

    if (!biddingPlanIds || !Array.isArray(biddingPlanIds) || biddingPlanIds.length === 0) {
      return new NextResponse('At least one plan is required', { status: 400 })
    }

    // Fetch bidders and plans
    const bidders = await db.bidder.findMany({
      where: {
        id: { in: bidderIds },
        biddingProjectId: params.id
      }
    })

    const plans = await db.biddingPlan.findMany({
      where: {
        id: { in: biddingPlanIds },
        biddingProjectId: params.id
      }
    })

    if (bidders.length === 0) {
      return new NextResponse('No valid bidders found', { status: 400 })
    }

    if (plans.length === 0) {
      return new NextResponse('No valid plans found', { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000'
    const invitations = []

    // Create invitations and send emails
    for (const bidder of bidders) {
      for (const plan of plans) {
        // Check if invitation already exists
        const existing = await db.bidInvitation.findUnique({
          where: {
            biddingProjectId_bidderId_biddingPlanId: {
              biddingProjectId: params.id,
              bidderId: bidder.id,
              biddingPlanId: plan.id
            }
          }
        })

        if (!existing) {
          const planUrl = `${baseUrl}/bidding/${params.id}?plan=${plan.id}`
          
          // Send email
          let emailSent = false
          let emailSentAt = null
          try {
            await sendBidInvitationEmail(
              bidder.email,
              bidder.contactName,
              bidder.companyName,
              biddingProject.name,
              plan.title,
              planUrl,
              baseUrl
            )
            emailSent = true
            emailSentAt = new Date()
          } catch (error) {
            console.error(`Failed to send email to ${bidder.email}:`, error)
          }

          const invitation = await db.bidInvitation.create({
            data: {
              biddingProjectId: params.id,
              bidderId: bidder.id,
              biddingPlanId: plan.id,
              emailSent,
              emailSentAt
            }
          })

          invitations.push(invitation)
        }
      }
    }

    return NextResponse.json({
      success: true,
      invitations,
      message: `Invitations sent to ${bidders.length} bidder(s) for ${plans.length} plan(s)`
    })
  } catch (error) {
    console.error('Error sending bid invitations:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

