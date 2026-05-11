import { createOAuth2Client } from '@/lib/google';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=no_code`);
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=unauthorized`);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleCalendarSyncEnabled: true,
      },
    });

    return new NextResponse(
      `<html>
        <body>
          <script>
            window.close();
          </script>
          <p>Connection successful! You can close this window.</p>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error('Google Callback Error:', error);
    return new NextResponse(
      `<html>
        <body>
          <script>
            window.close();
          </script>
          <p>Connection failed. Please try again.</p>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }
}
