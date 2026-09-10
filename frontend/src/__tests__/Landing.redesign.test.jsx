import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Landing from '../pages/Landing'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
}))

vi.mock('../components/Landing/Navbar', () => ({
  default: () => <nav>Navigation</nav>,
}))

vi.mock('../components/Landing/Hero', () => ({
  default: () => <div>Understand Your Health. Powered by AI.</div>,
}))

vi.mock('../components/Landing/Features', () => ({
  default: () => <div>AI Health Assistant</div>,
}))

vi.mock('../components/Landing/HowItWorks', () => ({
  default: () => <div>How NABDA Works</div>,
}))

vi.mock('../components/Landing/Security', () => ({
  default: () => <div>Privacy & Security</div>,
}))

vi.mock('../components/Landing/CTASection', () => ({
  default: () => <div>Start building your health profile</div>,
}))

vi.mock('../components/Landing/Footer', () => ({
  default: () => <div>Footer</div>,
}))

describe('Landing page redesign', () => {
  it('shows the premium healthcare positioning and core capabilities', () => {
    render(<Landing />)

    expect(screen.getByText(/Understand Your Health\. Powered by AI\./i)).toBeInTheDocument()
    expect(screen.getByText(/AI Health Assistant/i)).toBeInTheDocument()
    expect(screen.getByText(/How NABDA Works/i)).toBeInTheDocument()
    expect(screen.getByText(/Privacy & Security/i)).toBeInTheDocument()
  })
})
