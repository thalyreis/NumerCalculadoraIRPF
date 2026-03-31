import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { 
  Plus, Minus, Save, FileText, CheckCircle2, AlertCircle, Calculator, X, 
  Building2, User, Globe, Briefcase, ShieldCheck, Star, Receipt, 
  Stethoscope, Heart, Vote, Users, Baby, Home as HomeIcon, CreditCard, FileUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { SECTIONS, BASE_VALUE } from "../constants";
import { generatePDF } from "../lib/pdf-utils";

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [client, setClient] = useState({ clientName: "", cpf: "", phone: "", cnpj: "" });
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [discountType, setDiscountType] = useState<"none" | "NUMER" | "SINDSEP">("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (location.state?.budget) {
      const b = location.state.budget;
      setClient({
        clientName: b.clientName,
        cpf: b.cpf,
        phone: b.phone,
        cnpj: b.cnpj || "",
      });
      setSelections(b.selections || {});
      setDiscountType(b.discountType || "none");
      setEditingId(b.id);
      
      // Clear state so it doesn't re-populate on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const updateQuantity = (id: string, delta: number) => {
    setSelections((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const totals = useMemo(() => {
    let subtotal = BASE_VALUE;
    let itemsCount = 0;

    SECTIONS.forEach((section) => {
      section.items.forEach((item) => {
        const qty = selections[item.id] || 0;
        if (qty > 0) {
          subtotal += qty * item.price;
          itemsCount += qty;
        }
      });
    });

    const discount = discountType !== "none" ? subtotal * 0.1 : 0;
    const total = subtotal - discount;

    return { subtotal, discount, total, itemsCount };
  }, [selections, discountType]);

  const handleSave = async () => {
    if (!client.clientName || !client.cpf || !client.phone) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      let proofUrl = null;
      let status = "pending";

      if (proofFile) {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(proofFile);
        });
        proofUrl = await base64Promise;
        status = "approved";
      }

      const budgetData: any = {
        ...client,
        selections,
        discountType,
        totalValue: totals.total,
        status,
        createdBy: auth.currentUser?.uid,
        updatedAt: serverTimestamp(),
      };

      if (proofUrl) {
        budgetData.proofUrl = proofUrl;
      }

      if (editingId) {
        // Update existing
        // If it's an edit, we reset to pending unless a new proof is uploaded
        // This aligns with "if I edit, I need to send proof again"
        if (!proofFile) {
          budgetData.status = "pending";
        }
        await updateDoc(doc(db, "budgets", editingId), budgetData);
      } else {
        // Create new
        await addDoc(collection(db, "budgets"), {
          ...budgetData,
          createdAt: serverTimestamp(),
        });
      }

      // 2. Generate PDF
      await generatePDF(client, selections, discountType);

      setSuccess(true);
      
      // 3. Clear form after success
      setClient({ clientName: "", cpf: "", phone: "", cnpj: "" });
      setSelections({});
      setDiscountType("none");
      setEditingId(null);
      setProofFile(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar o orçamento. Verifique as permissões.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="text-orange-500 w-5 h-5" />
            Dados do Cliente
          </h2>
          <span className="text-xs text-red-600 font-medium italic">
            * Campos obrigatórios
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome do Cliente</label>
            <label className="text-xs font-semibold text-red-600 uppercase tracking-wider">*</label>
            <input
              type="text"
              value={client.clientName}
              onChange={(e) => setClient({ ...client, clientName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">CPF</label>
            <label className="text-xs font-semibold text-red-600 uppercase tracking-wider">*</label>
            <input
              type="text"
              value={client.cpf}
              onChange={(e) => setClient({ ...client, cpf: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="000.000.000-00"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Telefone</label>
            <label className="text-xs font-semibold text-red-600 uppercase tracking-wider">*</label>
            <input
              type="text"
              value={client.phone}
              onChange={(e) => setClient({ ...client, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">CNPJ (Opcional)</label>
            <input
              type="text"
              value={client.cnpj}
              onChange={(e) => setClient({ ...client, cnpj: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="00.000.000/0000-00"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.title} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-50">
                {section.title}
              </h3>
              <div className="space-y-6">
                {section.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4 flex-1 pr-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                        item.bgColor
                      )}>
                        <item.icon className={cn("w-5 h-5", item.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                        <p className="text-xs text-orange-500 font-medium mt-1">{item.info}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-lg border border-gray-100">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1.5 hover:bg-white hover:text-orange-500 rounded-md transition-all text-gray-400"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-gray-700 tabular-nums">
                        {selections[item.id] || 0}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1.5 hover:bg-white hover:text-orange-500 rounded-md transition-all text-gray-400"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-orange-100 sticky top-24">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <Calculator className="hidden text-orange-500 w-8 h-8" />
              Apuração de Valores
            </h3>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-600">
                <span>Taxa Base Fixa</span>
                <span className="font-semibold">R$ {BASE_VALUE.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Itens Adicionados ({totals.itemsCount})</span>
                <span className="font-semibold">R$ {(totals.subtotal - BASE_VALUE).toFixed(2)}</span>
              </div>
              <div className="h-px bg-gray-100 my-4"></div>
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Subtotal</span>
                <span>R$ {totals.subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Descontos Disponíveis</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDiscountType(discountType === "NUMER" ? "none" : "NUMER")}
                  className={cn(
                    "px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all",
                    discountType === "NUMER"
                      ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200"
                      : "bg-white border-gray-100 text-gray-600 hover:border-orange-200"
                  )}
                >
                  NUMER (10%)
                </button>
                <button
                  onClick={() => setDiscountType(discountType === "SINDSEP" ? "none" : "SINDSEP")}
                  className={cn(
                    "px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all",
                    discountType === "SINDSEP"
                      ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200"
                      : "bg-white border-gray-100 text-gray-600 hover:border-orange-200"
                  )}
                >
                  SINDSEP (10%)
                </button>
              </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-2xl mb-8">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-orange-600 text-sm font-bold uppercase tracking-wider">Valor Total</p>
                  <p className="text-4xl font-black text-orange-600 tracking-tighter">
                    R$ {totals.total.toFixed(2)}
                  </p>
                </div>
                {discountType !== "none" && (
                  <div className="text-right">
                    <p className="text-xs text-orange-400 font-bold">Economia de</p>
                    <p className="text-lg font-bold text-orange-500">R$ {totals.discount.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Comprovante de Pagamento (Opcional)</p>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-orange-200 rounded-xl p-4 text-center hover:border-orange-400 transition-all cursor-pointer group bg-orange-50/50"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,application/pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-3">
                  <FileUp className={cn("w-5 h-5 transition-all", proofFile ? "text-green-500" : "text-orange-400 group-hover:text-orange-600")} />
                  <p className="text-sm font-medium text-gray-600 truncate max-w-[200px]">
                    {proofFile ? proofFile.name : "Anexar comprovante"}
                  </p>
                </div>
              </div>
              {proofFile && (
                <p className="text-[10px] text-green-600 font-bold text-center">
                  * O status será atualizado para APROVADO ao salvar.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => generatePDF(client, selections, discountType)}
                  className="flex items-center justify-center gap-2 bg-white border-2 border-orange-500 text-orange-500 py-4 px-6 rounded-xl font-bold hover:bg-orange-50 transition-all"
                >
                  <FileText className="w-5 h-5" />
                  Visualizar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 bg-orange-500 text-white py-4 px-6 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingId ? "Atualizar" : "Salvar"}
                    </>
                  )}
                </button>
              </div>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setClient({ clientName: "", cpf: "", phone: "", cnpj: "" });
                    setSelections({});
                    setDiscountType("none");
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-3 px-6 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  <X className="w-4 h-4" />
                  Cancelar Edição
                </button>
              )}
            </div>

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm font-medium"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Orçamento salvo com sucesso!
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm font-medium"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
