import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bill } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import axios from 'axios';

export const BillExport = () => {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();
  const [bill, setBill] = useState<Bill | null>(null);

  useEffect(() => {
    const fetchBill = async () => {
      if (!billId) return;
      try {
        const API_HOST = import.meta.env.VITE_API_HOST;
        const response = await axios.get(`${API_HOST}/api/bills/${billId}`);
        setBill(response.data || null);
      } catch (error) {
        setBill(null);
      }
    };
    fetchBill();
  }, [billId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('bill-content');
    if (!element || !bill) return;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${bill.billNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save();
  };


  const handleBack = () => {
    navigate('/bills');
  };

  if (!bill) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">ไม่พบบิล</h2>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับสู่รายการบิล
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-gray-50 border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button onClick={handleBack} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              ดาวน์โหลด PDF
            </Button>
            <Button onClick={handlePrint} size="sm">
              <Printer className="mr-2 h-4 w-4" />
              พิมพ์
            </Button>
          </div>
        </div>
      </div>

      {/* Bill Content */}
      <div
        id="bill-content"
        className="max-w-4xl mx-auto p-8 bg-white print:overflow-visible overflow-visible"
      >
        {/* Company Header */}
        <div className="text-center mb-8 border-b pb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ใบเสร็จรับเงิน / Receipt</h1>
          <p className="text-gray-600">บริษัท ตัวอย่าง จำกัด</p>
          <p className="text-sm text-gray-500">123/45 ถนนตัวอย่าง เขตตัวอย่าง กรุงเทพฯ 10110</p>
          <p className="text-sm text-gray-500">Tel: 02-123-4567 | Email: info@example.com</p>
        </div>

        {/* Bill Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลบิล</h3>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="w-24 text-gray-700">เลขที่บิล:</span>
                <span className="text-gray-600 font-mono font-medium">{bill.billNumber}</span>
              </div>

              <div className="flex">
                <span className="w-24 text-gray-700">ผู้ออกบิล:</span>
                <span className='text-gray-600'>{bill.createdBy}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 opacity-0">header</h3>
            {/* <div className="space-y-2 text-sm text-gray-600">
              <div>ลูกค้าทั่วไป</div>
              <div>-</div>
              <div>-</div>
            </div>  */}
            <div className="flex">
              <span className="w-24 text-gray-700">วันที่:</span>
              <span className='text-gray-600'>{formatDate(bill.createdAt)}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-gray-700">เวลา:</span>
              <span className='text-gray-600'>{formatTime(bill.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-2 text-gray-900 font-semibold">ลำดับ</th>
                <th className="text-left py-3 px-2 text-gray-900 font-semibold">รายการ</th>
                <th className="text-right py-3 px-2 text-gray-900 font-semibold">ราคาต่อหน่วย</th>
                <th className="text-right py-3 px-2 text-gray-900 font-semibold">จำนวน</th>
                <th className="text-right py-3 px-2 text-gray-900 font-semibold">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 px-2 text-gray-900">{index + 1}</td>
                  <td className="py-3 px-2 text-gray-900">{item.productName}</td>
                  <td className="py-3 px-2 text-right text-gray-900">
                    {item.price.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-900">{item.quantity}</td>
                  <td className="py-3 px-2 text-right text-gray-900 font-medium">
                    {item.total.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                </tr>
              ))}

              {/* Add empty rows if needed for formatting */}
              {Array.from({ length: Math.max(0, 5 - bill.items.length) }).map((_, index) => (
                <tr key={`empty-${index}`} className="border-b border-gray-200">
                  <td className="py-3 px-2">&nbsp;</td>
                  <td className="py-3 px-2">&nbsp;</td>
                  <td className="py-3 px-2">&nbsp;</td>
                  <td className="py-3 px-2">&nbsp;</td>
                  <td className="py-3 px-2">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="bg-gray-50 p-4 rounded">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ยอดรวม:</span>
                  <span className="text-gray-900">
                    ฿{bill.subtotal.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ภาษีมูลค่าเพิ่ม 7%:</span>
                  <span className="text-gray-900">
                    ฿{bill.tax.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-gray-900">รวมทั้งสิ้น:</span>
                    <span className="text-gray-900">
                      ฿{bill.total.toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 text-center text-sm text-gray-500">
          <p className="mb-2">ขอบคุณที่ใช้บริการ</p>
          <p>หากมีข้อสงสัยกรุณาติดต่อ 02-123-4567</p>
        </div>

        {/* Digital Signature */}
        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>บิลนี้ออกโดยระบบอัตโนมัติ | {formatDate(bill.createdAt)} {formatTime(bill.createdAt)}</p>
          <p className="font-mono">ID: {bill._id}</p>
        </div>
      </div>
    </div>
  );
};