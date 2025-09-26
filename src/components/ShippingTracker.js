'use client';
import { 
  CheckCircleIcon, 
  TruckIcon, 
  ClockIcon, 
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function ShippingTracker({ status, trackingNumber, shippingDate, deliveryDate, notes }) {
  const getStatusConfig = (currentStatus) => {
    const configs = {
      'pending': {
        text: 'Menunggu Konfirmasi',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: ClockIcon,
        description: 'Permintaan reward sedang diproses'
      },
      'confirmed': {
        text: 'Dikonfirmasi',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        icon: CheckCircleIcon,
        description: 'Reward dikonfirmasi, sedang disiapkan'
      },
      'preparing': {
        text: 'Sedang Disiapkan',
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        icon: ClockIcon,
        description: 'Reward sedang dikemas untuk pengiriman'
      },
      'shipped': {
        text: 'Dalam Pengiriman',
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        icon: TruckIcon,
        description: 'Reward sedang dalam perjalanan'
      },
      'delivered': {
        text: 'Terkirim',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: CheckCircleIcon,
        description: 'Reward berhasil dikirim'
      },
      'cancelled': {
        text: 'Dibatalkan',
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: XMarkIcon,
        description: 'Pengiriman dibatalkan'
      }
    };
    
    return configs[currentStatus] || configs.pending;
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  // Timeline steps untuk visual progress
  const getTimelineSteps = () => {
    const steps = [
      { key: 'confirmed', label: 'Dikonfirmasi' },
      { key: 'preparing', label: 'Disiapkan' },
      { key: 'shipped', label: 'Dikirim' },
      { key: 'delivered', label: 'Terkirim' }
    ];

    const statusOrder = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);

    return steps.map((step, index) => ({
      ...step,
      isCompleted: index < currentIndex || (status === 'delivered' && step.key === 'delivered'),
      isActive: statusOrder[index + 1] === status || (status === 'delivered' && step.key === 'delivered'),
      isFuture: index > currentIndex && status !== 'delivered'
    }));
  };

  const timelineSteps = status !== 'cancelled' ? getTimelineSteps() : [];

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className={`border rounded-lg p-4 ${config.color}`}>
        <div className="flex items-center space-x-3">
          <IconComponent className="w-6 h-6" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{config.text}</h3>
            <p className="text-sm opacity-80">{config.description}</p>
          </div>
        </div>
        
        {trackingNumber && (
          <div className="mt-3 pt-3 border-t border-current border-opacity-20">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Nomor Resi:</span>
              <span className="font-mono bg-white bg-opacity-50 px-2 py-1 rounded">
                {trackingNumber}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Timeline - hanya tampil jika tidak dibatalkan */}
      {status !== 'cancelled' && timelineSteps.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <InformationCircleIcon className="w-4 h-4" />
            <span>Progress Pengiriman</span>
          </h4>
          
          <div className="relative">
            {timelineSteps.map((step, index) => (
              <div key={step.key} className="flex items-center space-x-3 pb-4 last:pb-0">
                {/* Timeline line */}
                {index < timelineSteps.length - 1 && (
                  <div className={`absolute left-3 top-6 w-0.5 h-8 ${
                    step.isCompleted ? 'bg-green-400' : 'bg-gray-300'
                  }`} style={{ zIndex: 0 }} />
                )}
                
                {/* Timeline dot */}
                <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  step.isCompleted 
                    ? 'bg-green-500 border-green-500' 
                    : step.isActive 
                      ? 'bg-blue-500 border-blue-500 animate-pulse' 
                      : 'bg-gray-200 border-gray-300'
                }`}>
                  {step.isCompleted && (
                    <CheckCircleIcon className="w-3 h-3 text-white" />
                  )}
                </div>
                
                {/* Timeline content */}
                <div className="flex-1">
                  <p className={`font-medium ${
                    step.isCompleted || step.isActive 
                      ? 'text-gray-900' 
                      : 'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  {step.isActive && (
                    <p className="text-sm text-blue-600 font-medium">Sedang berlangsung</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dates Info */}
      {(shippingDate || deliveryDate) && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          {shippingDate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tanggal Pengiriman:</span>
              <span className="font-medium">
                {new Date(shippingDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
          
          {deliveryDate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tanggal Diterima:</span>
              <span className="font-medium text-green-600">
                {new Date(deliveryDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Catatan:</h4>
          <p className="text-sm text-blue-800">{notes}</p>
        </div>
      )}
    </div>
  );
}

// Component untuk list tracking multiple items
export function ShippingTrackerList({ redemptions = [] }) {
  if (!redemptions || redemptions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TruckIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Tidak ada pengiriman yang sedang berlangsung</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {redemptions.map((redemption) => (
        <div key={redemption.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Reward: {redemption.reward?.title}</h3>
            <span className="text-sm text-gray-500">#{redemption.id}</span>
          </div>
          
          <ShippingTracker
            status={redemption.shipping_status}
            trackingNumber={redemption.tracking_number}
            shippingDate={redemption.shipping_date}
            deliveryDate={redemption.delivery_date}
            notes={redemption.shipping_notes}
          />
        </div>
      ))}
    </div>
  );
}