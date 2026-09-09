import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Shield, Key, Lock, CheckCircle } from 'lucide-react';
import api from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import toast from 'react-hot-toast';

const DEV_MODE = import.meta.env.DEV;

const getFriendlyErrorMessage = (error, fallback) => {
  if (error.response?.status === 429) {
    const retryAfter = error.response?.data?.retryAfter;
    return retryAfter
      ? `عدد المحاولات كبير. حاول مرة أخرى بعد ${retryAfter}.`
      : 'عدد المحاولات كبير. حاول مرة أخرى لاحقًا.';
  }

  return error.response?.data?.message || fallback;
};

const normalizeEmail = (value) => value.trim().toLowerCase();

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [receivedCode, setReceivedCode] = useState(null);
  const navigate = useNavigate();

  const startCountdown = () => {
    setCountdown(60);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCodeChange = (index, value) => {
    if (value && !/^\d*$/.test(value)) return;
    if (value.length > 1) return;

    const newCode = [...resetCode];
    newCode[index] = value;
    setResetCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const applyDevelopmentCode = (code) => {
    if (!code) return;

    setReceivedCode(code);
    if (DEV_MODE) {
      setResetCode(code.split(''));
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      toast.error('الرجاء إدخال البريد الإلكتروني');
      return;
    }

    setLoading(true);
    try {
      setEmail(normalizedEmail);
      const response = await api.post('/auth/forgot-password', { email: normalizedEmail });

      if (response.data.success) {
        applyDevelopmentCode(response.data.data?.resetCode);
        toast.success('تم إرسال رمز التحقق');
        setStep(2);
        startCountdown();
      }
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'فشل في إرسال الرمز'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const code = resetCode.join('');
    const normalizedEmail = normalizeEmail(email);

    if (code.length !== 6) {
      toast.error('الرجاء إدخال الرمز المكون من 6 أرقام');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-reset-code', {
        email: normalizedEmail,
        resetCode: code
      });

      if (response.data.success) {
        setResetToken(response.data.data.resetToken);
        toast.success('تم التحقق من الرمز بنجاح');
        setStep(3);
      }
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'رمز غير صحيح'));
      setResetCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error('الرجاء إدخال كلمة المرور');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور غير متطابقة');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        resetToken,
        newPassword
      });

      if (response.data.success) {
        toast.success('تم تغيير كلمة المرور بنجاح');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'فشل في تغيير كلمة المرور'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: normalizedEmail });

      if (response.data.success) {
        applyDevelopmentCode(response.data.data?.resetCode);
        toast.success('تم إعادة إرسال الرمز');
        startCountdown();
      }
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'فشل في إعادة إرسال الرمز'));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg mb-6">
            <Key className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 1 && 'استعادة كلمة المرور'}
            {step === 2 && 'تحقق من بريدك'}
            {step === 3 && 'كلمة مرور جديدة'}
          </h1>
          <p className="text-gray-500 mt-2">
            {step === 1 && 'أدخل بريدك الإلكتروني لإرسال رمز التحقق'}
            {step === 2 && `تم إرسال الرمز إلى ${email}`}
            {step === 3 && 'أدخل كلمة المرور الجديدة'}
          </p>
        </div>

        <Card className="p-8">
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-5">
              <Input
                label="البريد الإلكتروني"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                icon={<Mail className="w-4 h-4 text-gray-400" />}
                required
              />

              <Button type="submit" loading={loading} className="w-full">
                إرسال رمز التحقق
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>

              <div className="text-center mt-4">
                <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700">
                  تذكرت كلمة المرور؟ تسجيل الدخول
                </Link>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              {DEV_MODE && receivedCode && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-700">
                  <p className="mb-2">رمز التطوير الحالي</p>
                  <button
                    type="button"
                    dir="ltr"
                    onClick={() => setResetCode(receivedCode.split(''))}
                    className="font-bold tracking-[0.35em] hover:text-amber-900"
                  >
                    {receivedCode}
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 text-center mb-4">
                  أدخل رمز التحقق المكون من 6 أرقام
                </label>

                <div className="flex justify-center gap-3">
                  {resetCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      className="w-12 h-12 text-center text-2xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      autoFocus={index === 0}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full">
                التحقق
                <CheckCircle className="w-4 h-4 mr-2" />
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={countdown > 0 || loading}
                  className="text-sm text-primary-600 hover:text-primary-700 disabled:text-gray-400"
                >
                  {countdown > 0
                    ? `إعادة الإرسال بعد ${formatTime(countdown)}`
                    : 'إعادة إرسال الرمز'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <Input
                label="كلمة المرور الجديدة"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4 text-gray-400" />}
                required
              />

              <Input
                label="تأكيد كلمة المرور"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4 text-gray-400" />}
                required
              />

              <Button type="submit" loading={loading} className="w-full">
                تغيير كلمة المرور
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </form>
          )}
        </Card>

        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 text-xs text-gray-400">
            <Shield className="w-3 h-3" />
            <span>سيتم إرسال رمز التحقق إلى بريدك الإلكتروني</span>
          </div>
        </div>
      </div>
    </div>
  );
}
