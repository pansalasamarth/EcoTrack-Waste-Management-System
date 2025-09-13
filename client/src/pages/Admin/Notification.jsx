import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

const socket = io('http://localhost:8800');

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    // Socket connection status
    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to notification server');
    });
    
    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from notification server');
    });

    // Listen for bin alerts
    socket.on('binAlert', (alert) => {
      console.log('Received bin alert:', alert);
      
      // Add to notifications list
      setNotifications(prev => [alert, ...prev]);
      
      // Show toast notification with different styling based on alert type
      const toastOptions = {
        position: "top-right",
        autoClose: 10000, // 10 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      };
      
      if (alert.alertType === "FULLY FILLED") {
        toast.error(alert.message, toastOptions);
      } else {
        toast.warning(alert.message, toastOptions);
      }
    });
    
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('binAlert');
    };
  }, []);

  return (
    <div className="notification-page">
      <ToastContainer />
      
      <div className="connection-status mb-4">
        Status: {connected ? 
          <span className="text-green-600 font-semibold">Connected</span> : 
          <span className="text-red-600 font-semibold">Disconnected</span>}
      </div>
      
      <h2 className="text-2xl font-bold mb-4">Real-time Notifications</h2>
      <div className="notification-list">
        {notifications.length === 0 ? (
          <p className="text-gray-500">No notifications yet</p>
        ) : (
          notifications.map((alert, index) => (
            <div 
              key={index} 
              className={`notification-item p-4 mb-4 rounded-lg border-l-4 ${
                alert.alertType === "FULLY FILLED" ? "bg-red-50 border-red-500" : "bg-yellow-50 border-yellow-500"
              }`}
            >
              <div className="notification-header flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800">Bin ID: {alert.id}</span>
                <span className="text-sm text-gray-500">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="notification-body">
                <p className="text-gray-700 mb-2">{alert.message}</p>
                <div className="capacity-bar bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full ${
                      alert.realTimeCapacity >= 85 ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{width: `${alert.realTimeCapacity}%`}}
                  ></div>
                </div>
                <div className="alert-details flex justify-between text-sm text-gray-600">
                  <span>Ward: {alert.ward}</span>
                  <span>Zone: {alert.zone}</span>
                  <span>Capacity: {alert.realTimeCapacity}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notification;
