import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SOSFloating from '../SOSFloating'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import api from '../../../services/api'
import toast from 'react-hot-toast'

// ── Helpers ────────────────────────────────────────────────────────────────

function mockGeolocationSuccess(lat = 24.7136, lng = 46.6753) {
  Object.defineProperty(global.navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn((success) =>
        success({ coords: { latitude: lat, longitude: lng, accuracy: 10 } })
      ),
    },
    configurable: true,
    writable: true,
  })
}

function mockGeolocationDenied() {
  Object.defineProperty(global.navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn((_success, error) => error(new Error('denied'))),
    },
    configurable: true,
    writable: true,
  })
}

function mockGeolocationUnavailable() {
  Object.defineProperty(global.navigator, 'geolocation', {
    value: undefined,
    configurable: true,
    writable: true,
  })
}

const mockSuccessResponse = {
  data: {
    data: {
      contactsNotified: 2,
      primaryContact: { name: 'أحمد', phone: '+966501234567' },
    },
  },
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('SOSFloating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGeolocationSuccess()
  })

  // 1. Confirmation modal — clicking SOS button shows the modal
  it('shows confirmation modal when SOS button is clicked', async () => {
    const user = userEvent.setup()
    render(<SOSFloating />)

    const sosBtn = screen.getByTitle('SOS طوارئ')
    await user.click(sosBtn)

    expect(screen.getByText('تأكيد طلب المساعدة')).toBeInTheDocument()
    expect(screen.getByText('هل أنت متأكد من طلب المساعدة الطارئة؟')).toBeInTheDocument()
  })

  // 1b. Confirmation modal — cancel button closes the modal
  it('closes confirmation modal when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<SOSFloating />)

    await user.click(screen.getByTitle('SOS طوارئ'))
    expect(screen.getByText('تأكيد طلب المساعدة')).toBeInTheDocument()

    await user.click(screen.getByText('إلغاء'))
    expect(screen.queryByText('تأكيد طلب المساعدة')).not.toBeInTheDocument()
  })

  // 2. Geolocation fallback — when geolocation is denied, SOS still proceeds with null location
  it('proceeds with null location when geolocation is denied', async () => {
    const user = userEvent.setup()
    mockGeolocationDenied()
    api.post.mockResolvedValue(mockSuccessResponse)

    render(<SOSFloating />)

    await user.click(screen.getByTitle('SOS طوارئ'))
    await user.click(screen.getByText('تأكيد'))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/sos/emergency', { location: null })
    })
  })

  // 2b. Geolocation fallback — when geolocation API is unavailable, SOS still proceeds
  it('proceeds with null location when geolocation API is unavailable', async () => {
    const user = userEvent.setup()
    mockGeolocationUnavailable()
    api.post.mockResolvedValue(mockSuccessResponse)

    render(<SOSFloating />)

    await user.click(screen.getByTitle('SOS طوارئ'))
    await user.click(screen.getByText('تأكيد'))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/sos/emergency', { location: null })
    })
  })

  // 3. Success state — shows contacts notified count in toast and success panel
  it('shows contacts notified count in toast and success panel after successful SOS', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue(mockSuccessResponse)

    render(<SOSFloating />)

    await user.click(screen.getByTitle('SOS طوارئ'))
    await user.click(screen.getByText('تأكيد'))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('2')
      )
    })

    // Success panel should be visible with contact count
    expect(screen.getByText(/تم إخطار 2 جهة اتصال/)).toBeInTheDocument()
  })

  // 3b. Success state — shows primary contact call link
  it('shows primary contact phone link in success panel', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue(mockSuccessResponse)

    render(<SOSFloating />)

    await user.click(screen.getByTitle('SOS طوارئ'))
    await user.click(screen.getByText('تأكيد'))

    await waitFor(() => {
      const callLink = screen.getByRole('link')
      expect(callLink).toHaveAttribute('href', 'tel:+966501234567')
    })
  })

  // 4. Error state — when API call fails, shows error toast
  it('shows error toast when API call fails', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValue({
      response: { data: { message: 'لا توجد جهات اتصال طوارئ' } },
    })

    render(<SOSFloating />)

    await user.click(screen.getByTitle('SOS طوارئ'))
    await user.click(screen.getByText('تأكيد'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('لا توجد جهات اتصال طوارئ')
    })
  })

  // 4b. Error state — falls back to generic message when no response message
  it('shows generic error message when API fails without response body', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValue(new Error('Network Error'))

    render(<SOSFloating />)

    await user.click(screen.getByTitle('SOS طوارئ'))
    await user.click(screen.getByText('تأكيد'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('فشل في إرسال إشارة الاستغاثة')
    })
  })
})
