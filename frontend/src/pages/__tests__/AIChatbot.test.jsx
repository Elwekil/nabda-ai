import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AIChatbot from '../AIChatbot'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import api from '../../services/api'
import toast from 'react-hot-toast'

// ── Mock data ──────────────────────────────────────────────────────────────

const mockMedicalContext = {
  data: {
    userId: 1,
    age: 35,
    gender: 'male',
    bloodType: 'O+',
    chronicConditions: ['diabetes'],
    allergies: ['penicillin'],
    currentMedications: [{ name: 'Metformin', dosage: '500mg' }],
    recentVitals: [{ type: 'blood_pressure', value: '120/80' }],
  },
}

const mockChatResponse = {
  data: {
    data: {
      message: 'يبدو أنك تعاني من أعراض نزلة برد. أنصحك بالراحة وشرب السوائل.',
      urgencyLevel: 'low',
      followUpQuestions: ['هل لديك حمى؟', 'منذ متى بدأت الأعراض؟'],
    },
  },
}

const mockEmergencyResponse = {
  data: {
    data: {
      message: 'يجب عليك التوجه للطوارئ فوراً!',
      urgencyLevel: 'emergency',
      followUpQuestions: [],
    },
  },
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('AIChatbot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue(mockMedicalContext)
    
    // Mock scrollIntoView for tests
    Element.prototype.scrollIntoView = vi.fn()
  })

  // 1. Message rendering — initial welcome message is displayed
  it('renders initial welcome message from assistant', async () => {
    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByText(/مرحباً! أنا د\. سينا/)).toBeInTheDocument()
    })
  })

  // 2. Message rendering — user message appears after sending
  it('renders user message after sending', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue(mockChatResponse)

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')
    await user.type(input, 'عندي صداع')
    await user.click(screen.getByRole('button', { name: '' }))

    await waitFor(() => {
      expect(screen.getByText('عندي صداع')).toBeInTheDocument()
    })
  })

  // 3. Urgency badge colors — low urgency shows green badge
  it('renders green badge for low urgency level', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue(mockChatResponse)

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')
    await user.type(input, 'عندي صداع خفيف')
    await user.click(screen.getByRole('button', { name: '' }))

    await waitFor(() => {
      const badge = screen.getByText('🟢 إلحاح منخفض')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-100', 'text-green-700', 'border-green-300')
    })
  })

  // 4. Urgency badge colors — medium urgency shows yellow badge
  it('renders yellow badge for medium urgency level', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({
      data: {
        data: {
          message: 'قد تحتاج لزيارة الطبيب',
          urgencyLevel: 'medium',
          followUpQuestions: [],
        },
      },
    })

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')
    await user.type(input, 'عندي ألم في البطن')
    await user.click(screen.getByRole('button', { name: '' }))

    await waitFor(() => {
      const badge = screen.getByText('🟡 إلحاح متوسط')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700', 'border-yellow-300')
    })
  })

  // 5. Urgency badge colors — high urgency shows orange badge
  it('renders orange badge for high urgency level', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({
      data: {
        data: {
          message: 'يجب زيارة الطبيب قريباً',
          urgencyLevel: 'high',
          followUpQuestions: [],
        },
      },
    })

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')
    await user.type(input, 'ألم شديد في الصدر')
    await user.click(screen.getByRole('button', { name: '' }))

    await waitFor(() => {
      const badge = screen.getByText('🟠 إلحاح عالي')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-700', 'border-orange-300')
    })
  })

  // 6. Urgency badge colors — emergency urgency shows red badge
  it('renders red badge for emergency urgency level', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue(mockEmergencyResponse)

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')
    await user.type(input, 'ألم حاد في الصدر وضيق تنفس')
    await user.click(screen.getByRole('button', { name: '' }))

    await waitFor(() => {
      const badge = screen.getByText('🔴 حالة طارئة')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-100', 'text-red-700', 'border-red-300')
    })
  })

  // 7. Emergency alert — toast appears for emergency urgency
  it('shows emergency alert toast when urgency is emergency', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue(mockEmergencyResponse)

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')
    await user.type(input, 'ألم حاد في الصدر')
    await user.click(screen.getByRole('button', { name: '' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        '⚠️ حالة طارئة! يُنصح بالتوجه للطوارئ فوراً أو الاتصال بالإسعاف',
        expect.objectContaining({
          duration: 10000,
        })
      )
    })
  })

  // 8. Export flow — clicking export button prompts for email
  it('prompts for email when export button is clicked', async () => {
    const user = userEvent.setup()
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('test@example.com')
    api.post.mockResolvedValue({ data: { success: true } })

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByText('تصدير الملف الطبي')).toBeInTheDocument()
    })

    await user.click(screen.getByText('تصدير الملف الطبي'))

    expect(promptSpy).toHaveBeenCalledWith('أدخل البريد الإلكتروني لإرسال الملف الطبي:')
    promptSpy.mockRestore()
  })

  // 9. Export flow — successful export shows success toast
  it('shows success toast after successful export', async () => {
    const user = userEvent.setup()
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('test@example.com')
    api.post.mockResolvedValue({ data: { success: true } })

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByText('تصدير الملف الطبي')).toBeInTheDocument()
    })

    await user.click(screen.getByText('تصدير الملف الطبي'))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/ai/export-medical-file-pdf', {
        email: 'test@example.com',
      })
      expect(toast.success).toHaveBeenCalledWith('تم إرسال الملف الطبي إلى test@example.com بنجاح ✅')
    })

    promptSpy.mockRestore()
  })

  // 10. Export flow — failed export shows error toast
  it('shows error toast when export fails', async () => {
    const user = userEvent.setup()
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('test@example.com')
    api.post.mockRejectedValue(new Error('Export failed'))

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByText('تصدير الملف الطبي')).toBeInTheDocument()
    })

    await user.click(screen.getByText('تصدير الملف الطبي'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('فشل في إرسال الملف الطبي')
    })

    promptSpy.mockRestore()
  })

  // 11. Export flow — canceling email prompt does not trigger export
  it('does not trigger export when email prompt is cancelled', async () => {
    const user = userEvent.setup()
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null)

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByText('تصدير الملف الطبي')).toBeInTheDocument()
    })

    await user.click(screen.getByText('تصدير الملف الطبي'))

    expect(api.post).not.toHaveBeenCalled()
    promptSpy.mockRestore()
  })

  // 12. Follow-up questions — clicking follow-up fills input
  it('fills input when follow-up question is clicked', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue(mockChatResponse)

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')
    await user.type(input, 'عندي صداع')
    await user.click(screen.getByRole('button', { name: '' }))

    await waitFor(() => {
      expect(screen.getByText('هل لديك حمى؟')).toBeInTheDocument()
    })

    await user.click(screen.getByText('هل لديك حمى؟'))

    expect(input).toHaveValue('هل لديك حمى؟')
  })

  // 13. Clear chat — clicking clear chat resets messages
  it('resets messages when clear chat button is clicked', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue(mockChatResponse)

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')
    await user.type(input, 'عندي صداع')
    await user.click(screen.getByRole('button', { name: '' }))

    await waitFor(() => {
      expect(screen.getByText('عندي صداع')).toBeInTheDocument()
    })

    await user.click(screen.getByText('محادثة جديدة'))

    expect(screen.queryByText('عندي صداع')).not.toBeInTheDocument()
    expect(screen.getByText('تم بدء محادثة جديدة. كيف يمكنني مساعدتك؟ 🩺')).toBeInTheDocument()
  })

  // 14. Loading state — shows loader while waiting for response
  it('shows loading indicator while waiting for AI response', async () => {
    const user = userEvent.setup()
    api.post.mockReturnValue(new Promise(() => {})) // Never resolves

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')
    await user.type(input, 'عندي صداع')
    await user.click(screen.getByRole('button', { name: '' }))

    // Check that loading spinner appears
    await waitFor(() => {
      const loaders = screen.getAllByTestId('loader-icon')
      expect(loaders.length).toBeGreaterThan(0)
    })
  })

  // 15. Error handling — shows error message when chat fails
  it('shows error message when chat API fails', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValue(new Error('Network error'))

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')
    await user.type(input, 'عندي صداع')
    await user.click(screen.getByRole('button', { name: '' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('فشل في الرد، حاول مرة أخرى')
      expect(screen.getByText('عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.')).toBeInTheDocument()
    })
  })

  // 16. Input validation — send button disabled when input is empty
  it('disables send button when input is empty', async () => {
    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')).toBeInTheDocument()
    })

    const sendButton = screen.getByRole('button', { name: '' })
    expect(sendButton).toBeDisabled()
  })

  // 17. Quick questions — clicking quick question fills input
  it('fills input when quick question is clicked', async () => {
    const user = userEvent.setup()

    render(<AIChatbot />)

    await waitFor(() => {
      expect(screen.getByText('عندي صداع شديد منذ يومين')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('اكتب سؤالك الطبي هنا...')
    await user.click(screen.getByText('عندي صداع شديد منذ يومين'))

    expect(input).toHaveValue('عندي صداع شديد منذ يومين')
  })
})
