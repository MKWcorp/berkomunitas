"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from 'react-dom';
import { useUser } from "@clerk/nextjs";
import GlassCard from '../components/GlassCard';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { hasPrivilege } from '../../utils/privilegeChecker';

export default function RewardsPage() {
  const { user, isLoaded } = useUser();
  const [memberData, setMemberData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redeeming, setRedeeming] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeemQuantity, setRedeemQuantity] = useState(1);
  const [shippingNotes, setShippingNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Modal ref for positioning
  const modalRef = useRef(null);
  const [modalStyle, setModalStyle] = useState({});
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch reward categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/reward-categories');
      const result = await response.json();
      
      if (response.ok && result.success) {
        setCategories(result.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch user profile and rewards data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'GET',
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setMemberData(result.data.member);
        setRewards(result.data.rewards);
      } else {
        setError(result.error || 'Failed to load rewards data');
      }
    } catch (err) {
      console.error('Error fetching rewards:', err);
      setError('Failed to load rewards data');
    } finally {
      setLoading(false);
    }
  };

  // Filter rewards based on category and search
  const filteredRewards = rewards.filter(reward => {
    const matchesCategory = selectedCategory === 'all' || reward.category_id == selectedCategory;
    const matchesSearch = reward.reward_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (reward.description && reward.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });
  
  // Show results count for debugging
  if (selectedCategory === 7 || selectedCategory === '7') {
    console.log(`Filtered ${filteredRewards.length} rewards for Skincare category`);
  }

  // Handle redemption confirmation
  const handleRedeemClick = (reward) => {
    // Check if user has required privilege (hierarchical check)
    if (reward.required_privilege && reward.required_privilege !== 'user') {
      const userHasRequiredPrivilege = hasPrivilege(memberData?.privilege || 'user', reward.required_privilege);
      
      if (!userHasRequiredPrivilege) {
        const privilegeNames = {
          'berkomunitasplus': 'BerkomunitasPlus',
          'partner': 'Partner',
          'admin': 'Admin'
        };
        const requiredName = privilegeNames[reward.required_privilege] || reward.required_privilege;
        setErrorMessage(`Hadiah ini memerlukan privilege ${requiredName}. Upgrade akun Anda untuk mengakses hadiah ini.`);
        return;
      }
    }

    if (memberData?.coin < reward.point_cost) {
      setErrorMessage(`Coin Anda tidak mencukupi. Dibutuhkan ${formatNumber(reward.point_cost)} coin.`);
      return;
    }

    if (reward.stock <= 0) {
      setErrorMessage("Stok hadiah sudah habis.");
      return;
    }
    
    setSelectedReward(reward);
    setRedeemQuantity(1); // Reset quantity to 1
    setShippingNotes(""); // Reset shipping notes
    setShowConfirmModal(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  // Calculate max quantity based on coins and stock
  const getMaxQuantity = () => {
    if (!selectedReward || !memberData) return 1;
    
    const maxByCoin = Math.floor(memberData.coin / selectedReward.point_cost);
    const maxByStock = selectedReward.stock;
    
    return Math.min(maxByCoin, maxByStock, 10); // Cap at 10 for UX
  };

  // Calculate total cost
  const getTotalCost = () => {
    if (!selectedReward) return 0;
    return selectedReward.point_cost * redeemQuantity;
  };

  // Perform actual redemption
  const performRedemption = async () => {
    if (!selectedReward) return;

    setRedeeming(selectedReward.id);
    setShowConfirmModal(false);
    
    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rewardId: selectedReward.id,
          quantity: redeemQuantity,
          shipping_notes: shippingNotes.trim() || null,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const quantityText = result.data.quantity > 1 ? ` (${result.data.quantity}x)` : '';
        setSuccessMessage(`Berhasil menukar ${result.data.reward_name}${quantityText}! Anda sekarang memiliki ${formatNumber(result.data.remaining_coins)} coin.`);
        await fetchData();
      } else {
        setErrorMessage(result.error || 'Failed to redeem reward');
      }
    } catch (err) {
      console.error('Error redeeming reward:', err);
      setErrorMessage('Failed to redeem reward');
    } finally {
      setRedeeming(null);
      setSelectedReward(null);
    }
  };

  // Close confirmation modal
  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setSelectedReward(null);
    setRedeemQuantity(1); // Reset quantity
    setShippingNotes(""); // Reset shipping notes
  };

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // Fetch data when component mounts and user is loaded
  useEffect(() => {
    if (isLoaded && user) {
      fetchData();
      fetchCategories();
    } else if (isLoaded && !user) {
      setError('Please log in to view rewards');
      setLoading(false);
    }
  }, [isLoaded, user]);

  // Modal keyboard and focus management - exact copy from AdminModal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showConfirmModal) closeConfirmModal();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showConfirmModal]);

  useEffect(() => {
    if (showConfirmModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConfirmModal]);

  useEffect(() => {
    if (showConfirmModal && modalRef.current) {
      // Default: center the modal (same as AdminModal)
      const style = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
      setModalStyle(style);
    }
  }, [showConfirmModal]);

  // Format number with thousands separator
  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Loading state
  if (loading) {
    return (
      <GlassCard className="min-h-screen" padding="lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading rewards...</p>
        </div>
      </GlassCard>
    );
  }

  // Error state
  if (error) {
    return (
      <GlassCard className="min-h-screen" padding="lg">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Rewards</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="min-h-screen" padding="lg">
      <div className="max-w-6xl mx-auto">
        {/* Page Header - Hidden */}

        {/* User Stats Card - Hidden */}

        {/* Mobile-only compact header */}
        <div className="mb-6 md:hidden">
          <h1 className="text-xl font-bold text-gray-800">Tukar Hadiah</h1>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <GlassCard variant="subtle" padding="default" className="mb-6 bg-green-100/50 border-green-400/30">
            <div className="flex items-center text-green-700">
              <span className="text-green-500 mr-2">✅</span>
              {successMessage}
            </div>
          </GlassCard>
        )}

        {errorMessage && (
          <GlassCard variant="subtle" padding="default" className="mb-6 bg-red-100/50 border-red-400/30">
            <div className="flex items-center text-red-700">
              <span className="text-red-500 mr-2">❌</span>
              {errorMessage}
            </div>
          </GlassCard>
        )}

        {/* Filters Section - Search Only */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
            
            {/* Search Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              Search & Filter
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Enhanced Filter Controls */}
          {showFilters && (
            <GlassCard variant="strong" padding="lg" className="mb-6 bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Filter & Search</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enhanced Search */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Cari Hadiah
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari berdasarkan nama atau deskripsi..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Enhanced Category Filter */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Filter Kategori
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        selectedCategory === 'all'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Semua
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          selectedCategory === category.id
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: selectedCategory === category.id ? undefined : `${category.color}20`,
                          borderColor: selectedCategory === category.id ? undefined : `${category.color}40`
                        }}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </GlassCard>
          )}

          {/* Results Summary */}
          <div className="text-sm text-gray-600 mb-4">
            Showing {filteredRewards.length} of {rewards.length} rewards
            {selectedCategory !== 'all' && (
              <span> • Kategori: {categories.find(c => c.id === selectedCategory)?.name || 'Tidak Diketahui'}</span>
            )}
            {searchQuery && (
              <span> • Search: "{searchQuery}"</span>
            )}
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="mb-6">          
          {filteredRewards.length === 0 ? (
            <GlassCard variant="default" padding="xl" className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100/50 to-gray-200/50 flex items-center justify-center">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-gray-300/70 to-gray-400/70"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {rewards.length === 0 ? 'Tidak Ada Hadiah Tersedia' : 'Tidak Ada Hadiah yang Cocok'}
              </h3>
              <p className="text-gray-600">
                {rewards.length === 0 
                  ? 'Saat ini belum ada hadiah yang tersedia untuk ditukar'
                  : 'Coba sesuaikan filter atau kata kunci pencarian Anda'
                }
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRewards.map((reward) => {
                const canAfford = reward.is_affordable;
                const inStock = reward.stock > 0;
                
                // Check if user has required privilege (hierarchical check)
                const hasRequiredPrivilege = !reward.required_privilege || 
                  reward.required_privilege === 'user' || 
                  hasPrivilege(memberData?.privilege || 'user', reward.required_privilege);
                
                const isBerkomunitsPlus = reward.required_privilege === 'berkomunitasplus';
                const isPrivilegedReward = reward.required_privilege && reward.required_privilege !== 'user';
                const lacksRequiredPrivilege = isPrivilegedReward && !hasRequiredPrivilege;
                
                const canRedeem = canAfford && inStock && hasRequiredPrivilege;
                const isProcessing = redeeming === reward.id;
                const category = categories.find(c => c.id === reward.category_id);

                return (
                  <GlassCard
                    key={reward.id}
                    variant="default"
                    padding="none"
                    className={`overflow-hidden transition-all duration-300 ${
                      lacksRequiredPrivilege 
                        ? 'opacity-60 grayscale cursor-not-allowed' 
                        : 'hover:scale-105 hover:shadow-xl'
                    } ${
                      !canRedeem && !lacksRequiredPrivilege ? 'opacity-75' : ''
                    } ${isBerkomunitsPlus ? 'ring-2 ring-gradient-to-r from-yellow-400 to-orange-500' : ''} ${
                      reward.required_privilege === 'partner' ? 'ring-2 ring-gradient-to-r from-purple-400 to-indigo-500' : ''
                    } ${reward.required_privilege === 'admin' ? 'ring-2 ring-gradient-to-r from-red-400 to-pink-500' : ''}`}
                    hover={!lacksRequiredPrivilege}
                  >
                    {/* Reward Image - Square 1:1 aspect ratio */}
                    <div className="aspect-square bg-gradient-to-br from-blue-100/50 to-purple-100/50 flex items-center justify-center overflow-hidden relative">
                      {/* Privilege Badge */}
                      {isPrivilegedReward && (
                        <div className="absolute top-2 left-2 z-10">
                          <div className={`backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 ${
                            reward.required_privilege === 'berkomunitasplus' ? 'bg-gradient-to-r from-yellow-400/90 to-orange-500/90' :
                            reward.required_privilege === 'partner' ? 'bg-gradient-to-r from-purple-400/90 to-indigo-500/90' :
                            reward.required_privilege === 'admin' ? 'bg-gradient-to-r from-red-400/90 to-pink-500/90' :
                            'bg-gradient-to-r from-gray-400/90 to-gray-500/90'
                          }`}>
                            <div className="w-3 h-3 rounded-full bg-white/30"></div>
                            <span>{
                              reward.required_privilege === 'berkomunitasplus' ? 'Plus' :
                              reward.required_privilege === 'partner' ? 'Partner' :
                              reward.required_privilege === 'admin' ? 'Admin' :
                              reward.required_privilege
                            }</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Privilege Required Overlay */}
                      {lacksRequiredPrivilege && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                          <div className="text-center p-2">
                            <div className={`w-6 h-6 mx-auto mb-1 rounded-full flex items-center justify-center ${
                              reward.required_privilege === 'berkomunitasplus' ? 'bg-yellow-400/90' :
                              reward.required_privilege === 'partner' ? 'bg-purple-400/90' :
                              reward.required_privilege === 'admin' ? 'bg-red-400/90' :
                              'bg-gray-400/90'
                            }`}>
                              <div className="w-2 h-2 rounded-full bg-white/70"></div>
                            </div>
                            <p className="text-white text-xs font-medium">Perlu {
                              reward.required_privilege === 'berkomunitasplus' ? 'Plus' :
                              reward.required_privilege === 'partner' ? 'Partner' :
                              reward.required_privilege === 'admin' ? 'Admin' :
                              reward.required_privilege
                            }</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Category Badge */}
                      {category && (
                        <div className="absolute top-2 right-2 z-10">
                          <div 
                            className="bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full text-xs font-medium shadow-lg"
                            style={{
                              backgroundColor: `${category.color}15`,
                              borderColor: `${category.color}30`,
                              border: '1px solid'
                            }}
                          >
                            {category.name}
                          </div>
                        </div>
                      )}

                      {reward.foto_url ? (
                        <img
                          src={reward.foto_url}
                          alt={reward.reward_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-200/50 to-purple-200/50 flex items-center justify-center">
                          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-400/70 to-purple-400/70"></div>
                        </div>
                      )}
                      {reward.foto_url && (
                        <div className="hidden w-full h-full items-center justify-center">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-200/50 to-purple-200/50 flex items-center justify-center">
                            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-400/70 to-purple-400/70"></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reward Content */}
                    <div className={`p-4 ${isBerkomunitsPlus ? 'bg-gradient-to-br from-yellow-50 to-orange-50' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`text-lg font-bold mb-2 line-clamp-2 ${isBerkomunitsPlus ? 'text-orange-800' : 'text-gray-800'}`}>
                          {reward.reward_name}
                        </h3>
                      </div>
                      
                      {reward.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{reward.description}</p>
                      )}

                      {/* Enhanced Point Cost Display */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className={`flex items-center px-3 py-1 rounded-full ${
                            isBerkomunitsPlus 
                              ? 'bg-gradient-to-r from-yellow-400/90 to-orange-500/90 backdrop-blur-sm text-white' 
                              : 'bg-blue-100/70 backdrop-blur-sm text-blue-700'
                          }`}>
                            <div className={`w-2.5 h-2.5 rounded-full mr-2 ${
                              isBerkomunitsPlus ? 'bg-white/50' : 'bg-blue-500/70'
                            }`}></div>
                            <span className="font-semibold text-sm">
                              {formatNumber(reward.point_cost)}
                            </span>
                          </div>
                        </div>
                        <div className={`text-sm px-2 py-1 rounded-full ${
                          inStock 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {inStock ? `Sisa ${reward.stock}` : 'Stok habis'}
                        </div>
                      </div>

                      {/* Status Messages */}
                      <div className="space-y-1 mb-3 min-h-[1rem]">
                        {!canAfford && reward.points_needed > 0 && (
                          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md">
                            Need {formatNumber(reward.points_needed)} more coin
                          </div>
                        )}

                        {!inStock && (
                          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md">
                            Saat ini stok habis
                          </div>
                        )}
                      </div>

                      {/* Enhanced Redeem Button */}
                      <button
                        onClick={() => handleRedeemClick(reward)}
                        disabled={!canRedeem || isProcessing}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 transform ${
                          canRedeem && !isProcessing
                            ? isBerkomunitsPlus
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 shadow-lg hover:shadow-xl hover:scale-105'
                              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isProcessing ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Memproses...
                          </span>
                        ) : canRedeem ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              isBerkomunitsPlus ? 'bg-white/70' : 'bg-white/80'
                            }`}></div>
                            Tukar Sekarang
                          </span>
                        ) : lacksRequiredPrivilege ? (
                          `Upgrade ke ${
                            reward.required_privilege === 'berkomunitasplus' ? 'BerkomunitasPlus' :
                            reward.required_privilege === 'partner' ? 'Partner' :
                            reward.required_privilege === 'admin' ? 'Admin' :
                            reward.required_privilege
                          }`
                        ) : !inStock ? (
                          'Stok Habis'
                        ) : (
                          'Coin Tidak Cukup'
                        )}
                      </button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirmation Modal - Using AdminModal pattern */}
        {showConfirmModal && selectedReward && (
          typeof window !== 'undefined' ? createPortal(
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              style={{ zIndex: 99998 }}
              onClick={closeConfirmModal}
            >
              <div 
                ref={modalRef}
                style={{ ...modalStyle, zIndex: 99999 }}
                className="relative w-full bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with close button */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-xl font-semibold text-gray-800">Konfirmasi Penukaran</h3>
                  <button
                    onClick={closeConfirmModal}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal content */}
                <div className="p-6 overflow-y-auto">
                  {selectedReward.required_privilege === 'berkomunitasplus' && (
                    <div className="bg-gradient-to-r from-yellow-400/90 to-orange-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold mb-4 inline-flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-white/50"></div>
                      Plus Reward
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <p className="text-gray-600 mb-4 text-center">
                      Apakah Anda yakin ingin menukar hadiah ini?
                    </p>
                    
                    <GlassCard variant="subtle" padding="default" className="bg-gradient-to-br from-slate-50 to-blue-50">
                      <div className="text-center">
                        <h4 className="font-semibold text-gray-800 mb-2">{selectedReward.reward_name}</h4>
                        <div className="flex items-center justify-center gap-4 mb-3 flex-wrap">
                          <div className={`flex items-center px-3 py-1 rounded-full ${
                            selectedReward.required_privilege === 'berkomunitasplus' 
                              ? 'bg-gradient-to-r from-yellow-400/90 to-orange-500/90 backdrop-blur-sm text-white' 
                              : 'bg-blue-100/70 backdrop-blur-sm text-blue-700'
                          }`}>
                            <div className={`w-2.5 h-2.5 rounded-full mr-2 ${
                              selectedReward.required_privilege === 'berkomunitasplus' ? 'bg-white/50' : 'bg-blue-500/70'
                            }`}></div>
                            <span className="font-bold text-sm">
                              {formatNumber(selectedReward.point_cost)} Coin/item
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            Stock: {selectedReward.stock}
                          </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="mb-4 bg-white/50 p-4 rounded-lg border border-gray-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Jumlah yang ingin ditukar:
                          </label>
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => setRedeemQuantity(Math.max(1, redeemQuantity - 1))}
                              disabled={redeemQuantity <= 1}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-gray-700"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={getMaxQuantity()}
                              value={redeemQuantity}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                setRedeemQuantity(Math.min(Math.max(1, value), getMaxQuantity()));
                              }}
                              className="w-16 text-center border border-gray-300 rounded-md px-2 py-1 font-semibold text-lg"
                            />
                            <button
                              type="button"
                              onClick={() => setRedeemQuantity(Math.min(getMaxQuantity(), redeemQuantity + 1))}
                              disabled={redeemQuantity >= getMaxQuantity()}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-gray-700"
                            >
                              +
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-center">
                            Max: {getMaxQuantity()} item
                          </p>
                        </div>

                        {/* Shipping Notes */}
                        <div className="mb-4 bg-white/50 p-4 rounded-lg border border-gray-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Catatan Pengiriman (Opsional):
                          </label>
                          <textarea
                            value={shippingNotes}
                            onChange={(e) => setShippingNotes(e.target.value)}
                            placeholder="Masukkan alamat lengkap, nomor HP, atau catatan khusus lainnya..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows="3"
                            maxLength="500"
                          />
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500">
                              Contoh: alamat lengkap, nomor HP, waktu pengiriman yang diinginkan
                            </p>
                            <p className="text-xs text-gray-400">
                              {shippingNotes.length}/500
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span>Coin Anda:</span>
                            <span className="font-semibold">{formatNumber(memberData?.coin || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <span>Total Biaya:</span>
                            <span className="font-semibold text-red-600">
                              {formatNumber(getTotalCost())} coin
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t pt-1">
                            <span>Sisa Coin:</span>
                            <span className="font-semibold text-green-600">
                              {formatNumber((memberData?.coin || 0) - getTotalCost())}
                            </span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={closeConfirmModal}
                      className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Batal
                    </button>
                    <button
                      onClick={performRedemption}
                      disabled={redeeming === selectedReward.id}
                      className={`flex-1 py-3 px-4 rounded-xl text-white font-bold transition-all duration-200 ${
                        selectedReward.required_privilege === 'berkomunitasplus'
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 focus:ring-yellow-500'
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-blue-500'
                      } shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    >
                      {redeeming === selectedReward.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Memproses...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-white/70"></div>
                          Ya, Tukar {redeemQuantity > 1 ? `${redeemQuantity}x` : ''} Sekarang
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>, 
            document.body
          ) : null
        )}

        {/* Remove Refresh Button - Hidden */}
      </div>
    </GlassCard>
  );
}