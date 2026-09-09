import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import DocumentsList from '../components/Documents/DocumentsList';
import UploadDocument from '../components/Documents/UploadDocument';
import AIAnalysis from '../components/Documents/AIAnalysis';
import documentService from '../services/documentService';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

export default function Documents() {
    const { t } = useLanguage();
    const [documents, setDocuments] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchDocuments(); }, []);

    const fetchDocuments = async () => {
        try {
            const data = await documentService.getAll();
            setDocuments(data.items || []);
        } catch (error) {
            toast.error(`${t('documents.upload_failed')}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (formData) => {
        try {
            await documentService.upload(formData);
            toast.success(t('documents.document_uploaded'));
            fetchDocuments();
        } catch (error) {
            toast.error(`${t('documents.upload_failed')}: ${error.message}`);
            throw error;
        }
    };

    const handleDelete = async (id) => {
        try {
            await documentService.delete(id);
            toast.success(t('documents.document_deleted'));
            fetchDocuments();
            if (selectedDocument?.id === id) setSelectedDocument(null);
        } catch {
            toast.error(t('documents.delete_failed'));
        }
    };

    const handleViewAnalysis = (document) => setSelectedDocument(document);

    const handleAnalysisComplete = (updatedDoc) => {
        setSelectedDocument(updatedDoc);
        setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? { ...d, ai_analysis: updatedDoc.analysis } : d));
    };

    if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">{t('documents.title')}</h1>
                    <Button onClick={() => setShowUploadModal(true)}>
                        <Upload className="w-4 h-4 ml-2" />
                        {t('documents.upload_document')}
                    </Button>
                </div>
                <DocumentsList documents={documents} onDelete={handleDelete} onViewAnalysis={handleViewAnalysis} />
            </div>
            <div>
                <AIAnalysis document={selectedDocument} onAnalysisComplete={handleAnalysisComplete} />
            </div>
            <UploadDocument isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onSave={handleUpload} />
        </div>
    );
}
