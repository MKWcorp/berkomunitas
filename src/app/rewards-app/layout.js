import { ClerkProvider } from '@clerk/nextjs';
import RewardsLayout from './components/RewardsLayout';
import '../globals.css';

export const metadata = {
  title: 'Rewards Management - Komunitas Komentar',
  description: 'Dedicated rewards management system untuk mengelola hadiah dan penukaran poin',
};

export default function RewardsAppLayout({ children }) {
  return (
    <ClerkProvider>
      <RewardsLayout>
        {children}
      </RewardsLayout>
    </ClerkProvider>
  );
}
