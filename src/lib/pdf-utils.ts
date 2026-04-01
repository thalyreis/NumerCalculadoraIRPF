import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SECTIONS, BASE_VALUE } from "../constants";

interface Client {
  clientName: string;
  cpf: string;
  phone: string;
  cnpj?: string;
}

export const getBase64Image = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };
    img.onerror = (error) => reject(error);
    img.src = url;
  });
};

export const generatePDF = async (
  client: Client, 
  selections: Record<string, number>, 
  discountType: string,
  baseValue: number = BASE_VALUE,
  itemPrices: Record<string, number> = {},
  discounts: { id: string; name: string; value: number }[] = []
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const orange: [number, number, number] = [249, 115, 22];
  const grayDark: [number, number, number] = [31, 41, 55];
  const grayLight: [number, number, number] = [107, 114, 128];
  const grayBg: [number, number, number] = [249, 250, 251];

  // Pre-load logo
  let logoBase64 = "";
  try {
    logoBase64 = await getBase64Image("/logo.png");
  } catch (e) {
    console.warn("Could not load logo for PDF", e);
  }

  // Page Background
  doc.setFillColor(grayBg[0], grayBg[1], grayBg[2]);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Content Card
  const margin = 10;
  const cardWidth = pageWidth - (margin * 2);
  const cardHeight = pageHeight - (margin * 2);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, margin, cardWidth, cardHeight, 5, 5, "F");

  // 1. Header
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 20, 20, 15, 15);
  } else {
    doc.setFillColor(orange[0], orange[1], orange[2]);
    doc.circle(27.5, 27.5, 7.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("N", 27.5, 29, { align: "center" });
  }

  doc.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Numer Contabilidade", 40, 26);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(grayLight[0], grayLight[1], grayLight[2]);
  doc.text("Contabilidade e Sistemas", 40, 31);

  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PROPOSTA COMERCIAL", pageWidth - 20, 26, { align: "right" });
  doc.setTextColor(grayLight[0], grayLight[1], grayLight[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Nº ${Math.floor(Date.now() / 100000)}`, pageWidth - 20, 31, { align: "right" });

  doc.setDrawColor(230, 230, 230);
  doc.line(20, 40, pageWidth - 20, 40);

  // 2. Client & Date Info
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  
  doc.setTextColor(grayLight[0], grayLight[1], grayLight[2]);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CLIENTE", 20, 50);
  doc.text("DATA DE EMISSÃO", pageWidth - 20, 50, { align: "right" });

  doc.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(client.clientName.toUpperCase(), 20, 56);
  doc.setFont("helvetica", "normal");
  doc.text(dateStr, pageWidth - 20, 56, { align: "right" });

  doc.setFontSize(9);
  doc.setTextColor(grayLight[0], grayLight[1], grayLight[2]);
  let clientDetails = `CPF: ${client.cpf}  |  TEL: ${client.phone}`;
  if (client.cnpj) clientDetails += `  |  CNPJ: ${client.cnpj}`;
  doc.text(clientDetails, 20, 62);

  // 3. Detalhamento Table
  const tableData: any[] = [
    ["DESCRIÇÃO DO ITEM", "QTD", "VALOR UNIT.", "SUBTOTAL"],
    ["Honorários Base - Declaração IRPF 2026", "01", `R$ ${baseValue.toFixed(2)}`, `R$ ${baseValue.toFixed(2)}`],
  ];

  let subtotal = baseValue;
  
  // Find item 01 to ensure it always appears
  const item01 = SECTIONS[0].items.find(i => i.id === "01")!;
  const qty01 = selections["01"] || 0;
  
  // Add item 01 to tableData (always present)
  const displayQty01 = Math.max(1, qty01);
  const itemPrice01 = itemPrices["01"] ?? item01.price;
  const itemTotal01 = Math.max(0, qty01 - 1) * itemPrice01;
  subtotal += itemTotal01;
  tableData.push([
    item01.label,
    displayQty01.toString().padStart(2, '0'),
    `R$ ${itemPrice01.toFixed(2)}`,
    `R$ ${itemTotal01.toFixed(2)}`,
  ]);

  SECTIONS.forEach((section) => {
    section.items.forEach((item) => {
      // Skip item 01 as we already added it
      if (item.id === "01") return;

      const qty = selections[item.id] || 0;
      if (qty > 0) {
        const itemPrice = itemPrices[item.id] ?? item.price;
        subtotal += qty * itemPrice;
        tableData.push([
          item.label,
          qty.toString().padStart(2, '0'),
          `R$ ${itemPrice.toFixed(2)}`,
          `R$ ${(qty * itemPrice).toFixed(2)}`,
        ]);
      }
    });
  });

  autoTable(doc, {
    startY: 75,
    margin: { left: 20, right: 20 },
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: "striped",
    headStyles: {
      fillColor: [250, 250, 250],
      textColor: grayLight,
      fontSize: 7,
      fontStyle: "bold",
      halign: "left"
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 15 },
      2: { halign: "right", cellWidth: 30 },
      3: { halign: "right", cellWidth: 30 },
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 4,
      textColor: grayDark,
      lineColor: [245, 245, 245],
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252]
    }
  });

  let finalY = (doc as any).lastAutoTable.finalY + 10;

  // 4. Totals Summary
  const selectedDiscount = discounts.find(d => d.id === discountType);
  const discountValue = selectedDiscount ? selectedDiscount.value : (discountType !== "none" ? 10 : 0);
  const discount = subtotal * (discountValue / 100);
  const total = subtotal - discount;

  const summaryX = pageWidth - 110; // Moved slightly more to the left to avoid overlap
  doc.setFontSize(9);
  doc.setTextColor(grayLight[0], grayLight[1], grayLight[2]);
  doc.text("Subtotal:", summaryX, finalY);
  doc.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  doc.text(`R$ ${subtotal.toFixed(2)}`, pageWidth - 20, finalY, { align: "right" });

  if (discountType !== "none") {
    finalY += 6;
    doc.setTextColor(34, 197, 94);
    const discountName = selectedDiscount ? selectedDiscount.name : discountType;
    doc.text(`Desconto (${discountName}):`, summaryX, finalY);
    doc.text(`- R$ ${discount.toFixed(2)}`, pageWidth - 20, finalY, { align: "right" });
  }

  finalY += 10;
  doc.setFillColor(orange[0], orange[1], orange[2]);
  doc.rect(summaryX - 5, finalY - 6, 115, 12, "F"); // Increased width to 115
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9); // Slightly smaller font for label to ensure no overlap
  doc.text("VALOR TOTAL DA PROPOSTA:", summaryX, finalY + 1.5);
  doc.setFontSize(12);
  doc.text(`R$ ${total.toFixed(2)}`, pageWidth - 20, finalY + 1.5, { align: "right" });

  // 5. Bottom Section
  finalY += 25;
  const colWidth = (pageWidth - 50) / 2;

  doc.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("O SERVIÇO INCLUI:", 20, finalY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(grayLight[0], grayLight[1], grayLight[2]);
  const inclusions = [
    "Análise documental completa",
    "Preenchimento de todas as fichas",
    "Validação e transmissão (RFB)",
    "Acompanhamento do processamento",
    "Suporte em caso de pendências"
  ];
  let incY = finalY + 6;
  inclusions.forEach(inc => {
    doc.setTextColor(orange[0], orange[1], orange[2]);
    doc.text("•", 20, incY);
    doc.setTextColor(grayLight[0], grayLight[1], grayLight[2]);
    doc.text(inc, 24, incY);
    incY += 5;
  });

  doc.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CONDIÇÕES GERAIS:", 20 + colWidth + 10, finalY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(grayLight[0], grayLight[1], grayLight[2]);
  const conds = [
    "Pagamento via PIX ou Transferência.",
    "Validade da proposta: 15 dias.",
    "Prazo: 5 dias úteis após documentos.",
    "Valores sujeitos a ajuste por novos dados."
  ];
  let condY = finalY + 6;
  conds.forEach(c => {
    doc.setTextColor(orange[0], orange[1], orange[2]);
    doc.text("•", 20 + colWidth + 10, condY);
    doc.setTextColor(grayLight[0], grayLight[1], grayLight[2]);
    doc.text(c, 24 + colWidth + 10, condY);
    condY += 5;
  });

  // 6. Footer
  doc.setDrawColor(240, 240, 240);
  doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
  
  doc.setFontSize(7);
  doc.setTextColor(grayLight[0], grayLight[1], grayLight[2]);
  doc.text("Numer Contabilidade e Sistemas - Consultoria Especializada em IRPF", pageWidth / 2, pageHeight - 18, { align: "center" });
  doc.text("www.numercontabilidade.com.br | contato@numercontabilidade.com.br", pageWidth / 2, pageHeight - 14, { align: "center" });

  doc.save(`Proposta_IRPF_2026_${client.clientName.replace(/\s+/g, "_")}.pdf`);
};
