export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(req: NextRequest) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'noreply@doorly.app';

  const diagnostics = {
    env: {
      SMTP_HOST_exists: !!host,
      SMTP_HOST_value: host || null,
      SMTP_PORT_value: port,
      SMTP_USER_exists: !!user,
      SMTP_USER_value: user || null,
      SMTP_PASS_exists: !!pass,
      SMTP_PASS_length: pass ? pass.length : 0,
      SMTP_FROM_value: from,
    },
    smtpStatus: 'Not tested',
    errorDetails: null as any,
  };

  if (!host || !user || !pass) {
    diagnostics.smtpStatus = 'Failed: Missing environment variables';
    return NextResponse.json(diagnostics, { status: 400 });
  }

  const transporterOptions: any = host.includes('gmail.com')
    ? {
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      }
    : {
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      };

  try {
    const transporter = nodemailer.createTransport(transporterOptions);
    
    // Verify connection configuration
    await new Promise<void>((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    diagnostics.smtpStatus = 'Success: SMTP connection verified!';
    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error: any) {
    console.error('SMTP Diagnostic Error:', error);
    diagnostics.smtpStatus = 'Failed: Connection error';
    diagnostics.errorDetails = {
      message: error.message || String(error),
      code: error.code || null,
      command: error.command || null,
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
