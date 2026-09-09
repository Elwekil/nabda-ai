import { useState } from 'react'
import { FileText } from 'lucide-react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Button from '../common/Button'
import { useLanguage } from '../../context/LanguageContext'

export default function UploadDocument({ isOpen, onClose, onSave }) {
  const { t } = useLanguage()
  const [documentType, setDocumentType] = useState('other')
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const docTypes = [
    { value: 'lab_report',     label: t('documents.lab_report') },
    { value: 'prescription',   label: t('documents.prescription') },
    { value: 'xray',           label: t('documents.xray') },
    { value: 'medical_report', label: t('documents.medical_report') },
    { value: 'other',          label: t('documents.other') },
  ]

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) setSelectedFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('document_type', documentType)
      formData.append('upload_date', uploadDate)
      await onSave(formData)
      setSelectedFile(null)
      setDocumentType('other')
      onClose()
    } catch (error) {
      console.error('Failed to upload:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('documents.upload_document')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('documents.document_type')}</label>
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500">
              {docTypes.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <Input label={t('documents.upload_date')} type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} />
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
          {selectedFile ? (
            <div className="text-center">
              <FileText className="w-12 h-12 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              <button type="button" onClick={() => setSelectedFile(null)} className="mt-2 text-red-500 text-sm hover:underline">
                {t('documents.remove_file')}
              </button>
            </div>
          ) : (
            <>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">{t('documents.drag_or_click')}</p>
              <label className="inline-block mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-colors">
                {t('documents.choose_file')}
                <input type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png,.txt" />
              </label>
              <p className="text-xs text-gray-400 mt-2">{t('documents.supported_formats')}</p>
            </>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" loading={loading} disabled={!selectedFile}>{t('common.upload')}</Button>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        </div>
      </form>
    </Modal>
  )
}
