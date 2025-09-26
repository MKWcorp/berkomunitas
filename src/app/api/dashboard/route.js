import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export const dynamic = 'force-dynamic';

// Simple in-memory cache and rate limiting
let lastFetch = 0;
let cachedData = null;
const CACHE_DURATION = 5000; // 5 seconds cache
const MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests

/**
 * GET /api/dashboard
 * Fetches a comprehensive set of statistics and rankings for the dashboard.
 * This endpoint queries multiple pre-calculated tables with caching and rate limiting.
 */
export async function GET() {
  const now = Date.now();
  
  // Return cached data if available and fresh
  if (cachedData && (now - lastFetch) < CACHE_DURATION) {
    return NextResponse.json({ success: true, data: cachedData, cached: true });
  }
  
  // Rate limiting - prevent too frequent requests
  if ((now - lastFetch) < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - (now - lastFetch)));
  }

  try {
    // Calculate the date 30 days ago to fetch recent daily statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Execute queries with individual try-catch to handle potential timeouts
    let globalStatsRaw, pointRules, dailyStats, topCommenters, topLoyalty, topTaskSources, popularTasks;

    try {
      // Execute critical queries first
      globalStatsRaw = await prisma.statistik_global.findMany();
      pointRules = await prisma.loyalty_point_rules.findMany();
      
      // Execute secondary queries with shorter timeout
      const secondaryQueries = [
        prisma.statistik_harian.findMany({
          where: {
            tanggal: {
              gte: thirtyDaysAgo,
            },
          },
          orderBy: {
            tanggal: 'desc',
          },
        }),
        prisma.peringkat_member_comments.findMany({ 
          orderBy: { peringkat: 'asc' }
          // No limit - show all data for endless scroll
        }),
        prisma.peringkat_member_loyalty.findMany({ 
          orderBy: { peringkat: 'asc' }
          // No limit - show all data for endless scroll
        }),
        prisma.peringkat_sumber_tugas.findMany({ orderBy: { peringkat: 'asc' } }),
        prisma.peringkat_tugas_populer.findMany({ orderBy: { peringkat: 'asc' } }),
      ];

      [dailyStats, topCommenters, topLoyalty, topTaskSources, popularTasks] = await Promise.all(secondaryQueries);
      
    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Return minimal data on database error
      return NextResponse.json({
        success: true,
        data: {
          globalStats: [],
          pointRules: [],
          dailyStats: [],
          topCommenters: [],
          topLoyalty: [],
          topTaskSources: [],
          popularTasks: [],
        }
      });
    }

    // Helper function to convert BigInt fields in an array of objects
    const convertBigInts = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => {
        if (!item) return item;
        const newItem = {};
        for (const key in item) {
          if (typeof item[key] === 'bigint') {
            newItem[key] = Number(item[key]); // Convert BigInt to Number
          } else {
            newItem[key] = item[key];
          }
        }
        return newItem;
      });
    };

    // Transform the global stats from an array of objects to a single key-value object
    const globalStats = Array.isArray(globalStatsRaw) ? globalStatsRaw.reduce((acc, stat) => {
      if (stat && stat.nama_statistik) {
        // Also convert BigInt here
        acc[stat.nama_statistik] = typeof stat.nilai_statistik === 'bigint' 
          ? Number(stat.nilai_statistik) 
          : stat.nilai_statistik;
      }
      return acc;
    }, {}) : {};

    // Combine all results into the final data object, ensuring all BigInts are converted
    const responseData = {
      globalStats: globalStats || {},
      pointRules: convertBigInts(pointRules || []),
      dailyStats: convertBigInts(dailyStats || []),
      topCommenters: convertBigInts(topCommenters || []),
      topLoyalty: convertBigInts(topLoyalty || []),
      topTaskSources: convertBigInts(topTaskSources || []),
      popularTasks: convertBigInts(popularTasks || []),
    };

    // Cache the successful response
    cachedData = responseData;
    lastFetch = Date.now();

    return NextResponse.json({ success: true, data: responseData });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // Return cached data if available, otherwise fallback data
    const fallbackData = cachedData || {
      globalStats: {},
      pointRules: [],
      dailyStats: [],
      topCommenters: [],
      topLoyalty: [],
      topTaskSources: [],
      popularTasks: [],
    };

    return NextResponse.json({
      success: true,
      data: fallbackData,
      fallback: true
    });
  }
}
