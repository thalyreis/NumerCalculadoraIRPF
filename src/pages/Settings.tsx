import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { Save, RefreshCw, DollarSign, Settings as SettingsIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SECTIONS as DEFAULT_SECTIONS, BASE_VALUE as DEFAULT_BASE_VALUE } from "../constants";
import { cn } from "../lib/utils";

export default function Settings() {
  const [baseValue, setBaseValue] = useState(DEFAULT_BASE_VALUE);
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  const [discounts, setDiscounts] = useState<{ id: string; name: string; value: number }[]>([
    { id: "NUMER", name: "NUMER", value: 10 },
    { id: "SINDSEP", name: "SINDSEP", value: 10 },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "pricing"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBaseValue(data.baseValue ?? DEFAULT_BASE_VALUE);
        setItemPrices(data.itemPrices ?? {});
        if (data.discounts) {
          setDiscounts(data.discounts);
        }
      } else {
        // Initialize with defaults if not exists
        const initialPrices: Record<string, number> = {};
        DEFAULT_SECTIONS.forEach(section => {
          section.items.forEach(item => {
            initialPrices[item.id] = item.price;
          });
        });
        setItemPrices(initialPrices);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await setDoc(doc(db, "settings", "pricing"), {
        baseValue,
        itemPrices,
        discounts,
        updatedAt: new Date(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setItemPrices(prev => ({ ...prev, [id]: numValue }));
  };

  const handleDiscountChange = (id: string, field: "name" | "value", newValue: string) => {
    setDiscounts(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          [field]: field === "value" ? (parseFloat(newValue) || 0) : newValue
        };
      }
      return d;
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-orange-500" />
            Configurações de Preços
          </h2>
          <p className="text-gray-500 text-sm">Gerencie os valores base e preços por item do sistema</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-orange-500 text-white py-2 px-6 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Alterações
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Valor Base</h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Taxa Base Fixa (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  value={baseValue}
                  onChange={(e) => setBaseValue(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-bold text-gray-700"
                />
              </div>
              <p className="text-[10px] text-gray-400 italic">* Este valor é somado automaticamente a todos os orçamentos.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Configurações de Descontos</h3>
            <div className="space-y-6">
              {discounts.map((discount) => (
                <div key={discount.id} className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nome do Desconto</label>
                    <input
                      type="text"
                      value={discount.name}
                      onChange={(e) => handleDiscountChange(discount.id, "name", e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm font-bold text-gray-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Porcentagem (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={discount.value}
                        onChange={(e) => handleDiscountChange(discount.id, "value", e.target.value)}
                        className="w-full pl-3 pr-8 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm font-bold text-gray-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 italic">* Estes descontos são aplicados sobre o subtotal do orçamento.</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {DEFAULT_SECTIONS.map((section) => (
            <div key={section.title} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-50">
                {section.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.items.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                    <div className="flex items-center gap-2">
                      <item.icon className={cn("w-4 h-4", item.color)} />
                      <span className="text-xs font-bold text-gray-700 truncate">{item.label}</span>
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                      <input
                        type="number"
                        value={itemPrices[item.id] ?? item.price}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm font-semibold text-gray-600"
                      />
                    </div>
                    <p className="text-[10px] text-orange-500 font-medium italic">
                      {(() => {
                        const currentPrice = itemPrices[item.id] ?? item.price;
                        const formattedPrice = `R$ ${currentPrice.toFixed(2).replace('.', ',')}`;
                        if (item.id === "01") {
                          return `${item.info.replace(/R\$ [\d,.]+/, formattedPrice)} (a partir da 2ª unidade)`;
                        }
                        return item.info.replace(/R\$ [\d,.]+/, formattedPrice);
                      })()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold z-50"
          >
            <CheckCircle2 className="w-6 h-6" />
            Configurações salvas com sucesso!
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 right-8 bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold z-50"
          >
            <AlertCircle className="w-6 h-6" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
