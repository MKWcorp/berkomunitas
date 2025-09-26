// EventBoostIntegrationDemo.js - Demo untuk testing integrasi event boost dengan database
import React, { useState } from 'react';
import { useEventBoost } from '../hooks/useEventBoost';
import { EventBoostBanner, EventBoostBadge, EventBoostInlineDisplay } from './EventBoostComponents';

const EventBoostIntegrationDemo = () => {
  const [selectedEventType, setSelectedEventType] = useState('WEEKEND_BOOST');
  
  // Use the event boost hook
  const {
    eventConfig,
    isActive,
    isLoading,
    isInActivePeriod,
    activateEvent,
    deactivateEvent,
    updateEventConfig,
    loadEventSettings,
    saveEventSettings,
    availableEvents
  } = useEventBoost(selectedEventType);

  const handleActivateEvent = () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    activateEvent(now.toISOString(), tomorrow.toISOString());
  };

  const handleSaveToDatabase = async () => {
    await saveEventSettings(eventConfig);
  };

  const handleLoadFromDatabase = async () => {
    await loadEventSettings();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Event Boost Integration Demo</h2>
        
        {/* Event Type Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Event Type:</label>
          <select 
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            {availableEvents.map(event => (
              <option key={event} value={event}>{event}</option>
            ))}
          </select>
        </div>

        {/* Status Display */}
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Current Status:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Active:</span> 
              <span className={isActive ? 'text-green-600' : 'text-red-600'}>
                {isActive ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">In Period:</span>
              <span className={isInActivePeriod ? 'text-green-600' : 'text-red-600'}>
                {isInActivePeriod ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Loading:</span>
              <span className={isLoading ? 'text-blue-600' : 'text-gray-600'}>
                {isLoading ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Boost:</span>
              <span className="text-blue-600">
                {eventConfig?.boostPercentage || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Event Configuration */}
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Event Configuration:</h3>
          <div className="text-sm space-y-1">
            <div><span className="font-medium">Title:</span> {eventConfig?.title}</div>
            <div><span className="font-medium">Description:</span> {eventConfig?.description}</div>
            <div><span className="font-medium">Point Value:</span> {eventConfig?.pointValue}</div>
            <div><span className="font-medium">Start:</span> {eventConfig?.startDate}</div>
            <div><span className="font-medium">End:</span> {eventConfig?.endDate}</div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={handleActivateEvent}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Activate Event (24h)
          </button>
          <button
            onClick={deactivateEvent}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Deactivate Event
          </button>
          <button
            onClick={handleSaveToDatabase}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Save to Database
          </button>
          <button
            onClick={handleLoadFromDatabase}
            disabled={isLoading}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Load from Database
          </button>
        </div>
      </div>

      {/* Display Components Demo */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Display Components:</h3>
        
        {/* Banner */}
        <div>
          <h4 className="font-medium mb-2">Banner Component:</h4>
          <EventBoostBanner 
            isActive={isActive}
            title={eventConfig?.title}
            description={eventConfig?.description}
            boostPercentage={eventConfig?.boostPercentage}
            endDate={eventConfig?.endDate}
          />
        </div>

        {/* Badge */}
        <div>
          <h4 className="font-medium mb-2">Badge Component:</h4>
          <EventBoostBadge 
            isActive={isActive}
            boostPercentage={eventConfig?.boostPercentage}
            size="medium"
          />
        </div>

        {/* Inline Display */}
        <div>
          <h4 className="font-medium mb-2">Inline Display Component:</h4>
          <EventBoostInlineDisplay 
            isActive={isActive}
            pointValue={eventConfig?.pointValue}
            originalValue={10}
          />
        </div>
      </div>
    </div>
  );
};

export default EventBoostIntegrationDemo;
