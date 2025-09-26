export const metadata = {
  title: 'Daftar Tugas AI - Komunitas Komentar DRW Corp',
  description: 'Daftar tugas AI untuk komunitas komentar DRW Corp. Kerjakan tugas, dapatkan poin, dan tingkatkan loyalitas Anda.',
  openGraph: {
    title: 'Daftar Tugas AI - Komunitas Komentar DRW Corp',
    description: 'Daftar tugas AI untuk komunitas komentar DRW Corp. Kerjakan tugas, dapatkan poin, dan tingkatkan loyalitas Anda.',
    url: 'https://berkomunitas.com/tugas',
    siteName: 'Komunitas Komentar DRW Corp',
    images: [
      {
        url: 'https://berkomunitas.com/og-detail-tugas.jpg',
        width: 1200,
        height: 630,
        alt: 'Daftar Tugas AI - Komunitas Komentar DRW Corp',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daftar Tugas AI - Komunitas Komentar DRW Corp',
    description: 'Daftar tugas AI untuk komunitas komentar DRW Corp. Kerjakan tugas, dapatkan poin, dan tingkatkan loyalitas Anda.',
    images: ['https://berkomunitas.com/og-detail-tugas.jpg'],
  },
};

export default function TugasLayout({ children }) {
  return children;
}
