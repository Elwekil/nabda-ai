import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AIAnalysis from '../AIAnalysis'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

vi.mock('../../../services/documentService', () => ({
  default: {
    analyze: vi.fn(),
    getAll: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
    getAnalysis: vi.fn(),
  },
}))

vi.mock('../../../context/LanguageContext', () => ({
  useLanguage: () => ({ t: (key) => key }),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// ── Mock data ──────────────────────────────────────────────────────────────

const mockAnalysisResult = {
  data: {
    extractedValues: [
      {
        name: 'Glucose',
        value: '150',
        unit: 'mg/dL',
        normalRange: { min: 70, max: 100 },
        isAbnormal: true,
      },
      {
        name: 'Hemoglobin',
        value: '14',
        unit: 'g/dL',
        normalRange: { min: 12, max: 17 },
        isAbnormal: false,
      },
    ],
    imageType: 'lab_report',
    analysis: 'Test analysis text',
    treatmentSuggestions: [
      {
        priority: 'high',
        description: 'See a doctor',
        medications: [],
        lifestyle: [],
      },
    ],
    confidence: 75,
    warnings: ['Warning: abnormal glucose level'],
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────

import api from '../../../services/api'

function makeFile(name, type, sizeBytes) {
  const file = new File(['x'.repeat(Math.min(sizeBytes, 1024))], name, { type })
  // Override size for large file tests since File constructor limits content
  Object.defineProperty(file, 'size', { value: sizeBytes })
  return file
}

function uploadFile(file) {
  const input = document.querySelector('input[type="file"]')
  fireEvent.change(input, { target: { files: [file] } })
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('AIAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. File validation — invalid type
  it('rejects files with invalid type and shows error message', async () => {
    render(<AIAnalysis />)

    const txtFile = makeFile('report.txt', 'text/plain', 100)
    uploadFile(txtFile)

    expect(screen.getByText('ai_analysis.invalid_file_type')).toBeInTheDocument()
  })

  // 2. File validation — file too large
  it('rejects files over 10MB and shows error message', async () => {
    render(<AIAnalysis />)

    const bigFile = makeFile('big.jpg', 'image/jpeg', 11 * 1024 * 1024)
    uploadFile(bigFile)

    expect(screen.getByText('ai_analysis.file_too_large')).toBeInTheDocument()
  })

  // 3. Loading state — shows analyzing text while request is in flight
  it('shows loading/analyzing state when analyzing', async () => {
    const user = userEvent.setup()

    // Make api.post hang so we can observe the loading state
    api.post.mockReturnValue(new Promise(() => {}))

    render(<AIAnalysis />)

    const validFile = makeFile('scan.jpg', 'image/jpeg', 500 * 1024)
    uploadFile(validFile)

    const analyzeBtn = screen.getByRole('button', { name: /ai_analysis\.analyze_image/i })
    await user.click(analyzeBtn)

    expect(screen.getByText('ai_analysis.analyzing')).toBeInTheDocument()
  })

  // 4. Abnormal value display — red styling for isAbnormal: true
  it('renders abnormal values with red styling', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue(mockAnalysisResult)

    render(<AIAnalysis />)

    const validFile = makeFile('scan.png', 'image/png', 500 * 1024)
    uploadFile(validFile)

    const analyzeBtn = screen.getByRole('button', { name: /ai_analysis\.analyze_image/i })
    await user.click(analyzeBtn)

    await waitFor(() => {
      expect(screen.getByText('Glucose')).toBeInTheDocument()
    })

    // The abnormal row cell for "Glucose" should have red text class
    const glucoseCell = screen.getByText('Glucose')
    expect(glucoseCell).toHaveClass('text-red-700')

    // Normal value should NOT have red class
    const hemoglobinCell = screen.getByText('Hemoglobin')
    expect(hemoglobinCell).not.toHaveClass('text-red-700')
  })

  // 5. Warning display — renders warning boxes when warnings array is non-empty
  it('renders warning boxes when warnings are present', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue(mockAnalysisResult)

    render(<AIAnalysis />)

    const validFile = makeFile('scan.jpg', 'image/jpeg', 500 * 1024)
    uploadFile(validFile)

    const analyzeBtn = screen.getByRole('button', { name: /ai_analysis\.analyze_image/i })
    await user.click(analyzeBtn)

    await waitFor(() => {
      expect(screen.getByText('Warning: abnormal glucose level')).toBeInTheDocument()
    })
  })

  // 6. Confidence bar — renders confidence percentage correctly
  it('renders confidence percentage correctly', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue(mockAnalysisResult)

    render(<AIAnalysis />)

    const validFile = makeFile('scan.jpg', 'image/jpeg', 500 * 1024)
    uploadFile(validFile)

    const analyzeBtn = screen.getByRole('button', { name: /ai_analysis\.analyze_image/i })
    await user.click(analyzeBtn)

    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument()
    })
  })
})
