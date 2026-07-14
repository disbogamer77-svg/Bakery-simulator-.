import React, { useState, useEffect, useRef } from 'react';
import { Camera, ChefHat, X, Sliders, Sparkles, RotateCcw, Check } from 'lucide-react';
import { playButtonPress } from '../utils/audio';

interface LogoMakerModalProps {
  onClose: () => void;
  onSave: (logoBase64: string) => void;
  isOpen: boolean;
}

export function LogoMakerModal({ onClose, onSave, isOpen }: LogoMakerModalProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Sliders for balancing/aligning the chef hat over the face
  const [chefHatX, setChefHatX] = useState<number>(0); // percentage offset from center (-50 to 50)
  const [chefHatY, setChefHatY] = useState<number>(20); // percentage offset from top (0 to 100)
  const [chefHatScale, setChefHatScale] = useState<number>(1.2); // scale factor (0.5 to 2.5)
  const [chefHatRotate, setChefHatRotate] = useState<number>(0); // degrees rotation (-45 to 45)

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Start camera stream
  const startCamera = async () => {
    setCapturedPhoto(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => console.warn('Video playback failed:', err));
        };
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access denied or failed:', err);
      alert('لم نتمكن من تشغيل الكاميرا. يرجى تفعيل الصلاحية لالتقاط شعار المطعم.');
      setCameraActive(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Handle load / trigger camera
  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    playButtonPress();
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 150);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // 1. Set canvas size to match video aspect
      canvas.width = 640;
      canvas.height = 480;

      // 2. Draw mirrored video frame to make it feel natural like a mirror
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformations

      // 3. Draw chef hat overlay with customized slider adjustments
      // Map percentages to canvas coordinates
      const hatX = canvas.width / 2 + (chefHatX / 100) * canvas.width;
      const hatY = (chefHatY / 100) * canvas.height;
      const baseHatSize = canvas.height * 0.28;
      const finalHatSize = baseHatSize * chefHatScale;

      ctx.save();
      // Translate to the hat center
      ctx.translate(hatX, hatY);
      ctx.rotate((chefHatRotate * Math.PI) / 180);
      
      // Draw chef hat emoji text
      ctx.font = `${finalHatSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👨‍🍳', 0, 0);
      ctx.restore();

      // 4. Generate data URL and save to preview state
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    playButtonPress();
    setCapturedPhoto(null);
    startCamera();
  };

  const handleSave = () => {
    if (capturedPhoto) {
      playButtonPress();
      onSave(capturedPhoto);
      onClose();
    }
  };

  const handleResetSliders = () => {
    playButtonPress();
    setChefHatX(0);
    setChefHatY(20);
    setChefHatScale(1.2);
    setChefHatRotate(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 md:p-8 text-right text-white shadow-2xl flex flex-col gap-6 max-h-[92vh] overflow-y-auto relative animate-scaleIn">
        
        {/* Close Button */}
        <button
          onClick={() => { playButtonPress(); stopCamera(); onClose(); }}
          className="absolute top-5 left-5 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white rounded-full transition-all duration-200 active:scale-95 cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-row-reverse items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <ChefHat className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100">تأسيس واجهة المطعم والشعار 👨‍🍳</h2>
            <p className="text-xs text-slate-400 mt-1">
              التقط صورتك الآن لوضعها كشعار رسمي يعلو واجهة مطبخك السحري!
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-row-reverse gap-3 items-start">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            {capturedPhoto 
              ? "تفقد صورتك الملتقطة أدناه! إذا أعجبتك اضغط على 'اعتماد وحفظ'، أو اضغط 'إعادة التقاط 🔄' للتصوير مرة أخرى."
              : "للحصول على الشعار المثالي، اجلس في مكان مضيء، وقم بوزن رأسك مع قبعة الطباخ الظاهرة على الكاميرا. يمكنك استخدام أشرطة التحكم الجانبية لتعديل حجم وموقع القبعة بدقة لتطابق وجهك!"}
          </p>
        </div>

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live Camera View with Interactive Overlay or Captured Photo */}
        <div className="relative border border-slate-700/80 rounded-2xl overflow-hidden aspect-video bg-slate-950 flex flex-col items-center justify-center shadow-inner group">
          {/* Flash Effect */}
          {flashActive && (
            <div className="absolute inset-0 bg-white z-50 animate-fadeOut pointer-events-none" />
          )}

          {capturedPhoto ? (
            <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
              <img src={capturedPhoto} alt="Captured Logo preview" className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 bg-emerald-600 border border-emerald-500 text-white font-black text-[10px] px-3 py-1 rounded-full shadow-lg">
                ✨ معاينة الشعار الملتَقَط
              </div>
            </div>
          ) : cameraActive ? (
            <div className="relative w-full h-full">
              {/* Mirrored video display */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover scale-x-[-1]"
                playsInline
                muted
              />

              {/* Dynamic Interactive Chef Hat Overlay */}
              <div 
                className="absolute pointer-events-none select-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)] flex items-center justify-center transition-transform duration-75"
                style={{
                  top: `${chefHatY}%`,
                  left: `calc(50% + ${chefHatX}%)`,
                  transform: `translate(-50%, -50%) scale(${chefHatScale}) rotate(${chefHatRotate}deg)`,
                }}
              >
                <span className="text-8xl md:text-9xl">👨‍🍳</span>
              </div>

              {/* Guide Lines Silhouette */}
              <div className="absolute inset-0 border border-dashed border-white/5 pointer-events-none flex items-center justify-center">
                <div className="w-32 h-40 rounded-full border border-dashed border-emerald-500/20" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 animate-pulse">
                📷
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-400 block">الكاميرا بانتظار التفعيل</span>
                <span className="text-xs text-slate-500 mt-1 block max-w-sm">يرجى الضغط على الزر أدناه لتنشيط الكاميرا والسماح بالتقاط صورتك الكريمة</span>
              </div>
              <button
                onClick={() => { playButtonPress(); startCamera(); }}
                className="mt-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold rounded-xl text-white transition-all shadow-lg cursor-pointer"
              >
                تنشيط كاميرا الشيف 📷
              </button>
            </div>
          )}
        </div>

        {/* Balancing & Alignment Controls (Only show if not captured) */}
        {!capturedPhoto && (
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex flex-row-reverse justify-between items-center border-b border-slate-850 pb-2">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Sliders className="w-4 h-4" />
                <h4 className="text-xs font-bold">أدوات موازنة وضبط قبعة الطباخ</h4>
              </div>
              <button
                onClick={handleResetSliders}
                className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                إعادة تعيين الافتراضي
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Height Position (Y) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-row-reverse justify-between text-[11px] text-slate-400">
                  <span>الارتفاع العمودي للفرن</span>
                  <span className="font-mono font-bold text-amber-500">{chefHatY}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={chefHatY}
                  onChange={(e) => setChefHatY(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer border border-slate-800"
                />
              </div>

              {/* Horizontal Position (X) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-row-reverse justify-between text-[11px] text-slate-400">
                  <span>الموضع الأفقي (يمين/يسار)</span>
                  <span className="font-mono font-bold text-amber-500">{chefHatX}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={chefHatX}
                  onChange={(e) => setChefHatX(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer border border-slate-800"
                />
              </div>

              {/* Scale (Size) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-row-reverse justify-between text-[11px] text-slate-400">
                  <span>حجم قبعة الشيف</span>
                  <span className="font-mono font-bold text-amber-500">{chefHatScale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={chefHatScale}
                  onChange={(e) => setChefHatScale(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer border border-slate-800"
                />
              </div>

              {/* Rotation */}
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-row-reverse justify-between text-[11px] text-slate-400">
                  <span>ميلان وانحناء القبعة</span>
                  <span className="font-mono font-bold text-amber-500">{chefHatRotate}°</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={chefHatRotate}
                  onChange={(e) => setChefHatRotate(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer border border-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Snap Button & Controls */}
        <div className="flex gap-3 mt-1">
          {capturedPhoto ? (
            <>
              <button
                onClick={handleRetake}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-2xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة التقاط 🔄</span>
              </button>
              
              <button
                onClick={handleSave}
                className="flex-[2] py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs transition-all shadow-xl rounded-2xl flex items-center justify-center gap-2 border border-emerald-500 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>اعتماد وحفظ الشعار كشعار رسمي للمطعم ✅</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { playButtonPress(); stopCamera(); onClose(); }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-2xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                إلغاء وتخطي
              </button>
              
              <button
                onClick={handleCapture}
                disabled={!cameraActive}
                className={`flex-[2] py-3 rounded-2xl font-extrabold text-xs transition-all shadow-xl flex items-center justify-center gap-2 border ${
                  cameraActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white border-emerald-500 active:scale-95 cursor-pointer'
                    : 'bg-slate-800 text-slate-600 border-slate-850 cursor-not-allowed'
                }`}
              >
                <Camera className="w-4 h-4 fill-current" />
                <span>التقاط الصورة ومعاينتها ✨</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
