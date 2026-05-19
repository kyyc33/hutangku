import { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

// ── Icons (lucide-react) ──────────────────────────────────────────────────────
import {
  LayoutDashboard, TrendingUp, TrendingDown, CreditCard, Target,
  Plus, Search, Filter, Download, Trash2, CheckCircle2, AlertCircle,
  ChevronRight, Moon, Sun, Bell, BarChart2, RefreshCw, X,
  Briefcase, ShoppingBag, Utensils, Wifi, GraduationCap, Car,
  DollarSign, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight,
  Calendar, Tag, FileText, User, BookOpen, Zap, Award
} from "lucide-react";

// ── MOTIVATIONAL QUOTES ───────────────────────────────────────────────────────
const QUOTES = [
  "Keuangan yang sehat dimulai dari pencatatan yang konsisten. 💪",
  "Setiap rupiah yang dicatat adalah langkah menuju kebebasan finansial. 🚀",
  "Freelancer sukses bukan yang paling sibuk, tapi yang paling teratur. ✨",
  "Utang adalah musuh, tapi bisa ditaklukkan dengan strategi. 🎯",
  "Catat hari ini, bebas finansial esok hari. 🌟",
  "Disiplin keuangan = investasi untuk masa depan kamu. 💎",
];

// ── INITIAL DEBT DATA ─────────────────────────────────────────────────────────
const INITIAL_DEBTS = [
  { id: "d1", name: "Kredivo", total: 3000000, paid: 0, color: "#6366f1" },
  { id: "d2", name: "BNI", total: 5000000, paid: 0, color: "#8b5cf6" },
  { id: "d3", name: "Kredit Pintar", total: 8000000, paid: 0, color: "#ec4899" },
  { id: "d4", name: "Akulaku", total: 10000000, paid: 0, color: "#f59e0b" },
  { id: "d5", name: "Indodana", total: 20000000, paid: 0, color: "#10b981" },
  { id: "d6", name: "Bank Saqu", total: 20000000, paid: 0, color: "#3b82f6" },
];

const EXPENSE_CATEGORIES = [
  { value: "makan", label: "Makan & Minum", icon: Utensils },
  { value: "transport", label: "Transport", icon: Car },
  { value: "kuliah", label: "Kuliah", icon: GraduationCap },
  { value: "internet", label: "Internet", icon: Wifi },
  { value: "pribadi", label: "Kebutuhan Pribadi", icon: ShoppingBag },
  { value: "lainnya", label: "Lainnya", icon: Tag },
];

const INCOME_CATEGORIES = [
  "Web/App Development", "Design Grafis", "Content Writing",
  "Video Editing", "Data Entry", "Social Media", "Translasi", "Lainnya"
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}M`;
  if (n >= 1e6) return `Rp${(n / 1e6).toFixed(1)}jt`;
  if (n >= 1e3) return `Rp${(n / 1e3).toFixed(0)}rb`;
  return `Rp${n}`;
};
const today = () => new Date().toISOString().split("T")[0];
const monthKey = (d) => d.slice(0, 7);
const currentMonth = today().slice(0, 7);

function useLS(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useLS("ff_dark", true);
  const [tab, setTab] = useState("dashboard");
  const [incomes, setIncomes] = useLS("ff_incomes", []);
  const [expenses, setExpenses] = useLS("ff_expenses", []);
  const [debts, setDebts] = useLS("ff_debts", INITIAL_DEBTS);
  const [dailyTarget, setDailyTarget] = useLS("ff_target", 200000);
  const [notification, setNotification] = useState(null);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const notify = useCallback((msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // ── Month Stats ──────────────────────────────────────────────────────────
  const monthIncomes = useMemo(() => incomes.filter(i => monthKey(i.date) === currentMonth), [incomes]);
  const monthExpenses = useMemo(() => expenses.filter(e => monthKey(e.date) === currentMonth), [expenses]);
  const totalIncome = useMemo(() => monthIncomes.reduce((s, i) => s + i.amount, 0), [monthIncomes]);
  const totalExpense = useMemo(() => monthExpenses.reduce((s, e) => s + e.amount, 0), [monthExpenses]);
  const netProfit = totalIncome - totalExpense;
  const totalDebt = useMemo(() => debts.reduce((s, d) => s + d.total, 0), [debts]);
  const totalPaid = useMemo(() => debts.reduce((s, d) => s + d.paid, 0), [debts]);
  const remainDebt = totalDebt - totalPaid;

  // Today income
  const todayIncome = useMemo(() => incomes.filter(i => i.date === today()).reduce((s, i) => s + i.amount, 0), [incomes]);
  const targetReached = todayIncome >= dailyTarget;

  // Chart data
  const chartData = useMemo(() => {
    const days = {};
    [...incomes, ...expenses].forEach(item => {
      if (monthKey(item.date) !== currentMonth) return;
      if (!days[item.date]) days[item.date] = { date: item.date, income: 0, expense: 0 };
      if (item.amount && item.category !== undefined && EXPENSE_CATEGORIES.find(c => c.value === item.category))
        days[item.date].expense += item.amount;
      else if (item.amount)
        days[item.date].income += item.amount;
    });
    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d, date: d.date.slice(5), profit: d.income - d.expense
    }));
  }, [incomes, expenses]);

  // Expense by category
  const expByCat = useMemo(() => {
    const map = {};
    monthExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(([k, v]) => ({
      name: EXPENSE_CATEGORIES.find(c => c.value === k)?.label || k, value: v
    }));
  }, [monthExpenses]);

  const PIE_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

  // ── Export ───────────────────────────────────────────────────────────────
  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();
    const incSheet = XLSX.utils.json_to_sheet(incomes.map(i => ({ Tanggal: i.date, Job: i.jobName, Client: i.client, Kategori: i.category, Nominal: i.amount, Status: i.status, Catatan: i.note })));
    const expSheet = XLSX.utils.json_to_sheet(expenses.map(e => ({ Tanggal: e.date, Kategori: e.category, Nominal: e.amount, Catatan: e.note })));
    const debtSheet = XLSX.utils.json_to_sheet(debts.map(d => ({ Nama: d.name, Total: d.total, Dibayar: d.paid, Sisa: d.total - d.paid, Status: d.paid >= d.total ? "LUNAS" : "BELUM LUNAS" })));
    XLSX.utils.book_append_sheet(wb, incSheet, "Pemasukan");
    XLSX.utils.book_append_sheet(wb, expSheet, "Pengeluaran");
    XLSX.utils.book_append_sheet(wb, debtSheet, "Utang");
    XLSX.writeFile(wb, `FreelancerFinance_${today()}.xlsx`);
    notify("Data berhasil diexport ke Excel! 📊");
  };

  const exportCSV = () => {
    const rows = [["Tanggal", "Jenis", "Nominal", "Keterangan"],
      ...incomes.map(i => [i.date, "Pemasukan", i.amount, i.jobName]),
      ...expenses.map(e => [e.date, "Pengeluaran", e.amount, e.category])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `FreelancerFinance_${today()}.csv`; a.click();
    notify("Data berhasil diexport ke CSV! 📄");
  };

  const resetAll = () => {
    if (!confirm("Reset SEMUA data? Tindakan ini tidak bisa dibatalkan.")) return;
    setIncomes([]); setExpenses([]); setDebts(INITIAL_DEBTS);
    notify("Semua data telah direset.", "info");
  };

  // ── THEME CLASSES ────────────────────────────────────────────────────────
  const bg = dark ? "bg-gray-950" : "bg-slate-50";
  const card = dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const text = dark ? "text-gray-100" : "text-gray-900";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const inputCls = dark
    ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-violet-500"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-violet-500";
  const btnPrimary = "bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 text-sm shadow-lg shadow-violet-900/30";
  const navItem = (t) => `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 text-xs font-medium cursor-pointer ${tab === t ? (dark ? "bg-violet-600 text-white" : "bg-violet-600 text-white") : (dark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800")}`;

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "income", label: "Pemasukan", icon: TrendingUp },
    { id: "expense", label: "Pengeluaran", icon: TrendingDown },
    { id: "debt", label: "Utang", icon: CreditCard },
    { id: "stats", label: "Statistik", icon: BarChart2 },
  ];

  return (
    <div className={`min-h-screen ${bg} ${text} font-sans transition-colors duration-300`}>
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-medium animate-slide-in
          ${notification.type === "success" ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"}`}>
          {notification.type === "success" ? <CheckCircle2 size={18} /> : <Bell size={18} />}
          {notification.msg}
          <button onClick={() => setNotification(null)}><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-40 ${dark ? "bg-gray-950/90" : "bg-white/90"} backdrop-blur-xl border-b ${dark ? "border-gray-800" : "border-gray-200"}`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <Wallet size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">FreelancerFinance</h1>
              <p className={`text-xs ${muted}`}>Kelola keuangan freelance kamu</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {targetReached && (
              <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full animate-pulse">
                <Award size={12} /> Target tercapai!
              </div>
            )}
            <button onClick={() => setDark(!dark)} className={`p-2 rounded-xl transition-colors ${dark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={exportXLSX} className={`p-2 rounded-xl transition-colors ${dark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`} title="Export Excel">
              <Download size={18} />
            </button>
          </div>
        </div>
        {/* Nav */}
        <div className="max-w-5xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={navItem(t.id)}>
              <t.icon size={18} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Quote Bar */}
      <div className={`${dark ? "bg-violet-900/20 border-violet-800/30" : "bg-violet-50 border-violet-100"} border-b px-4 py-2`}>
        <p className={`text-xs text-center ${dark ? "text-violet-300" : "text-violet-700"}`}><Zap size={12} className="inline mr-1" />{quote}</p>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-20">
        {tab === "dashboard" && <Dashboard {...{ dark, card, text, muted, inputCls, btnPrimary, totalIncome, totalExpense, netProfit, totalDebt, totalPaid, remainDebt, debts, dailyTarget, setDailyTarget, todayIncome, targetReached, notify, fmt, fmtShort, chartData, expByCat, PIE_COLORS, exportXLSX, exportCSV, resetAll }} />}
        {tab === "income" && <IncomeSection {...{ dark, card, text, muted, inputCls, btnPrimary, incomes, setIncomes, notify, fmt }} />}
        {tab === "expense" && <ExpenseSection {...{ dark, card, text, muted, inputCls, btnPrimary, expenses, setExpenses, notify, fmt }} />}
        {tab === "debt" && <DebtSection {...{ dark, card, text, muted, inputCls, btnPrimary, debts, setDebts, notify, fmt }} />}
        {tab === "stats" && <StatsSection {...{ dark, card, text, muted, chartData, expByCat, PIE_COLORS, incomes, expenses, fmt, fmtShort }} />}
      </main>

      <style>{`
        @keyframes slide-in { from { opacity:0; transform:translateX(2rem); } to { opacity:1; transform:translateX(0); } }
        .animate-slide-in { animation: slide-in 0.3s ease; }
        .scrollbar-none::-webkit-scrollbar { display:none; }
        .scrollbar-none { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ dark, card, text, muted, inputCls, btnPrimary, totalIncome, totalExpense, netProfit, totalDebt, totalPaid, remainDebt, debts, dailyTarget, setDailyTarget, todayIncome, targetReached, notify, fmt, fmtShort, chartData, expByCat, PIE_COLORS, exportXLSX, exportCSV, resetAll }) {
  const debtProgress = totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : 0;
  const todayProgress = dailyTarget > 0 ? Math.min(100, Math.round((todayIncome / dailyTarget) * 100)) : 0;

  const stats = [
    { label: "Pemasukan Bulan Ini", value: fmtShort(totalIncome), icon: ArrowUpRight, color: "text-emerald-400", bg: dark ? "bg-emerald-900/20" : "bg-emerald-50" },
    { label: "Pengeluaran Bulan Ini", value: fmtShort(totalExpense), icon: ArrowDownRight, color: "text-red-400", bg: dark ? "bg-red-900/20" : "bg-red-50" },
    { label: "Keuntungan Bersih", value: fmtShort(netProfit), icon: TrendingUp, color: netProfit >= 0 ? "text-violet-400" : "text-red-400", bg: dark ? "bg-violet-900/20" : "bg-violet-50" },
    { label: "Sisa Utang", value: fmtShort(remainDebt), icon: CreditCard, color: "text-amber-400", bg: dark ? "bg-amber-900/20" : "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`${card} border rounded-2xl p-4 flex flex-col gap-2`}>
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon size={18} className={s.color} />
            </div>
            <p className={`text-xs ${muted}`}>{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Target Harian & Utang Progress */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Target */}
        <div className={`${card} border rounded-2xl p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Target size={16} className="text-violet-400" />Target Harian</h3>
            {targetReached && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">🎉 Tercapai!</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${muted}`}>Target:</span>
            <input type="number" value={dailyTarget}
              onChange={e => setDailyTarget(+e.target.value)}
              className={`${inputCls} border rounded-xl px-3 py-1.5 text-sm w-36 outline-none`} />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className={muted}>Hari ini: <span className="text-emerald-400 font-semibold">{fmt(todayIncome)}</span></span>
              <span className={muted}>Target: <span className="font-semibold">{fmt(dailyTarget)}</span></span>
            </div>
            <div className={`h-3 rounded-full ${dark ? "bg-gray-800" : "bg-gray-100"} overflow-hidden`}>
              <div className={`h-full rounded-full transition-all duration-700 ${targetReached ? "bg-emerald-500" : "bg-violet-500"}`} style={{ width: `${todayProgress}%` }} />
            </div>
            <p className={`text-xs ${muted} mt-1 text-right`}>{todayProgress}%</p>
          </div>
        </div>

        {/* Utang Overview */}
        <div className={`${card} border rounded-2xl p-5 space-y-3`}>
          <h3 className="font-semibold flex items-center gap-2"><PiggyBank size={16} className="text-amber-400" />Progress Pelunasan Utang</h3>
          <div className="flex justify-between text-sm">
            <span className={muted}>Total: <span className={`font-bold ${dark ? "text-gray-200" : "text-gray-800"}`}>{fmt(totalDebt)}</span></span>
            <span className={muted}>Lunas: <span className="font-bold text-emerald-400">{fmt(totalPaid)}</span></span>
          </div>
          <div className={`h-3 rounded-full ${dark ? "bg-gray-800" : "bg-gray-100"} overflow-hidden`}>
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-700" style={{ width: `${debtProgress}%` }} />
          </div>
          <p className={`text-xs ${muted}`}>{debtProgress}% terlunasi · Sisa <span className="text-amber-400 font-semibold">{fmt(remainDebt)}</span></p>
          {debts.slice(0, 3).map(d => (
            <div key={d.id} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
              <span className={`text-xs flex-1 ${muted}`}>{d.name}</span>
              <span className="text-xs font-medium">{Math.round((d.paid / d.total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Chart */}
      {chartData.length > 0 && (
        <div className={`${card} border rounded-2xl p-5`}>
          <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-violet-400" />Pemasukan vs Pengeluaran Bulan Ini</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1f2937" : "#f1f5f9"} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: dark ? "#6b7280" : "#9ca3af" }} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: dark ? "#6b7280" : "#9ca3af" }} />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: dark ? "#111827" : "#fff", border: "1px solid #374151", borderRadius: 12 }} />
              <Area type="monotone" dataKey="income" stroke="#6366f1" fill="url(#gi)" strokeWidth={2} name="Pemasukan" />
              <Area type="monotone" dataKey="expense" stroke="#f43f5e" fill="url(#ge)" strokeWidth={2} name="Pengeluaran" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Export & Reset */}
      <div className="flex flex-wrap gap-3">
        <button onClick={exportXLSX} className={btnPrimary}><Download size={16} />Export Excel</button>
        <button onClick={exportCSV} className={`${btnPrimary} bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30`}><FileText size={16} />Export CSV</button>
        <button onClick={resetAll} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-900/20 text-sm font-semibold transition-all"><RefreshCw size={16} />Reset Data</button>
      </div>
    </div>
  );
}

// ── INCOME SECTION ────────────────────────────────────────────────────────────
function IncomeSection({ dark, card, text, muted, inputCls, btnPrimary, incomes, setIncomes, notify, fmt }) {
  const [form, setForm] = useState({ date: today(), jobName: "", client: "", category: INCOME_CATEGORIES[0], amount: "", status: "Belum Dibayar", note: "" });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const handleAdd = () => {
    if (!form.jobName || !form.amount) { notify("Nama job dan nominal wajib diisi!", "info"); return; }
    const entry = { ...form, amount: +form.amount, id: Date.now().toString() };
    setIncomes(p => [entry, ...p]);
    setForm(f => ({ ...f, jobName: "", client: "", amount: "", note: "" }));
    notify("Pemasukan berhasil ditambahkan! 💰");
  };

  const filtered = useMemo(() => incomes.filter(i => {
    const matchSearch = i.jobName.toLowerCase().includes(search.toLowerCase()) || i.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    const matchDate = !filterDate || i.date === filterDate;
    return matchSearch && matchStatus && matchDate;
  }), [incomes, search, filterStatus, filterDate]);

  const inputField = (label, key, type = "text", opts = null) => (
    <div className="flex flex-col gap-1">
      <label className={`text-xs font-medium ${muted}`}>{label}</label>
      {opts ? (
        <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className={`${inputCls} border rounded-xl px-3 py-2 text-sm outline-none`}>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className={`${inputCls} border rounded-xl px-3 py-2 text-sm outline-none`} />
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Form */}
      <div className={`${card} border rounded-2xl p-5`}>
        <h2 className="font-bold mb-4 flex items-center gap-2"><Plus size={18} className="text-violet-400" />Tambah Pemasukan</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {inputField("Tanggal", "date", "date")}
          {inputField("Nama Job/Jokian", "jobName")}
          {inputField("Client", "client")}
          {inputField("Kategori", "category", "text", INCOME_CATEGORIES)}
          {inputField("Nominal (Rp)", "amount", "number")}
          {inputField("Status", "status", "text", ["Belum Dibayar", "DP", "Lunas"])}
          <div className="col-span-2 md:col-span-3 flex flex-col gap-1">
            <label className={`text-xs font-medium ${muted}`}>Catatan</label>
            <textarea rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className={`${inputCls} border rounded-xl px-3 py-2 text-sm outline-none resize-none`} />
          </div>
        </div>
        <button onClick={handleAdd} className={`${btnPrimary} mt-4`}><Plus size={16} />Tambah Pemasukan</button>
      </div>

      {/* Filter */}
      <div className={`${card} border rounded-2xl p-4 flex flex-wrap gap-3 items-center`}>
        <div className="flex items-center gap-2 flex-1 min-w-40">
          <Search size={16} className={muted} />
          <input placeholder="Cari job atau client..." value={search} onChange={e => setSearch(e.target.value)}
            className={`${inputCls} border rounded-xl px-3 py-2 text-sm outline-none flex-1`} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className={`${inputCls} border rounded-xl px-3 py-2 text-sm outline-none`}>
          <option value="all">Semua Status</option>
          <option value="Belum Dibayar">Belum Dibayar</option>
          <option value="DP">DP</option>
          <option value="Lunas">Lunas</option>
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className={`${inputCls} border rounded-xl px-3 py-2 text-sm outline-none`} />
      </div>

      {/* Table */}
      <div className={`${card} border rounded-2xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`${dark ? "bg-gray-800/50" : "bg-gray-50"} border-b ${dark ? "border-gray-800" : "border-gray-200"}`}>
              <tr>
                {["Tanggal", "Job", "Client", "Kategori", "Nominal", "Status", ""].map(h => (
                  <th key={h} className={`px-4 py-3 text-left text-xs font-semibold ${muted}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className={`px-4 py-8 text-center ${muted} text-sm`}>Belum ada data pemasukan</td></tr>
              ) : filtered.map(i => (
                <tr key={i.id} className={`${dark ? "hover:bg-gray-800/30" : "hover:bg-gray-50"} transition-colors`}>
                  <td className={`px-4 py-3 text-xs ${muted}`}>{i.date}</td>
                  <td className="px-4 py-3 font-medium">{i.jobName}</td>
                  <td className={`px-4 py-3 text-xs ${muted}`}>{i.client}</td>
                  <td className={`px-4 py-3 text-xs ${muted}`}>{i.category}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-400">{fmt(i.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${i.status === "Lunas" ? "bg-emerald-500/20 text-emerald-400" : i.status === "DP" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>{i.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setIncomes(p => p.filter(x => x.id !== i.id))} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── EXPENSE SECTION ───────────────────────────────────────────────────────────
function ExpenseSection({ dark, card, text, muted, inputCls, btnPrimary, expenses, setExpenses, notify, fmt }) {
  const [form, setForm] = useState({ date: today(), category: "makan", amount: "", note: "" });
  const [filterCat, setFilterCat] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const handleAdd = () => {
    if (!form.amount) { notify("Nominal wajib diisi!", "info"); return; }
    setExpenses(p => [{ ...form, amount: +form.amount, id: Date.now().toString() }, ...p]);
    setForm(f => ({ ...f, amount: "", note: "" }));
    notify("Pengeluaran dicatat! 📝");
  };

  const filtered = useMemo(() => expenses.filter(e => {
    const matchCat = filterCat === "all" || e.category === filterCat;
    const matchDate = !filterDate || e.date === filterDate;
    return matchCat && matchDate;
  }), [expenses, filterCat, filterDate]);

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5">
      {/* Form */}
      <div className={`${card} border rounded-2xl p-5`}>
        <h2 className="font-bold mb-4 flex items-center gap-2"><TrendingDown size={18} className="text-red-400" />Tambah Pengeluaran</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${muted}`}>Tanggal</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className={`${inputCls} border rounded-xl px-3 py-2 text-sm outline-none`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${muted}`}>Kategori</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className={`${inputCls} border rounded-xl px-3 py-2 text-sm outline-none`}>
              {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${muted}`}>Nominal (Rp)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className={`${inputCls} border rounded-xl px-3 py-2 text-sm outline-none`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${muted}`}>Catatan</label>
            <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className={`${inputCls} border rounded-xl px-3 py-2 text-sm outline-none`} />
          </div>
        </div>
        <button onClick={handleAdd} className={`${btnPrimary} mt-4 bg-rose-600 hover:bg-rose-700 shadow-rose-900/30`}><Plus size={16} />Catat Pengeluaran</button>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {EXPENSE_CATEGORIES.map(c => {
          const total = expenses.filter(e => e.category === c.value).reduce((s, e) => s + e.amount, 0);
          return (
            <div key={c.value} className={`${card} border rounded-xl p-3 text-center cursor-pointer transition-all hover:border-violet-500 ${filterCat === c.value ? "border-violet-500 ring-1 ring-violet-500" : ""}`}
              onClick={() => setFilterCat(p => p === c.value ? "all" : c.value)}>
              <c.icon size={20} className={`mx-auto mb-1 ${dark ? "text-gray-400" : "text-gray-500"}`} />
              <p className={`text-xs ${muted} truncate`}>{c.label}</p>
              {total > 0 && <p className="text-xs font-bold text-red-400 mt-0.5">{fmt(total)}</p>}
            </div>
          );
        })}
      </div>

      {/* Filter & Total */}
      <div className={`${card} border rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between`}>
        <div className="flex items-center gap-3">
          <Filter size={16} className={muted} />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className={`${inputCls} border rounded-xl px-3 py-2 text-sm outline-none`}>
            <option value="all">Semua Kategori</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className={`${inputCls} border rounded-xl px-3 py-2 text-sm outline-none`} />
        </div>
        <p className={`text-sm ${muted}`}>Total: <span className="font-bold text-red-400">{fmt(totalFiltered)}</span></p>
      </div>

      {/* Table */}
      <div className={`${card} border rounded-2xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`${dark ? "bg-gray-800/50" : "bg-gray-50"} border-b ${dark ? "border-gray-800" : "border-gray-200"}`}>
              <tr>
                {["Tanggal", "Kategori", "Nominal", "Catatan", ""].map(h => (
                  <th key={h} className={`px-4 py-3 text-left text-xs font-semibold ${muted}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className={`px-4 py-8 text-center ${muted} text-sm`}>Belum ada data pengeluaran</td></tr>
              ) : filtered.map(e => {
                const cat = EXPENSE_CATEGORIES.find(c => c.value === e.category);
                return (
                  <tr key={e.id} className={`${dark ? "hover:bg-gray-800/30" : "hover:bg-gray-50"} transition-colors`}>
                    <td className={`px-4 py-3 text-xs ${muted}`}>{e.date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
                        {cat?.label || e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-red-400">{fmt(e.amount)}</td>
                    <td className={`px-4 py-3 text-xs ${muted}`}>{e.note}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setExpenses(p => p.filter(x => x.id !== e.id))} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── DEBT SECTION ──────────────────────────────────────────────────────────────
function DebtSection({ dark, card, text, muted, inputCls, btnPrimary, debts, setDebts, notify, fmt }) {
  const [payments, setPayments] = useState({});
  const totalDebt = debts.reduce((s, d) => s + d.total, 0);
  const totalPaid = debts.reduce((s, d) => s + d.paid, 0);

  const handlePay = (id) => {
    const amount = +payments[id];
    if (!amount || amount <= 0) { notify("Masukkan jumlah pembayaran yang valid!", "info"); return; }
    setDebts(p => p.map(d => {
      if (d.id !== id) return d;
      const newPaid = Math.min(d.paid + amount, d.total);
      return { ...d, paid: newPaid };
    }));
    setPayments(p => ({ ...p, [id]: "" }));
    notify("Pembayaran berhasil dicatat! 🎉");
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Utang", value: fmt(totalDebt), color: "text-red-400" },
          { label: "Sudah Dibayar", value: fmt(totalPaid), color: "text-emerald-400" },
          { label: "Sisa Utang", value: fmt(totalDebt - totalPaid), color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className={`${card} border rounded-2xl p-4 text-center`}>
            <p className={`text-xs ${muted} mb-1`}>{s.label}</p>
            <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      <div className={`${card} border rounded-2xl p-5`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold flex items-center gap-2"><PiggyBank size={16} className="text-amber-400" />Progress Total Pelunasan</h3>
          <span className="font-bold text-amber-400">{Math.round((totalPaid / totalDebt) * 100)}%</span>
        </div>
        <div className={`h-4 rounded-full ${dark ? "bg-gray-800" : "bg-gray-100"} overflow-hidden`}>
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-emerald-500 transition-all duration-700"
            style={{ width: `${(totalPaid / totalDebt) * 100}%` }} />
        </div>
      </div>

      {/* Debt Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {debts.map(d => {
          const pct = Math.round((d.paid / d.total) * 100);
          const done = d.paid >= d.total;
          return (
            <div key={d.id} className={`${card} border rounded-2xl p-5 space-y-3 ${done ? "opacity-70" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <h4 className="font-bold">{d.name}</h4>
                </div>
                {done ? (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={12} /> LUNAS</span>
                ) : (
                  <span className={`text-xs ${muted}`}>Sisa <span className="font-bold" style={{ color: d.color }}>{fmt(d.total - d.paid)}</span></span>
                )}
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={muted}>Total: {fmt(d.total)}</span>
                  <span style={{ color: d.color }}>{pct}%</span>
                </div>
                <div className={`h-2.5 rounded-full ${dark ? "bg-gray-800" : "bg-gray-100"} overflow-hidden`}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: d.color }} />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-emerald-400">Dibayar: {fmt(d.paid)}</span>
                </div>
              </div>

              {!done && (
                <div className="flex gap-2">
                  <input type="number" placeholder="Jumlah bayar..." value={payments[d.id] || ""}
                    onChange={e => setPayments(p => ({ ...p, [d.id]: e.target.value }))}
                    className={`${inputCls} border rounded-xl px-3 py-2 text-sm outline-none flex-1`} />
                  <button onClick={() => handlePay(d.id)}
                    className="px-4 py-2 rounded-xl font-semibold text-sm text-white transition-all"
                    style={{ background: d.color }}>
                    Bayar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── STATS SECTION ─────────────────────────────────────────────────────────────
function StatsSection({ dark, card, text, muted, chartData, expByCat, PIE_COLORS, incomes, expenses, fmt, fmtShort }) {
  const gridColor = dark ? "#1f2937" : "#f1f5f9";
  const tickColor = dark ? "#6b7280" : "#9ca3af";
  const tooltipStyle = { background: dark ? "#111827" : "#fff", border: "1px solid #374151", borderRadius: 12 };

  return (
    <div className="space-y-6">
      {/* Income vs Expense Chart */}
      <div className={`${card} border rounded-2xl p-5`}>
        <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart2 size={18} className="text-violet-400" />Pemasukan & Pengeluaran Harian</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor }} />
            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: tickColor }} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="income" fill="#6366f1" name="Pemasukan" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#f43f5e" name="Pengeluaran" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Profit Line Chart */}
      <div className={`${card} border rounded-2xl p-5`}>
        <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-400" />Grafik Profit Harian</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor }} />
            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: tickColor }} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4 }} name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Pie */}
      {expByCat.length > 0 && (
        <div className={`${card} border rounded-2xl p-5`}>
          <h3 className="font-bold mb-4 flex items-center gap-2"><PieChart size={18} className="text-amber-400" />Komposisi Pengeluaran</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={expByCat} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                labelLine={false}>
                {expByCat.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Total Transaksi Pemasukan", value: incomes.length, icon: TrendingUp, color: "text-violet-400" },
          { label: "Total Transaksi Pengeluaran", value: expenses.length, icon: TrendingDown, color: "text-red-400" },
          { label: "Rata-rata Pemasukan/Job", value: incomes.length ? fmt(Math.round(incomes.reduce((s, i) => s + i.amount, 0) / incomes.length)) : "Rp0", icon: DollarSign, color: "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className={`${card} border rounded-2xl p-4 flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl ${dark ? "bg-gray-800" : "bg-gray-100"} flex items-center justify-center`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <p className={`text-xs ${muted}`}>{s.label}</p>
              <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
