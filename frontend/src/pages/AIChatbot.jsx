import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, User, AlertTriangle, RefreshCw, Download } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case 'low': return 'bg-green-100 text-green-700 border-green-300'
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    case 'high': return 'bg-orange-100 text-orange-700 border-orange-300'
    case 'emergency': return 'bg-red-100 text-red-700 border-red-300'
    default: return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

const Message = ({ msg, onFollowUpClick }) => {
  const isBot = msg.role === 'assistant'
  return (
    <div className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isBot ? 'bg-primary-100' : 'bg-gray-100'}`}>
        {isBot ? <Bot className="w-4 h-4 text-primary-600" /> : <User className="w-4 h-4 text-gray-600" />}
      </div>
      <div className="flex-1 max-w-[80%]">
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isBot ? 'bg-white border border-gray-100 text-gray-800 shadow-sm' : 'bg-primary-600 text-white'
        }`}>
          {msg.content}
        </div>
        {isBot && msg.urgencyLevel && (
          <div className={`mt-2 inline-block px-2 py-1 rounded-full text-xs border ${getUrgencyColor(msg.urgencyLevel)}`}>
            {msg.urgencyLevel === 'low' && '🟢 إلحاح منخفض'}
            {msg.urgencyLevel === 'medium' && '🟡 إلحاح متوسط'}
            {msg.urgencyLevel === 'high' && '🟠 إلحاح عالي'}
            {msg.urgencyLevel === 'emergency' && '🔴 حالة طارئة'}
          </div>
        )}
        {isBot && msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-500">أسئلة إضافية:</p>
            <div className="flex flex-wrap gap-2">
              {msg.followUpQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onFollowUpClick(q)}
                  className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors border border-primary-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AIChatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'مرحباً! أنا د. سينا، مساعدك الطبي الذكي 🩺\n\nيمكنني مساعدتك في:\n• تحليل الأعراض وتقديم توصيات\n• الإجابة على أسئلتك الطبية\n• اقتراح أفضل 3 علاجات لحالتك\n\nأخبرني كيف تشعر اليوم؟'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [medicalContext, setMedicalContext] = useState(null)
  const [contextLoading, setContextLoading] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    loadMedicalContext()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMedicalContext = async () => {
    try {
      const { data } = await api.get('/users/medical-context')
      setMedicalContext(data.data)
    } catch (err) {
      console.error('Failed to load medical context:', err)
      toast.error('فشل في تحميل السياق الطبي')
    } finally {
      setContextLoading(false)
    }
  }

  const sendMessage = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.slice(-10)
      const { data } = await api.post('/ai/chat-diagnosis', { 
        message: text, 
        history,
        context: medicalContext 
      })
      
      const assistantMsg = {
        role: 'assistant',
        content: data.data.message,
        urgencyLevel: data.data.urgencyLevel,
        followUpQuestions: data.data.followUpQuestions || []
      }
      
      setMessages(prev => [...prev, assistantMsg])

      // Show emergency alert toast if urgency is emergency
      if (data.data.urgencyLevel === 'emergency') {
        toast.error('⚠️ حالة طارئة! يُنصح بالتوجه للطوارئ فوراً أو الاتصال بالإسعاف', {
          duration: 10000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '2px solid #dc2626',
            fontWeight: 'bold'
          }
        })
      }
    } catch (err) {
      console.error('Chat error:', err)
      toast.error('فشل في الرد، حاول مرة أخرى')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleFollowUpClick = (question) => {
    setInput(question)
    inputRef.current?.focus()
  }

  const exportMedicalFile = async () => {
    const email = prompt('أدخل البريد الإلكتروني لإرسال الملف الطبي:')
    if (!email || !email.trim()) return

    try {
      await api.post('/ai/export-medical-file-pdf', { email: email.trim() })
      toast.success(`تم إرسال الملف الطبي إلى ${email} بنجاح ✅`)
    } catch (err) {
      console.error('Export error:', err)
      toast.error('فشل في إرسال الملف الطبي')
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'تم بدء محادثة جديدة. كيف يمكنني مساعدتك؟ 🩺'
    }])
  }

  const quickQuestions = [
    'عندي صداع شديد منذ يومين',
    'أشعر بألم في الصدر',
    'عندي حمى وسعال',
    'أريد معرفة أعراض السكري'
  ]

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" data-testid="loader-icon" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">د. سينا — المساعد الطبي</h1>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
              متاح الآن
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportMedicalFile} 
            className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-50 border border-primary-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> تصدير الملف الطبي
          </button>
          <button 
            onClick={clearChat} 
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className="w-3 h-3" /> محادثة جديدة
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl mb-4 text-xs text-yellow-700">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>هذا المساعد للمعلومات العامة فقط ولا يغني عن استشارة الطبيب المختص في الحالات الطبية.</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-2xl mb-4">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} onFollowUpClick={handleFollowUpClick} />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-600" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" data-testid="loader-icon" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {quickQuestions.map((q, i) => (
            <button key={i} onClick={() => { setInput(q); inputRef.current?.focus() }}
              className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors border border-primary-200">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-3">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="اكتب سؤالك الطبي هنا..."
          disabled={loading}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm disabled:opacity-60"
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
        />
        <button type="submit" disabled={loading || !input.trim()}
          className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}
