import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import NavigationWrapper from './components/NavigationWrapper';
import ContentWrapper from './components/ContentWrapper';
import SubdomainHandler from './components/SubdomainHandler';
import AutoGlassWrapper from '@/components/AutoGlassWrapper';
import { GlassThemeProvider } from '@/hooks/useGlassTheme';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Berkomunitas',
  description: 'Platform Komunitas Digital',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
      </head>
      <body 
        suppressHydrationWarning={true}
        className="m-0 p-0 min-h-screen w-full overflow-x-hidden"
      >
        <ClerkProvider 
          appearance={{
            baseTheme: undefined,
            layout: {
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "blockButton",
            },
            variables: {
              colorPrimary: "#ef4444",
            },
          }}
        >
          <GlassThemeProvider>
            <SubdomainHandler />
            <NavigationWrapper />
            <AutoGlassWrapper>
              <ContentWrapper>
                {children}
              </ContentWrapper>
            </AutoGlassWrapper>
          </GlassThemeProvider>
        </ClerkProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}