import { useState } from 'react'
import { Check, X, Zap, Shield, Crown, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const plans = [
  {
    id: 'free',
    name: 'مجاني',
    nameEn: 'Free',
    price: 0,
    priceLabel: 'مجاناً',
    priceLabelEn: 'Free',
    period: '',
    icon: Shield,
    color: 'gray',
    gradient: 'from-gray-500 to-gray-600',
    features: [
      { text: 'تسجيل العلامات الحيوية', en: 'Vital Signs Tracking', included: true },
      { text: 'حتى 3 أدوية', en: 'Up to 3 Medications', included: true },
      { text: 'حتى 3 مواعيد', en: 'Up to 3 Appointments', included: true },
      { text: 'الملف الشخصي الأساسي', en: 'Basic Profile', included: true },
      { text: 'إشعارات الأدوية', en: 'Medication Reminders', included: true },
      { text: 'رفع المستندات', en: 'Document Upload', included: false },
      { text: 'تحليل المستندات بالـ AI', en: 'AI Document Analysis', included: false },
      { text: 'تحليل الأدوية بالـ AI', en: 'AI Medication Analysis', included: false },
      { text: 'التقرير الصحي الشامل', en: 'Full Health Report', included: false },
      { text: 'دعم أولوية', en: 'Priority Support', included: false },
    ]
  },
  {
    id: 'basic',
    name: 'الأساسي',
    nameEn: 'Basic',
    price: 29,
    priceLabel: '29 ريال',
    priceLabelEn: '$7.99',
    period: '/شهر',
    periodEn: '/month',
    icon: Zap,
    color: 'blue',
    gradient: 'from-blue-500 to-primary-600',
    popular: false,
    features: [
      { text: 'تسجيل العلامات الحيوية', en: 'Vital Signs Tracking', included: true },
      { text: 'أدوية غير محدودة', en: 'Unlimited Medications', included: true },
      { text: 'مواعيد غير محدودة', en: 'Unlimited Appointments', included: true },
      { text: 'الملف الشخصي الكامل', en: 'Full Profile', included: true },
      { text: 'إشعارات متقدمة', en: 'Advanced Reminders', included: true },
      { text: 'رفع المستندات', en: 'Document Upload', included: true },
      { text: 'تحليل المستندات بالـ AI', en: 'AI Document Analysis', included: false },
      { text: 'تحليل الأدوية بالـ AI', en: 'AI Medication Analysis', included: false },
      { text: 'التقرير الصحي الشامل', en: 'Full Health Report', included: false },
      { text: 'دعم أولوية', en: 'Priority Support', included: false },
    ]
  },
  {
    id: 'premium',
    name: 'المميز',
    nameEn: 'Premium',
    price: 79,
    priceLabel: '79 ريال',
    priceLabelEn: '$19.99',
    period: '/شهر',
    periodEn: '/month',
    icon: Crown,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    popular: true,
    features: [
      { text: 'تسجيل العلامات الحيوية', en: 'Vital Signs Tracking', included: true },
      { text: 'أدوية غير محدودة', en: 'Unlimited Medications', included: true },
      { text: 'مواعيد غير محدودة', en: 'Unlimited Appointments', included: true },
      { text: 'الملف الشخصي الكامل', en: 'Full Profile', included: true },
      { text: 'إشعارات متقدمة', en: 'Advanced Reminders', included: true },
      { text: 'رفع المستندات', en: 'Document Upload', included: true },
      { text: 'تحليل المستندات بالـ AI', en: 'AI Document Analysis', included: true },
      { text: 'تحليل الأدوية بالـ AI', en: 'AI Medication Analysis', included: true },
      { text: 'التقرير الصحي الشامل', en: 'Full Health Report', included: true },
      { text: 'دعم أولوية', en: 'Priority Support', included: true },
    ]
  }
]

export default function Pricing() {
  const { isAuthenticated } = useAuth()
  const { language } = useLanguage()
  const ar = language === 'ar'
  const [currentPlan] = useState('free') // will come from user data later

  return (
    <div className="min-h-screen py-16 px-4" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            {ar ? 'خطط الاشتراك' : 'Subscription Plans'}
          </span>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-4xl font-bold mb-4">
            {ar ? 'اختر الخطة المناسبة لك' : 'Choose Your Plan'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-lg max-w-xl mx-auto">
            {ar
              ? 'ابدأ مجاناً وطور تجربتك الصحية مع خطط مصممة لاحتياجاتك'
              : 'Start free and upgrade your health experience with plans designed for your needs'}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrent = plan.id === currentPlan
            const isPopular = plan.popular

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                  isPopular ? 'shadow-2xl scale-105' : 'shadow-sm hover:shadow-lg'
                }`}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: isPopular ? '2px solid #8b5cf6' : '1px solid var(--border)'
                }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center text-xs font-bold py-1.5">
                    {ar ? '⭐ الأكثر شيوعاً' : '⭐ Most Popular'}
                  </div>
                )}

                <div className={`p-6 ${isPopular ? 'pt-10' : ''}`}>
                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 style={{ color: 'var(--text-primary)' }} className="font-bold text-lg">
                        {ar ? plan.name : plan.nameEn}
                      </h3>
                      {isCurrent && (
                        <span className="text-xs text-green-600 font-medium">
                          {ar ? '✓ خطتك الحالية' : '✓ Current Plan'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      <span style={{ color: 'var(--text-primary)' }} className="text-4xl font-bold">
                        {ar ? plan.priceLabel : plan.priceLabelEn}
                      </span>
                      {plan.period && (
                        <span style={{ color: 'var(--text-muted)' }} className="text-sm mb-1">
                          {ar ? plan.period : plan.periodEn}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl text-center text-sm font-medium mb-6"
                      style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                      {ar ? 'خطتك الحالية' : 'Current Plan'}
                    </div>
                  ) : plan.id === 'free' ? (
                    <Link to={isAuthenticated ? '/dashboard' : '/signup'}
                      className="block w-full py-2.5 rounded-xl text-center text-sm font-medium mb-6 transition-colors"
                      style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                      {ar ? 'ابدأ مجاناً' : 'Get Started Free'}
                    </Link>
                  ) : (
                    <button
                      className={`w-full py-2.5 rounded-xl text-center text-sm font-bold mb-6 text-white transition-all hover:opacity-90 bg-gradient-to-r ${plan.gradient}`}
                      onClick={() => alert(ar ? 'قريباً - ميزة الدفع قيد التطوير' : 'Coming Soon - Payment feature in development')}
                    >
                      {ar ? `اشترك في ${plan.name}` : `Subscribe to ${plan.nameEn}`}
                    </button>
                  )}

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {feature.included ? (
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center flex-shrink-0`}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'var(--bg-muted)' }}>
                            <X className="w-3 h-3" style={{ color: 'var(--text-faint)' }} />
                          </div>
                        )}
                        <span
                          className="text-sm"
                          style={{ color: feature.included ? 'var(--text-secondary)' : 'var(--text-faint)' }}
                        >
                          {ar ? feature.text : feature.en}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom note */}
        <p style={{ color: 'var(--text-faint)' }} className="text-center text-sm mt-10">
          {ar
            ? '✓ لا يوجد بطاقة ائتمان مطلوبة للخطة المجانية • يمكن الإلغاء في أي وقت'
            : '✓ No credit card required for Free plan • Cancel anytime'}
        </p>
      </div>
    </div>
  )
}
