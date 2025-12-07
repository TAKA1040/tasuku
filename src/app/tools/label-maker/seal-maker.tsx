'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Printer, Plus, Trash2, Copy, Save, FolderOpen, X, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// 型定義
interface SealData {
  text: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  alignVertical: 'top' | 'center' | 'bottom';
  alignHorizontal: 'left' | 'center' | 'right';
  image: string | null;
  imageSize: number;
  imagePosition: 'top' | 'center' | 'bottom';
  imageAlignHorizontal: 'left' | 'center' | 'right';
  richText?: string; // HTML形式のリッチテキスト
}

interface LayoutConfig {
  name: string;
  cols: number;
  rows: number;
  width: number;
  height: number;
  gap: number;
  fontSize: number;
}

interface PrintOffset {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

// 用紙プリセット
interface PaperPreset {
  id: string;
  name: string;
  layout: string;
  offset: PrintOffset;
}

// 組み込みプリセット（よく使う用紙設定）
const builtInPresets: PaperPreset[] = [
  { id: 'default', name: '標準（オフセットなし）', layout: '24', offset: { top: 0, left: 0, right: 0, bottom: 0 } },
  { id: 'a-one-72224', name: 'A-one 72224（24面）', layout: '24', offset: { top: -1, left: 0.5, right: 0.5, bottom: -1 } },
  { id: 'a-one-72230', name: 'A-one 72230（10面）', layout: '10', offset: { top: -0.5, left: 0, right: 0, bottom: -0.5 } },
  { id: 'a-one-72244', name: 'A-one 72244（44面）', layout: '44', offset: { top: -1, left: 0.5, right: 0.5, bottom: -1 } },
];

interface GlobalSettings {
  fontSize: number;
  fontFamily: string;
  textColor: string;
  alignVertical: 'top' | 'center' | 'bottom';
  alignHorizontal: 'left' | 'center' | 'right';
}

// 保存データの型
interface SavedTemplate {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  layout: string;
  sealData: SealData[];
  printOffset: PrintOffset;
  globalSettings: GlobalSettings;
}

const STORAGE_KEY = 'seal-maker-templates';
const PRINT_OFFSET_KEY = 'seal-maker-print-offset';
const PAPER_PRESETS_KEY = 'seal-maker-paper-presets';

const createDefaultSeal = (fontSize: number = 11): SealData => ({
  text: '',
  textColor: '#000000',
  fontSize,
  fontFamily: 'sans-serif',
  alignVertical: 'center',
  alignHorizontal: 'center',
  image: null,
  imageSize: 50,
  imagePosition: 'top',
  imageAlignHorizontal: 'center',
  richText: ''
});

// プリセットカラー
const colorPresets = [
  { name: '黒', value: '#000000' },
  { name: '赤', value: '#dc2626' },
  { name: '青', value: '#2563eb' },
  { name: '緑', value: '#16a34a' },
  { name: 'オレンジ', value: '#ea580c' },
  { name: '紫', value: '#7c3aed' },
  { name: 'ピンク', value: '#db2777' },
  { name: '茶', value: '#92400e' },
  { name: '灰', value: '#6b7280' },
  { name: '紺', value: '#1e3a8a' },
];

// スタイル定義
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)',
    padding: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  } as React.CSSProperties,
  headerCard: {
    maxWidth: '1280px',
    margin: '0 auto 24px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    padding: '24px'
  } as React.CSSProperties,
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#312e81',
    marginBottom: '8px'
  } as React.CSSProperties,
  subtitle: {
    color: '#6b7280',
    fontSize: '14px'
  } as React.CSSProperties,
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s'
  } as React.CSSProperties,
  primaryButton: {
    background: '#4f46e5',
    color: 'white'
  } as React.CSSProperties,
  grayButton: {
    background: '#4b5563',
    color: 'white'
  } as React.CSSProperties,
  greenButton: {
    background: '#16a34a',
    color: 'white'
  } as React.CSSProperties,
  blueButton: {
    background: '#2563eb',
    color: 'white'
  } as React.CSSProperties,
  redButton: {
    background: '#dc2626',
    color: 'white'
  } as React.CSSProperties,
  layoutButton: (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    background: active ? '#4f46e5' : '#e5e7eb',
    color: active ? 'white' : '#374151'
  } as React.CSSProperties),
  tabButton: (active: boolean) => ({
    flex: 1,
    padding: '16px 24px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    background: active ? '#4f46e5' : '#f3f4f6',
    color: active ? 'white' : '#6b7280',
    borderBottom: active ? '4px solid #4f46e5' : 'none'
  } as React.CSSProperties),
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  } as React.CSSProperties,
  textarea: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'none' as const,
    outline: 'none'
  } as React.CSSProperties,
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '4px'
  } as React.CSSProperties,
  sealItem: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    background: '#f9fafb'
  } as React.CSSProperties,
  alignButton: (active: boolean) => ({
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: active ? 'none' : '1px solid #d1d5db',
    cursor: 'pointer',
    fontSize: '14px',
    background: active ? '#4f46e5' : 'white',
    color: active ? 'white' : '#374151'
  } as React.CSSProperties),
  settingsPanel: {
    marginBottom: '16px',
    padding: '16px',
    background: '#fefce8',
    border: '2px solid #fde047',
    borderRadius: '8px'
  } as React.CSSProperties,
  globalSettingsPanel: {
    marginBottom: '24px',
    border: '2px solid #c7d2fe',
    borderRadius: '8px',
    padding: '16px',
    background: '#eef2ff'
  } as React.CSSProperties,
  orangeButton: {
    background: '#ea580c',
    color: 'white'
  } as React.CSSProperties,
  purpleButton: {
    background: '#7c3aed',
    color: 'white'
  } as React.CSSProperties,
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  } as React.CSSProperties,
  modalContent: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto'
  } as React.CSSProperties,
  templateItem: {
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  } as React.CSSProperties
};

const SealMaker = () => {
  const [layout, setLayout] = useState<string>('24');
  const [sealData, setSealData] = useState<SealData[]>(
    Array(24).fill(null).map(() => createDefaultSeal())
  );
  const [activeTab, setActiveTab] = useState<'input' | 'preview'>('input');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [printOffset, setPrintOffset] = useState<PrintOffset>({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  });
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    fontSize: 11,
    fontFamily: 'sans-serif',
    textColor: '#000000',
    alignVertical: 'center',
    alignHorizontal: 'center'
  });
  const printRef = useRef<HTMLDivElement>(null);

  // 保存機能用の状態
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState(0.4);
  const [customPresets, setCustomPresets] = useState<PaperPreset[]>([]);
  const [showPresetSaveModal, setShowPresetSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');

  // ガイド出力用の状態
  const [showGuides, setShowGuides] = useState({
    cutMarks: false,
    centerLine: false,
    testPattern: false
  });

  // 複数ページ印刷用の状態
  const [printSettings, setPrintSettings] = useState({
    copies: 1,
    startPage: 1,
    endPage: 1,
    startLabel: 1  // 開始ラベル位置（部分印刷用）
  });

  // PDF生成中フラグ
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // 可変データ印刷用の状態
  const [variableDataMode, setVariableDataMode] = useState(false);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [showVariableDataModal, setShowVariableDataModal] = useState(false);
  const [serialNumberSettings, setSerialNumberSettings] = useState({
    enabled: false,
    prefix: '',
    startNumber: 1,
    digits: 3,
    suffix: ''
  });

  // 初期化時に保存データと印刷設定を読み込み
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedTemplates(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load templates:', e);
      }
    }
    const storedOffset = localStorage.getItem(PRINT_OFFSET_KEY);
    if (storedOffset) {
      try {
        setPrintOffset(JSON.parse(storedOffset));
      } catch (e) {
        console.error('Failed to load print offset:', e);
      }
    }
    const storedPresets = localStorage.getItem(PAPER_PRESETS_KEY);
    if (storedPresets) {
      try {
        setCustomPresets(JSON.parse(storedPresets));
      } catch (e) {
        console.error('Failed to load paper presets:', e);
      }
    }
  }, []);

  // 印刷設定が変わったら自動保存
  useEffect(() => {
    localStorage.setItem(PRINT_OFFSET_KEY, JSON.stringify(printOffset));
  }, [printOffset]);

  // 用紙プリセットを保存
  const savePaperPreset = () => {
    if (!presetName.trim()) {
      alert('プリセット名を入力してください');
      return;
    }
    const newPreset: PaperPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      layout,
      offset: { ...printOffset }
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem(PAPER_PRESETS_KEY, JSON.stringify(updated));
    setShowPresetSaveModal(false);
    setPresetName('');
    alert('プリセットを保存しました！');
  };

  // 用紙プリセットを適用
  const applyPaperPreset = (preset: PaperPreset) => {
    if (preset.layout !== layout) {
      handleLayoutChange(preset.layout);
    }
    setPrintOffset(preset.offset);
  };

  // カスタムプリセットを削除
  const deleteCustomPreset = (id: string) => {
    if (!confirm('このプリセットを削除しますか？')) return;
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    localStorage.setItem(PAPER_PRESETS_KEY, JSON.stringify(updated));
  };

  
  // テンプレートを保存
  const saveTemplate = () => {
    if (!saveName.trim()) {
      alert('テンプレート名を入力してください');
      return;
    }

    const now = new Date().toISOString();
    const newTemplate: SavedTemplate = {
      id: currentTemplateId || Date.now().toString(),
      name: saveName.trim(),
      createdAt: currentTemplateId
        ? savedTemplates.find(t => t.id === currentTemplateId)?.createdAt || now
        : now,
      updatedAt: now,
      layout,
      sealData,
      printOffset,
      globalSettings
    };

    let updated: SavedTemplate[];
    if (currentTemplateId) {
      updated = savedTemplates.map(t => t.id === currentTemplateId ? newTemplate : t);
    } else {
      updated = [...savedTemplates, newTemplate];
    }

    setSavedTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCurrentTemplateId(newTemplate.id);
    setShowSaveModal(false);
    setSaveName('');
    alert('保存しました！');
  };

  // テンプレートを読み込み
  const loadTemplate = (template: SavedTemplate) => {
    setLayout(template.layout);
    setSealData(template.sealData);
    setPrintOffset(template.printOffset);
    setGlobalSettings(template.globalSettings);
    setCurrentTemplateId(template.id);
    setSaveName(template.name);
    setShowLoadModal(false);
    setEditingIndex(null);
  };

  // テンプレートを削除
  const deleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('このテンプレートを削除しますか？')) return;

    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (currentTemplateId === id) {
      setCurrentTemplateId(null);
      setSaveName('');
    }
  };

  // 新規作成
  const createNew = () => {
    if (sealData.some(s => s.text || s.image)) {
      if (!confirm('現在の内容は破棄されます。新規作成しますか？')) return;
    }
    setLayout('24');
    setSealData(Array(24).fill(null).map(() => createDefaultSeal()));
    setCurrentTemplateId(null);
    setSaveName('');
    setEditingIndex(null);
  };

  const layouts: Record<string, LayoutConfig> = {
    '10': { name: '10面（名刺サイズ）', cols: 2, rows: 5, width: 91, height: 55, gap: 3, fontSize: 14 },
    '24': { name: '24面', cols: 3, rows: 8, width: 64, height: 33.9, gap: 2.5, fontSize: 11 },
    '40': { name: '40面', cols: 5, rows: 8, width: 48.3, height: 25.4, gap: 2, fontSize: 9 },
    '44': { name: '44面', cols: 4, rows: 11, width: 48.3, height: 25.4, gap: 2, fontSize: 9 },
    '65': { name: '65面', cols: 5, rows: 13, width: 38.1, height: 21.2, gap: 1.5, fontSize: 8 }
  };

  const currentLayout = layouts[layout];
  const totalSeals = currentLayout.cols * currentLayout.rows;

  const handleLayoutChange = (newLayout: string) => {
    setLayout(newLayout);
    const newTotal = layouts[newLayout].cols * layouts[newLayout].rows;
    setSealData(Array(newTotal).fill(null).map(() => createDefaultSeal(layouts[newLayout].fontSize)));
    setEditingIndex(null);
  };

  const handleSealChange = (index: number, property: keyof SealData, value: string | number | null) => {
    const newData = [...sealData];
    newData[index] = { ...newData[index], [property]: value };
    setSealData(newData);
  };

  const handleGlobalSettingChange = (property: keyof GlobalSettings, value: string | number) => {
    setGlobalSettings({ ...globalSettings, [property]: value });
  };

  const applyGlobalSettings = () => {
    if (confirm('全てのシールに共通設定を適用しますか？（テキストは保持されます）')) {
      setSealData(sealData.map(seal => ({
        ...seal,
        fontSize: globalSettings.fontSize,
        fontFamily: globalSettings.fontFamily,
        textColor: globalSettings.textColor,
        alignVertical: globalSettings.alignVertical,
        alignHorizontal: globalSettings.alignHorizontal
      })));
    }
  };

  const fillAllSeals = () => {
    const text = prompt('全てのシールに入力するテキストを入力してください：');
    if (text !== null) {
      setSealData(sealData.map(seal => ({ ...seal, text })));
    }
  };

  const clearAllSeals = () => {
    if (confirm('全てのシールをクリアしますか？')) {
      setSealData(Array(totalSeals).fill(null).map(() => createDefaultSeal(currentLayout.fontSize)));
      setEditingIndex(null);
    }
  };

  const duplicateFirst = () => {
    if (sealData[0].text || sealData[0].image) {
      setSealData(Array(totalSeals).fill(null).map(() => ({ ...sealData[0] })));
    }
  };

  const copyToBelow = (startIndex: number, count: number) => {
    const newData = [...sealData];
    const sourceSeal = { ...sealData[startIndex] };
    for (let i = 1; i <= count; i++) {
      const targetIndex = startIndex + i;
      if (targetIndex < totalSeals) {
        newData[targetIndex] = { ...sourceSeal };
      }
    }
    setSealData(newData);
  };

  const handleImageUpload = (index: number, file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleSealChange(index, 'image', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagePaste = (index: number, e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        handleImageUpload(index, file);
        e.preventDefault();
        break;
      }
    }
  };

  const removeImage = (index: number) => {
    handleSealChange(index, 'image', null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      handleImageUpload(index, files[0]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // PDF書き出し
  const handleExportPDF = async () => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    setIsGeneratingPDF(true);

    try {
      // 一時的にスケールを100%に設定してキャプチャ
      const originalTransform = printArea.style.transform;
      printArea.style.transform = 'none';

      const canvas = await html2canvas(printArea, {
        scale: 2, // 高解像度でキャプチャ
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // 元のスケールに戻す
      printArea.style.transform = originalTransform;

      // A4サイズのPDFを作成（210mm x 297mm）
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // キャンバスをPDFに追加
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 210;
      const pdfHeight = 297;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // ファイル名を生成
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `シール_${layouts[layout].name}_${timestamp}.pdf`;

      // ダウンロード
      pdf.save(filename);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF生成に失敗しました');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // CSVをパースする関数
  const parseCSV = (text: string): { headers: string[]; data: string[][] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return { headers: [], data: [] };

    // 簡易CSVパーサー（カンマ区切り、ダブルクォート対応）
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const data = lines.slice(1).map(parseLine);

    return { headers, data };
  };

  // CSVファイルを読み込み
  const handleCSVUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, data } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvData(data);
      setVariableDataMode(true);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // 通番を生成
  const generateSerialNumber = (index: number): string => {
    if (!serialNumberSettings.enabled) return '';
    const num = serialNumberSettings.startNumber + index;
    const paddedNum = String(num).padStart(serialNumberSettings.digits, '0');
    return `${serialNumberSettings.prefix}${paddedNum}${serialNumberSettings.suffix}`;
  };

  // CSVデータを各シールに適用（テンプレートにプレースホルダーを使用）
  const applyCSVData = () => {
    if (csvData.length === 0) return;

    const newSealData = sealData.map((seal, index) => {
      if (index >= csvData.length) return seal;

      let newText = seal.text;
      // ヘッダー名でプレースホルダーを置換 {{列名}}
      csvHeaders.forEach((header, colIndex) => {
        const placeholder = `{{${header}}}`;
        const value = csvData[index]?.[colIndex] || '';
        newText = newText.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      });

      // 通番プレースホルダー {{通番}}
      if (serialNumberSettings.enabled) {
        newText = newText.replace(/\{\{通番\}\}/g, generateSerialNumber(index));
      }

      return { ...seal, text: newText };
    });

    setSealData(newSealData);
    setShowVariableDataModal(false);
    alert(`${Math.min(csvData.length, totalSeals)}件のデータを適用しました`);
  };

  // 通番だけを適用
  const applySerialNumbers = () => {
    const newSealData = sealData.map((seal, index) => {
      const newText = seal.text.replace(/\{\{通番\}\}/g, generateSerialNumber(index));
      return { ...seal, text: newText };
    });
    setSealData(newSealData);
    alert('通番を適用しました');
  };

  // 可変データモードをクリア
  const clearVariableData = () => {
    setCsvData([]);
    setCsvHeaders([]);
    setVariableDataMode(false);
    setSerialNumberSettings({
      enabled: false,
      prefix: '',
      startNumber: 1,
      digits: 3,
      suffix: ''
    });
  };

  // フォントオプション
  const fontOptions = [
    { group: '日本語ゴシック体', options: [
      { value: 'sans-serif', label: 'ゴシック（標準）' },
      { value: "'メイリオ', 'Meiryo', sans-serif", label: 'メイリオ' },
      { value: "'游ゴシック', 'Yu Gothic', sans-serif", label: '游ゴシック' },
    ]},
    { group: '日本語明朝体', options: [
      { value: 'serif', label: '明朝（標準）' },
      { value: "'游明朝', 'Yu Mincho', serif", label: '游明朝' },
    ]},
    { group: '等幅フォント', options: [
      { value: 'monospace', label: '等幅（標準）' },
    ]},
  ];

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={styles.headerCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={styles.title}>🏷️ シール職人</h1>
            <p style={styles.subtitle}>
              A4サイズのシール印刷ツール
              {currentTemplateId && saveName && (
                <span style={{ marginLeft: '8px', color: '#4f46e5', fontWeight: '600' }}>
                  - {saveName}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={createNew}
              style={{ ...styles.button, ...styles.grayButton }}
            >
              <Plus size={18} />
              新規
            </button>
            <button
              onClick={() => {
                setSaveName(currentTemplateId ? saveName : '');
                setShowSaveModal(true);
              }}
              style={{ ...styles.button, ...styles.orangeButton }}
            >
              <Save size={18} />
              保存
            </button>
            <button
              onClick={() => setShowLoadModal(true)}
              style={{ ...styles.button, ...styles.purpleButton }}
            >
              <FolderOpen size={18} />
              読込
            </button>
            <button
              onClick={() => setShowPrintSettings(!showPrintSettings)}
              style={{ ...styles.button, ...styles.grayButton }}
            >
              ⚙️ 調整
            </button>
            <button
              onClick={handlePrint}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              <Printer size={20} />
              印刷
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isGeneratingPDF}
              style={{
                ...styles.button,
                ...styles.blueButton,
                opacity: isGeneratingPDF ? 0.6 : 1,
                cursor: isGeneratingPDF ? 'not-allowed' : 'pointer'
              }}
            >
              <FileDown size={20} />
              {isGeneratingPDF ? 'PDF生成中...' : 'PDF'}
            </button>
            <button
              onClick={() => setShowVariableDataModal(true)}
              style={{
                ...styles.button,
                background: variableDataMode ? '#16a34a' : '#6b7280',
                color: 'white'
              }}
            >
              📊 差込
            </button>
          </div>
        </div>

        {/* 印刷調整パネル */}
        {showPrintSettings && (
          <div style={styles.settingsPanel}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151', marginBottom: '12px' }}>
              🖨️ 印刷位置の微調整
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              実際のシール用紙に合わせて印刷位置を調整できます。
            </p>

            {/* 用紙プリセット */}
            <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>📄 用紙プリセット</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                {builtInPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPaperPreset(preset)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      cursor: 'pointer',
                      background: 'white',
                      color: '#374151',
                      transition: 'all 0.2s'
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
              {customPresets.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>カスタムプリセット</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {customPresets.map(preset => (
                      <div key={preset.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => applyPaperPreset(preset)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            borderRadius: '6px 0 0 6px',
                            border: '1px solid #7c3aed',
                            borderRight: 'none',
                            cursor: 'pointer',
                            background: '#f5f3ff',
                            color: '#7c3aed',
                          }}
                        >
                          {preset.name}
                        </button>
                        <button
                          onClick={() => deleteCustomPreset(preset.id)}
                          style={{
                            padding: '6px 8px',
                            fontSize: '12px',
                            borderRadius: '0 6px 6px 0',
                            border: '1px solid #7c3aed',
                            cursor: 'pointer',
                            background: '#7c3aed',
                            color: 'white',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowPresetSaveModal(true)}
                style={{
                  marginTop: '12px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid #16a34a',
                  cursor: 'pointer',
                  background: '#16a34a',
                  color: 'white',
                }}
              >
                + 現在の設定をプリセット保存
              </button>
            </div>

            {/* ガイド出力オプション */}
            <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>📐 ガイド出力</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={showGuides.cutMarks}
                    onChange={(e) => setShowGuides({ ...showGuides, cutMarks: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  カットマーク
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={showGuides.centerLine}
                    onChange={(e) => setShowGuides({ ...showGuides, centerLine: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  センターライン
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={showGuides.testPattern}
                    onChange={(e) => setShowGuides({ ...showGuides, testPattern: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  テストパターン
                </label>
              </div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', marginBottom: 0 }}>
                印刷時にガイドを表示して位置合わせに使用できます
              </p>
            </div>

            {/* 複数ページ印刷設定 */}
            <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>📄 印刷設定</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>部数</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={printSettings.copies}
                    onChange={(e) => setPrintSettings({ ...printSettings, copies: Math.max(1, parseInt(e.target.value) || 1) })}
                    style={{ ...styles.input, width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>開始ラベル番号</label>
                  <input
                    type="number"
                    min="1"
                    max={totalSeals}
                    value={printSettings.startLabel}
                    onChange={(e) => setPrintSettings({ ...printSettings, startLabel: Math.max(1, Math.min(totalSeals, parseInt(e.target.value) || 1)) })}
                    style={{ ...styles.input, width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    onClick={() => setPrintSettings({ copies: 1, startPage: 1, endPage: 1, startLabel: 1 })}
                    style={{ ...styles.button, ...styles.grayButton, fontSize: '12px', width: '100%' }}
                  >
                    リセット
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', marginBottom: 0 }}>
                開始ラベル番号: 途中から印刷を開始（既に使用済みのラベル用紙を再利用）
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {(['top', 'left', 'right', 'bottom'] as const).map((dir) => (
                <div key={dir}>
                  <label style={styles.label}>
                    {dir === 'top' ? '上' : dir === 'left' ? '左' : dir === 'right' ? '右' : '下'}余白: {printOffset[dir]}mm
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={printOffset[dir]}
                    onChange={(e) => setPrintOffset({ ...printOffset, [dir]: parseFloat(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setPrintOffset({ top: 0, left: 0, right: 0, bottom: 0 })}
              style={{ ...styles.button, ...styles.grayButton, marginTop: '16px' }}
            >
              リセット
            </button>
          </div>
        )}

        {/* レイアウト選択 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ ...styles.label, marginBottom: '8px' }}>シールレイアウト</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(layouts).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleLayoutChange(key)}
                style={styles.layoutButton(layout === key)}
              >
                {value.name}
              </button>
            ))}
          </div>
        </div>

        {/* 一括操作ボタン */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={fillAllSeals} style={{ ...styles.button, ...styles.greenButton, fontSize: '12px' }}>
            <Plus size={18} />
            全面に同じテキストを入力
          </button>
          <button onClick={duplicateFirst} style={{ ...styles.button, ...styles.blueButton, fontSize: '12px' }}>
            <Copy size={18} />
            1枚目を全面にコピー
          </button>
          <button onClick={clearAllSeals} style={{ ...styles.button, ...styles.redButton, fontSize: '12px' }}>
            <Trash2 size={18} />
            全クリア
          </button>
        </div>
      </div>

      {/* タブとコンテンツ */}
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          {/* タブヘッダー */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            <button onClick={() => setActiveTab('input')} style={styles.tabButton(activeTab === 'input')}>
              📝 テキスト入力
            </button>
            <button onClick={() => setActiveTab('preview')} style={styles.tabButton(activeTab === 'preview')}>
              👁️ プレビュー
            </button>
          </div>

          {/* タブコンテンツ */}
          <div style={{ padding: '24px' }}>
            {/* 入力フォーム */}
            {activeTab === 'input' && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>
                  テキスト入力
                </h2>

                {/* 全体設定セクション */}
                <div style={styles.globalSettingsPanel}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#312e81' }}>🎨 全体共通設定</h3>
                    <button
                      onClick={() => setShowGlobalSettings(!showGlobalSettings)}
                      style={{ fontSize: '14px', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                    >
                      {showGlobalSettings ? '閉じる ▲' : '設定を開く ▼'}
                    </button>
                  </div>

                  {showGlobalSettings && (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label style={styles.label}>フォント</label>
                          <select
                            value={globalSettings.fontFamily}
                            onChange={(e) => handleGlobalSettingChange('fontFamily', e.target.value)}
                            style={styles.select}
                          >
                            {fontOptions.map(group => (
                              <optgroup key={group.group} label={group.group}>
                                {group.options.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={styles.label}>フォントサイズ: {globalSettings.fontSize}pt</label>
                          <input
                            type="range"
                            min="6"
                            max="24"
                            value={globalSettings.fontSize}
                            onChange={(e) => handleGlobalSettingChange('fontSize', parseInt(e.target.value))}
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={styles.label}>文字色</label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {colorPresets.map(color => (
                            <button
                              key={color.value}
                              onClick={() => handleGlobalSettingChange('textColor', color.value)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                border: globalSettings.textColor === color.value ? '3px solid #4f46e5' : '2px solid #d1d5db',
                                background: color.value,
                                cursor: 'pointer',
                                padding: 0
                              }}
                              title={color.name}
                            />
                          ))}
                          <input
                            type="color"
                            value={globalSettings.textColor}
                            onChange={(e) => handleGlobalSettingChange('textColor', e.target.value)}
                            style={{ width: '28px', height: '28px', border: 'none', cursor: 'pointer', padding: 0 }}
                            title="カスタム色"
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={styles.label}>縦位置</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {(['top', 'center', 'bottom'] as const).map(v => (
                            <button
                              key={v}
                              onClick={() => handleGlobalSettingChange('alignVertical', v)}
                              style={styles.alignButton(globalSettings.alignVertical === v)}
                            >
                              {v === 'top' ? '上' : v === 'center' ? '中央' : '下'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={styles.label}>横位置</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {(['left', 'center', 'right'] as const).map(h => (
                            <button
                              key={h}
                              onClick={() => handleGlobalSettingChange('alignHorizontal', h)}
                              style={styles.alignButton(globalSettings.alignHorizontal === h)}
                            >
                              {h === 'left' ? '左' : h === 'center' ? '中央' : '右'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={applyGlobalSettings}
                        style={{
                          width: '100%',
                          padding: '12px 24px',
                          background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        ✨ 全シールに共通設定を適用
                      </button>
                    </div>
                  )}
                </div>

                {/* 個別設定リスト */}
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151', marginBottom: '12px' }}>
                  個別シール設定
                </h3>
                <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
                  {Array.from({ length: totalSeals }).map((_, index) => {
                    const seal = sealData[index];
                    return (
                      <div key={index} style={{ ...styles.sealItem, marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#4f46e5' }}>
                            {index + 1}枚目
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {index < totalSeals - 1 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>下に</span>
                                <select
                                  id={`copy-count-${index}`}
                                  style={{ padding: '4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  defaultValue="1"
                                >
                                  {Array.from({ length: totalSeals - index - 1 }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>{num}</option>
                                  ))}
                                </select>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>行</span>
                                <button
                                  onClick={() => {
                                    const selectElement = document.getElementById(`copy-count-${index}`) as HTMLSelectElement | null;
                                    if (!selectElement) return;
                                    copyToBelow(index, parseInt(selectElement.value));
                                  }}
                                  style={{ padding: '4px 8px', fontSize: '12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  コピー
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                              style={{ fontSize: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              {editingIndex === index ? '閉じる ▲' : '詳細設定 ▼'}
                            </button>
                          </div>
                        </div>

                        {/* テキスト入力とプレビュー */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                          <textarea
                            value={seal.text}
                            onChange={(e) => handleSealChange(index, 'text', e.target.value)}
                            placeholder="テキストを入力"
                            style={styles.textarea}
                            rows={3}
                          />
                          {/* ミニプレビュー */}
                          <div style={{ flexShrink: 0 }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', textAlign: 'center' }}>プレビュー</div>
                            <div
                              style={{
                                width: `${currentLayout.width * 2}px`,
                                height: `${currentLayout.height * 2}px`,
                                border: '2px solid #9ca3af',
                                background: 'white',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '4px',
                                boxSizing: 'border-box',
                                overflow: 'hidden'
                              }}
                            >
                              {seal.image && seal.imagePosition === 'top' && (
                                <div style={{ display: 'flex', justifyContent: seal.imageAlignHorizontal === 'center' ? 'center' : seal.imageAlignHorizontal === 'left' ? 'flex-start' : 'flex-end', marginBottom: '2px' }}>
                                  <img src={seal.image} alt="" style={{ width: `${seal.imageSize}%`, height: 'auto', maxHeight: `${currentLayout.height * 0.8}px`, objectFit: 'contain' }} />
                                </div>
                              )}
                              {seal.text && (
                                <div style={{
                                  flex: '1 1 auto',
                                  display: 'flex',
                                  alignItems: seal.alignVertical === 'top' ? 'flex-start' : seal.alignVertical === 'bottom' ? 'flex-end' : 'center',
                                  justifyContent: seal.alignHorizontal === 'left' ? 'flex-start' : seal.alignHorizontal === 'right' ? 'flex-end' : 'center',
                                  textAlign: seal.alignHorizontal,
                                  fontSize: `${seal.fontSize * 0.5}pt`,
                                  fontFamily: seal.fontFamily,
                                  color: seal.textColor || '#000000',
                                  wordBreak: 'break-word',
                                  lineHeight: 1.4,
                                  whiteSpace: 'pre-wrap',
                                  width: '100%'
                                }}>
                                  {seal.text}
                                </div>
                              )}
                              {seal.image && seal.imagePosition === 'center' && !seal.text && (
                                <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: seal.imageAlignHorizontal === 'center' ? 'center' : seal.imageAlignHorizontal === 'left' ? 'flex-start' : 'flex-end' }}>
                                  <img src={seal.image} alt="" style={{ width: `${seal.imageSize}%`, height: 'auto', maxHeight: `${currentLayout.height * 1.6}px`, objectFit: 'contain' }} />
                                </div>
                              )}
                              {seal.image && seal.imagePosition === 'bottom' && (
                                <div style={{ display: 'flex', justifyContent: seal.imageAlignHorizontal === 'center' ? 'center' : seal.imageAlignHorizontal === 'left' ? 'flex-start' : 'flex-end', marginTop: '2px' }}>
                                  <img src={seal.image} alt="" style={{ width: `${seal.imageSize}%`, height: 'auto', maxHeight: `${currentLayout.height * 0.8}px`, objectFit: 'contain' }} />
                                </div>
                              )}
                              {!seal.text && !seal.image && (
                                <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ color: '#ccc', fontSize: `${seal.fontSize * 0.4}pt` }}>{index + 1}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 詳細設定 */}
                        {editingIndex === index && (
                          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                            {/* 画像設定 */}
                            <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                              <label style={styles.label}>🖼️ 画像</label>
                              {!seal.image ? (
                                <div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                        handleImageUpload(index, e.target.files[0]);
                                      }
                                    }}
                                    style={{ display: 'none' }}
                                    id={`image-upload-${index}`}
                                  />
                                  <label
                                    htmlFor={`image-upload-${index}`}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(index, e)}
                                    style={{
                                      display: 'block',
                                      padding: '12px',
                                      textAlign: 'center',
                                      background: 'white',
                                      border: '2px dashed #d1d5db',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      color: '#6b7280'
                                    }}
                                  >
                                    📁 画像を選択 / ドラッグ&ドロップ
                                  </label>
                                  <div
                                    onPaste={(e) => handleImagePaste(index, e)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(index, e)}
                                    contentEditable
                                    suppressContentEditableWarning
                                    style={{
                                      marginTop: '8px',
                                      padding: '12px',
                                      textAlign: 'center',
                                      background: 'white',
                                      border: '2px dashed #d1d5db',
                                      borderRadius: '8px',
                                      fontSize: '14px',
                                      color: '#9ca3af'
                                    }}
                                  >
                                    または ここをクリックして Ctrl+V
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                                    <img src={seal.image} alt="" style={{ maxHeight: '80px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                                  </div>
                                  <button
                                    onClick={() => removeImage(index)}
                                    style={{ width: '100%', padding: '6px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginBottom: '12px' }}
                                  >
                                    画像を削除
                                  </button>
                                  <div style={{ marginBottom: '8px' }}>
                                    <label style={styles.label}>画像位置（縦）</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      {(['top', 'center', 'bottom'] as const).map(pos => (
                                        <button
                                          key={pos}
                                          onClick={() => handleSealChange(index, 'imagePosition', pos)}
                                          style={styles.alignButton(seal.imagePosition === pos)}
                                        >
                                          {pos === 'top' ? '上' : pos === 'center' ? '中央' : '下'}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div style={{ marginBottom: '8px' }}>
                                    <label style={styles.label}>画像位置（横）</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      {(['left', 'center', 'right'] as const).map(pos => (
                                        <button
                                          key={pos}
                                          onClick={() => handleSealChange(index, 'imageAlignHorizontal', pos)}
                                          style={styles.alignButton(seal.imageAlignHorizontal === pos)}
                                        >
                                          {pos === 'left' ? '左' : pos === 'center' ? '中央' : '右'}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <label style={styles.label}>画像サイズ: {seal.imageSize}%</label>
                                    <input
                                      type="range"
                                      min="5"
                                      max="100"
                                      step="5"
                                      value={seal.imageSize}
                                      onChange={(e) => handleSealChange(index, 'imageSize', parseInt(e.target.value))}
                                      style={{ width: '100%' }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* フォント設定 */}
                            <div style={{ marginBottom: '12px' }}>
                              <label style={styles.label}>フォント</label>
                              <select
                                value={seal.fontFamily}
                                onChange={(e) => handleSealChange(index, 'fontFamily', e.target.value)}
                                style={styles.select}
                              >
                                {fontOptions.map(group => (
                                  <optgroup key={group.group} label={group.group}>
                                    {group.options.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                              <label style={styles.label}>フォントサイズ: {seal.fontSize}pt</label>
                              <input
                                type="range"
                                min="6"
                                max="24"
                                value={seal.fontSize}
                                onChange={(e) => handleSealChange(index, 'fontSize', parseInt(e.target.value))}
                                style={{ width: '100%' }}
                              />
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                              <label style={styles.label}>文字色</label>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {colorPresets.map(color => (
                                  <button
                                    key={color.value}
                                    onClick={() => handleSealChange(index, 'textColor', color.value)}
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '50%',
                                      border: seal.textColor === color.value ? '3px solid #4f46e5' : '2px solid #d1d5db',
                                      background: color.value,
                                      cursor: 'pointer',
                                      padding: 0
                                    }}
                                    title={color.name}
                                  />
                                ))}
                                <input
                                  type="color"
                                  value={seal.textColor || '#000000'}
                                  onChange={(e) => handleSealChange(index, 'textColor', e.target.value)}
                                  style={{ width: '24px', height: '24px', border: 'none', cursor: 'pointer', padding: 0 }}
                                  title="カスタム色"
                                />
                              </div>
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                              <label style={styles.label}>縦位置</label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {(['top', 'center', 'bottom'] as const).map(v => (
                                  <button
                                    key={v}
                                    onClick={() => handleSealChange(index, 'alignVertical', v)}
                                    style={styles.alignButton(seal.alignVertical === v)}
                                  >
                                    {v === 'top' ? '上' : v === 'center' ? '中央' : '下'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label style={styles.label}>横位置</label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {(['left', 'center', 'right'] as const).map(h => (
                                  <button
                                    key={h}
                                    onClick={() => handleSealChange(index, 'alignHorizontal', h)}
                                    style={styles.alignButton(seal.alignHorizontal === h)}
                                  >
                                    {h === 'left' ? '左' : h === 'center' ? '中央' : '右'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* プレビュー */}
            {activeTab === 'preview' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#374151', margin: 0 }}>プレビュー</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[
                        { label: '30%', value: 0.3 },
                        { label: '50%', value: 0.5 },
                        { label: '75%', value: 0.75 },
                        { label: '100%', value: 1 },
                      ].map(preset => (
                        <button
                          key={preset.label}
                          onClick={() => setPreviewScale(preset.value)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            background: Math.abs(previewScale - preset.value) < 0.01 ? '#4f46e5' : '#e5e7eb',
                            color: Math.abs(previewScale - preset.value) < 0.01 ? 'white' : '#374151',
                            fontWeight: '500'
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => setPreviewScale(Math.max(0.2, previewScale - 0.1))}
                        style={{ ...styles.button, ...styles.grayButton, padding: '4px 12px', fontSize: '16px' }}
                      >
                        −
                      </button>
                      <span style={{ fontSize: '14px', fontWeight: '600', minWidth: '50px', textAlign: 'center' }}>
                        {Math.round(previewScale * 100)}%
                      </span>
                      <button
                        onClick={() => setPreviewScale(Math.min(1, previewScale + 0.1))}
                        style={{ ...styles.button, ...styles.grayButton, padding: '4px 12px', fontSize: '16px' }}
                      >
                        ＋
                      </button>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      step="5"
                      value={previewScale * 100}
                      onChange={(e) => setPreviewScale(parseInt(e.target.value) / 100)}
                      style={{ width: '100px' }}
                    />
                  </div>
                </div>
                <div style={{ border: '2px solid #d1d5db', borderRadius: '8px', padding: '16px', background: '#f9fafb', overflow: 'auto' }}>
                  <div style={{ width: `calc(210mm * ${previewScale})`, height: `calc(297mm * ${previewScale})`, margin: '0 auto' }}>
                    <div
                      ref={printRef}
                      id="print-area"
                      style={{
                        position: 'relative',
                        background: 'white',
                        width: '210mm',
                        height: '297mm',
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'top left',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${currentLayout.cols}, 1fr)`,
                        gap: `${currentLayout.gap}mm`,
                        paddingTop: `${10 + printOffset.top}mm`,
                        paddingLeft: `${10 + printOffset.left}mm`,
                        paddingRight: `${10 + printOffset.right}mm`,
                        paddingBottom: `${10 + printOffset.bottom}mm`
                      }}
                    >
                      {sealData.map((seal, index) => {
                        // 開始ラベル番号より前は空白で表示（印刷時のスキップ用）
                        const isSkipped = index < (printSettings.startLabel - 1);

                        return (
                        <div
                          key={index}
                          style={{
                            width: `${currentLayout.width}mm`,
                            height: `${currentLayout.height}mm`,
                            border: '1px solid #ddd',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '2mm',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            background: isSkipped ? '#f9fafb' : 'white'
                          }}
                        >
                          {isSkipped ? (
                            <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: '#ccc', fontSize: '8pt' }}>スキップ</span>
                            </div>
                          ) : (
                            <>
                          {seal.image && seal.imagePosition === 'top' && (
                            <div style={{ display: 'flex', justifyContent: seal.imageAlignHorizontal === 'center' ? 'center' : seal.imageAlignHorizontal === 'left' ? 'flex-start' : 'flex-end', marginBottom: '1mm' }}>
                              <img src={seal.image} alt="" style={{ width: `${seal.imageSize}%`, height: 'auto', maxHeight: `${currentLayout.height * 0.4}mm`, objectFit: 'contain' }} />
                            </div>
                          )}
                          {seal.text && (
                            <div
                              style={{
                                flex: '1 1 auto',
                                display: 'flex',
                                alignItems: seal.alignVertical === 'top' ? 'flex-start' : seal.alignVertical === 'bottom' ? 'flex-end' : 'center',
                                justifyContent: seal.alignHorizontal === 'left' ? 'flex-start' : seal.alignHorizontal === 'right' ? 'flex-end' : 'center',
                                textAlign: seal.alignHorizontal,
                                fontSize: `${seal.fontSize}pt`,
                                fontFamily: seal.fontFamily,
                                color: seal.textColor || '#000000',
                                wordBreak: 'break-word',
                                lineHeight: 1.4,
                                whiteSpace: 'pre-wrap',
                                width: '100%'
                              }}
                            >
                              {seal.text}
                            </div>
                          )}
                          {seal.image && seal.imagePosition === 'center' && !seal.text && (
                            <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: seal.imageAlignHorizontal === 'center' ? 'center' : seal.imageAlignHorizontal === 'left' ? 'flex-start' : 'flex-end' }}>
                              <img src={seal.image} alt="" style={{ width: `${seal.imageSize}%`, height: 'auto', maxHeight: `${currentLayout.height * 0.8}mm`, objectFit: 'contain' }} />
                            </div>
                          )}
                          {seal.image && seal.imagePosition === 'bottom' && (
                            <div style={{ display: 'flex', justifyContent: seal.imageAlignHorizontal === 'center' ? 'center' : seal.imageAlignHorizontal === 'left' ? 'flex-start' : 'flex-end', marginTop: '1mm' }}>
                              <img src={seal.image} alt="" style={{ width: `${seal.imageSize}%`, height: 'auto', maxHeight: `${currentLayout.height * 0.4}mm`, objectFit: 'contain' }} />
                            </div>
                          )}
                          {!seal.text && !seal.image && (
                            <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: '#ccc', fontSize: '10pt' }}>{index + 1}</span>
                            </div>
                          )}
                            </>
                          )}
                        </div>
                      );
                      })}
                    </div>

                    {/* カットマーク */}
                    {showGuides.cutMarks && (
                      <>
                        {/* 四隅のカットマーク */}
                        <div style={{ position: 'absolute', top: '3mm', left: '3mm', width: '5mm', height: '5mm', borderTop: '1px solid #000', borderLeft: '1px solid #000' }} />
                        <div style={{ position: 'absolute', top: '3mm', right: '3mm', width: '5mm', height: '5mm', borderTop: '1px solid #000', borderRight: '1px solid #000' }} />
                        <div style={{ position: 'absolute', bottom: '3mm', left: '3mm', width: '5mm', height: '5mm', borderBottom: '1px solid #000', borderLeft: '1px solid #000' }} />
                        <div style={{ position: 'absolute', bottom: '3mm', right: '3mm', width: '5mm', height: '5mm', borderBottom: '1px solid #000', borderRight: '1px solid #000' }} />
                        {/* 中央のカットマーク */}
                        <div style={{ position: 'absolute', top: '3mm', left: '50%', transform: 'translateX(-50%)', width: '1px', height: '5mm', background: '#000' }} />
                        <div style={{ position: 'absolute', bottom: '3mm', left: '50%', transform: 'translateX(-50%)', width: '1px', height: '5mm', background: '#000' }} />
                        <div style={{ position: 'absolute', left: '3mm', top: '50%', transform: 'translateY(-50%)', height: '1px', width: '5mm', background: '#000' }} />
                        <div style={{ position: 'absolute', right: '3mm', top: '50%', transform: 'translateY(-50%)', height: '1px', width: '5mm', background: '#000' }} />
                      </>
                    )}

                    {/* センターライン */}
                    {showGuides.centerLine && (
                      <>
                        <div style={{ position: 'absolute', top: 0, left: '50%', width: '1px', height: '100%', borderLeft: '1px dashed #ccc' }} />
                        <div style={{ position: 'absolute', left: 0, top: '50%', height: '1px', width: '100%', borderTop: '1px dashed #ccc' }} />
                      </>
                    )}

                    {/* テストパターン */}
                    {showGuides.testPattern && (
                      <div style={{ position: 'absolute', bottom: '5mm', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', fontSize: '8pt', color: '#666' }}>
                        <div style={{ marginBottom: '2mm', display: 'flex', gap: '2mm', justifyContent: 'center' }}>
                          {[0, 1, 2, 3, 4].map(i => (
                            <div key={i} style={{ width: '10mm', height: '3mm', background: i % 2 === 0 ? '#000' : '#fff', border: '0.5px solid #000' }} />
                          ))}
                        </div>
                        <div>印刷テストパターン - 10mm単位</div>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 保存モーダル */}
      {showSaveModal && (
        <div style={styles.modal} onClick={() => setShowSaveModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#374151', margin: 0 }}>
                💾 テンプレートを保存
              </h2>
              <button
                onClick={() => setShowSaveModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>テンプレート名</label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="例: 商品ラベル、住所シール..."
                style={styles.input}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowSaveModal(false)}
                style={{ ...styles.button, ...styles.grayButton, flex: 1 }}
              >
                キャンセル
              </button>
              <button
                onClick={saveTemplate}
                style={{ ...styles.button, ...styles.primaryButton, flex: 1 }}
              >
                <Save size={18} />
                {currentTemplateId ? '上書き保存' : '新規保存'}
              </button>
            </div>
            {currentTemplateId && (
              <button
                onClick={() => {
                  setCurrentTemplateId(null);
                  setSaveName('');
                }}
                style={{ marginTop: '12px', fontSize: '14px', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'center' }}
              >
                別名で新規保存する
              </button>
            )}
          </div>
        </div>
      )}

      {/* 読み込みモーダル */}
      {showLoadModal && (
        <div style={styles.modal} onClick={() => setShowLoadModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#374151', margin: 0 }}>
                📂 テンプレートを読み込み
              </h2>
              <button
                onClick={() => setShowLoadModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>
            {savedTemplates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>📭</p>
                <p>保存されたテンプレートがありません</p>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {savedTemplates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => loadTemplate(template)}
                    style={{
                      ...styles.templateItem,
                      background: currentTemplateId === template.id ? '#eef2ff' : 'white',
                      borderColor: currentTemplateId === template.id ? '#4f46e5' : '#e5e7eb'
                    }}
                    onMouseEnter={(e) => {
                      if (currentTemplateId !== template.id) {
                        e.currentTarget.style.background = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentTemplateId !== template.id) {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                          {template.name}
                          {currentTemplateId === template.id && (
                            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#4f46e5' }}>（編集中）</span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {layouts[template.layout]?.name || template.layout} ・
                          更新: {new Date(template.updatedAt).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteTemplate(template.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          color: '#dc2626'
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowLoadModal(false)}
              style={{ ...styles.button, ...styles.grayButton, width: '100%', marginTop: '16px', justifyContent: 'center' }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* プリセット保存モーダル */}
      {showPresetSaveModal && (
        <div style={styles.modal} onClick={() => setShowPresetSaveModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#374151', margin: 0 }}>
                📄 用紙プリセットを保存
              </h2>
              <button
                onClick={() => setShowPresetSaveModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              現在のレイアウト（{layouts[layout].name}）と印刷位置設定を保存します。
            </p>
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px', color: '#6b7280' }}>
              <div>上余白: {printOffset.top}mm</div>
              <div>左余白: {printOffset.left}mm</div>
              <div>右余白: {printOffset.right}mm</div>
              <div>下余白: {printOffset.bottom}mm</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>プリセット名</label>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="例: 自宅プリンター用、会社プリンター用..."
                style={styles.input}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowPresetSaveModal(false)}
                style={{ ...styles.button, ...styles.grayButton, flex: 1 }}
              >
                キャンセル
              </button>
              <button
                onClick={savePaperPreset}
                style={{ ...styles.button, ...styles.greenButton, flex: 1 }}
              >
                <Save size={18} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 可変データ印刷モーダル */}
      {showVariableDataModal && (
        <div style={styles.modal} onClick={() => setShowVariableDataModal(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#374151', margin: 0 }}>
                📊 可変データ印刷
              </h2>
              <button
                onClick={() => setShowVariableDataModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              CSVファイルを読み込んで、各シールに異なるデータを差し込みます。<br />
              テンプレートのテキストに <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '4px' }}>{'{{列名}}'}</code> を入力してください。
            </p>

            {/* CSV読み込み */}
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
              <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>CSVファイル</label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleCSVUpload(e.target.files[0]);
                  }
                }}
                style={{ marginBottom: '8px' }}
              />
              {csvHeaders.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#16a34a' }}>
                  ✓ {csvData.length}件のデータ、列: {csvHeaders.join(', ')}
                </div>
              )}
            </div>

            {/* 通番設定 */}
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={serialNumberSettings.enabled}
                  onChange={(e) => setSerialNumberSettings({ ...serialNumberSettings, enabled: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontWeight: '600', color: '#374151' }}>通番を使用する</span>
              </label>

              {serialNumberSettings.enabled && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>接頭辞</label>
                    <input
                      type="text"
                      value={serialNumberSettings.prefix}
                      onChange={(e) => setSerialNumberSettings({ ...serialNumberSettings, prefix: e.target.value })}
                      placeholder="例: No."
                      style={{ ...styles.input, width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>開始番号</label>
                    <input
                      type="number"
                      min="0"
                      value={serialNumberSettings.startNumber}
                      onChange={(e) => setSerialNumberSettings({ ...serialNumberSettings, startNumber: parseInt(e.target.value) || 0 })}
                      style={{ ...styles.input, width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>桁数</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={serialNumberSettings.digits}
                      onChange={(e) => setSerialNumberSettings({ ...serialNumberSettings, digits: Math.max(1, parseInt(e.target.value) || 1) })}
                      style={{ ...styles.input, width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>接尾辞</label>
                    <input
                      type="text"
                      value={serialNumberSettings.suffix}
                      onChange={(e) => setSerialNumberSettings({ ...serialNumberSettings, suffix: e.target.value })}
                      placeholder="例: 号"
                      style={{ ...styles.input, width: '100%' }}
                    />
                  </div>
                </div>
              )}

              {serialNumberSettings.enabled && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                  プレビュー: {generateSerialNumber(0)}, {generateSerialNumber(1)}, {generateSerialNumber(2)}...
                  <br />
                  テンプレートに <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '4px' }}>{'{{通番}}'}</code> を入力してください。
                </div>
              )}
            </div>

            {/* ボタン */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowVariableDataModal(false)}
                style={{ ...styles.button, ...styles.grayButton, flex: 1 }}
              >
                閉じる
              </button>
              {(csvData.length > 0 || serialNumberSettings.enabled) && (
                <button
                  onClick={applyCSVData}
                  style={{ ...styles.button, ...styles.greenButton, flex: 1 }}
                >
                  データを適用
                </button>
              )}
              {serialNumberSettings.enabled && csvData.length === 0 && (
                <button
                  onClick={applySerialNumbers}
                  style={{ ...styles.button, ...styles.blueButton, flex: 1 }}
                >
                  通番のみ適用
                </button>
              )}
              {variableDataMode && (
                <button
                  onClick={clearVariableData}
                  style={{ ...styles.button, ...styles.redButton, flex: 1 }}
                >
                  クリア
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 印刷用スタイル */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SealMaker;
