'use client';

import React, { useState, useRef } from 'react';
import { Printer, Plus, Trash2, Copy } from 'lucide-react';

// 型定義
interface SealData {
  text: string;
  fontSize: number;
  fontFamily: string;
  alignVertical: 'top' | 'center' | 'bottom';
  alignHorizontal: 'left' | 'center' | 'right';
  image: string | null;
  imageSize: number;
  imagePosition: 'top' | 'center' | 'bottom';
  imageAlignHorizontal: 'left' | 'center' | 'right';
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

interface GlobalSettings {
  fontSize: number;
  fontFamily: string;
  alignVertical: 'top' | 'center' | 'bottom';
  alignHorizontal: 'left' | 'center' | 'right';
}

const createDefaultSeal = (fontSize: number = 11): SealData => ({
  text: '',
  fontSize,
  fontFamily: 'sans-serif',
  alignVertical: 'center',
  alignHorizontal: 'center',
  image: null,
  imageSize: 50,
  imagePosition: 'top',
  imageAlignHorizontal: 'center'
});

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
    alignVertical: 'center',
    alignHorizontal: 'center'
  });
  const printRef = useRef<HTMLDivElement>(null);

  const layouts: Record<string, LayoutConfig> = {
    '10': {
      name: '10面（名刺サイズ）',
      cols: 2,
      rows: 5,
      width: 91,
      height: 55,
      gap: 3,
      fontSize: 14
    },
    '24': {
      name: '24面',
      cols: 3,
      rows: 8,
      width: 64,
      height: 33.9,
      gap: 2.5,
      fontSize: 11
    },
    '40': {
      name: '40面',
      cols: 5,
      rows: 8,
      width: 48.3,
      height: 25.4,
      gap: 2,
      fontSize: 9
    },
    '44': {
      name: '44面',
      cols: 4,
      rows: 11,
      width: 48.3,
      height: 25.4,
      gap: 2,
      fontSize: 9
    },
    '65': {
      name: '65面',
      cols: 5,
      rows: 13,
      width: 38.1,
      height: 21.2,
      gap: 1.5,
      fontSize: 8
    }
  };

  const currentLayout = layouts[layout];
  const totalSeals = currentLayout.cols * currentLayout.rows;

  const handleLayoutChange = (newLayout: string) => {
    setLayout(newLayout);
    const newTotal = layouts[newLayout].cols * layouts[newLayout].rows;
    setSealData(
      Array(newTotal).fill(null).map(() => createDefaultSeal(layouts[newLayout].fontSize))
    );
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
      setSealData(
        Array(totalSeals).fill(null).map(() => ({
          text: '',
          fontSize: currentLayout.fontSize,
          fontFamily: 'sans-serif',
          alignVertical: 'center',
          alignHorizontal: 'center',
          image: null,
          imageSize: 50,
          imagePosition: 'top',
          imageAlignHorizontal: 'center'
        }))
      );
      setEditingIndex(null);
    }
  };

  const duplicateFirst = () => {
    if (sealData[0].text) {
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

  const _handleExport = () => {
    const _printContent = printRef.current;
    const newWindow = window.open('', '', 'width=800,height=600');
    if (!newWindow) return;
    
    const sealsHTML = sealData.map((seal, index) => {
      let content = '';
      
      const imageAlign = seal.imageAlignHorizontal === 'center' ? 'center' : seal.imageAlignHorizontal === 'left' ? 'flex-start' : 'flex-end';
      
      // 画像が上の場合
      if (seal.image && seal.imagePosition === 'top') {
        content += `<div style="display: flex; justify-content: ${imageAlign}; margin-bottom: 1mm;">
          <img src="${seal.image}" style="width: ${seal.imageSize}%; height: auto; max-height: ${currentLayout.height * 0.4}mm; object-fit: contain;" />
        </div>`;
      }
      
      // テキスト部分
      if (seal.text) {
        const textAlignV = seal.alignVertical === 'top' ? 'flex-start' : seal.alignVertical === 'bottom' ? 'flex-end' : 'center';
        const textAlignH = seal.alignHorizontal === 'left' ? 'flex-start' : seal.alignHorizontal === 'right' ? 'flex-end' : 'center';
        content += `<div style="flex: 1 1 auto; display: flex; align-items: ${textAlignV}; justify-content: ${textAlignH}; text-align: ${seal.alignHorizontal}; font-size: ${seal.fontSize}pt; font-family: ${seal.fontFamily}; word-break: break-word; overflow-wrap: break-word; line-height: 1.4; white-space: pre-wrap; width: 100%;">
          ${seal.text}
        </div>`;
      }
      
      // 画像が中央の場合（テキストなし）
      if (seal.image && seal.imagePosition === 'center' && !seal.text) {
        content += `<div style="flex: 1 1 auto; display: flex; align-items: center; justify-content: ${imageAlign};">
          <img src="${seal.image}" style="width: ${seal.imageSize}%; height: auto; max-height: ${currentLayout.height * 0.8}mm; object-fit: contain;" />
        </div>`;
      }
      
      // 画像が下の場合
      if (seal.image && seal.imagePosition === 'bottom') {
        content += `<div style="display: flex; justify-content: ${imageAlign}; margin-top: 1mm;">
          <img src="${seal.image}" style="width: ${seal.imageSize}%; height: auto; max-height: ${currentLayout.height * 0.4}mm; object-fit: contain;" />
        </div>`;
      }
      
      // 空の場合
      if (!seal.text && !seal.image) {
        content = `<div style="flex: 1 1 auto; display: flex; align-items: center; justify-content: center;">
          <span style="color: #ccc; font-size: 10pt;">${index + 1}</span>
        </div>`;
      }
      
      return `
        <div style="
          width: ${currentLayout.width}mm;
          height: ${currentLayout.height}mm;
          border: 1px solid #ddd;
          display: flex;
          flex-direction: column;
          padding: 2mm;
          box-sizing: border-box;
          overflow: hidden;
        ">
          ${content}
        </div>
      `;
    }).join('');
    
    newWindow.document.write(`
      <html>
        <head>
          <title>シール印刷 - ${currentLayout.name}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding-top: ${10 + printOffset.top}mm;
              padding-left: ${10 + printOffset.left}mm;
              padding-right: ${10 + printOffset.right}mm;
              padding-bottom: ${10 + printOffset.bottom}mm;
              font-family: sans-serif;
            }
            .seal-grid {
              display: grid;
              grid-template-columns: repeat(${currentLayout.cols}, 1fr);
              gap: ${currentLayout.gap}mm;
              width: 210mm;
            }
            @media print {
              body { 
                padding-top: ${10 + printOffset.top}mm;
                padding-left: ${10 + printOffset.left}mm;
                padding-right: ${10 + printOffset.right}mm;
                padding-bottom: ${10 + printOffset.bottom}mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="seal-grid">
            ${sealsHTML}
          </div>
        </body>
      </html>
    `);
    newWindow.document.close();
    newWindow.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* ヘッダー */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-indigo-900 mb-2">🏷️ シール職人</h1>
              <p className="text-gray-600">A4サイズのシール印刷ツール</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPrintSettings(!showPrintSettings)}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ⚙️ 印刷調整
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Printer size={20} />
                印刷
              </button>
            </div>
          </div>

          {/* 印刷調整パネル */}
          {showPrintSettings && (
            <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-3">🖨️ 印刷位置の微調整</h3>
              <p className="text-sm text-gray-600 mb-4">
                実際のシール用紙に合わせて印刷位置を調整できます。試し印刷をして位置がずれている場合に使用してください。
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    上余白: {printOffset.top}mm
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={printOffset.top}
                    onChange={(e) => setPrintOffset({...printOffset, top: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => setPrintOffset({...printOffset, top: -5})} className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">-5</button>
                    <button onClick={() => setPrintOffset({...printOffset, top: 0})} className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">0</button>
                    <button onClick={() => setPrintOffset({...printOffset, top: 5})} className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">+5</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    左余白: {printOffset.left}mm
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={printOffset.left}
                    onChange={(e) => setPrintOffset({...printOffset, left: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => setPrintOffset({...printOffset, left: -5})} className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">-5</button>
                    <button onClick={() => setPrintOffset({...printOffset, left: 0})} className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">0</button>
                    <button onClick={() => setPrintOffset({...printOffset, left: 5})} className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">+5</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    右余白: {printOffset.right}mm
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={printOffset.right}
                    onChange={(e) => setPrintOffset({...printOffset, right: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => setPrintOffset({...printOffset, right: -5})} className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">-5</button>
                    <button onClick={() => setPrintOffset({...printOffset, right: 0})} className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">0</button>
                    <button onClick={() => setPrintOffset({...printOffset, right: 5})} className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">+5</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    下余白: {printOffset.bottom}mm
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={printOffset.bottom}
                    onChange={(e) => setPrintOffset({...printOffset, bottom: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => setPrintOffset({...printOffset, bottom: -5})} className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">-5</button>
                    <button onClick={() => setPrintOffset({...printOffset, bottom: 0})} className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">0</button>
                    <button onClick={() => setPrintOffset({...printOffset, bottom: 5})} className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">+5</button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setPrintOffset({ top: 0, left: 0, right: 0, bottom: 0 })}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                >
                  リセット
                </button>
              </div>
            </div>
          )}

          {/* レイアウト選択 */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              シールレイアウト
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(layouts).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleLayoutChange(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    layout === key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {value.name}
                </button>
              ))}
            </div>
          </div>

          {/* 一括操作ボタン */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fillAllSeals}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Plus size={18} />
              全面に同じテキストを入力
            </button>
            <button
              onClick={duplicateFirst}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Copy size={18} />
              1枚目を全面にコピー
            </button>
            <button
              onClick={clearAllSeals}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 size={18} />
              全クリア
            </button>
          </div>
        </div>
      </div>

      {/* タブとコンテンツエリア */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          {/* タブヘッダー */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('input')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'input'
                  ? 'bg-indigo-600 text-white border-b-4 border-indigo-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📝 テキスト入力
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'preview'
                  ? 'bg-indigo-600 text-white border-b-4 border-indigo-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              👁️ プレビュー
            </button>
          </div>

          {/* タブコンテンツ */}
          <div className="p-6">
            {/* 入力フォーム */}
            {activeTab === 'input' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">テキスト入力</h2>
                
                {/* 全体設定セクション */}
                <div className="mb-6 border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-indigo-900">🎨 全体共通設定</h3>
                    <button
                      onClick={() => setShowGlobalSettings(!showGlobalSettings)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      {showGlobalSettings ? '閉じる ▲' : '設定を開く ▼'}
                    </button>
                  </div>

                  {showGlobalSettings && (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* フォント選択 */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            フォント
                          </label>
                          <select
                            value={globalSettings.fontFamily}
                            onChange={(e) => handleGlobalSettingChange('fontFamily', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          >
                            <optgroup label="日本語ゴシック体">
                              <option value="sans-serif">ゴシック（標準）</option>
                              <option value="'メイリオ', 'Meiryo', sans-serif">メイリオ</option>
                              <option value="'游ゴシック', 'Yu Gothic', sans-serif">游ゴシック</option>
                              <option value="'游ゴシック Medium', 'Yu Gothic Medium', sans-serif">游ゴシック Medium</option>
                              <option value="'ヒラギノ角ゴ Pro W3', 'Hiragino Kaku Gothic Pro', sans-serif">ヒラギノ角ゴ</option>
                              <option value="'MS Pゴシック', 'MS PGothic', sans-serif">MS Pゴシック</option>
                              <option value="'MS ゴシック', 'MS Gothic', monospace">MS ゴシック</option>
                            </optgroup>
                            <optgroup label="日本語明朝体">
                              <option value="serif">明朝（標準）</option>
                              <option value="'游明朝', 'Yu Mincho', serif">游明朝</option>
                              <option value="'游明朝 Demibold', 'Yu Mincho Demibold', serif">游明朝 Demibold</option>
                              <option value="'ヒラギノ明朝 Pro W3', 'Hiragino Mincho Pro', serif">ヒラギノ明朝</option>
                              <option value="'MS P明朝', 'MS PMincho', serif">MS P明朝</option>
                              <option value="'MS 明朝', 'MS Mincho', serif">MS 明朝</option>
                            </optgroup>
                            <optgroup label="等幅フォント">
                              <option value="monospace">等幅（標準）</option>
                              <option value="'Courier New', monospace">Courier New</option>
                              <option value="'Consolas', monospace">Consolas</option>
                              <option value="'Monaco', monospace">Monaco</option>
                            </optgroup>
                            <optgroup label="欧文セリフ体">
                              <option value="'Times New Roman', serif">Times New Roman</option>
                              <option value="'Georgia', serif">Georgia</option>
                              <option value="'Garamond', serif">Garamond</option>
                              <option value="'Palatino Linotype', 'Book Antiqua', Palatino, serif">Palatino</option>
                              <option value="'Baskerville', serif">Baskerville</option>
                            </optgroup>
                            <optgroup label="欧文サンセリフ体">
                              <option value="'Arial', sans-serif">Arial</option>
                              <option value="'Helvetica', 'Arial', sans-serif">Helvetica</option>
                              <option value="'Verdana', sans-serif">Verdana</option>
                              <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                              <option value="'Tahoma', sans-serif">Tahoma</option>
                              <option value="'Calibri', sans-serif">Calibri</option>
                              <option value="'Century Gothic', sans-serif">Century Gothic</option>
                            </optgroup>
                            <optgroup label="装飾・特殊フォント">
                              <option value="'Impact', sans-serif">Impact</option>
                              <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                              <option value="'Brush Script MT', cursive">Brush Script MT</option>
                              <option value="'Copperplate', fantasy">Copperplate</option>
                              <option value="'Papyrus', fantasy">Papyrus</option>
                            </optgroup>
                          </select>
                        </div>

                        {/* フォントサイズ */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            フォントサイズ: {globalSettings.fontSize}pt
                          </label>
                          <input
                            type="range"
                            min="6"
                            max="24"
                            value={globalSettings.fontSize}
                            onChange={(e) => handleGlobalSettingChange('fontSize', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* 縦位置 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          縦位置
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGlobalSettingChange('alignVertical', 'top')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                              globalSettings.alignVertical === 'top'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-gray-300'
                            }`}
                          >
                            上
                          </button>
                          <button
                            onClick={() => handleGlobalSettingChange('alignVertical', 'center')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                              globalSettings.alignVertical === 'center'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-gray-300'
                            }`}
                          >
                            中央
                          </button>
                          <button
                            onClick={() => handleGlobalSettingChange('alignVertical', 'bottom')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                              globalSettings.alignVertical === 'bottom'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-gray-300'
                            }`}
                          >
                            下
                          </button>
                        </div>
                      </div>

                      {/* 横位置 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          横位置
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGlobalSettingChange('alignHorizontal', 'left')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                              globalSettings.alignHorizontal === 'left'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-gray-300'
                            }`}
                          >
                            左
                          </button>
                          <button
                            onClick={() => handleGlobalSettingChange('alignHorizontal', 'center')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                              globalSettings.alignHorizontal === 'center'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-gray-300'
                            }`}
                          >
                            中央
                          </button>
                          <button
                            onClick={() => handleGlobalSettingChange('alignHorizontal', 'right')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                              globalSettings.alignHorizontal === 'right'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-gray-300'
                            }`}
                          >
                            右
                          </button>
                        </div>
                      </div>

                      {/* 適用ボタン */}
                      <button
                        onClick={applyGlobalSettings}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                      >
                        ✨ 全シールに共通設定を適用
                      </button>
                    </div>
                  )}
                </div>

                {/* 個別設定リスト */}
                <h3 className="text-lg font-bold text-gray-800 mb-3">個別シール設定</h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {Array.from({ length: totalSeals }).map((_, index) => {
                    const seal = sealData[index];
                    const getAlignment = () => {
                      let alignItems = 'center';
                      let justifyContent = 'center';
                      
                      if (seal.alignVertical === 'top') alignItems = 'flex-start';
                      if (seal.alignVertical === 'bottom') alignItems = 'flex-end';
                      
                      if (seal.alignHorizontal === 'left') justifyContent = 'flex-start';
                      if (seal.alignHorizontal === 'right') justifyContent = 'flex-end';
                      
                      return { alignItems, justifyContent };
                    };
                    
                    const _alignment = getAlignment();

                    return (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <span className="text-sm font-bold text-indigo-600">
                            {index + 1}枚目
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {/* 下にコピー機能 */}
                            {index < totalSeals - 1 && (() => {
                              const remainingCount = totalSeals - index - 1;
                              return (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-600">下に</span>
                                  <select
                                    id={`copy-count-${index}`}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                    defaultValue="1"
                                  >
                                    {Array.from({ length: remainingCount }, (_, i) => i + 1).map(num => (
                                      <option key={num} value={num}>{num}</option>
                                    ))}
                                  </select>
                                  <span className="text-xs text-gray-600">行 (残り{remainingCount}枚)</span>
                                  <button
                                    onClick={() => {
                                      const selectElement = document.getElementById(`copy-count-${index}`) as HTMLSelectElement | null;
                                      if (!selectElement) return;
                                      const count = parseInt(selectElement.value);
                                      copyToBelow(index, count);
                                    }}
                                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                                  >
                                    コピー
                                  </button>
                                </div>
                              );
                            })()}
                            
                            <button
                              onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                              className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
                            >
                              {editingIndex === index ? '閉じる ▲' : '詳細設定 ▼'}
                            </button>
                          </div>
                        </div>
                        
                        {/* テキスト入力とプレビューを横並び */}
                        <div className="flex gap-3 mb-3">
                          <textarea
                            value={seal.text}
                            onChange={(e) => handleSealChange(index, 'text', e.target.value)}
                            placeholder="テキストを入力"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            rows={3}
                          />
                          
                          {/* 個別プレビュー */}
                          <div className="flex-shrink-0">
                            <div className="text-xs text-gray-600 mb-1 text-center">プレビュー</div>
                            <div
                              className="border-2 border-gray-400 bg-white relative"
                              style={{
                                width: `${currentLayout.width * 2}px`,
                                height: `${currentLayout.height * 2}px`,
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '4px',
                                boxSizing: 'border-box',
                                overflow: 'hidden'
                              }}
                            >
                              {/* 画像が上の場合 */}
                              {seal.image && seal.imagePosition === 'top' && (
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: seal.imageAlignHorizontal === 'center' ? 'center' : seal.imageAlignHorizontal === 'left' ? 'flex-start' : 'flex-end',
                                  marginBottom: '2px'
                                }}>
                                  <img 
                                    src={seal.image} 
                                    alt="" 
                                    style={{
                                      width: `${seal.imageSize}%`,
                                      height: 'auto',
                                      maxHeight: `${currentLayout.height * 0.8}px`,
                                      objectFit: 'contain'
                                    }}
                                  />
                                </div>
                              )}
                              
                              {/* テキスト部分 */}
                              {seal.text && (
                                <div
                                  style={{
                                    flex: '1 1 auto',
                                    display: 'flex',
                                    alignItems: seal.alignVertical === 'top' ? 'flex-start' : seal.alignVertical === 'bottom' ? 'flex-end' : 'center',
                                    justifyContent: seal.alignHorizontal === 'left' ? 'flex-start' : seal.alignHorizontal === 'right' ? 'flex-end' : 'center',
                                    textAlign: seal.alignHorizontal,
                                    fontSize: `${seal.fontSize * 0.5}pt`,
                                    fontFamily: seal.fontFamily,
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    lineHeight: '1.4',
                                    whiteSpace: 'pre-wrap',
                                    width: '100%'
                                  }}
                                >
                                  {seal.text}
                                </div>
                              )}
                              
                              {/* 画像が中央の場合（テキストなし） */}
                              {seal.image && seal.imagePosition === 'center' && !seal.text && (
                                <div style={{ 
                                  flex: '1 1 auto',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: seal.imageAlignHorizontal === 'center' ? 'center' : seal.imageAlignHorizontal === 'left' ? 'flex-start' : 'flex-end'
                                }}>
                                  <img 
                                    src={seal.image} 
                                    alt="" 
                                    style={{
                                      width: `${seal.imageSize}%`,
                                      height: 'auto',
                                      maxHeight: `${currentLayout.height * 1.6}px`,
                                      objectFit: 'contain'
                                    }}
                                  />
                                </div>
                              )}
                              
                              {/* 画像が下の場合 */}
                              {seal.image && seal.imagePosition === 'bottom' && (
                                <div style={{ 
                                  display: 'flex',
                                  justifyContent: seal.imageAlignHorizontal === 'center' ? 'center' : seal.imageAlignHorizontal === 'left' ? 'flex-start' : 'flex-end',
                                  marginTop: '2px'
                                }}>
                                  <img 
                                    src={seal.image} 
                                    alt="" 
                                    style={{
                                      width: `${seal.imageSize}%`,
                                      height: 'auto',
                                      maxHeight: `${currentLayout.height * 0.8}px`,
                                      objectFit: 'contain'
                                    }}
                                  />
                                </div>
                              )}
                              
                              {/* 空の場合 */}
                              {!seal.text && !seal.image && (
                                <div style={{
                                  flex: '1 1 auto',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <span style={{ color: '#ccc', fontSize: `${seal.fontSize * 0.4}pt` }}>
                                    {index + 1}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {editingIndex === index && (
                          <div className="space-y-3 pt-3 border-t">
                            {/* 画像設定 */}
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <label className="block text-xs font-semibold text-gray-700 mb-2">
                                🖼️ 画像
                              </label>
                              
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
                                    className="hidden"
                                    id={`image-upload-${index}`}
                                  />
                                  <label
                                    htmlFor={`image-upload-${index}`}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(index, e)}
                                    className="block w-full px-3 py-2 text-center bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                                  >
                                    <span className="text-sm text-gray-600">
                                      📁 画像を選択 / ドラッグ&ドロップ / Ctrl+V で貼り付け
                                    </span>
                                  </label>
                                  <div
                                    onPaste={(e) => handleImagePaste(index, e)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(index, e)}
                                    contentEditable
                                    suppressContentEditableWarning
                                    className="mt-2 px-3 py-2 text-center bg-white border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                                  >
                                    または ここをクリックして Ctrl+V / ドラッグ&ドロップ
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="mb-2 flex justify-center">
                                    <img 
                                      src={seal.image} 
                                      alt="アップロード画像" 
                                      className="max-h-20 border rounded"
                                    />
                                  </div>
                                  <button
                                    onClick={() => removeImage(index)}
                                    className="w-full px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 mb-3"
                                  >
                                    画像を削除
                                  </button>

                                  {/* 画像位置（縦） */}
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                      画像位置（縦）
                                    </label>
                                    <div className="flex gap-2 mb-3">
                                      <button
                                        onClick={() => handleSealChange(index, 'imagePosition', 'top')}
                                        className={`flex-1 px-2 py-1 rounded text-xs ${
                                          seal.imagePosition === 'top'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white border border-gray-300'
                                        }`}
                                      >
                                        上
                                      </button>
                                      <button
                                        onClick={() => handleSealChange(index, 'imagePosition', 'center')}
                                        className={`flex-1 px-2 py-1 rounded text-xs ${
                                          seal.imagePosition === 'center'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white border border-gray-300'
                                        }`}
                                      >
                                        中央
                                      </button>
                                      <button
                                        onClick={() => handleSealChange(index, 'imagePosition', 'bottom')}
                                        className={`flex-1 px-2 py-1 rounded text-xs ${
                                          seal.imagePosition === 'bottom'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white border border-gray-300'
                                        }`}
                                      >
                                        下
                                      </button>
                                    </div>
                                  </div>

                                  {/* 画像位置（横） */}
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                      画像位置（横）
                                    </label>
                                    <div className="flex gap-2 mb-3">
                                      <button
                                        onClick={() => handleSealChange(index, 'imageAlignHorizontal', 'left')}
                                        className={`flex-1 px-2 py-1 rounded text-xs ${
                                          seal.imageAlignHorizontal === 'left'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white border border-gray-300'
                                        }`}
                                      >
                                        左
                                      </button>
                                      <button
                                        onClick={() => handleSealChange(index, 'imageAlignHorizontal', 'center')}
                                        className={`flex-1 px-2 py-1 rounded text-xs ${
                                          seal.imageAlignHorizontal === 'center'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white border border-gray-300'
                                        }`}
                                      >
                                        中央
                                      </button>
                                      <button
                                        onClick={() => handleSealChange(index, 'imageAlignHorizontal', 'right')}
                                        className={`flex-1 px-2 py-1 rounded text-xs ${
                                          seal.imageAlignHorizontal === 'right'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white border border-gray-300'
                                        }`}
                                      >
                                        右
                                      </button>
                                    </div>
                                  </div>

                                  {/* 画像サイズ */}
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                      画像サイズ: {seal.imageSize}%
                                    </label>
                                    <input
                                      type="range"
                                      min="5"
                                      max="100"
                                      step="5"
                                      value={seal.imageSize}
                                      onChange={(e) => handleSealChange(index, 'imageSize', parseInt(e.target.value))}
                                      className="w-full mb-1"
                                    />
                                    <div className="flex gap-1">
                                      {[20, 30, 50, 70, 100].map(size => (
                                        <button
                                          key={size}
                                          onClick={() => handleSealChange(index, 'imageSize', size)}
                                          className="flex-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                        >
                                          {size}%
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* フォント選択 */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                フォント
                              </label>
                              <select
                                value={seal.fontFamily}
                                onChange={(e) => handleSealChange(index, 'fontFamily', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              >
                                <optgroup label="日本語ゴシック体">
                                  <option value="sans-serif">ゴシック（標準）</option>
                                  <option value="'メイリオ', 'Meiryo', sans-serif">メイリオ</option>
                                  <option value="'游ゴシック', 'Yu Gothic', sans-serif">游ゴシック</option>
                                  <option value="'游ゴシック Medium', 'Yu Gothic Medium', sans-serif">游ゴシック Medium</option>
                                  <option value="'ヒラギノ角ゴ Pro W3', 'Hiragino Kaku Gothic Pro', sans-serif">ヒラギノ角ゴ</option>
                                  <option value="'MS Pゴシック', 'MS PGothic', sans-serif">MS Pゴシック</option>
                                  <option value="'MS ゴシック', 'MS Gothic', monospace">MS ゴシック</option>
                                </optgroup>
                                <optgroup label="日本語明朝体">
                                  <option value="serif">明朝（標準）</option>
                                  <option value="'游明朝', 'Yu Mincho', serif">游明朝</option>
                                  <option value="'游明朝 Demibold', 'Yu Mincho Demibold', serif">游明朝 Demibold</option>
                                  <option value="'ヒラギノ明朝 Pro W3', 'Hiragino Mincho Pro', serif">ヒラギノ明朝</option>
                                  <option value="'MS P明朝', 'MS PMincho', serif">MS P明朝</option>
                                  <option value="'MS 明朝', 'MS Mincho', serif">MS 明朝</option>
                                </optgroup>
                                <optgroup label="等幅フォント">
                                  <option value="monospace">等幅（標準）</option>
                                  <option value="'Courier New', monospace">Courier New</option>
                                  <option value="'Consolas', monospace">Consolas</option>
                                  <option value="'Monaco', monospace">Monaco</option>
                                </optgroup>
                                <optgroup label="欧文セリフ体">
                                  <option value="'Times New Roman', serif">Times New Roman</option>
                                  <option value="'Georgia', serif">Georgia</option>
                                  <option value="'Garamond', serif">Garamond</option>
                                  <option value="'Palatino Linotype', 'Book Antiqua', Palatino, serif">Palatino</option>
                                  <option value="'Baskerville', serif">Baskerville</option>
                                </optgroup>
                                <optgroup label="欧文サンセリフ体">
                                  <option value="'Arial', sans-serif">Arial</option>
                                  <option value="'Helvetica', 'Arial', sans-serif">Helvetica</option>
                                  <option value="'Verdana', sans-serif">Verdana</option>
                                  <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                                  <option value="'Tahoma', sans-serif">Tahoma</option>
                                  <option value="'Calibri', sans-serif">Calibri</option>
                                  <option value="'Century Gothic', sans-serif">Century Gothic</option>
                                </optgroup>
                                <optgroup label="装飾・特殊フォント">
                                  <option value="'Impact', sans-serif">Impact</option>
                                  <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                                  <option value="'Brush Script MT', cursive">Brush Script MT</option>
                                  <option value="'Copperplate', fantasy">Copperplate</option>
                                  <option value="'Papyrus', fantasy">Papyrus</option>
                                </optgroup>
                              </select>
                            </div>

                            {/* フォントサイズ */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                フォントサイズ: {seal.fontSize}pt
                              </label>
                              <input
                                type="range"
                                min="6"
                                max="24"
                                value={seal.fontSize}
                                onChange={(e) => handleSealChange(index, 'fontSize', parseInt(e.target.value))}
                                className="w-full"
                              />
                            </div>

                            {/* 縦位置 */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                縦位置
                              </label>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSealChange(index, 'alignVertical', 'top')}
                                  className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                                    seal.alignVertical === 'top'
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-white border border-gray-300'
                                  }`}
                                >
                                  上
                                </button>
                                <button
                                  onClick={() => handleSealChange(index, 'alignVertical', 'center')}
                                  className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                                    seal.alignVertical === 'center'
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-white border border-gray-300'
                                  }`}
                                >
                                  中央
                                </button>
                                <button
                                  onClick={() => handleSealChange(index, 'alignVertical', 'bottom')}
                                  className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                                    seal.alignVertical === 'bottom'
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-white border border-gray-300'
                                  }`}
                                >
                                  下
                                </button>
                              </div>
                            </div>

                            {/* 横位置 */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                横位置
                              </label>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSealChange(index, 'alignHorizontal', 'left')}
                                  className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                                    seal.alignHorizontal === 'left'
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-white border border-gray-300'
                                  }`}
                                >
                                  左
                                </button>
                                <button
                                  onClick={() => handleSealChange(index, 'alignHorizontal', 'center')}
                                  className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                                    seal.alignHorizontal === 'center'
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-white border border-gray-300'
                                  }`}
                                >
                                  中央
                                </button>
                                <button
                                  onClick={() => handleSealChange(index, 'alignHorizontal', 'right')}
                                  className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                                    seal.alignHorizontal === 'right'
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-white border border-gray-300'
                                  }`}
                                >
                                  右
                                </button>
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
                <h2 className="text-xl font-bold text-gray-800 mb-4">プレビュー</h2>
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50 overflow-x-auto">
                  <div
                    ref={printRef}
                    className="bg-white mx-auto"
                    style={{
                      width: '210mm',
                      transform: 'scale(0.5)',
                      transformOrigin: 'top left',
                      height: '297mm'
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
                        const getAlignment = () => {
                          let alignItems = 'center';
                          let justifyContent = 'center';
                          
                          if (seal.alignVertical === 'top') alignItems = 'flex-start';
                          if (seal.alignVertical === 'bottom') alignItems = 'flex-end';
                          
                          if (seal.alignHorizontal === 'left') justifyContent = 'flex-start';
                          if (seal.alignHorizontal === 'right') justifyContent = 'flex-end';
                          
                          return { alignItems, justifyContent };
                        };
                        
                        const _alignment = getAlignment();

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
                              overflow: 'hidden'
                            }}
                          >
                            {/* 画像が上の場合 */}
                            {seal.image && seal.imagePosition === 'top' && (
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: seal.imageAlignHorizontal === 'center' ? 'center' : seal.imageAlignHorizontal === 'left' ? 'flex-start' : 'flex-end',
                                marginBottom: '1mm'
                              }}>
                                <img 
                                  src={seal.image} 
                                  alt="" 
                                  style={{
                                    width: `${seal.imageSize}%`,
                                    height: 'auto',
                                    maxHeight: `${currentLayout.height * 0.4}mm`,
                                    objectFit: 'contain'
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* テキスト部分 */}
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
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                  lineHeight: '1.4',
                                  whiteSpace: 'pre-wrap',
                                  width: '100%'
                                }}
                              >
                                {seal.text}
                              </div>
                            )}
                            
                            {/* 画像が中央の場合（テキストなし） */}
                            {seal.image && seal.imagePosition === 'center' && !seal.text && (
                              <div style={{ 
                                flex: '1 1 auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: seal.imageAlignHorizontal === 'center' ? 'center' : seal.imageAlignHorizontal === 'left' ? 'flex-start' : 'flex-end'
                              }}>
                                <img 
                                  src={seal.image} 
                                  alt="" 
                                  style={{
                                    width: `${seal.imageSize}%`,
                                    height: 'auto',
                                    maxHeight: `${currentLayout.height * 0.8}mm`,
                                    objectFit: 'contain'
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* 画像が下の場合 */}
                            {seal.image && seal.imagePosition === 'bottom' && (
                              <div style={{ 
                                display: 'flex',
                                justifyContent: seal.imageAlignHorizontal === 'center' ? 'center' : seal.imageAlignHorizontal === 'left' ? 'flex-start' : 'flex-end',
                                marginTop: '1mm'
                              }}>
                                <img 
                                  src={seal.image} 
                                  alt="" 
                                  style={{
                                    width: `${seal.imageSize}%`,
                                    height: 'auto',
                                    maxHeight: `${currentLayout.height * 0.4}mm`,
                                    objectFit: 'contain'
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* 空の場合 */}
                            {!seal.text && !seal.image && (
                              <div style={{
                                flex: '1 1 auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <span style={{ color: '#ccc', fontSize: '10pt' }}>
                                  {index + 1}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 印刷用スタイル */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          ${printRef.current ? `
            #print-area,
            #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 210mm;
              transform: none !important;
            }
          ` : ''}
        }
      `}</style>
    </div>
  );
};

export default SealMaker;
