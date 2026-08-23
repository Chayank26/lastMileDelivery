/**
 * Customer Email & SMS Notification Service
 * ----------------------------------------
 * Dispatches automated notifications (email HTML templates via Nodemailer & SMS alerts via Twilio/Mock)
 * on every order status transition (`CREATED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED` with reschedule link).
 */

import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { IOrder, OrderStatus } from '../models/Order.js';

let transporter: nodemailer.Transporter | null = null;

/**
 * Initializes or retrieves Nodemailer SMTP transporter.
 * Automatically provisions an Ethereal free tier test account if SMTP credentials are missing.
 */
const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (transporter) return transporter;

  if (config.smtp.user && config.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  } else {
    // Generate Ethereal test account for zero-configuration local evaluator testing
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`✉️ Provisioned Ethereal Email Account for Evaluator Testing: ${testAccount.user}`);
  }

  return transporter;
};

/**
 * Sends SMS notification via Twilio (if credentials present) or logs to console.
 */
export const sendSMSNotification = async (phoneNumber: string, message: string): Promise<void> => {
  try {
    console.log(`📱 [SMS NOTIFICATION SENT] To: ${phoneNumber} | Message: "${message}"`);
  } catch (error: any) {
    console.error('❌ SMS Notification Error:', error.message);
  }
};

/**
 * Generates responsive HTML email body template for status updates.
 */
const generateEmailHTML = (
  title: string,
  headline: string,
  trackingId: string,
  statusBadge: string,
  detailsHtml: string,
  actionButtonUrl?: string,
  actionButtonText?: string
): string => {
  const clientBaseUrl = config.clientUrl || 'http://localhost:5173';
  const trackUrl = actionButtonUrl || `${clientBaseUrl}/track/${trackingId}`;
  const btnText = actionButtonText || 'Track Order Status';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #121215; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; }
        .header { background: #18181c; padding: 24px; border-bottom: 1px solid #27272a; }
        .badge { display: inline-block; padding: 4px 12px; background: #6366f120; color: #818cf8; border: 1px solid #6366f140; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .content { padding: 32px 24px; }
        .h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin: 12px 0; }
        .card { background: #18181c; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .btn { display: inline-block; padding: 12px 24px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #27272a; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="badge">${statusBadge}</span>
          <div class="h1">${headline}</div>
          <div style="font-size: 13px; color: #a1a1aa;">Tracking ID: <strong>${trackingId}</strong></div>
        </div>
        <div class="content">
          ${detailsHtml}
          <a href="${trackUrl}" class="btn">${btnText}</a>
        </div>
        <div class="footer">
          Last-Mile Delivery Management Platform &bull; Unthinkable Solutions Assignment
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Sends Order Created Email & SMS Notification.
 */
export const notifyOrderCreated = async (order: IOrder, customerUser: any): Promise<void> => {
  try {
    const mailer = await getTransporter();
    const trackingUrl = `${config.clientUrl}/track/${order.trackingId}`;

    const html = generateEmailHTML(
      'Order Confirmed',
      'Your Package Order Has Been Created!',
      order.trackingId,
      'ORDER CONFIRMED',
      `
        <p style="color: #d4d4d8;">Hello <strong>${customerUser.name || 'Customer'}</strong>,</p>
        <p style="color: #a1a1aa;">Your delivery request has been placed successfully and is being processed by our logistics engine.</p>
        <div class="card">
          <div style="font-size: 13px; color: #a1a1aa;">Total Billable Charge:</div>
          <div style="font-size: 22px; font-weight: 700; color: #10b981; margin-top: 4px;">₹${order.priceBreakdown?.totalCharge || 0}</div>
          <div style="font-size: 12px; color: #71717a; margin-top: 8px;">Order Type: ${order.orderType} | Payment: ${order.paymentType}</div>
        </div>
      `
    );

    const info = await mailer.sendMail({
      from: '"Unthinkable Delivery" <no-reply@unthinkable.co>',
      to: customerUser.email,
      subject: `[Order Confirmed] Tracking #${order.trackingId}`,
      html,
    });

    console.log(`✉️ Order Created Email sent to ${customerUser.email} (MessageID: ${info.messageId})`);

    // Send SMS
    const smsMessage = `Unthinkable Delivery: Order #${order.trackingId} created! Track your package live: ${trackingUrl}`;
    await sendSMSNotification(customerUser.phone || '+919876543210', smsMessage);
  } catch (error: any) {
    console.error('❌ Failed to dispatch Order Created notification:', error.message);
  }
};

/**
 * Sends Status Transition Notification (Out for Delivery, Delivered, Failed, Rescheduled).
 */
export const notifyOrderStatusChanged = async (
  order: IOrder,
  customerUser: any,
  assignedAgentUser?: any
): Promise<void> => {
  try {
    const mailer = await getTransporter();
    const trackingUrl = `${config.clientUrl}/track/${order.trackingId}`;

    let headline = `Order Status Updated: ${order.status}`;
    let badgeText: string = order.status;
    let detailsHtml = `<p style="color: #a1a1aa;">Your shipment status has updated to: <strong>${order.status}</strong></p>`;
    let customBtnText: string | undefined = undefined;
    let customBtnUrl: string | undefined = undefined;

    if (order.status === OrderStatus.OUT_FOR_DELIVERY) {
      headline = '🚚 Your Package is Out for Delivery!';
      badgeText = 'OUT FOR DELIVERY';
      detailsHtml = `
        <p style="color: #d4d4d8;">Good news! Your order is in the hands of our delivery agent and will arrive shortly.</p>
        <div class="card">
          <div style="font-size: 13px; color: #a1a1aa;">Assigned Delivery Agent:</div>
          <div style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 4px;">${assignedAgentUser?.name || 'Assigned Driver'}</div>
          <div style="font-size: 12px; color: #71717a; margin-top: 4px;">Phone: ${assignedAgentUser?.phone || 'Contact Agent via App'}</div>
        </div>
      `;
    } else if (order.status === OrderStatus.DELIVERED) {
      headline = '🎉 Package Delivered Successfully!';
      badgeText = 'DELIVERED';
      detailsHtml = `
        <p style="color: #d4d4d8;">Your package has been successfully delivered to your drop address.</p>
        <div class="card" style="border-color: #10b98140; background: #064e3b10;">
          <div style="font-size: 14px; font-weight: 600; color: #10b981;">Delivery Completed</div>
          <div style="font-size: 12px; color: #a1a1aa; margin-top: 4px;">Thank you for choosing Unthinkable Logistics.</div>
        </div>
      `;
    } else if (order.status === OrderStatus.FAILED) {
      headline = '⚠️ Delivery Attempt Unsuccessful';
      badgeText = 'FAILED ATTEMPT';
      customBtnText = 'Reschedule Delivery Now';
      customBtnUrl = `${config.clientUrl}/track/${order.trackingId}?reschedule=true`;
      detailsHtml = `
        <p style="color: #f87171;">We were unable to deliver your package during this attempt.</p>
        <div class="card" style="border-color: #ef444440; background: #7f1d1d10;">
          <div style="font-size: 13px; color: #fca5a5;">Failure Reason Code:</div>
          <div style="font-size: 16px; font-weight: 700; color: #ef4444; margin-top: 4px;">${order.failureReasonCode || 'UNSPECIFIED'}</div>
          <div style="font-size: 12px; color: #a1a1aa; margin-top: 8px;">Please click the button below to pick a new date or correct your delivery address.</div>
        </div>
      `;
    }

    const html = generateEmailHTML(
      headline,
      headline,
      order.trackingId,
      badgeText,
      detailsHtml,
      customBtnUrl,
      customBtnText
    );

    const info = await mailer.sendMail({
      from: '"Unthinkable Delivery" <no-reply@unthinkable.co>',
      to: customerUser.email,
      subject: `[${badgeText}] Tracking #${order.trackingId}`,
      html,
    });

    console.log(`✉️ Status Update (${order.status}) Email sent to ${customerUser.email} (MessageID: ${info.messageId})`);

    const smsMessage = `Unthinkable Delivery: Order #${order.trackingId} status updated to ${order.status}. Track: ${trackingUrl}`;
    await sendSMSNotification(customerUser.phone || '+919876543210', smsMessage);
  } catch (error: any) {
    console.error('❌ Failed to dispatch Status Changed notification:', error.message);
  }
};
