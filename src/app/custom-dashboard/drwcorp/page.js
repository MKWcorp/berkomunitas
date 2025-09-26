'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { DRW_CORP_EMPLOYEES } from '../../../utils/drwcorp-employees';
import { getTierStyle, getRankConfig } from './complete-rank-config';

export default function DRWCorpDashboard() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/custom-dashboard/drwcorp', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Get all members from database (already sorted by loyalty points)
        const allMembers = data.data || [];

        // Create array with exactly 111 positions to match complete Figma data
        const allPositions = Array(111).fill(null);

        console.log('📊 Member Distribution:');
        console.log('Total members from database:', allMembers.length);
        console.log('DRW Corp employees to be placed in lower tier:', DRW_CORP_EMPLOYEES.length);

        // Fill positions 0-39: Top database members by loyalty points (ranks 1-40)
        allMembers.forEach((member, index) => {
          if (index < 40) {
            allPositions[index] = member;
          }
        });

        // Fill positions 40+: ALL DRW Corp employees from the static list (ranks 41+)
        DRW_CORP_EMPLOYEES.forEach((employeeName, index) => {
          const position = 40 + index; // Start from position 40 (rank 41)
          if (position < 111) {
            allPositions[position] = {
              id: `drwcorp-employee-${index + 1}`,
              nama_lengkap: employeeName,
              loyalty_point: 0,
              jumlah_komentar: 0,
              username_sosmed: `drwcorp-${index + 1}`,
              tier: 'guard',
              isDrwCorpEmployee: true,
              badges: [],
              hasDrwCorpBadge: false
            };
          }
        });

        // Fill remaining positions with remaining database members (if any)
        const remainingMembers = allMembers.slice(40);
        const startPosition = 40 + DRW_CORP_EMPLOYEES.length;
        remainingMembers.forEach((member, index) => {
          const position = startPosition + index;
          if (position < 111) {
            allPositions[position] = member;
          }
        });

        console.log('Final positioning:');
        console.log('Ranks 1-40: Top database members');
        console.log(`Ranks 41-${40 + DRW_CORP_EMPLOYEES.length}: DRW Corp employees`);
        console.log(`Ranks ${41 + DRW_CORP_EMPLOYEES.length}+: Remaining database members`);

        // Keep all positions (including nulls) for proper positioning
        setMembers(allPositions);
      } else {
        setError(data.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching DRW Corp data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // DRW Corp Tier System with Updated Figma positioning (111 ranks)
  const getRankingPositions = () => {
    return members.map((member, index) => {
      if (!member) return null;
      
      const rank = index + 1;
      const config = getRankConfig(rank);
      
      if (!config) return null;
      
      return {
        member,
        rank,
        ...config,
        left: `${config.x}px`,
        top: `${config.y}px`
      };
    }).filter(item => item !== null);
  };

  // Helper function untuk mempersingkat nama dengan format konsisten
  const formatName = (name, loyaltyPoints = 0, isDrwCorpEmployee = false) => {
    if (isDrwCorpEmployee) {
      // DRW Corp employees: show full name without truncation
      return name;
    }
    
    // All other members: show abbreviated name with points
    const shortName = name.length <= 8 ? name : name.substring(0, 8) + '..';
    return `${shortName} : ${loyaltyPoints.toLocaleString()}`;
  };

  const showPlayerInfo = (member) => {
    setSelectedPlayer(member);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPlayer(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Memuat Leaderboard...</p>
        </div>
        <style jsx>{`
          .loading-container {
            background-color: #0d1117;
            color: #c9d1d9;
            font-family: 'Inter', sans-serif;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 1rem;
            box-sizing: border-box;
          }
          .loading-content {
            text-align: center;
            padding: 32px;
            background: rgba(0,0,0,0.6);
            border-radius: 16px;
            border: 1px solid rgba(107,114,128,0.6);
          }
          .spinner {
            width: 64px;
            height: 64px;
            border: 4px solid #f0c975;
            border-top: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px auto;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div className="main-container">
        {/* Main Background Container */}
        <div className="background-container">
          {/* Error State */}
          {error && (
            <div className="error-banner">
              <ExclamationTriangleIcon style={{ width: '20px', height: '20px', marginRight: '8px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Member Rankings - New Figma Design with 111 ranks */}
          {members.length > 0 && getRankingPositions().map((item) => (
            <div
              key={item.member.id}
              className="ranking-box"
              style={getTierStyle(item.rank)}
              onClick={() => showPlayerInfo(item.member)}
            >
              {formatName(
                item.member.nama_lengkap, 
                item.member.loyalty_point, 
                item.member.isDrwCorpEmployee
              )}
            </div>
          ))}

          {/* Empty State */}
          {members.length === 0 && !loading && !error && (
            <div className="empty-state">
              <div className="empty-content">
                <h3>Belum Ada Member di Leaderboard</h3>
                <p>Jadilah yang pertama meraih lencana DRW Corp</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer">
          <p>© 2025 DRW Corp - Community Platform</p>
        </div>

        {/* Modal untuk menampilkan info pemain */}
        {showModal && selectedPlayer && (
          <div className="player-modal" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <span className="close-button" onClick={closeModal}>&times;</span>
              <h2 style={{ color: 'white' }}>{selectedPlayer.nama_lengkap}</h2>
              {selectedPlayer.isDrwCorpEmployee ? (
                <p style={{ color: 'white' }}>Belum terdaftar, silahkan mendaftar</p>
              ) : (
                <>
                  <div className="player-stats">
                    <p style={{ color: 'white' }}>
                      <strong>Loyalty Points:</strong> {selectedPlayer.loyalty_point?.toLocaleString() || 0}
                    </p>
                    <p style={{ color: 'white' }}>
                      <strong>Jumlah Komentar:</strong> {selectedPlayer.jumlah_komentar?.toLocaleString() || 0}
                    </p>
                  </div>
                  <Link
                    href={`/profil/${selectedPlayer.username || selectedPlayer.username_sosmed || selectedPlayer.id}`}
                    className="profile-link"
                    style={{ color: 'white', textDecoration: 'none' }}
                  >
                    Lihat profil selengkapnya
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
        
        :root {
          --primary-color: #f0c975;
          --background-color: #0d1117;
          --text-color: #c9d1d9;
          --box-bg-color: rgba(255, 255, 255, 0.9);
          --box-text-color: #1a1a1a;
          --box-border-color: #cccccc;
        }

        .main-container {
          min-height: 100vh;
          width: 100%;
          overflow-x: auto;
          overflow-y: auto;
          background: #000000;
          position: relative;
        }

        .background-container {
          position: relative;
          width: 1123px;
          height: 5180px;
          min-width: 1123px;
          margin: 0 auto;
          background-image: url('/background_drwcorp_3.jpeg');
          background-size: 1123px 5180px;
          background-repeat: no-repeat;
          background-position: center top;
        }

        .ranking-box {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
          border: 1px solid #cccccc;
          cursor: pointer;
          transition: transform 0.2s;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          text-align: center;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
          line-height: 1;
        }

        .ranking-box:hover {
          transform: scale(1.05);
        }

        .error-banner {
          position: absolute;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(239, 68, 68, 0.9);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          z-index: 40;
          backdrop-filter: blur(5px);
        }

        .empty-state {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: white;
        }

        .empty-content h3 {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .empty-content p {
          font-size: 16px;
          opacity: 0.8;
        }

        .footer {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          text-align: center;
          padding: 16px;
          z-index: 10;
        }

        .player-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 24px;
          border-radius: 12px;
          max-width: 400px;
          width: 90%;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .close-button {
          position: absolute;
          top: 12px;
          right: 16px;
          font-size: 28px;
          cursor: pointer;
          color: #ffffff;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .close-button:hover {
          opacity: 1;
        }

        .modal-content h2 {
          margin-top: 0;
          margin-bottom: 16px;
          color: #ffffff;
          font-weight: 600;
        }

        .modal-content p {
          margin-bottom: 16px;
          color: #ffffff !important;
          font-size: 16px;
        }

        .player-stats {
          margin-bottom: 24px;
        }

        .player-stats p {
          margin-bottom: 12px;
          color: #ffffff !important;
          font-size: 16px;
        }

        .profile-link {
          display: inline-block;
          background: #F8C600;
          color: #000000 !important;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none !important;
          font-weight: 600;
          transition: all 0.2s;
          border: 2px solid #F8C600;
        }

        .profile-link:hover {
          background: #e6b800;
          border-color: #e6b800;
          transform: translateY(-1px);
        }        /* Gaya untuk setiap kotak peringkat */
        .ranking-box {
          position: absolute;
          border: 1px solid var(--box-border-color);
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 8px; 
          font-weight: bold;
          text-align: center;
          white-space: nowrap;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }

        /* Styling khusus untuk peringkat 1-3 */
        .ranking-box[style*="#f8c600"] {
          width: 180px !important;
          height: 45px !important;
          font-size: 20px !important;
          font-family: 'Poppins', sans-serif !important;
          font-weight: 500 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0 !important;
          white-space: normal !important;
          line-height: 1.2 !important;
        }

        .ranking-box:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }

        /* Error Banner */
        .error-banner {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          z-index: 50;
          background: rgba(127,29,29,0.9);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #dc2626;
          display: flex;
          align-items: center;
        }

        /* Empty State */
        .empty-state {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .empty-content {
          background: rgba(0,0,0,0.6);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          border: 1px solid rgba(107,114,128,0.6);
        }

        .empty-content h3 {
          font-size: 18px;
          font-weight: 500;
          color: white;
          margin-bottom: 8px;
        }

        .empty-content p {
          color: #d1d5db;
        }

        /* Gaya untuk Modal (Pop-up) Info Pemain */
        .player-modal {
          display: flex;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          overflow: auto;
          background-color: rgba(0,0,0,0.7);
          justify-content: center;
          align-items: center;
        }

        .modal-content {
          background-color: var(--background-color);
          margin: auto;
          padding: 30px;
          border: 1px solid var(--primary-color);
          border-radius: 10px;
          width: 80%;
          max-width: 500px;
          text-align: center;
          position: relative;
          box-shadow: 0 0 20px rgba(240, 201, 117, 0.5);
        }

        .close-button {
          color: #aaa;
          position: absolute;
          top: 10px;
          right: 20px;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
        }

        .close-button:hover,
        .close-button:focus {
          color: white;
        }

        .modal-content h2 {
          font-size: 1.8rem;
          color: #ffffff;
          margin-bottom: 10px;
        }

        .modal-content p {
          color: #ffffff;
          margin-bottom: 20px;
        }

        .profile-link {
          display: inline-block;
          background-color: var(--primary-color);
          color: #1a1a1a;
          padding: 10px 20px;
          border-radius: 5px;
          text-decoration: none;
          font-weight: bold;
          transition: background-color 0.3s ease;
        }

        .profile-link:hover {
          background-color: #e6b760;
        }
      `}</style>
    </>
  );
}
