import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { authService } from "../services/auth.service";
import { User } from "../types";
import {
  Shield,
  AlertCircle,
  CheckCircle,
  Lock,
  Smartphone,
  Key,
  XCircle,
} from "lucide-react";

interface TwoFactorSetupProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ user, onUserUpdate }) => {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [setupUserId, setSetupUserId] = useState<string | number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // enable2FA should return { secret, qrCode } from your backend
      const response = await authService.enable2FA(password);

      setQrCode(response.qrCode);
      setSecret(response.secret);

      // Keep a user id for verify step (some backends require it)
      // If your authService doesn't return userId, we can use current user id
      setSetupUserId(response.userId ?? user.id);

      setShowSetup(true);
      setPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to enable 2FA");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: verify code to actually enable 2FA in the database
  const handleVerify2FASetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const userIdToVerify = setupUserId ?? user.id;

      // this should call backend verify2FA() which enables twoFactorEnabled and returns token+user
      const res = await authService.verify2FA(String(userIdToVerify), code);

      // Update user from backend response (persisted state)
      if (res?.user) {
        onUserUpdate(res.user);
      } else {
        // fallback if your backend doesn't return full user
        onUserUpdate({ ...user, twoFactorEnabled: true });
      }

      setSuccess("2FA has been enabled successfully!");
      setShowSetup(false);
      setCode("");
      setQrCode("");
      setSecret("");
      setSetupUserId(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await authService.disable2FA(password, code);
      setSuccess("2FA has been disabled successfully");
      onUserUpdate({ ...user, twoFactorEnabled: false });
      setPassword("");
      setCode("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSetup = () => {
    setShowSetup(false);
    setQrCode("");
    setSecret("");
    setCode("");
    setPassword("");
    setSetupUserId(null);
    setError("");
    setSuccess("");
  };

  // =======================
  // 2FA ENABLED UI
  // =======================
  if (user.twoFactorEnabled) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-xl font-bold text-green-900">2FA is Enabled</h2>
              <p className="text-sm text-green-700">
                Your account is protected with two-factor authentication
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Disable Two-Factor Authentication
          </h3>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleDisable2FA} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center text-lg font-mono tracking-widest"
                  placeholder="000000"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Disabling..." : "Disable 2FA"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =======================
  // SETUP SCREEN
  // =======================
  if (showSetup && qrCode) {
    return (
      <div className="space-y-6">
        <div className="bg-white border-2 border-indigo-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-indigo-600" />
            Scan QR Code
          </h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
              {qrCode.startsWith("data:image") ? (
                <img src={qrCode} alt="2FA QR Code" />
              ) : (
                <QRCodeSVG value={qrCode} />
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">Setup Instructions:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Open your authenticator app (Google Authenticator, Microsoft Authenticator, etc.)</li>
                <li>Scan the QR code above</li>
                <li>Or manually enter the secret key below</li>
                <li>Enter a verification code to complete setup</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Key (Manual Entry)
              </label>
              <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm break-all">
                {secret}
              </div>
            </div>

            {/* ✅ NEW: Verify code to actually enable 2FA */}
            <form onSubmit={handleVerify2FASetup} className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code (from app)
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg font-mono tracking-widest"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Verifying..." : "Verify & Enable 2FA"}
              </button>
            </form>

            <div className="flex gap-3">
              <button
                onClick={handleCancelSetup}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>

              {/* keep as informational only */}
              <button
                onClick={() => setSuccess("Now enter the code from your app below to enable 2FA.")}
                className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                I’ve Scanned It
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =======================
  // NOT ENABLED UI
  // =======================
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-8 w-8 text-yellow-600" />
          <div>
            <h2 className="text-xl font-bold text-yellow-900">2FA is Not Enabled</h2>
            <p className="text-sm text-yellow-700">Add an extra layer of security to your account</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-600" />
          Enable Two-Factor Authentication
        </h3>

        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-semibold mb-2">What is 2FA?</p>
          <p className="text-sm text-blue-800">
            Two-factor authentication adds an extra layer of security by requiring both your password
            and a verification code from your phone to log in.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleEnable2FA} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Setting up..." : "Enable 2FA"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorSetup;
