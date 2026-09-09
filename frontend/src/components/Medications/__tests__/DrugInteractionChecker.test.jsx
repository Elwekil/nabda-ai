import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DrugInteractionChecker from '../DrugInteractionChecker'

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

// ── Mock data ──────────────────────────────────────────────────────────────

const severeMockResponse = {
  data: {
    hasInteractions: true,
    severity: 'severe',
    interactions: [
      {
        drug1: 'warfarin',
        drug2: 'aspirin',
        severity: 'severe',
        description: 'Bleeding risk',
        effects: ['bleeding'],
        recommendation: 'Avoid',
      },
    ],
    safeToTake: false,
    recommendations: ['Consult doctor'],
    alternatives: [
      {
        originalDrug: 'warfarin',
        alternativeDrug: 'apixaban',
        reason: 'Safer',
        effectivenessPercentage: 90,
        sideEffects: ['bruising'],
      },
    ],
  },
}

const mildMockResponse = {
  data: {
    hasInteractions: true,
    severity: 'mild',
    interactions: [
      {
        drug1: 'ibuprofen',
        drug2: 'paracetamol',
        severity: 'mild',
        description: 'Minor interaction',
        effects: ['nausea'],
        recommendation: 'Monitor',
      },
    ],
    safeToTake: true,
    recommendations: [],
    alternatives: [],
  },
}

const moderateMockResponse = {
  data: {
    hasInteractions: true,
    severity: 'moderate',
    interactions: [
      {
        drug1: 'metformin',
        drug2: 'alcohol',
        severity: 'moderate',
        description: 'Moderate interaction',
        effects: ['dizziness'],
        recommendation: 'Use caution',
      },
    ],
    safeToTake: true,
    recommendations: [],
    alternatives: [],
  },
}

const noInteractionsMockResponse = {
  data: {
    hasInteractions: false,
    severity: 'none',
    interactions: [],
    safeToTake: true,
    recommendations: [],
    alternatives: [],
  },
}

const twoMeds = [
  { name: 'warfarin', dosage: '5mg' },
  { name: 'aspirin', dosage: '100mg' },
]

// ── Tests ──────────────────────────────────────────────────────────────────

describe('DrugInteractionChecker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Severity color coding — severe shows red badge
  it('shows red badge for severe interactions', async () => {
    api.post.mockResolvedValue(severeMockResponse)

    render(<DrugInteractionChecker medications={twoMeds} />)

    await waitFor(() => {
      expect(screen.getByText('خطير')).toBeInTheDocument()
    })

    const badge = screen.getByText('خطير')
    expect(badge).toHaveClass('bg-red-100')
    expect(badge).toHaveClass('text-red-700')
  })

  // 1b. Severity color coding — mild shows yellow badge
  it('shows yellow badge for mild interactions', async () => {
    api.post.mockResolvedValue(mildMockResponse)

    render(<DrugInteractionChecker medications={twoMeds} />)

    await waitFor(() => {
      expect(screen.getByText('خفيف')).toBeInTheDocument()
    })

    const badge = screen.getByText('خفيف')
    expect(badge).toHaveClass('bg-yellow-100')
    expect(badge).toHaveClass('text-yellow-700')
  })

  // 1c. Severity color coding — moderate shows orange badge
  it('shows orange badge for moderate interactions', async () => {
    api.post.mockResolvedValue(moderateMockResponse)

    render(<DrugInteractionChecker medications={twoMeds} />)

    await waitFor(() => {
      expect(screen.getByText('متوسط')).toBeInTheDocument()
    })

    const badge = screen.getByText('متوسط')
    expect(badge).toHaveClass('bg-orange-100')
    expect(badge).toHaveClass('text-orange-700')
  })

  // 2. Alternatives display — shown when safeToTake is false
  it('shows alternatives section when safeToTake is false', async () => {
    api.post.mockResolvedValue(severeMockResponse)

    render(<DrugInteractionChecker medications={twoMeds} />)

    await waitFor(() => {
      expect(screen.getByText(/بدائل آمنة مقترحة/)).toBeInTheDocument()
    })
  })

  // 2b. Alternatives display — not shown when safeToTake is true
  it('does not show alternatives section when safeToTake is true', async () => {
    api.post.mockResolvedValue(mildMockResponse)

    render(<DrugInteractionChecker medications={twoMeds} />)

    await waitFor(() => {
      expect(screen.getByText('خفيف')).toBeInTheDocument()
    })

    expect(screen.queryByText(/بدائل آمنة مقترحة/)).not.toBeInTheDocument()
  })

  // 2c. Alternatives content — clicking toggle reveals alternative drug details
  it('reveals alternative drug details when alternatives section is expanded', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue(severeMockResponse)

    render(<DrugInteractionChecker medications={twoMeds} />)

    await waitFor(() => {
      expect(screen.getByText(/بدائل آمنة مقترحة/)).toBeInTheDocument()
    })

    await user.click(screen.getByText(/بدائل آمنة مقترحة/))

    expect(screen.getByText('apixaban')).toBeInTheDocument()
    expect(screen.getByText('90% فعالية')).toBeInTheDocument()
  })

  // 3. Safe scenario — shows green "لا يوجد تعارض" message
  it('shows green no-interaction message when no interactions found', async () => {
    api.post.mockResolvedValue(noInteractionsMockResponse)

    render(<DrugInteractionChecker medications={twoMeds} />)

    await waitFor(() => {
      expect(screen.getByText('لا يوجد تعارض بين أدويتك')).toBeInTheDocument()
    })

    const statusEl = screen.getByText('لا يوجد تعارض بين أدويتك')
    expect(statusEl).toHaveClass('text-green-700')
  })

  // 3b. Safe scenario — calls toast.success when no interactions
  it('calls toast.success when no interactions are found', async () => {
    api.post.mockResolvedValue(noInteractionsMockResponse)

    render(<DrugInteractionChecker medications={twoMeds} />)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('لا يوجد تعارض')
      )
    })
  })

  // 3c. Interaction scenario — calls toast.error when interactions found
  it('calls toast.error when interactions are detected', async () => {
    api.post.mockResolvedValue(severeMockResponse)

    render(<DrugInteractionChecker medications={twoMeds} />)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('تعارض')
      )
    })
  })

  // 4. Auto-trigger — check is triggered when medications prop changes
  it('triggers interaction check automatically when medications prop changes', async () => {
    api.post.mockResolvedValue(noInteractionsMockResponse)

    const { rerender } = render(<DrugInteractionChecker medications={twoMeds} />)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1)
    })

    const newMeds = [
      ...twoMeds,
      { name: 'metformin', dosage: '500mg' },
    ]

    rerender(<DrugInteractionChecker medications={newMeds} />)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(2)
    })
  })

  // 4b. Auto-trigger — does not call API when fewer than 2 medications
  it('does not call API when fewer than 2 medications are provided', async () => {
    render(<DrugInteractionChecker medications={[{ name: 'aspirin' }]} />)

    // Give time for any potential async calls
    await new Promise((r) => setTimeout(r, 50))

    expect(api.post).not.toHaveBeenCalled()
    expect(screen.getByText('أضف دواءين أو أكثر لفحص التعارضات')).toBeInTheDocument()
  })
})
