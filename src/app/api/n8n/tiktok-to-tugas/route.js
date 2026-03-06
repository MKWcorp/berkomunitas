import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/n8n/tiktok-to-tugas
 *
 * N8n calls this after scraping a new TikTok content to automatically create
 * a tugas_ai_2 task for community members to comment on.
 *
 * Secured by shared secret header: x-n8n-secret or Authorization: Bearer <secret>
 *
 * Payload from n8n:
 * {
 *   // TikTok content (must match tiktok_contents columns)
 *   content_id: string,           // TikTok video ID (unique)
 *   author_username: string,
 *   author_nickname?: string,
 *   description?: string,
 *   video_url: string,
 *   cover_url?: string,
 *   like_count?: number,
 *   comment_count?: number,
 *   share_count?: number,
 *   view_count?: number,
 *   created_at_tiktok?: string,   // ISO timestamp of original TikTok post
 *
 *   // Task configuration (optional overrides)
 *   keyword_tugas?: string,       // defaults to "#DRWSkincare @{author}"
 *   deskripsi_tugas?: string,
 *   point_value?: number,         // default: 10
 *   expires_hours?: number,       // task expiry window in hours (default: 72)
 *   n8n_execution_id?: string,
 * }
 */
export async function POST(request) {
  console.log('🎵 [TikTok→Tugas] Received create request...');

  // Validate shared secret
  const authHeader = request.headers.get('x-n8n-secret') || request.headers.get('authorization');
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET;
  if (expectedSecret && authHeader !== expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    console.warn('❌ [TikTok→Tugas] Unauthorised — invalid secret');
    return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    content_id,
    author_username,
    author_nickname,
    description,
    video_url,
    cover_url,
    like_count,
    comment_count,
    share_count,
    view_count,
    created_at_tiktok,
    keyword_tugas,
    deskripsi_tugas,
    point_value = 10,
    expires_hours = 72,
    n8n_execution_id,
  } = body;

  if (!content_id || !author_username || !video_url) {
    return NextResponse.json(
      { success: false, message: 'content_id, author_username, and video_url are required' },
      { status: 400 }
    );
  }

  try {
    // 1. Upsert tiktok_contents record
    const tiktokContent = await prisma.tiktok_contents.upsert({
      where: { content_id },
      update: {
        author_nickname: author_nickname ?? undefined,
        description: description ?? undefined,
        video_url,
        cover_url: cover_url ?? undefined,
        like_count: like_count ?? undefined,
        comment_count: comment_count ?? undefined,
        share_count: share_count ?? undefined,
        view_count: view_count ?? undefined,
        updated_at: new Date(),
      },
      create: {
        content_id,
        author_username,
        author_nickname: author_nickname ?? null,
        description: description ?? null,
        video_url,
        cover_url: cover_url ?? null,
        like_count: like_count ?? null,
        comment_count: comment_count ?? null,
        share_count: share_count ?? null,
        view_count: view_count ?? null,
        created_at_tiktok: created_at_tiktok ? new Date(created_at_tiktok) : null,
        scraped_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log('✅ [TikTok→Tugas] tiktok_content upserted:', tiktokContent.id);

    // 2. Check if a tugas_ai_2 task already exists for this content
    const existingTask = await prisma.tugas_ai_2.findFirst({
      where: { tiktok_content_id: tiktokContent.id },
      select: { id: true, status: true },
    });

    if (existingTask) {
      console.log('ℹ️ [TikTok→Tugas] Task already exists for content:', tiktokContent.id, '→ task', existingTask.id);
      return NextResponse.json({
        success: true,
        message: 'Task already exists for this TikTok content',
        data: { created: false, taskId: existingTask.id, tiktokContentId: tiktokContent.id },
      });
    }

    // 3. Build task metadata
    const resolvedKeyword = keyword_tugas || `@${author_username} #DRWSkincare`;
    const resolvedDescription = deskripsi_tugas
      || `Komentar di video TikTok @${author_username}: "${(description || '').slice(0, 120)}${(description || '').length > 120 ? '...' : ''}"`;

    const expiresAt = expires_hours > 0
      ? new Date(Date.now() + expires_hours * 60 * 60 * 1000)
      : null;

    const verificationRules = {
      platform: 'tiktok',
      keyword: resolvedKeyword,
      min_confidence: 70,
      check_username: false,
    };

    // 4. Create the tugas_ai_2 record
    const newTask = await prisma.tugas_ai_2.create({
      data: {
        keyword_tugas:     resolvedKeyword,
        deskripsi_tugas:   resolvedDescription,
        link_postingan:    video_url,
        status:            'tersedia',
        point_value:       point_value,
        source:            'tiktok',
        tiktok_content_id: tiktokContent.id,
        verification_rules: verificationRules,
        max_submissions:   1,
        post_timestamp:    created_at_tiktok ? new Date(created_at_tiktok) : new Date(),
        expires_at:        expiresAt,
        created_at:        new Date(),
        updated_at:        new Date(),
      },
    });

    console.log(`✅ [TikTok→Tugas] Created task #${newTask.id} for content ${tiktokContent.id}`);

    return NextResponse.json({
      success: true,
      message: 'Task created successfully',
      data: {
        created: true,
        taskId: newTask.id,
        tiktokContentId: tiktokContent.id,
        keyword_tugas: resolvedKeyword,
        point_value: point_value,
        expires_at: expiresAt?.toISOString() ?? null,
      },
    });

  } catch (error) {
    console.error('❌ [TikTok→Tugas] Fatal error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
