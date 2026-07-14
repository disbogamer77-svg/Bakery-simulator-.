import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  Folder, 
  RefreshCw, 
  FileJson, 
  CheckCircle2, 
  Trash2, 
  ExternalLink, 
  X, 
  Info, 
  AlertTriangle, 
  Image as ImageIcon 
} from 'lucide-react';
import { playButtonPress, playCoinsSound } from '../utils/audio';
import { getAllCaptures } from '../utils/db';

interface GoogleDriveDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  setCoins: (coins: number) => void;
  restaurantLogo: string | null;
  setRestaurantLogo: (logo: string | null) => void;
  googleAccessToken: string | null;
  setGoogleAccessToken: (token: string | null) => void;
  user: any;
  handleLogin: () => Promise<string | null>;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string;
  createdTime: string;
}

export const GoogleDriveDashboard: React.FC<GoogleDriveDashboardProps> = ({
  isOpen,
  onClose,
  coins,
  setCoins,
  restaurantLogo,
  setRestaurantLogo,
  googleAccessToken,
  setGoogleAccessToken,
  user,
  handleLogin,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [backupLogs, setBackupLogs] = useState<string[]>([]);

  // Helper: Show custom status messages
  const showStatus = (text: string, isError: boolean = false) => {
    setStatusMessage({ text, isError });
    setTimeout(() => setStatusMessage(null), 6000);
  };

  // Helper: Log message
  const logMessage = (msg: string) => {
    setBackupLogs(prev => [`[${new Date().toLocaleTimeString('ar-EG')}] ${msg}`, ...prev]);
  };

  // Convert Base64 data URL to Blob
  const dataUrlToBlob = (dataUrl: string): Blob => {
    try {
      const parts = dataUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (err) {
      console.error("Error converting data URL to blob:", err);
      throw new Error("فشل تحويل الصورة إلى صيغة متوافقة.");
    }
  };

  // Search folder on Google Drive
  const searchFolder = async (token: string): Promise<string | null> => {
    try {
      const query = encodeURIComponent("name = 'Magic Bakery Oven' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
      return null;
    } catch (err) {
      console.error("Error searching folder:", err);
      return null;
    }
  };

  // Create folder on Google Drive
  const createFolder = async (token: string): Promise<string | null> => {
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Magic Bakery Oven',
          mimeType: 'application/vnd.google-apps.folder'
        })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.id;
    } catch (err) {
      console.error("Error creating folder:", err);
      return null;
    }
  };

  // Get or Create Google Drive folder
  const getOrCreateFolder = async (token: string): Promise<string | null> => {
    let folderId = await searchFolder(token);
    if (folderId) {
      logMessage("تم العثور على مجلد السحابة Magic Bakery Oven بنجاح.");
      return folderId;
    }
    logMessage("لم يتم العثور على مجلد، جاري إنشاء مجلد جديد على Google Drive...");
    folderId = await createFolder(token);
    if (folderId) {
      logMessage("تم إنشاء مجلد 'Magic Bakery Oven' بنجاح.");
    } else {
      logMessage("فشل إنشاء مجلد على Google Drive.");
    }
    return folderId;
  };

  // Upload file helper
  const uploadFile = async (token: string, folderId: string, filename: string, mimeType: string, blob: Blob) => {
    // 1. Create file metadata
    const metaRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: filename,
        parents: [folderId]
      })
    });
    if (!metaRes.ok) {
      throw new Error(`فشل إنشاء مواصفات الملف: ${await metaRes.text()}`);
    }
    const metaData = await metaRes.json();
    const fileId = metaData.id;

    // 2. Upload file content
    const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': mimeType
      },
      body: blob
    });
    if (!uploadRes.ok) {
      throw new Error(`فشل رفع محتوى الملف: ${await uploadRes.text()}`);
    }
    return await uploadRes.json();
  };

  // List all files in the Magic Bakery Oven folder
  const fetchDriveFiles = async (token: string, folderId: string) => {
    try {
      const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,webViewLink,thumbnailLink,createdTime)&orderBy=createdTime desc`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("فشل جلب الملفات.");
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err) {
      console.error("Error fetching drive files:", err);
      logMessage("فشل تحديث قائمة ملفات Google Drive.");
    }
  };

  // Connect Google Drive (Sign in)
  const handleConnectDrive = async () => {
    playButtonPress();
    setLoading(true);
    try {
      const token = await handleLogin();
      if (token) {
        setGoogleAccessToken(token);
        logMessage("تم ربط حساب Google Drive بنجاح: " + (user?.email || "disbogamer77@gmail.com"));
        const folderId = await getOrCreateFolder(token);
        if (folderId) {
          setDriveFolderId(folderId);
          await fetchDriveFiles(token, folderId);
        }
      } else {
        showStatus("فشل في الحصول على رمز الوصول من حساب Google.", true);
      }
    } catch (err: any) {
      console.error(err);
      showStatus("حدث خطأ أثناء الاتصال بـ Google Drive: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Drive Folder on Open
  useEffect(() => {
    if (isOpen && googleAccessToken) {
      setLoading(true);
      (async () => {
        const folderId = await getOrCreateFolder(googleAccessToken);
        if (folderId) {
          setDriveFolderId(folderId);
          await fetchDriveFiles(googleAccessToken, folderId);
        }
        setLoading(false);
      })();
    }
  }, [isOpen, googleAccessToken]);

  // Refresh Files
  const handleRefreshFiles = async () => {
    if (!googleAccessToken || !driveFolderId) return;
    playButtonPress();
    setLoading(true);
    await fetchDriveFiles(googleAccessToken, driveFolderId);
    setLoading(false);
    logMessage("تم تحديث قائمة الملفات من السحابة.");
  };

  // Upload captures (Oven photos) to Drive
  const handleUploadCaptures = async () => {
    if (!googleAccessToken || !driveFolderId) return;
    const confirmed = window.confirm("هل تريد رفع جميع الصور المخبوزة الملتقطة محلياً إلى حساب Google Drive الخاص بك؟");
    if (!confirmed) return;

    playButtonPress();
    setLoading(true);
    try {
      const localCaptures = await getAllCaptures();
      if (localCaptures.length === 0) {
        showStatus("لا توجد صور ملتقطة محلياً لرفعها.", true);
        setLoading(false);
        return;
      }

      logMessage(`جاري تحضير رفع عدد ${localCaptures.length} من الصور الملتقطة...`);
      let successCount = 0;
      for (const cap of localCaptures) {
        try {
          const filename = `bakery_capture_${cap.itemType || 'item'}_${cap.timestamp || Date.now()}.jpg`;
          const blob = dataUrlToBlob(cap.photo);
          await uploadFile(googleAccessToken, driveFolderId, filename, 'image/jpeg', blob);
          successCount++;
          logMessage(`تم رفع الصورة: ${filename}`);
        } catch (uploadErr: any) {
          console.error("Upload error for capture:", uploadErr);
          logMessage(`فشل رفع إحدى الصور: ${uploadErr.message}`);
        }
      }

      showStatus(`🎉 تم رفع عدد ${successCount} صورة بنجاح إلى مجلد Google Drive!`);
      await fetchDriveFiles(googleAccessToken, driveFolderId);
    } catch (err: any) {
      console.error(err);
      showStatus("حدث خطأ أثناء رفع الصور: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Upload Restaurant Logo
  const handleUploadLogo = async () => {
    if (!googleAccessToken || !driveFolderId) return;
    if (!restaurantLogo) {
      showStatus("الرجاء تصميم شعار للمطعم أولاً لرفعه.", true);
      return;
    }

    const confirmed = window.confirm("هل تريد تصدير شعار المطعم الحالي الخاص بك إلى Google Drive؟");
    if (!confirmed) return;

    playButtonPress();
    setLoading(true);
    try {
      logMessage("جاري رفع شعار المطعم إلى Google Drive...");
      const blob = dataUrlToBlob(restaurantLogo);
      const filename = `bakery_logo_${Date.now()}.jpg`;
      await uploadFile(googleAccessToken, driveFolderId, filename, 'image/jpeg', blob);
      logMessage(`تم تصدير الشعار بنجاح كـ: ${filename}`);
      showStatus("🎉 تم رفع شعار المطعم بنجاح إلى سحابة Google Drive!");
      await fetchDriveFiles(googleAccessToken, driveFolderId);
    } catch (err: any) {
      console.error(err);
      showStatus("فشل رفع الشعار: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Backup game states to Google Drive (JSON)
  const handleExportBackup = async () => {
    if (!googleAccessToken || !driveFolderId) return;
    const confirmed = window.confirm("هل تريد تصدير نسخة احتياطية من تقدم اللعبة الحالي (الذهب، الشعار، الإحصائيات) كملف JSON سحابي؟");
    if (!confirmed) return;

    playButtonPress();
    setLoading(true);
    try {
      logMessage("جاري إعداد بيانات اللعبة للتصدير السحابي...");
      const backupData = {
        app_version: "1.0.0",
        magic_oven_backup: true,
        coins: coins,
        restaurantLogo: restaurantLogo,
        timestamp: Date.now(),
        account: user?.email || 'disbogamer77@gmail.com'
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const filename = `magic_bakery_save_${new Date().toISOString().split('T')[0]}.json`;

      await uploadFile(googleAccessToken, driveFolderId, filename, 'application/json', blob);
      logMessage(`تم حفظ نسخة احتياطية سحابية: ${filename}`);
      showStatus("🎉 تم تصدير نسخة اللعبة الاحتياطية بنجاح إلى Google Drive!");
      await fetchDriveFiles(googleAccessToken, driveFolderId);
    } catch (err: any) {
      console.error(err);
      showStatus("فشل تصدير النسخة الاحتياطية: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Restore game state from a selected file in list
  const handleRestoreBackup = async (fileId: string, fileName: string) => {
    if (!googleAccessToken) return;
    const confirmed = window.confirm(`⚠️ تحذير: هل أنت متأكد من استعادة بيانات اللعبة من الملف السحابي "${fileName}"؟ سيتم استبدال الذهب الحالي والشعار بالبيانات المحفوظة.`);
    if (!confirmed) return;

    playButtonPress();
    setLoading(true);
    try {
      logMessage(`جاري تحميل وقراءة ملف النسخة الاحتياطية: ${fileName}...`);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${googleAccessToken}` }
      });
      if (!res.ok) throw new Error("فشل قراءة ملف النسخة الاحتياطية من السيرفر.");
      
      const backupData = await res.json();
      if (!backupData.magic_oven_backup) {
        throw new Error("تنسيق الملف غير مدعوم أو تالف كنسخة احتياطية للعبة الفرن السحري.");
      }

      // Restore states
      if (typeof backupData.coins === 'number') {
        setCoins(backupData.coins);
      }
      if (backupData.restaurantLogo) {
        setRestaurantLogo(backupData.restaurantLogo);
        localStorage.setItem('restaurant_logo', backupData.restaurantLogo);
      }

      playCoinsSound();
      logMessage("تمت استعادة تقدم اللعبة والشعار والعملات بنجاح من الملف السحابي!");
      showStatus("🎉 تم استيراد واستعادة نسخة اللعبة السحابية بنجاح!");
    } catch (err: any) {
      console.error(err);
      showStatus("فشل استيراد النسخة الاحتياطية: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Delete File from Google Drive
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!googleAccessToken) return;
    const confirmed = window.confirm(`هل أنت متأكد من حذف الملف "${fileName}" نهائياً من حساب Google Drive الخاص بك؟`);
    if (!confirmed) return;

    playButtonPress();
    setLoading(true);
    try {
      logMessage(`جاري حذف الملف من السحابة: ${fileName}...`);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${googleAccessToken}` }
      });
      if (!res.ok) throw new Error("فشل حذف الملف.");
      logMessage(`تم حذف الملف بنجاح: ${fileName}`);
      showStatus("تم حذف الملف نهائياً من حساب Google Drive الخاص بك.");
      await fetchDriveFiles(googleAccessToken, driveFolderId!);
    } catch (err: any) {
      console.error(err);
      showStatus("فشل حذف الملف من السحابة: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden text-right">
        
        {/* Header */}
        <div className="flex flex-row-reverse items-center justify-between bg-slate-950 px-6 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <Cloud className="w-5 h-5 text-blue-500 animate-pulse" />
            <h2 className="text-lg font-black text-slate-100">سحابة النسخ الاحتياطي والربط بـ Google Drive ☁️</h2>
          </div>
          <button 
            onClick={() => { playButtonPress(); onClose(); }}
            className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info panel */}
        <div className="bg-slate-950/40 border-b border-slate-800/40 p-4 px-6 text-xs text-slate-400 flex flex-row-reverse gap-2 items-start leading-relaxed">
          <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
          <span className="text-right">
            مرحباً بك في محطة النسخ الاحتياطي السحابي. تتيح لك هذه الأداة حفظ صور الشيف الرسمية الخاصة بك وشعار مطعمك، وتصدير كامل تقدمك وعملاتك الذهبية مباشرةً إلى حساب Google Drive الخاص بك (<b>disbogamer77@gmail.com</b>) لتضمن عدم ضياع أي تقدم!
          </span>
        </div>

        {/* Main Workspace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 overflow-y-auto max-h-[70vh]">
          
          {/* Right sidebar: Auth status and controls */}
          <div className="md:col-span-5 flex flex-col gap-4">
            
            {/* Status box */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">حالة الاتصال بالسحابة</span>
              
              {googleAccessToken ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row-reverse items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                    <img 
                      src={user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=disbo`}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full border border-slate-700"
                    />
                    <div className="flex flex-col text-right leading-tight">
                      <span className="text-xs font-bold text-slate-200">{user?.displayName || "disbogamer77"}</span>
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">disbogamer77@gmail.com</span>
                    </div>
                  </div>
                  <div className="flex flex-row-reverse items-center gap-1.5 text-xs text-emerald-400 font-bold justify-end">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>متصل بـ Google Drive بنجاح</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-400 leading-relaxed text-right">
                    الرجاء ربط حساب Google لبدء استخدام السحابة وتأمين صورك وإنجازاتك.
                  </p>
                  <button
                    onClick={handleConnectDrive}
                    disabled={loading}
                    className="w-full py-2 bg-gradient-to-l from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-blue-400/10 disabled:opacity-50"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>ربط حساب Google Drive الخاص بك</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sync actions - only active if connected */}
            <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">عمليات المزامنة السريعة</span>
              
              <button
                onClick={handleUploadCaptures}
                disabled={!googleAccessToken || loading}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-bold transition-all flex flex-row-reverse items-center justify-between cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex flex-row-reverse items-center gap-2">
                  <CloudUpload className="w-4 h-4 text-emerald-400" />
                  <span>نسخ صور الشيف إلى Drive 📸</span>
                </div>
                <span className="text-[9px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded">محلي ⬅ سحابي</span>
              </button>

              <button
                onClick={handleUploadLogo}
                disabled={!googleAccessToken || loading || !restaurantLogo}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-bold transition-all flex flex-row-reverse items-center justify-between cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex flex-row-reverse items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>تصدير شعار المطعم 👨‍🍳</span>
                </div>
                <span className="text-[9px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded">الشعار ⬅ سحابي</span>
              </button>

              <button
                onClick={handleExportBackup}
                disabled={!googleAccessToken || loading}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-bold transition-all flex flex-row-reverse items-center justify-between cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex flex-row-reverse items-center gap-2">
                  <FileJson className="w-4 h-4 text-yellow-500" />
                  <span>تصدير تقدم اللعبة والذهب 💰</span>
                </div>
                <span className="text-[9px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded">حفظ البيانات</span>
              </button>
            </div>

            {/* Logs console */}
            <div className="flex-1 flex flex-col gap-1.5 bg-slate-950/90 border border-slate-900 rounded-xl p-3 font-mono text-[9px] min-h-[140px] max-h-[200px] overflow-y-auto">
              <span className="text-[9px] font-bold text-slate-500 uppercase pb-1 border-b border-slate-900">سجل عمليات السحابة</span>
              <div className="flex flex-col gap-1 flex-1 overflow-y-auto select-none">
                {backupLogs.length === 0 ? (
                  <span className="text-slate-600 italic">لا توجد عمليات مسجلة حالياً...</span>
                ) : (
                  backupLogs.map((log, idx) => (
                    <span key={idx} className="text-slate-400 leading-normal">{log}</span>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Left panel: File Browser in Drive folder */}
          <div className="md:col-span-7 flex flex-col gap-4">
            
            {/* Folder browser heading */}
            <div className="flex flex-row-reverse items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-850">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-300">محتويات مجلد "Magic Bakery Oven" على السحابة</span>
              </div>
              <button
                onClick={handleRefreshFiles}
                disabled={!googleAccessToken || loading}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                title="تحديث قائمة الملفات"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Status message banners */}
            {statusMessage && (
              <div className={`p-3 rounded-lg text-xs leading-relaxed text-right flex flex-row-reverse items-center gap-2 border ${
                statusMessage.isError 
                  ? 'bg-red-950/30 border-red-900/40 text-red-300' 
                  : 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300'
              }`}>
                {statusMessage.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Files list */}
            <div className="bg-slate-950/50 border border-slate-900 rounded-xl min-h-[300px] max-h-[420px] overflow-y-auto flex flex-col">
              {!googleAccessToken ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
                  <div className="text-4xl">🔒</div>
                  <span className="text-xs text-slate-500 font-bold">الرجاء ربط الحساب أولاً لعرض وتصفح الملفات السحابية</span>
                </div>
              ) : loading && driveFiles.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3">
                  <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                  <span className="text-xs text-slate-500">جاري مسح محتويات مجلد Google Drive...</span>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-2">
                  <Folder className="w-10 h-10 text-slate-800" />
                  <span className="text-xs text-slate-500 font-bold">المجلد فارغ تماماً</span>
                  <span className="text-[10px] text-slate-600 max-w-[200px]">قم برفع الصور أو تصدير إعداداتك لملء السحابة الخاصة بك.</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-900 overflow-y-auto flex-1">
                  {driveFiles.map((file) => {
                    const isJson = file.mimeType.includes('json');
                    return (
                      <div key={file.id} className="p-3.5 flex flex-row-reverse items-center justify-between hover:bg-slate-900/40 transition-all gap-4">
                        
                        {/* File details & preview */}
                        <div className="flex flex-row-reverse items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden border border-slate-800 shrink-0">
                            {isJson ? (
                              <FileJson className="w-5 h-5 text-yellow-500" />
                            ) : file.thumbnailLink ? (
                              <img src={file.thumbnailLink} alt="Drive thumbnail" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-blue-400" />
                            )}
                          </div>
                          
                          <div className="flex flex-col text-right min-w-0">
                            <span className="text-xs font-bold text-slate-200 truncate" title={file.name}>
                              {file.name}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                              {new Date(file.createdTime).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* File Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Open external web view */}
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-all"
                            title="عرض في Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Restore if JSON */}
                          {isJson && (
                            <button
                              onClick={() => handleRestoreBackup(file.id, file.name)}
                              className="p-1.5 bg-amber-950/30 hover:bg-amber-900/50 border border-amber-900/40 text-amber-400 hover:text-amber-300 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                              title="استعادة هذه النسخة"
                            >
                              <CloudDownload className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">استعادة</span>
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteFile(file.id, file.name)}
                            className="p-1.5 bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-900/40 text-slate-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                            title="حذف نهائياً"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
