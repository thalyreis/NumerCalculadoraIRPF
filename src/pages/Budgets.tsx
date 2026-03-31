import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { FileUp, Trash2, CheckCircle2, Clock, Search, ExternalLink, AlertCircle, Edit2, X, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { generatePDF } from "../lib/pdf-utils";

interface Budget {
  id: string;
  clientName: string;
  cpf: string;
  phone: string;
  cnpj?: string;
  selections: Record<string, number>;
  discountType: "none" | "NUMER" | "SINDSEP";
  totalValue: number;
  status: "pending" | "approved";
  proofUrl?: string;
  createdAt: any;
}

export default function Budgets() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal States
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [proofId, setProofId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "budgets"),
      where("createdBy", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Budget[];
      setBudgets(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openInNewTab = (dataUrl: string) => {
    try {
      const [header, base64] = dataUrl.split(',');
      const mime = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([array], { type: mime });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Erro ao abrir em nova guia:', err);
      // Fallback for simple data URLs if they are small enough
      window.open(dataUrl, '_blank');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, "budgets", deletingId));
      setDeletingId(null);
    } catch (err) {
      console.error("Erro ao excluir:", err);
      alert("Erro ao excluir orçamento. Verifique sua conexão ou permissões.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadProof = async () => {
    if (!proofId || !selectedFile) return;
    setIsSaving(true);
    try {
      // Simulate file upload by converting to data URL (Base64)
      // Note: In production, use Firebase Storage.
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          await updateDoc(doc(db, "budgets", proofId), {
            proofUrl: base64String,
            status: "approved",
          });
          setProofId(null);
          setSelectedFile(null);
        } catch (err) {
          console.error(err);
          alert("Erro ao salvar no banco de dados.");
        } finally {
          setIsSaving(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      console.error(err);
      alert("Erro ao processar arquivo.");
      setIsSaving(false);
    }
  };

  const handleEdit = (budget: Budget) => {
    navigate("/", { state: { budget } });
  };

  const filteredBudgets = budgets.filter((b) =>
    b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.cpf.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orçamentos Realizados</h2>
          <p className="text-gray-500 text-sm">Gerencie e acompanhe o status dos orçamentos</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full md:w-80 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredBudgets.map((budget) => (
            <motion.div
              layout
              key={budget.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{budget.clientName}</h3>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1",
                      budget.status === "approved" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-amber-100 text-amber-700"
                    )}>
                      {budget.status === "approved" ? (
                        <><CheckCircle2 className="w-3 h-3" /> Aprovado</>
                      ) : (
                        <><Clock className="w-3 h-3" /> Pendente</>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-gray-400">CPF:</span> {budget.cpf}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-gray-400">Tel:</span> {budget.phone}
                    </span>
                    {budget.cnpj && (
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-gray-400">CNPJ:</span> {budget.cnpj}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-gray-400">Data:</span> {budget.createdAt?.toDate().toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Valor Total</p>
                    <p className="text-2xl font-black text-orange-500">R$ {budget.totalValue.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generatePDF(
                        { clientName: budget.clientName, cpf: budget.cpf, phone: budget.phone, cnpj: budget.cnpj },
                        budget.selections,
                        budget.discountType
                      )}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Visualizar Orçamento (PDF)"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(budget)}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                      title="Editar na Calculadora"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    {budget.proofUrl && (
                      <button
                        onClick={() => openInNewTab(budget.proofUrl!)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="Ver Comprovante"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => setProofId(budget.id)}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        budget.proofUrl ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50" : "text-orange-600 hover:bg-orange-50"
                      )}
                      title={budget.proofUrl ? "Substituir Comprovante" : "Anexar Comprovante"}
                    >
                      <FileUp className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(budget.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredBudgets.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhum orçamento encontrado.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Orçamento?</h3>
              <p className="text-gray-500 mb-6">Esta ação não pode ser desfeita. O orçamento será removido permanentemente.</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100 flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : "Excluir"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Upload Proof Modal */}
        {proofId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50">
                <h3 className="text-lg font-bold text-gray-900">Anexar Comprovante</h3>
                <button onClick={() => { setProofId(null); setSelectedFile(null); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500">Selecione uma foto ou arquivo PDF do comprovante de pagamento.</p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Arquivo (PDF ou Imagem)</label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition-all cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2">
                      <FileUp className="w-8 h-8 text-gray-300 mx-auto group-hover:text-blue-500 transition-all" />
                      <p className="text-sm font-medium text-gray-600">
                        {selectedFile ? selectedFile.name : "Clique ou arraste para selecionar"}
                      </p>
                      <p className="text-xs text-gray-400">Formatos aceitos: JPG, PNG, PDF</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => { setProofId(null); setSelectedFile(null); }}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUploadProof}
                    disabled={isSaving || !selectedFile}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmar Pagamento
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
