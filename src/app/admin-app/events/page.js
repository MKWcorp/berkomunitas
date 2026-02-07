"use client";
import { useState, useEffect } from "react";
import { useSSOUser } from '@/hooks/useSSOUser';
import AdminLayout from '../components/AdminLayout';
import { 
  AdminPageLayout,
  AdminPageHeader,
  AdminContentContainer,
  AdminTableContainer,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
  AdminSearchInput,
  AdminEmptyState,
  AdminStatusBadge
} from '@/components/AdminComponents';
import { GlassCard, GlassButton } from '@/components/GlassLayout';
import AdminModal from "../components/AdminModal";
import { 
  CalendarIcon, 
  ClockIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import ScrollToTopButton from '../components/ScrollToTopButton';
import { triggerEventRefresh } from '@/hooks/useEventBoostSync';

function EventModal({ open, onClose, event = null, onSave, onDelete, mode = 'create' }) {
  const [form, setForm] = useState({
    setting_name: '',
    setting_value: '',
    start_date: '',
    end_date: '',
    ...event
  });

  useEffect(() => {
    if (event) {
      // Ensure proper date formatting when editing
      const formattedEvent = {
        setting_name: event.setting_name || '',
        setting_value: event.setting_value || '',
        start_date: event.start_date || '',
        end_date: event.end_date || ''
      };
      setForm(formattedEvent);
    } else {
      setForm({
        setting_name: '',
        setting_value: '',
        start_date: '',
        end_date: ''
      });
    }
  }, [event, open]);

  // Format date untuk input date (tanpa jam)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Handle different date formats from database
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return '';
      }
      
      // Convert to local timezone and format for date input
      // date input expects format: YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
  };

  // Format date untuk database dengan default jam 00:00 dan 23:59
  const formatDateForDatabase = (dateString, isEndDate = false) => {
    if (!dateString) return null;
    
    try {
      // Input dari date dalam format: YYYY-MM-DD
      // Set jam otomatis: start = 00:00:00, end = 23:59:59
      const date = new Date(dateString);
      
      if (isEndDate) {
        // Set ke jam 23:59:59 untuk tanggal berakhir
        date.setHours(23, 59, 59, 999);
      } else {
        // Set ke jam 00:00:00 untuk tanggal mulai
        date.setHours(0, 0, 0, 0);
      }
      
      return date.toISOString();
    } catch (error) {
      console.error('Error formatting date for database:', error);
      return null;
    }
  };

  return (
    <AdminModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? "Tambah Event Baru" : "Edit Event"}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Event <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g. Double Coin Weekend"
              value={form.setting_name}
              onChange={(e) => setForm({...form, setting_name: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Setting Value (%) <span className="text-red-500">*</span>
              <div className="text-xs text-gray-500 mt-1">Masukkan nilai persentase boost. Contoh: 600 untuk 600% boost</div>
            </label>
            <input
              type="text"
              className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g. 600 (untuk 600% boost)"
              value={form.setting_value}
              onChange={(e) => setForm({...form, setting_value: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi Event
            </label>
            <input
              type="text"
              className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g. Holiday Mega Boost - 6x points untuk celebration!"
              value={form.description || ''}
              onChange={(e) => setForm({...form, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai <span className="text-red-500">*</span>
                <div className="text-xs text-gray-500 mt-1">Event akan mulai jam 00:00 (12 malam)</div>
              </label>
              <input
                type="date"
                className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
                value={formatDateForInput(form.start_date)}
                onChange={(e) => setForm({...form, start_date: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Selesai <span className="text-red-500">*</span>
                <div className="text-xs text-gray-500 mt-1">Event akan berakhir jam 23:59 (11:59 malam)</div>
              </label>
              <input
                type="date"
                className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
                value={formatDateForInput(form.end_date)}
                onChange={(e) => setForm({...form, end_date: e.target.value})}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-white/20">
          <div>
            {mode === 'edit' && onDelete && (
              <GlassButton 
                variant="danger" 
                onClick={() => onDelete(event.id)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Hapus Event
              </GlassButton>
            )}
          </div>
          <div className="flex gap-3">
            <GlassButton variant="secondary" onClick={onClose}>
              Batal
            </GlassButton>
            <GlassButton 
              variant="primary" 
              onClick={() => {
                // Format dates for database before saving
                // start_date akan diset ke jam 00:00, end_date ke jam 23:59
                const formattedData = {
                  ...form,
                  start_date: formatDateForDatabase(form.start_date, false), // false = start date
                  end_date: formatDateForDatabase(form.end_date, true) // true = end date
                };
                onSave(formattedData);
              }}
              disabled={!form.setting_name || !form.setting_value || !form.start_date || !form.end_date}
            >
              {mode === 'create' ? 'Tambah Event' : 'Simpan Perubahan'}
            </GlassButton>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}

export default function EventsAdminPage() {
  const { user } = useSSOUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  useEffect(() => {
    if (user?.email) {
      loadEvents();
    }
  }, [user?.email]);

  async function loadEvents() {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/events");
      
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorData}`);
      }
      
      const data = await res.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      console.error('❌ Error loading events:', error);
      setError(`Gagal memuat events: ${error.message}`);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEvent(formData) {
    try {
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const url = modalMode === 'create' ? '/api/events' : `/api/events/${editEvent.setting_name}`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Failed to ${modalMode} event: ${errorData}`);
      }
      
      const responseData = await res.json();
      
      setModalOpen(false);
      setEditEvent(null);
      loadEvents();
      
      // Handle setting_name changes for event boost refresh
      const finalSettingName = responseData.setting_name_changed 
        ? responseData.new_setting_name 
        : formData.setting_name;
      
      // Trigger refresh untuk event boost components
      await triggerEventRefresh(finalSettingName);
      console.log('Event boost refresh triggered for:', finalSettingName);
      
      // Show success message if setting_name was changed
      if (responseData.setting_name_changed) {
        console.log(`✅ Event name updated: ${responseData.old_setting_name} → ${responseData.new_setting_name}`);
      }
      
    } catch (error) {
      console.error('Error saving event:', error);
      alert(`Gagal ${modalMode === 'create' ? 'menambah' : 'mengupdate'} event: ${error.message}`);
    }
  }

  async function handleDeleteEvent(eventId) {
    if (!confirm('Apakah Anda yakin ingin menghapus event ini?')) return;
    
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete event');
      
      setModalOpen(false);
      setEditEvent(null);
      loadEvents();
      
      // Trigger refresh untuk event boost components
      await triggerEventRefresh(eventId);
      console.log('Event boost refresh triggered after deletion of:', eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Gagal menghapus event');
    }
  }

  function handleCreateEvent() {
    setModalMode('create');
    setEditEvent(null);
    setModalOpen(true);
  }

  function handleEditEvent(event) {
    setModalMode('edit');
    setEditEvent(event);
    setModalOpen(true);
  }

  function getEventStatus(event) {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    if (now < startDate) {
      return { status: 'Belum Dimulai', variant: 'warning' };
    } else if (now > endDate) {
      return { status: 'Selesai', variant: 'danger' };
    } else {
      return { status: 'Aktif', variant: 'success' };
    }
  }

  function formatDateTime(dateString) {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      });
    } catch (error) {
      console.error('Error formatting date for display:', error);
      return 'Error';
    }
  }

  // Filter events based on search
  const filteredEvents = events.filter(event =>
    event.setting_name?.toLowerCase().includes(search.toLowerCase()) ||
    event.setting_value?.toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <AdminLayout>
        <AdminPageLayout>
          <AdminEmptyState
            title="Terjadi Kesalahan"
            description={error}
            icon={XMarkIcon}
          />
        </AdminPageLayout>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageLayout>
        <AdminPageHeader 
          title="Kelola Event"
          description="Kelola event dan pengaturan khusus komunitas"
          actions={
            <div className="flex gap-3">
              <AdminSearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari event..."
              />
              <GlassButton 
                variant="primary" 
                onClick={handleCreateEvent}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Tambah Event
              </GlassButton>
            </div>
          }
        />
        
        <AdminContentContainer>
          <EventModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditEvent(null);
            }}
            event={editEvent}
            onSave={handleSaveEvent}
            onDelete={handleDeleteEvent}
            mode={modalMode}
          />

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-600">Memuat data event...</div>
            </div>
          ) : filteredEvents.length === 0 && search ? (
            <AdminEmptyState
              title="Tidak ada hasil"
              description={`Tidak ada event yang cocok dengan pencarian "${search}"`}
            />
          ) : filteredEvents.length === 0 ? (
            <AdminEmptyState
              title="Belum ada event"
              description="Belum ada event yang dibuat dalam sistem"
              actionText="Tambah Event Pertama"
              onAction={handleCreateEvent}
              icon={CalendarIcon}
            />
          ) : (
            <AdminTableContainer>
              <AdminTableHeader>
                <AdminTableHeaderCell>Nama Event</AdminTableHeaderCell>
                <AdminTableHeaderCell>Setting Value</AdminTableHeaderCell>
                <AdminTableHeaderCell>Mulai</AdminTableHeaderCell>
                <AdminTableHeaderCell>Selesai</AdminTableHeaderCell>
                <AdminTableHeaderCell>Status</AdminTableHeaderCell>
                <AdminTableHeaderCell>Aksi</AdminTableHeaderCell>
              </AdminTableHeader>
              <AdminTableBody>
                {filteredEvents.map((event) => {
                  const statusInfo = getEventStatus(event);
                  return (
                    <AdminTableRow key={event.setting_name}>
                      <AdminTableCell className="font-medium">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
                          {event.setting_name}
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {event.setting_value}
                        </code>
                      </AdminTableCell>
                      <AdminTableCell>
                        <div className="flex items-center text-sm">
                          <ClockIcon className="h-3 w-3 mr-1 text-gray-400" />
                          {formatDateTime(event.start_date)}
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <div className="flex items-center text-sm">
                          <ClockIcon className="h-3 w-3 mr-1 text-gray-400" />
                          {formatDateTime(event.end_date)}
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <AdminStatusBadge 
                          status={statusInfo.status}
                          variant={statusInfo.variant}
                        />
                      </AdminTableCell>
                      <AdminTableCell>
                        <button
                          className="p-2 rounded-lg hover:bg-white/20 transition-colors text-blue-600"
                          onClick={() => handleEditEvent(event)}
                          title="Edit Event"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </AdminTableCell>
                    </AdminTableRow>
                  );
                })}
              </AdminTableBody>
            </AdminTableContainer>
          )}
        </AdminContentContainer>
      </AdminPageLayout>
      <ScrollToTopButton />
    </AdminLayout>
  );
}
