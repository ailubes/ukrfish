import { useState } from 'react'
import { Search, TrendingUp, Users, Fish, FileText, Target, MapPin, Calendar, ArrowUpRight, Activity, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  subtext: string
  highlighted?: boolean
  icon: LucideIcon
  trend?: string
}

function StatCard({ label, value, subtext, highlighted = false, icon: Icon, trend }: StatCardProps) {
  return (
    <div className={`stat-card ${highlighted ? 'bg-gradient-to-br from-[#0047AB] to-[#002d6e] text-white' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs uppercase tracking-wider ${highlighted ? 'text-[#facc15]' : 'text-[#0047AB]'}`}>
          {label}
        </span>
        {trend && (
          <span className={`text-xs flex items-center gap-1 ${highlighted ? 'text-white/70' : 'text-green-600'}`}>
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-sm flex items-center justify-center ${highlighted ? 'bg-white/10' : 'bg-[#0047AB]/10'}`}>
          <Icon className={`w-6 h-6 ${highlighted ? 'text-white' : 'text-[#0047AB]'}`} />
        </div>
        <span className={`font-mono text-4xl font-semibold ${highlighted ? 'text-white' : 'text-[#002d6e]'}`}>
          {value}
        </span>
      </div>
      <span className={`text-xs mt-4 block ${highlighted ? 'text-white/60' : 'text-gray-500'}`}>
        {subtext}
      </span>
    </div>
  )
}

interface BarChartProps {
  data: { label: string; value: number; max: number; yellow?: boolean }[]
  title: string
  unit?: string
}

function BarChart({ data, title, unit = '' }: BarChartProps) {
  return (
    <div className="blueprint-panel">
      <div className="panel-title">
        <span>{title}</span>
        {unit && <span className="text-xs opacity-60">UNIT: {unit}</span>}
      </div>
      <div className="flex flex-col gap-4">
        {data.map((item, index) => (
          <div key={index} className="grid grid-cols-[140px_1fr_50px] items-center gap-4">
            <span className="text-sm text-gray-700 font-medium">{item.label}</span>
            <div className="bar-track">
              <div className={`bar-fill ${item.yellow ? 'yellow' : ''}`} style={{ width: `${(item.value / item.max) * 100}%` }} />
            </div>
            <span className="text-sm text-gray-700 font-mono text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface PurchaseItemProps {
  title: string
  organization: string
  quantity: string
  price: string
  total: string
  date?: string
}

function PurchaseItem({ title, organization, quantity, price, total, date }: PurchaseItemProps) {
  return (
    <div className="purchase-item group cursor-pointer">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-medium text-[#002d6e] group-hover:text-[#0047AB] transition-colors">{title}</h4>
          {date && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {date}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">{organization} • {quantity}</p>
      </div>
      <div className="text-right">
        <span className="font-mono font-bold text-[#0047AB] block group-hover:text-[#002d6e] transition-colors">{price}</span>
        <span className="text-xs text-gray-400">{total}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fishData = [
    { label: 'Товстолоб', value: 58, max: 70 },
    { label: 'Короп', value: 49, max: 70 },
    { label: 'Карась', value: 41, max: 70 },
    { label: 'Сом', value: 30, max: 70 },
    { label: 'Форель', value: 24, max: 70, yellow: true },
    { label: 'Плітка', value: 18, max: 70 },
    { label: 'Лящ', value: 15, max: 70 },
    { label: 'Судак', value: 12, max: 70 },
  ]

  const regionData = [
    { label: 'Київська', value: 9, max: 10 },
    { label: 'Запорізька', value: 8, max: 10 },
    { label: 'Черкаська', value: 6, max: 10 },
    { label: 'Рівненська', value: 4, max: 10 },
    { label: 'Вінницька', value: 3, max: 10 },
    { label: 'Хмельницька', value: 3, max: 10 },
    { label: 'Волинська', value: 2, max: 10 },
    { label: 'Кіровоградська', value: 2, max: 10 },
  ]

  const categoryData = [
    { label: 'Заморожена', value: 85, max: 100 },
    { label: 'Консерви', value: 62, max: 100 },
    { label: 'Напівфабрикати', value: 48, max: 100 },
    { label: 'Копчена', value: 35, max: 100 },
    { label: 'Свіжа', value: 28, max: 100 },
  ]

  const purchases = [
    { title: 'Риба заморожена обезголовлена «Форель»', organization: 'Національна Гвардія України', quantity: '500 кг', price: '420 грн/кг', total: '210,000 грн', date: '2025-01-15' },
    { title: 'Короп філе заморожене', organization: 'Національна Гвардія України', quantity: '100,000 кг', price: '300.3 грн/кг', total: '30,030,000 грн', date: '2025-01-12' },
    { title: 'Риба заморожена «Форель»', organization: 'Національна Гвардія України', quantity: '20,000 кг', price: '344 грн/кг', total: '6,880,000 грн', date: '2025-01-10' },
    { title: 'Товстолоб свіжий охолоджений', organization: 'Держрезерв України', quantity: '50,000 кг', price: '185 грн/кг', total: '9,250,000 грн', date: '2025-01-08' },
    { title: 'Карась заморожений', organization: 'Міністерство Оборони', quantity: '15,000 кг', price: '220 грн/кг', total: '3,300,000 грн', date: '2025-01-05' },
  ]

  return (
    <div className="p-6 lg:p-8">
      <header className="section-header">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
          <div>
            <h2 className="font-light text-sm uppercase text-[#0047AB] mb-1 tracking-wider">
              Головна панель керування
            </h2>
            <h3 className="text-2xl lg:text-3xl font-semibold text-[#1a1a1a]">
              Аналітичний звіт сектору
            </h3>
          </div>
          <div className="relative w-full lg:w-[400px]">
            <div className={`relative border-2 transition-all duration-300 ${searchFocused ? 'border-[#facc15] shadow-lg' : 'border-[#0047AB]'}`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0047AB]" />
              <input
                type="text"
                placeholder="Пошук по всіх даних..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent py-3 pl-11 pr-4 font-mono text-sm text-[#0047AB] placeholder:text-[#0047AB]/50 focus:outline-none"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
            <span className="absolute -top-2 right-2 text-[10px] bg-[#fdfdfa] px-2 py-0.5 text-[#0047AB] font-mono border border-[#0047AB]/20">
              SEARCH_ID: 882-X
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard label="Виробники" value="14" subtext="зареєстровано в системі" icon={Users} trend="+12%" />
        <StatCard label="Продуктів" value="203" subtext="активних SKU" icon={Fish} trend="+8%" />
        <StatCard label="Активних закупівель" value="16" subtext="активних тендерів" icon={FileText} trend="+25%" />
        <StatCard label="Прогнозів 2026" value="67" subtext="прогнозованих закупівель" icon={Target} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="stat-card bg-gradient-to-br from-[#0047AB] to-[#002d6e] text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#facc15]">Загальна вартість закупівель</span>
            <Activity className="w-5 h-5 text-white/50" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-sm bg-white/10 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="font-mono text-5xl font-bold text-white">195.56</span>
              <span className="text-lg text-white/70 ml-2">млн грн</span>
            </div>
          </div>
          <span className="text-xs mt-4 block text-white/60">Сума очікуваних вартостей активних тендерів</span>
        </div>

        <div className="stat-card border-2 border-[#facc15]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#0047AB]">Прогнозована вартість 2026</span>
            <Calendar className="w-5 h-5 text-[#0047AB]/50" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-sm bg-[#facc15]/10 flex items-center justify-center">
              <Target className="w-7 h-7 text-[#facc15]" />
            </div>
            <div>
              <span className="font-mono text-5xl font-bold text-[#002d6e]">0.00</span>
              <span className="text-lg text-gray-500 ml-2">млн грн</span>
            </div>
          </div>
          <span className="text-xs mt-4 block text-gray-500">Сума прогнозованих закупівель на 2026 рік</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <BarChart data={categoryData} title="ПРОДУКТИ ЗА КАТЕГОРІЯМИ" unit="QUANTITY" />
          <BarChart data={fishData} title="ПРОДУКТИ ЗА ВИДАМИ РИБИ" unit="QUANTITY" />
          <div className="blueprint-panel">
            <div className="panel-title">
              <span>ОСТАННІ ЗАКУПІВЛІ</span>
              <button className="text-xs text-[#0047AB] hover:text-[#facc15] transition-colors flex items-center gap-1">
                Всі закупівлі
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {purchases.map((purchase, index) => (
                <PurchaseItem key={index} {...purchase} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="blueprint-panel border-2 border-[#facc15]">
            <div className="panel-title">
              <span>ПРОГНОЗ 2026</span>
            </div>
            <div className="text-center py-6">
              <div className="relative inline-block">
                <span className="font-mono text-7xl font-bold text-[#002d6e]">67</span>
                <div className="absolute -top-2 -right-4 w-4 h-4 bg-[#facc15] rounded-full animate-pulse" />
              </div>
              <p className="text-sm mt-3 text-gray-600">Прогнозованих закупівель</p>
              <div className="mt-8 space-y-5">
                <div>
                  <div className="flex justify-between text-xs mb-2 font-medium">
                    <span className="text-gray-600">DEFENSE</span>
                    <span className="font-mono">12</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: '25%', background: 'linear-gradient(90deg, #1a1a1a, #333)' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2 font-medium">
                    <span className="text-gray-600">HEALTH</span>
                    <span className="font-mono">55</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill yellow" style={{ width: '75%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <BarChart data={regionData} title="ГЕОГРАФІЯ ВИРОБНИКІВ" unit="REGIONS" />

          <div className="blueprint-panel bg-gradient-to-br from-[#002d6e] to-[#0047AB] text-white">
            <div className="panel-title text-white">
              <span>ШВИДКА СТАТИСТИКА</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-sm">
                <span className="text-sm text-white/80">Активні члени</span>
                <span className="font-mono text-xl font-bold text-[#facc15]">27</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-sm">
                <span className="text-sm text-white/80">Публікацій</span>
                <span className="font-mono text-xl font-bold text-[#facc15]">45+</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-sm">
                <span className="text-sm text-white/80">Регіонів</span>
                <span className="font-mono text-xl font-bold text-[#facc15]">8</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-12 pt-6 border-t-2 border-[#0047AB] flex flex-col lg:flex-row justify-between gap-4 text-xs font-mono text-[#0047AB]">
        <div>© 2025 Громадська спілка "Риба України" | Аналітичний портал</div>
        <div className="flex items-center gap-6 flex-wrap">
          <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-[#facc15]" />14 виробників</span>
          <span className="flex items-center gap-2"><Fish className="w-3 h-3 text-[#facc15]" />203 продукти</span>
          <span className="flex items-center gap-2"><Target className="w-3 h-3 text-[#facc15]" />67 прогнозів</span>
          <span className="flex items-center gap-2"><Users className="w-3 h-3 text-[#facc15]" />27 членів</span>
        </div>
      </footer>
    </div>
  )
}
