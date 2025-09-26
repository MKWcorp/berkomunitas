export async function generateMetadata({ params }) {
  const { id } = await params;
  
  try {
    // Fetch task data untuk metadata
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://berkomunitas.com'}/api/tugas/${id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return {
        title: `Kerjakan Tugas ${id}`,
        description: 'Tugas yang Anda cari tidak tersedia.',
        openGraph: {
          title: `Kerjakan Tugas ${id}`,
          description: 'Tugas yang Anda cari tidak tersedia.',
          url: `https://berkomunitas.com/tugas/${id}`,
          siteName: 'Komunitas Komentar DRW Corp',
          images: [
            {
              url: 'https://berkomunitas.com/og-detail-tugas.jpg',
              width: 1200,
              height: 630,
              alt: 'Tugas Tidak Ditemukan',
            },
          ],
          locale: 'id_ID',
          type: 'website',
        },
      };
    }
    
    const result = await response.json();
    const task = result.task;
    
    if (!task) {
      return {
        title: `Kerjakan Tugas ${id}`,
        description: 'Tugas yang Anda cari tidak tersedia.',
        openGraph: {
          title: `Kerjakan Tugas ${id}`,
          description: 'Tugas yang Anda cari tidak tersedia.',
          url: `https://berkomunitas.com/tugas/${id}`,
          siteName: 'Komunitas Komentar DRW Corp',
          images: [
            {
              url: 'https://berkomunitas.com/og-detail-tugas.jpg',
              width: 1200,
              height: 630,
              alt: 'Tugas Tidak Ditemukan',
            },
          ],
          locale: 'id_ID',
          type: 'website',
        },
      };
    }
    
    return {
      title: `Kerjakan Tugas ${id}`,
      description: task.deskripsi_tugas ? task.deskripsi_tugas.substring(0, 160) : 'Detail tugas komunitas komentar DRW Corp',
      openGraph: {
        title: `Kerjakan Tugas ${id}`,
        description: task.deskripsi_tugas ? task.deskripsi_tugas.substring(0, 160) : 'Detail tugas komunitas komentar DRW Corp',
        url: `https://berkomunitas.com/tugas/${id}`,
        siteName: 'Komunitas Komentar DRW Corp',
        images: [
          {
            url: 'https://berkomunitas.com/og-detail-tugas.jpg',
            width: 1200,
            height: 630,
            alt: task.nama_tugas || 'Detail Tugas',
          },
        ],
        locale: 'id_ID',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Kerjakan Tugas ${id}`,
        description: task.deskripsi_tugas ? task.deskripsi_tugas.substring(0, 160) : 'Detail tugas komunitas komentar DRW Corp',
        images: ['https://berkomunitas.com/og-detail-tugas.jpg'],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: `Kerjakan Tugas ${id}`,
      description: 'Detail tugas komunitas komentar DRW Corp',
      openGraph: {
        title: `Kerjakan Tugas ${id}`,
        description: 'Detail tugas komunitas komentar DRW Corp',
        url: `https://berkomunitas.com/tugas/${id}`,
        siteName: 'Komunitas Komentar DRW Corp',
        images: [
          {
            url: 'https://berkomunitas.com/og-detail-tugas.jpg',
            width: 1200,
            height: 630,
            alt: `Kerjakan Tugas ${id}`,
          },
        ],
        locale: 'id_ID',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Kerjakan Tugas ${id}`,
        description: 'Detail tugas komunitas komentar DRW Corp',
        images: ['https://berkomunitas.com/og-detail-tugas.jpg'],
      },
    };
  }
}
