import { 
  Building2, Globe, Briefcase, ShieldCheck, Star, Receipt, 
  Stethoscope, Heart, Vote, Users, Baby, Home as HomeIcon, CreditCard, FileText
} from "lucide-react";

export const BASE_VALUE = 120;

export const SECTIONS = [
  {
    title: "Rendimentos Tributáveis",
    items: [
      { id: "01", label: "01 Rend. Trib. Receb. de Pessoa Jurídica", price: 20, info: "R$ 20,00 por processo", icon: Building2, color: "text-blue-500", bgColor: "bg-blue-50" },
      { id: "02", label: "02 Rend. Trib. Recebidos de PF/Exterior (Carnê-Leão)", price: 20, info: "R$ 20,00 por processo", icon: Globe, color: "text-green-500", bgColor: "bg-green-50" },
      { id: "03", label: "03 Rendimentos Tributáveis de PJ (Imposto com Exigibilidade Suspensa)", price: 20, info: "R$ 20,00 por processo", icon: ShieldCheck, color: "text-orange-500", bgColor: "bg-orange-50" },
      { id: "04", label: "04 Rendimentos Recebidos Acumuladamente (RRA)", price: 20, info: "R$ 20,00 por processo", icon: Briefcase, color: "text-purple-500", bgColor: "bg-purple-50" },
    ],
  },
  {
    title: "Rendimentos Isentos e Especiais",
    items: [
      { id: "05", label: "05 Rendimentos Isentos e Não Tributáveis", price: 10, info: "R$ 10,00 por informe", icon: Star, color: "text-cyan-500", bgColor: "bg-cyan-50" },
      { id: "06", label: "06 Rendimentos Sujeitos à Tributação Exclusiva/Definitiva", price: 10, info: "R$ 10,00 por informe", icon: Receipt, color: "text-rose-500", bgColor: "bg-rose-50" },
      { id: "07", label: "07 Imposto Pago/Retido", price: 10, info: "R$ 10,00 por fonte", icon: Receipt, color: "text-indigo-500", bgColor: "bg-indigo-50" },
      { id: "08", label: "08 Pagamentos Efetuados (médicos, educação, pensão, etc.)", price: 10, info: "R$ 10,00 por lançamento", icon: Stethoscope, color: "text-amber-500", bgColor: "bg-amber-50" },
      { id: "09", label: "09 Doações Efetuadas", price: 10, info: "R$ 10,00 por doação", icon: Heart, color: "text-emerald-500", bgColor: "bg-emerald-50" },
      { id: "10", label: "10 Doações à Partidos Políticos e Candidatos", price: 15, info: "R$ 15,00 por doação", icon: Vote, color: "text-slate-500", bgColor: "bg-slate-50" },
    ],
  },
  {
    title: "Dependentes e Alimentados",
    items: [
      { id: "11", label: "11 Dependentes", price: 15, info: "R$ 15,00 por dependente", icon: Users, color: "text-blue-600", bgColor: "bg-blue-50" },
      { id: "12", label: "12 Alimentados", price: 15, info: "R$ 15,00 por alimentado", icon: Baby, color: "text-pink-500", bgColor: "bg-pink-50" },
    ],
  },
  {
    title: "Bens, Dívidas e Situações Especiais",
    items: [
      { id: "13", label: "13 Bens e Direitos (imóveis, veículos, contas, aplicações, criptos, etc.)", price: 15, info: "R$ 15,00 por bem", icon: HomeIcon, color: "text-orange-600", bgColor: "bg-orange-50" },
      { id: "14", label: "14 Dívidas e Ônus Reais", price: 15, info: "R$ 15,00 por dívida", icon: CreditCard, color: "text-red-500", bgColor: "bg-red-50" },
      { id: "15", label: "15 Espólio", price: 100, info: "R$ 100,00 por espólio", icon: FileText, color: "text-gray-600", bgColor: "bg-gray-50" },
    ],
  },
];
