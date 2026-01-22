import React, { useState, useEffect } from 'react';
import { passwordService } from '../services/password.service';
import { PasswordStrength } from '../types';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Shield,
  Clock
} from 'lucide-react';

const PasswordChecker: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState<PasswordStrength | null>(null);
  const [pwnedInfo, setPwnedInfo] = useState<{ isPwned: boolean; count: number } | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkingPwned, setCheckingPwned] = useState(false);

  useEffect(() => {
    if (!password) {
      setStrength(null);
      setPwnedInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const result = await passwordService.checkPassword(password);
        setStrength(result);
      } catch (error) {
        console.error('Error checking password:', error);
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [password]);

  const checkPwned = async () => {
    if (!password) return;

    setCheckingPwned(true);
    try {
      const result = await passwordService.checkPwnedPassword(password);
      setPwnedInfo(result);
    } catch (error) {
      console.error('Error checking pwned password:', error);
    } finally {
      setCheckingPwned(false);
    }
  };

  const getStrengthLabel = (score: number) => {
    const labels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];
    return labels[score] || 'Unknown';
  };

  const getStrengthColor = (score: number) => {
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
    ];
    return colors[score] || 'bg-gray-300';
  };

  const getStrengthTextColor = (score: number) => {
    const colors = [
      'text-red-700',
      'text-orange-700',
      'text-yellow-700',
      'text-lime-700',
      'text-green-700',
    ];
    return colors[score] || 'text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Strength Checker</h2>
        <p className="text-gray-600">
          Test your password strength and get recommendations for improvement
        </p>
      </div>

      {/* Password Input */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Enter Password to Test
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
            placeholder="Type a password to check..."
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>

        {/* Strength Meter */}
        {strength && (
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Strength</span>
                <span className={`text-sm font-bold ${getStrengthTextColor(strength.score)}`}>
                  {getStrengthLabel(strength.score)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getStrengthColor(strength.score)}`}
                  style={{ width: `${(strength.score + 1) * 20}%` }}
                />
              </div>
            </div>

            {/* Crack Time */}
            <div className="flex items-center gap-2 text-sm text-gray-700 bg-white rounded-lg p-3">
              <Clock className="h-5 w-5 text-indigo-600" />
              <span>
                <strong>Time to crack:</strong> {strength.crackTime}
              </span>
            </div>

            {/* Common Password Warning */}
            {strength.isCommon && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Warning:</strong> This is a commonly used password and should NOT be used!
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pwned Password Check */}
      {password && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                HaveIBeenPwned Check
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Check if this password has appeared in data breaches
              </p>
            </div>
            <button
              onClick={checkPwned}
              disabled={checkingPwned}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {checkingPwned ? 'Checking...' : 'Check Now'}
            </button>
          </div>

          {pwnedInfo && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg ${
                pwnedInfo.isPwned
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-green-50 border border-green-200 text-green-800'
              }`}
            >
              {pwnedInfo.isPwned ? (
                <>
                  <AlertTriangle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Password Found in Breach!</p>
                    <p className="text-sm mt-1">
                      This password has been seen {pwnedInfo.count.toLocaleString()} times in data breaches.
                      <strong> Do not use this password!</strong>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Password Not Found in Breaches</p>
                    <p className="text-sm mt-1">
                      This password has not appeared in any known data breaches.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      {strength && strength.feedback.length > 0 && (
        <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Recommendations
          </h3>
          <ul className="space-y-2">
            {strength.feedback.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Password Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Use at least 12 characters</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Mix uppercase and lowercase letters</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Include numbers and special characters (!@#$%^&*)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Avoid common words, patterns, and personal information</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Use a unique password for each account</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PasswordChecker;