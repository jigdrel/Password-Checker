import React, { useState } from 'react';
import { User } from '../types';
import PasswordChecker from './PasswordChecker';
import TwoFactorSetup from './TwoFactorSetup';
import AdminPanel from './AdminPanel';
import { 
  LogOut, 
  Shield, 
  User as UserIcon, 
  Lock, 
  Users,
  CheckCircle,
  XCircle 
} from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

type TabType = 'password' | '2fa' | 'admin';

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('password');

  const tabs = [
    { id: 'password' as TabType, label: 'Password Checker', icon: Lock },
    { id: '2fa' as TabType, label: 'Two-Factor Auth', icon: Shield },
  ];

  if (user.role === 'ADMIN') {
    tabs.push({ id: 'admin' as TabType, label: 'Admin Panel', icon: Users });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Shield className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Password Checker</h1>
                <p className="text-sm text-gray-600">Secure Authentication System</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">
                    {user.name || user.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    user.role === 'ADMIN' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                  {user.twoFactorEnabled ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                      <CheckCircle className="h-3 w-3" />
                      2FA Enabled
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      <XCircle className="h-3 w-3" />
                      2FA Disabled
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'password' && <PasswordChecker />}
            {activeTab === '2fa' && (
              <TwoFactorSetup user={user} onUserUpdate={onUserUpdate} />
            )}
            {activeTab === 'admin' && user.role === 'ADMIN' && <AdminPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;