import React, { useState, useEffect } from 'react';
import { 
  CapturedPhoto, 
  getAllCaptures, 
  deleteCapture, 
  clearAllCaptures,
  getCapturesFromServer,
  deleteCaptureFromServer,
  clearCapturesOnServer
} from '../utils/db';
import { playUnlock, playButtonPress } from '../utils/audio';
import { Trash2, ShieldCheck, ShieldAlert, Download, RefreshCw, EyeOff, Sparkles, Sliders, Globe, Camera } from 'lucide-react';

interface SecretLogProps {
  onClose: () => void;
  neonMode: boolean;
  setNeonMode: (mode: boolean) => void;
  steamMode: boolean;
  setSteamMode: (mode: boolean) => void;
  authToken?: string | null;
}

export const SecretLog: React.FC<SecretLogProps> = ({
  onClose,
  neonMode,
  setNeonMode,
  steamMode,
  setSteamMode,
  authToken,
}) => {
  const [code, setCode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [captures, setCaptures] = useState<CapturedPhoto[]>([]);
  const [serverCaptures, setServerCaptures] = useState<CapturedPhoto[]>([]);
  const [activeTab, setActiveTab] = useState<'server' | 'local'>('server');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isUnlocked) {
      loadCaptures();
    }
  }, [isUnlocked]);

  const loadCaptures = async () => {
    setLoading(true);
    try {
      const localData = await getAllCaptures();
      setCaptures(localData.sort((a, b) => b.timestamp - a.timestamp));
      
      const serverData = await getCapturesFromServer(authToken);
      setServerCaptures(serverData.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.error('Failed to load captures:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    playButtonPress();
    if (code === '1917') {
      playUnlock();
      setIsUnlocked(true);
      setErrorMsg('');
    } else {
      setErrorMsg('الرمز غير صحيح! الرجاء التحقق من رمز النظام.');
      // clear error msg after 3s
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleDeleteLocal = async (id: number) => {
    playButtonPress();
    await deleteCapture(id);
    loadCaptures();
  };

  const handleDeleteServer = async (id: number) => {
    playButtonPress();
    await deleteCaptureFromServer(id, authToken);
    loadCaptures();
  };

  const handleClearLocal = async () => {
    if (window.confirm('هل أنت متأكد من مسح جميع الصور المؤرشفة محلياً؟')) {
      playButtonPress();
      await clearAllCaptures();
      loadCaptures();
    }
  };

  const handleClearServer = async () => {
    if (window.confirm('هل أنت متأكد من مسح جميع الصور المشتركة على السيرفر؟')) {
      playButtonPress();
      await clearCapturesOnServer(authToken);
      loadCaptures();
    }
  };

  const handleDownload = (photoBase64: string, id: number) => {
    playButtonPress();
    const link = document.createElement('a');
    link.href = photoBase64;
    link.download = `baker_capture_${id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const displayedCaptures = activeTab === 'server' ? serverCaptures : captures;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 md:p-8 text-right text-white shadow-2xl flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-row-reverse items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Sliders className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight">إعدادات الفرن والمطبخ الذكي</h2>
          </div>
          <button
            onClick={() => { playButtonPress(); onClose(); }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs rounded-full border border-slate-700 text-slate-300"
          >
            إغلاق الإعدادات
          </button>
        </div>

        {/* Standard Config Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3">تخصيص التأثيرات والجماليات</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-900/50">
                <input
                  type="checkbox"
                  checked={neonMode}
                  onChange={(e) => { playButtonPress(); setNeonMode(e.target.checked); }}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="text-sm text-slate-200">وضع النيون المتوهج (أضواء RGB ديسكو)</span>
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-900/50">
                <input
                  type="checkbox"
                  checked={steamMode}
                  onChange={(e) => { playButtonPress(); setSteamMode(e.target.checked); }}
                  className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-sm text-slate-200">تأثير البخار وبلورات الحرارة</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-slate-400 mb-2">تعليمات التشغيل</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              اختر نوع الطبخة (خبز، بيتزا، عجينة، همبرجر)، حدد درجة الحرارة التي تفضلها للفرن، واضغط على زر البدء لتنشيط الحرارة. استمتع بأصوات الفرن التفاعلية والمشهد البصري المتوهج.
            </p>
          </div>
        </div>

        {/* PIN Pad Form */}
        {!isUnlocked ? (
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
              <ShieldAlert className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold">بوابة الوصول المتقدم للمهندسين</h3>
              <p className="text-xs text-slate-400 mt-1">
                الرجاء إدخال رمز المعايرة والترخيص لعرض أرشيف الصور المشتركة السحابية والصور المحلية الكامنة.
              </p>
            </div>

            <form onSubmit={handleVerify} className="flex gap-2 max-w-sm w-full mt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-medium text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)]"
              >
                تحقق
              </button>
              <input
                type="password"
                placeholder="أدخل الرمز المكون من 4 أرقام..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center font-mono font-bold text-white tracking-widest placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </form>

            {errorMsg && (
              <span className="text-xs text-red-500 font-medium animate-pulse">
                {errorMsg}
              </span>
            )}

            <div className="text-[10px] text-slate-600 tracking-wider">
              نظام تشغيل ذكي مدمج • الإصدار 4.0.2 • 2026
            </div>
          </div>
        ) : (
          /* Unlocked Photo Archive! */
          <div className="flex flex-col gap-6 bg-slate-950/60 p-6 rounded-2xl border-2 border-emerald-500/30">
            <div className="flex flex-col md:flex-row-reverse md:items-center justify-between gap-4 border-b border-emerald-950 pb-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                <div>
                  <h3 className="text-lg font-bold text-emerald-400">قاعدة بيانات وأرشيف الصور</h3>
                  <p className="text-xs text-slate-400">
                    يعرض هذا القسم الصور الملتقطة من الكاميرا ومشاركتها مع المستخدمين الآخرين!
                  </p>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 self-end">
                <button
                  onClick={() => { playButtonPress(); setActiveTab('server'); }}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'server'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  سيرفر الصور السحابي ({serverCaptures.length})
                </button>
                <button
                  onClick={() => { playButtonPress(); setActiveTab('local'); }}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'local'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  صوري المحلية ({captures.length})
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={loadCaptures}
                  className="p-2 bg-slate-800 hover:bg-slate-700 active:rotate-90 transition-all rounded-lg text-slate-300"
                  title="تحديث البيانات"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                {displayedCaptures.length > 0 && (
                  <button
                    onClick={activeTab === 'server' ? handleClearServer : handleClearLocal}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 rounded-lg text-red-200 text-xs font-semibold transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    مسح القسم كاملاً
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-t-emerald-500 border-slate-800 animate-spin" />
                <span className="text-xs font-mono">جاري تحميل سجلات الصور...</span>
              </div>
            ) : displayedCaptures.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 gap-2 border border-dashed border-slate-800 rounded-xl">
                <EyeOff className="w-8 h-8 text-slate-700" />
                <h4 className="text-sm font-semibold">لا يوجد صور في هذا القسم حتى الآن</h4>
                <p className="text-xs max-w-sm mt-1 leading-relaxed">
                  {activeTab === 'server' 
                    ? 'التقط صوراً مع تفعيل قبعة الشيف لتظهر لجميع مستخدمي السيرفر!' 
                    : 'قم بالتقاط الصور عند الخبز أو من محطة تصوير الشيف لتخزن محلياً في جهازك.'}
                </p>
              </div>
            ) : (
              /* Captures Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {displayedCaptures.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-lg transition-transform duration-300 hover:scale-[1.02]"
                  >
                    {/* Image frame */}
                    <div className="relative aspect-video bg-black flex items-center justify-center border-b border-slate-800">
                      <img
                        src={item.photo}
                        alt="Baker snap"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/75 rounded-full text-[10px] text-orange-400 border border-orange-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {item.itemType === 'bread' && 'خبزة عائلية'}
                        {item.itemType === 'pizza' && 'بيتزا نابولي'}
                        {item.itemType === 'croissant' && 'كرواسون فرنسي'}
                        {item.itemType === 'cake' && 'كعكة الشوكولاتة'}
                        {item.itemType === 'cookie' && 'كعكة الكوكيز'}
                        {item.itemType === 'pie' && 'فطيرة تفاح'}
                        {item.itemType === 'dough' && 'عجينة مخمرة'}
                        {item.itemType === 'hamburger' && 'همبرجر دبل'}
                      </div>
                      
                      {item.isOfficial && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-950/90 rounded-full text-[9px] text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
                          👨‍🍳 صورة الشيف الرسمية
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-3.5 flex flex-col gap-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-mono text-slate-400">{formatTime(item.timestamp)}</span>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>الحرارة: {item.temperature}°م</span>
                          <span>المعرف: #{item.id}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleDownload(item.photo, item.id!)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          تحميل
                        </button>
                        <button
                          onClick={() => activeTab === 'server' ? handleDeleteServer(item.id!) : handleDeleteLocal(item.id!)}
                          className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg border border-red-900/30 transition-all"
                          title="مسح الصورة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

