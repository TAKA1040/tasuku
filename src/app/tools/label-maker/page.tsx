'use client';

import dynamic from 'next/dynamic';

// クライアントサイドのみでレンダリング（window.print等を使用するため）
const SealMaker = dynamic(() => import('./seal-maker'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-xl text-indigo-600">読み込み中...</div>
    </div>
  )
});

export default function LabelMakerPage() {
  return <SealMaker />;
}
