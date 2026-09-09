import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// ── Mocks ──────────────────────────────────────────────────────────────────

// Mock all page components to avoid complex dependencies
vi.mock('../pages/Landing', () => ({ default: () => <div data-testid="landing-page">Landing</div> }))
vi.mock('../pages/Login', () => ({ default: () => <div data-testid="login-page">Login</div> }))
vi.mock('../pages/Signup', () => ({ default: () => <div data-testid="signup-page">Signup</div> }))
vi.mock('../pages/VerifyOTP', () => ({ default: () => <div data-testid="verify-otp-page">VerifyOTP</div> }))
vi.mock('../pages/ForgotPassword', () => ({ default: () => <div data-testid="forgot-password-page">ForgotPassword</div> }))
vi.mock('../pages/GoogleAuthSuccess', () => ({ default: () => <div data-testid="google-auth-page">GoogleAuthSuccess</div> }))
vi.mock('../pages/Dashboard', () => ({ default: () => <div data-testid="dashboard-page">Dashboard</div> }))
vi.mock('../pages/Medications', () => ({ default: () => <div data-testid="medications-page">Medications</div> }))
vi.mock('../pages/Appointments', () => ({ default: () => <div data-testid="appointments-page">Appointments</div> }))
vi.mock('../pages/Documents', () => ({ default: () => <div data-testid="documents-page">Documents</div> }))
vi.mock('../pages/Profile', () => ({ default: () => <div data-testid="profile-page">Profile</div> }))
vi.mock('../pages/HealthReport', () => ({ default: () => <div data-testid="health-report-page">HealthReport</div> }))
vi.mock('../pages/AIChatbot', () => ({ default: () => <div data-testid="ai-chatbot-page">AIChatbot</div> }))
vi.mock('../pages/Pricing', () => ({ default: () => <div data-testid="pricing-page">Pricing</div> }))

// Mock layout components
vi.mock('../components/Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }))
vi.mock('../components/Header', () => ({ default: () => <div data-testid="header">Header</div> }))

// Mock SOSFloating component - this is what we're testing
vi.mock('../components/common/SOSFloating', () => ({ 
  default: () => <div data-testid="sos-floating">SOS Button</div> 
}))

// Mock context providers
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
}))
vi.mock('../context/NotificationContext', () => ({
  NotificationProvider: ({ children }) => <div>{children}</div>,
}))
vi.mock('../context/LanguageContext', () => ({
  LanguageProvider: ({ children }) => <div>{children}</div>,
}))
vi.mock('../context/ThemeContext', () => ({
  ThemeProvider: ({ children }) => <div>{children}</div>,
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
}))

// Mock API service
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

// ── Helper Function ────────────────────────────────────────────────────────

function renderAppAtRoute(route) {
  // Set the initial route before rendering
  window.history.pushState({}, '', route)
  return render(<App />)
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('App Routing - SOSFloating Placement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Public Pages - SOSFloating should NOT be present', () => {
    it('should NOT show SOSFloating on Landing page', () => {
      renderAppAtRoute('/')
      
      expect(screen.getByTestId('landing-page')).toBeInTheDocument()
      expect(screen.queryByTestId('sos-floating')).not.toBeInTheDocument()
    })

    it('should NOT show SOSFloating on Login page', () => {
      renderAppAtRoute('/login')
      
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
      expect(screen.queryByTestId('sos-floating')).not.toBeInTheDocument()
    })

    it('should NOT show SOSFloating on Signup page', () => {
      renderAppAtRoute('/signup')
      
      expect(screen.getByTestId('signup-page')).toBeInTheDocument()
      expect(screen.queryByTestId('sos-floating')).not.toBeInTheDocument()
    })

    it('should NOT show SOSFloating on VerifyOTP page', () => {
      renderAppAtRoute('/verify-otp')
      
      expect(screen.getByTestId('verify-otp-page')).toBeInTheDocument()
      expect(screen.queryByTestId('sos-floating')).not.toBeInTheDocument()
    })

    it('should NOT show SOSFloating on ForgotPassword page', () => {
      renderAppAtRoute('/forgot-password')
      
      expect(screen.getByTestId('forgot-password-page')).toBeInTheDocument()
      expect(screen.queryByTestId('sos-floating')).not.toBeInTheDocument()
    })

    it('should NOT show SOSFloating on GoogleAuthSuccess page', () => {
      renderAppAtRoute('/auth/google/success')
      
      expect(screen.getByTestId('google-auth-page')).toBeInTheDocument()
      expect(screen.queryByTestId('sos-floating')).not.toBeInTheDocument()
    })
  })

  describe('Authenticated Pages - SOSFloating SHOULD be present', () => {
    it('should show SOSFloating on Dashboard page', () => {
      renderAppAtRoute('/dashboard')
      
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
      expect(screen.getByTestId('sos-floating')).toBeInTheDocument()
    })

    it('should show SOSFloating on Medications page', () => {
      renderAppAtRoute('/medications')
      
      expect(screen.getByTestId('medications-page')).toBeInTheDocument()
      expect(screen.getByTestId('sos-floating')).toBeInTheDocument()
    })

    it('should show SOSFloating on Appointments page', () => {
      renderAppAtRoute('/appointments')
      
      expect(screen.getByTestId('appointments-page')).toBeInTheDocument()
      expect(screen.getByTestId('sos-floating')).toBeInTheDocument()
    })

    it('should show SOSFloating on Documents page', () => {
      renderAppAtRoute('/documents')
      
      expect(screen.getByTestId('documents-page')).toBeInTheDocument()
      expect(screen.getByTestId('sos-floating')).toBeInTheDocument()
    })

    it('should show SOSFloating on Profile page', () => {
      renderAppAtRoute('/profile')
      
      expect(screen.getByTestId('profile-page')).toBeInTheDocument()
      expect(screen.getByTestId('sos-floating')).toBeInTheDocument()
    })

    it('should show SOSFloating on HealthReport page', () => {
      renderAppAtRoute('/health-report')
      
      expect(screen.getByTestId('health-report-page')).toBeInTheDocument()
      expect(screen.getByTestId('sos-floating')).toBeInTheDocument()
    })

    it('should show SOSFloating on AIChatbot page', () => {
      renderAppAtRoute('/ai-chatbot')
      
      expect(screen.getByTestId('ai-chatbot-page')).toBeInTheDocument()
      expect(screen.getByTestId('sos-floating')).toBeInTheDocument()
    })

    it('should show SOSFloating on Pricing page (authenticated)', () => {
      renderAppAtRoute('/pricing')
      
      expect(screen.getByTestId('pricing-page')).toBeInTheDocument()
      expect(screen.getByTestId('sos-floating')).toBeInTheDocument()
    })
  })

  describe('Layout Components', () => {
    it('should show Sidebar and Header on authenticated pages', () => {
      renderAppAtRoute('/dashboard')
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('header')).toBeInTheDocument()
    })

    it('should NOT show Sidebar and Header on public pages', () => {
      renderAppAtRoute('/login')
      
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
      expect(screen.queryByTestId('header')).not.toBeInTheDocument()
    })
  })
})
