import { Mail, Phone, MapPin, Send, Clock, Facebook, Linkedin, CheckCircle, ExternalLink } from 'lucide-react'
import { useState } from 'react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({ name: '', email: '', subject: '', message: '' })
    }, 3000)
  }

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'ngoukrfish@gmail.com',
      href: 'mailto:ngoukrfish@gmail.com',
      description: 'Загальні питання, членство, заходи',
    },
    {
      icon: Phone,
      label: 'Приймальня',
      value: '+380 (67) 502-47-30',
      href: 'tel:+380675024730',
      description: 'Основний контактний телефон',
    },
    {
      icon: Phone,
      label: 'Виконавча дирекція',
      value: '+380 (50) 879-68-03',
      href: 'tel:+380508796803',
      description: 'Питання співпраці та проєктів',
    },
    {
      icon: MapPin,
      label: 'Адреса',
      value: 'вул. Відродження, 5',
      href: '#',
      description: 'с. Віта-Поштова, Київська обл., 08170 Україна',
    },
    {
      icon: Clock,
      label: 'Графік роботи',
      value: 'Пн-Пт: 9:00 - 18:00',
      href: '#',
      description: 'Вихідні: Сб, Нд',
    },
  ]

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', href: 'https://facebook.com', followers: '1.2K+' },
    { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com/company/ukrfish', followers: '500+' },
  ]

  const quickLinks = [
    { title: 'Членство', email: 'membership@ukrfish.org', description: 'Питання щодо членства та внесків' },
    { title: 'Прес-служба', email: 'press@ukrfish.org', description: 'Медіа-запити та інтерв\'ю' },
    { title: 'Партнерство', email: 'partners@ukrfish.org', description: 'Співпраця та партнерські програми' },
  ]

  return (
    <div className="p-6 lg:p-8">
      <header className="section-header">
        <h2 className="font-light text-sm uppercase text-[#0047AB] mb-1 tracking-wider">Зв'яжіться з нами</h2>
        <h3 className="text-2xl lg:text-3xl font-semibold text-[#1a1a1a]">Контактна інформація</h3>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {contactInfo.map((item, index) => {
          const Icon = item.icon
          return (
            <a
              key={index}
              href={item.href}
              className="blueprint-panel text-center group hover:-translate-y-2 transition-all duration-300"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-[#0047AB] to-[#002d6e] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</span>
              <p className="text-sm font-semibold text-[#002d6e] mt-1">{item.value}</p>
              <p className="text-xs text-gray-400 mt-2">{item.description}</p>
            </a>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <div className="blueprint-panel">
          <div className="panel-title mb-6">
            <span>НАДІСЛАТИ ПОВІДОМЛЕННЯ</span>
          </div>
          
          {isSubmitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-[#002d6e] mb-2">Дякуємо!</h4>
              <p className="text-gray-600">Ваше повідомлення надіслано. Ми зв'яжемося з вами найближчим часом.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Ім'я *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border-2 border-gray-200 px-4 py-3 text-sm focus:border-[#0047AB] focus:outline-none transition-colors"
                    placeholder="Ваше ім'я"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border-2 border-gray-200 px-4 py-3 text-sm focus:border-[#0047AB] focus:outline-none transition-colors"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Тема *</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full border-2 border-gray-200 px-4 py-3 text-sm focus:border-[#0047AB] focus:outline-none transition-colors bg-white"
                  required
                >
                  <option value="">Оберіть тему</option>
                  <option value="membership">Членство в асоціації</option>
                  <option value="partnership">Співпраця та партнерство</option>
                  <option value="media">Медіа-запити</option>
                  <option value="consultation">Консультація</option>
                  <option value="other">Інше</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Повідомлення *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full border-2 border-gray-200 px-4 py-3 text-sm focus:border-[#0047AB] focus:outline-none transition-colors resize-none"
                  rows={6}
                  placeholder="Ваше повідомлення..."
                  required
                />
              </div>
              <button type="submit" className="btn-primary">
                Надіслати повідомлення
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        <div className="space-y-6">
          <div className="blueprint-panel">
            <div className="panel-title">
              <span>ШВИДКІ КОНТАКТИ</span>
            </div>
            <div className="space-y-4">
              {quickLinks.map((link, index) => (
                <div key={index} className="p-4 bg-gray-50 border border-gray-200">
                  <h5 className="font-semibold text-[#002d6e] mb-1">{link.title}</h5>
                  <p className="text-sm text-gray-500 mb-2">{link.description}</p>
                  <a 
                    href={`mailto:${link.email}`}
                    className="text-sm text-[#0047AB] hover:text-[#facc15] transition-colors flex items-center gap-1"
                  >
                    {link.email}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="blueprint-panel">
            <div className="panel-title">
              <span>СОЦІАЛЬНІ МЕРЕЖІ</span>
            </div>
            <div className="space-y-3">
              {socialLinks.map((link, index) => {
                const Icon = link.icon
                return (
                  <a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 hover:border-[#0047AB] hover:bg-white transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#0047AB] to-[#002d6e] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{link.label}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">{link.followers}</span>
                  </a>
                )
              })}
            </div>
          </div>

          <a 
            href="https://t.me/ukrfish2050"
            target="_blank"
            rel="noopener noreferrer"
            className="blueprint-panel bg-gradient-to-br from-[#0047AB] to-[#002d6e] text-white block hover:-translate-y-1 transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <div>
                <h5 className="font-semibold text-white mb-1">Telegram канал</h5>
                <p className="text-sm text-white/70">@ukrfish2050</p>
              </div>
            </div>
          </a>
        </div>
      </div>

      <div className="mt-8">
        <div className="blueprint-panel p-0 overflow-hidden">
          <div className="panel-title p-6 pb-0">
            <span>НАША ЛОКАЦІЯ</span>
          </div>
          <div className="h-[350px] bg-gradient-to-br from-[#002d6e] to-[#0047AB] flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
            
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-[#facc15] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <MapPin className="w-10 h-10 text-[#002d6e]" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Громадська спілка "Риба України"</h4>
              <p className="text-white/80 mb-1">вул. Відродження, 5, с. Віта-Поштова</p>
              <p className="text-white/80 mb-4">Київська обл., 08170 Україна</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-sm">
                <span className="font-mono">50.45° N, 30.52° E</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-12 pt-6 border-t-2 border-[#0047AB] flex flex-col lg:flex-row justify-between gap-4 text-xs font-mono text-[#0047AB]">
        <div>© 2025 Громадська спілка "Риба України"</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-[#facc15]" />Київ, Україна</span>
        </div>
      </footer>
    </div>
  )
}
