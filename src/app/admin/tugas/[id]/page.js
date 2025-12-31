'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSSOUser } from '@/hooks/useSSOUser';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSSOUser();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    status_submission: '',
    admin_notes: '',
    award_points: 0,
    keterangan: ''
  });
  const [taskEditForm, setTaskEditForm] = useState({
    keyword_tugas: '',
    deskripsi_tugas: '',
    point_value: 0
  });

  useEffect(() => {
    if (params.id) {
      fetchTaskDetails();
    }
  }, [params.id]);

  const fetchTaskDetails = async () => {
    try {
      const response = await fetch(`/api/admin/tugas/${params.id}`, {
        headers: {
          'x-user-email': user?.email
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setTask(result.task);
        // Set initial values for task edit form
        setTaskEditForm({
          keyword_tugas: result.task.keyword_tugas || '',
          deskripsi_tugas: result.task.deskripsi_tugas || '',
          point_value: result.task.point_value || 0
        });
      } else {
        console.error('Failed to fetch task details');
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (submission) => {
    setSelectedSubmission(submission);
    setEditForm({
      status_submission: submission.status_submission,
      admin_notes: submission.admin_notes || '',
      award_points: 0, // Default to 0 for point adjustment
      keterangan: submission.keterangan || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmission = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await fetch(`/api/admin/task-submissions/${selectedSubmission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email
        },
        body: JSON.stringify({
          ...editForm,
          verified_by: user?.email
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Submission updated:', result);
        
        // Refresh task details
        await fetchTaskDetails();
        
        // Close modal
        setShowEditModal(false);
        setSelectedSubmission(null);
        
        alert('Submission berhasil diupdate!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating submission:', error);
      alert('Error updating submission');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await fetch(`/api/admin/tugas/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email
        },
        body: JSON.stringify(taskEditForm)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Task updated:', result);
        
        // Refresh task details
        await fetchTaskDetails();
        
        // Close modal
        setShowEditTaskModal(false);
        
        alert('Tugas berhasil diupdate!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTask = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/tugas/${params.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': user?.email
        }
      });

      if (response.ok) {
        alert('Tugas berhasil dihapus!');
        // Redirect ke halaman tugas
        router.push('/tugas');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'tersedia': { color: 'bg-gray-100 text-gray-800', label: 'Tersedia' },
      'dikerjakan': { color: 'bg-yellow-100 text-yellow-800', label: 'Dikerjakan' },
      'pending': { color: 'bg-blue-100 text-blue-800', label: 'Pending' },
      'selesai': { color: 'bg-green-100 text-green-800', label: 'Selesai' },
      'ditolak': { color: 'bg-red-100 text-red-800', label: 'Ditolak' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Memuat detail tugas...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Tugas tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Kembali ke Manajemen Tugas
          </button>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {task.keyword_tugas}
                </h1>
                <p className="text-gray-600 mb-4">{task.deskripsi_tugas}</p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                    {task.point_value} Poin
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="w-4 h-4 mr-1" />
                    {task.submissions.length} Submissions
                  </div>
                  {task.link_postingan && (
                    <a 
                      href={task.link_postingan} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Lihat Postingan
                    </a>
                  )}
                </div>
              </div>
              
              <div className="ml-4 flex items-center space-x-3">
                <button
                  onClick={() => setShowEditTaskModal(true)}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Tugas
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Hapus Tugas
                </button>
                {getStatusBadge(task.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Member yang Mengerjakan ({task.submissions.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Submit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Verifikasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {task.submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Image
                            className="h-10 w-10 rounded-full object-cover"
                            src={submission.member.foto_profil_url || '/placeholder-avatar.png'}
                            alt={submission.member.nama_lengkap}
                            width={40}
                            height={40}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.member.nama_lengkap}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{submission.member.username}
                          </div>
                          <div className="text-xs text-gray-400">
                            {submission.member.loyalty_point} poin
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(submission.status_submission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(submission.tanggal_submission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(submission.tanggal_verifikasi)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {submission.admin_notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal(submission)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {task.submissions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Belum ada member yang mengerjakan tugas ini
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Submission Modal */}
      {showEditModal && selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Submission - {selectedSubmission.member.nama_lengkap}
              </h3>
              
              <form onSubmit={handleUpdateSubmission} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status Submission
                  </label>
                  <select
                    value={editForm.status_submission}
                    onChange={(e) => setEditForm({...editForm, status_submission: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="dikerjakan">Dikerjakan</option>
                    <option value="pending">Pending</option>
                    <option value="selesai">Selesai</option>
                    <option value="ditolak">Ditolak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poin Adjustment
                  </label>
                  <input
                    type="number"
                    value={editForm.award_points}
                    onChange={(e) => setEditForm({...editForm, award_points: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0 (positif = tambah, negatif = kurangi)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan angka positif untuk menambah poin, negatif untuk mengurangi
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    value={editForm.admin_notes}
                    onChange={(e) => setEditForm({...editForm, admin_notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Catatan admin..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keterangan
                  </label>
                  <textarea
                    value={editForm.keterangan}
                    onChange={(e) => setEditForm({...editForm, keterangan: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={2}
                    placeholder="Keterangan tambahan..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {updating ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Edit Tugas</h2>
                <button
                  onClick={() => setShowEditTaskModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keyword Tugas
                  </label>
                  <input
                    type="text"
                    value={taskEditForm.keyword_tugas}
                    onChange={(e) => setTaskEditForm({...taskEditForm, keyword_tugas: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Masukkan keyword tugas..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi Tugas
                  </label>
                  <textarea
                    value={taskEditForm.deskripsi_tugas}
                    onChange={(e) => setTaskEditForm({...taskEditForm, deskripsi_tugas: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={4}
                    placeholder="Masukkan deskripsi tugas..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reward (Loyalty Points)
                  </label>
                  <input
                    type="number"
                    value={taskEditForm.point_value}
                    onChange={(e) => setTaskEditForm({...taskEditForm, point_value: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditTaskModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {updating ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Konfirmasi Hapus</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={deleting}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <TrashIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Hapus Tugas</h3>
                    <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">Peringatan!</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Menghapus tugas akan menghapus semua data terkait termasuk submissions dari member. 
                        Pastikan Anda yakin sebelum melanjutkan.
                      </p>
                    </div>
                  </div>
                </div>

                {task && (
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-600">Tugas yang akan dihapus:</p>
                    <p className="font-medium text-gray-900">{task.keyword_tugas}</p>
                    <p className="text-sm text-gray-600 mt-1">{task.submissions?.length || 0} submissions akan dihapus</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  disabled={deleting}
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menghapus...
                    </span>
                  ) : (
                    'Ya, Hapus Tugas'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
