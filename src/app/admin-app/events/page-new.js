"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
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
      setForm({
        setting_name: '',
        setting_value: '',
        start_date: '',
        end_date: '',
        ...event
      });
    } else {
      setForm({
        setting_name: '',
        setting_value: '',
        start_date: '',
        end_date: ''
      });
    }
  }, [event, open]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
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
              Setting Value <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g. 2x_coin_multiplier"
              value={form.setting_value}
              onChange={(e) => setForm({...form, setting_value: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
                value={formatDateForInput(form.start_date)}
                onChange={(e) => setForm({...form, start_date: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
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
              onClick={() => onSave(form)}
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
  const { user } = useUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      loadEvents();
    }
  }, [user?.primaryEmailAddress?.emailAddress]);

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
      const url = modalMode === 'create' ? '/api/events' : `/api/events/${editEvent.id}`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error(`Failed to ${modalMode} event`);
      
      setModalOpen(false);
      setEditEvent(null);
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      alert(`Gagal ${modalMode === 'create' ? 'menambah' : 'mengupdate'} event`);
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
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                    <AdminTableRow key={event.id}>
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
