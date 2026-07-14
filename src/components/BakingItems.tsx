import React from 'react';

interface BakingItemProps {
  type: 'bread' | 'pizza' | 'croissant' | 'cake' | 'cookie' | 'pie' | 'dough' | 'hamburger';
  bakeProgress: number; // 0 to 100
  isBaking: boolean;
  className?: string;
  addedIngredients?: string[];
}

const BakingItemBase: React.FC<BakingItemProps> = ({ type, bakeProgress, isBaking, className = "" }) => {
  // We use detailed linear/radial gradients defined dynamically per item to convey realistic roasting & depth.

  if (type === 'bread') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] transition-all duration-500">
          <defs>
            {/* Bread dough transition based on progress */}
            <radialGradient id="breadBodyGrad" cx="50%" cy="40%" r="50%">
              {bakeProgress < 25 ? (
                <>
                  <stop offset="0%" stopColor="#faf6e8" />
                  <stop offset="70%" stopColor="#f3ebd3" />
                  <stop offset="100%" stopColor="#e5dba8" />
                </>
              ) : bakeProgress < 65 ? (
                <>
                  <stop offset="0%" stopColor="#f7d08a" />
                  <stop offset="60%" stopColor="#e2a048" />
                  <stop offset="100%" stopColor="#bd761b" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#de9443" />
                  <stop offset="50%" stopColor="#a35d18" />
                  <stop offset="90%" stopColor="#6e3305" />
                  <stop offset="100%" stopColor="#3d1800" />
                </>
              )}
            </radialGradient>

            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              {bakeProgress < 50 ? (
                <>
                  <stop offset="0%" stopColor="#eedca5" />
                  <stop offset="100%" stopColor="#dfca8c" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#e8a858" />
                  <stop offset="100%" stopColor="#9a5209" />
                </>
              )}
            </linearGradient>
            
            <radialGradient id="breadShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Realistic Floor Shadow */}
          <ellipse cx="80" cy="100" rx="60" ry="14" fill="url(#breadShadow)" />

          {/* Main 3D Loaf Body */}
          <path
            d="M 25,65 
               C 20,40 45,25 80,25 
               C 115,25 140,40 135,65 
               C 130,85 110,95 80,95 
               C 50,95 30,85 25,65 Z"
            fill="url(#breadBodyGrad)"
            stroke="#271000"
            strokeWidth="2.5"
            className="transition-all duration-500"
          />

          {/* Top crust glow / shine overlay */}
          <path
            d="M 35,52 C 45,35 70,30 80,30 C 95,30 115,35 125,52"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            className="opacity-20 pointer-events-none"
          />

          {/* Artisan Knife Slash Cut 1 */}
          <path
            d="M 48,72 Q 58,42 55,48"
            fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            className="transition-colors duration-500"
          />
          {/* Artisan Knife Slash Cut 2 */}
          <path
            d="M 78,74 Q 88,44 85,50"
            fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            className="transition-colors duration-500"
          />
          {/* Artisan Knife Slash Cut 3 */}
          <path
            d="M 108,72 Q 118,42 115,48"
            fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            className="transition-colors duration-500"
          />

          {/* Flour Dusting Specks */}
          <g className="opacity-40">
            <circle cx="65" cy="40" r="1.5" fill="#ffffff" />
            <circle cx="72" cy="38" r="1" fill="#ffffff" />
            <circle cx="92" cy="42" r="1.8" fill="#ffffff" />
            <circle cx="102" cy="48" r="1.2" fill="#ffffff" />
            <circle cx="54" cy="52" r="1.5" fill="#ffffff" />
          </g>
        </svg>
      </div>
    );
  }

  if (type === 'pizza') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-[0_12px_20px_rgba(0,0,0,0.6)] transition-all duration-500">
          <defs>
            {/* Crust color transition */}
            <radialGradient id="pizzaCrustGrad" cx="50%" cy="50%" r="50%">
              {bakeProgress < 25 ? (
                <>
                  <stop offset="80%" stopColor="#f4ebcf" />
                  <stop offset="100%" stopColor="#e3d6b1" />
                </>
              ) : bakeProgress < 65 ? (
                <>
                  <stop offset="78%" stopColor="#f0ca81" />
                  <stop offset="92%" stopColor="#cc933d" />
                  <stop offset="100%" stopColor="#965f1c" />
                </>
              ) : (
                <>
                  <stop offset="75%" stopColor="#d28935" />
                  <stop offset="90%" stopColor="#945210" />
                  <stop offset="100%" stopColor="#4c2201" />
                </>
              )}
            </radialGradient>

            {/* Melted bubbly cheese */}
            <radialGradient id="cheeseGrad" cx="45%" cy="45%" r="45%">
              {bakeProgress < 25 ? (
                <>
                  <stop offset="0%" stopColor="#fffdef" />
                  <stop offset="85%" stopColor="#fbf0cc" />
                  <stop offset="100%" stopColor="#ffd8a6" />
                </>
              ) : bakeProgress < 65 ? (
                <>
                  <stop offset="0%" stopColor="#fff3a1" />
                  <stop offset="70%" stopColor="#fbc752" />
                  <stop offset="100%" stopColor="#e2871b" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#ffda6a" />
                  <stop offset="40%" stopColor="#f59e0b" />
                  <stop offset="80%" stopColor="#dc2626" /> {/* roasted tomato showing through */}
                  <stop offset="100%" stopColor="#b45309" />
                </>
              )}
            </radialGradient>

            {/* Pepperoni sausages with realistic crisp edges */}
            <linearGradient id="pepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              {bakeProgress < 50 ? (
                <>
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#b91c1c" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="60%" stopColor="#991b1b" />
                  <stop offset="100%" stopColor="#450a0a" />
                </>
              )}
            </linearGradient>

            <radialGradient id="pizzaShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.7)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Ambient shadow */}
          <ellipse cx="80" cy="125" rx="65" ry="18" fill="url(#pizzaShadow)" />

          {/* Realistic Perspective Outer Crust */}
          <ellipse
            cx="80"
            cy="75"
            rx="68"
            ry="48"
            fill="url(#pizzaCrustGrad)"
            stroke="#2f1401"
            strokeWidth="3.5"
            className="transition-colors duration-500"
          />

          {/* Golden Marinara Sauce Base */}
          <ellipse
            cx="80"
            cy="75"
            rx="58"
            ry="39"
            fill="#a61c1c"
          />

          {/* Cheese Melting Layer */}
          <ellipse
            cx="80"
            cy="75"
            rx="55"
            ry="36"
            fill="url(#cheeseGrad)"
            className="transition-colors duration-500"
          />

          {/* Bubbly Cheese details */}
          {bakeProgress > 30 && (
            <g fill="#92400e" className="opacity-60 transition-opacity duration-500">
              <ellipse cx="55" cy="65" rx="5" ry="3" />
              <ellipse cx="102" cy="72" rx="4" ry="2.2" />
              <ellipse cx="78" cy="92" rx="6" ry="3.5" />
              <ellipse cx="94" cy="62" rx="4.5" ry="2.5" />
            </g>
          )}

          {/* Realistic Pepperoni toppings with fat glaze shine */}
          <g className="transition-all duration-500">
            {/* Pepperoni 1 */}
            <g>
              <ellipse cx="50" cy="65" rx="10" ry="7.5" fill="url(#pepGrad)" stroke="#450505" strokeWidth="1.5" />
              <ellipse cx="48" cy="63" rx="4" ry="2.5" fill="#ffffff" opacity="0.15" />
            </g>
            {/* Pepperoni 2 */}
            <g>
              <ellipse cx="110" cy="70" rx="9.5" ry="7" fill="url(#pepGrad)" stroke="#450505" strokeWidth="1.5" />
              <ellipse cx="108" cy="68" rx="3.8" ry="2" fill="#ffffff" opacity="0.15" />
            </g>
            {/* Pepperoni 3 */}
            <g>
              <ellipse cx="78" cy="90" rx="11" ry="8" fill="url(#pepGrad)" stroke="#450505" strokeWidth="1.5" />
              <ellipse cx="76" cy="88" rx="5" ry="3" fill="#ffffff" opacity="0.15" />
            </g>
            {/* Pepperoni 4 */}
            <g>
              <ellipse cx="85" cy="58" rx="9" ry="6.5" fill="url(#pepGrad)" stroke="#450505" strokeWidth="1.5" />
              <ellipse cx="83" cy="56" rx="3.5" ry="2.2" fill="#ffffff" opacity="0.15" />
            </g>
          </g>

          {/* Black Olives */}
          {bakeProgress > 20 && (
            <g fill="#111" stroke="#000" strokeWidth="0.5">
              <circle cx="62" cy="82" r="3" />
              <circle cx="62" cy="82" r="1.2" fill="#f59e0b" className="opacity-40" />
              
              <circle cx="95" cy="78" r="3" />
              <circle cx="95" cy="78" r="1.2" fill="#f59e0b" className="opacity-40" />

              <circle cx="68" cy="58" r="3" />
              <circle cx="68" cy="58" r="1.2" fill="#f59e0b" className="opacity-40" />
            </g>
          )}

          {/* Realistic basil green leaves */}
          {bakeProgress > 45 && (
            <g fill="#15803d" stroke="#166534" strokeWidth="0.5" className="opacity-90">
              <path d="M 62,68 C 60,60 70,62 66,70 Z" />
              <path d="M 98,82 C 102,74 92,78 94,84 Z" />
              <path d="M 45,78 C 40,75 50,72 48,80 Z" />
            </g>
          )}
        </svg>
      </div>
    );
  }

  if (type === 'croissant') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.55)] transition-all duration-500">
          <defs>
            {/* 3D puff pastry butter layers */}
            <linearGradient id="croissantGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              {bakeProgress < 25 ? (
                <>
                  <stop offset="0%" stopColor="#fff9db" />
                  <stop offset="50%" stopColor="#f3e6ae" />
                  <stop offset="100%" stopColor="#dac584" />
                </>
              ) : bakeProgress < 65 ? (
                <>
                  <stop offset="0%" stopColor="#ffd885" />
                  <stop offset="50%" stopColor="#f29f38" />
                  <stop offset="100%" stopColor="#bf6a0b" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#fca5a5" /> {/* reddish golden brown crust */}
                  <stop offset="30%" stopColor="#d97706" />
                  <stop offset="70%" stopColor="#854d0e" />
                  <stop offset="100%" stopColor="#451a03" />
                </>
              )}
            </linearGradient>

            <radialGradient id="croissantShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Floor Shadow */}
          <ellipse cx="80" cy="100" rx="55" ry="12" fill="url(#croissantShadow)" />

          {/* Golden crispy curves */}
          <g stroke="#3a1d01" strokeWidth="2.5" className="transition-all duration-500" fill="url(#croissantGrad)">
            {/* Leftmost tip curve */}
            <path d="M 24,75 C 10,70 12,50 32,54 C 40,56 42,65 35,76 Z" />
            {/* Rightmost tip curve */}
            <path d="M 136,75 C 150,70 148,50 128,54 C 120,56 118,65 125,76 Z" />
            
            {/* Outer side wings */}
            <path d="M 32,68 C 24,45 48,35 60,40 C 50,56 42,68 32,68 Z" />
            <path d="M 128,68 C 136,45 112,35 100,40 C 110,56 118,68 128,68 Z" />

            {/* Bulging central layers */}
            <path d="M 45,64 C 40,32 70,25 80,28 C 90,25 120,32 115,64 C 100,82 60,82 45,64 Z" />
            <path d="M 58,60 C 55,30 75,22 80,24 C 85,22 105,30 102,60 C 92,76 68,76 58,60 Z" />
            
            {/* Center Core Swirl */}
            <path d="M 68,54 C 65,28 78,20 80,21 C 82,20 95,28 92,54 C 86,68 74,68 68,54 Z" fill="#ffffff" fillOpacity="0.1" />
          </g>

          {/* Flaky pastry cracks highlights */}
          {bakeProgress > 50 && (
            <g stroke="#fef08a" strokeWidth="1" opacity="0.4" fill="none">
              <path d="M 62,38 Q 72,42 80,32" />
              <path d="M 46,52 Q 58,45 70,48" />
              <path d="M 94,50 Q 104,45 112,54" />
            </g>
          )}
        </svg>
      </div>
    );
  }

  if (type === 'cake') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-[0_12px_18px_rgba(0,0,0,0.65)] transition-all duration-500">
          <defs>
            <linearGradient id="cakeSpongeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              {bakeProgress < 25 ? (
                <>
                  <stop offset="0%" stopColor="#a17c6a" />
                  <stop offset="100%" stopColor="#7a5544" />
                </>
              ) : bakeProgress < 65 ? (
                <>
                  <stop offset="0%" stopColor="#5c3826" />
                  <stop offset="100%" stopColor="#3d2114" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#3b1d11" />
                  <stop offset="100%" stopColor="#1e0c06" />
                </>
              )}
            </linearGradient>

            <linearGradient id="frostingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              {bakeProgress < 50 ? (
                <>
                  <stop offset="0%" stopColor="#ffccd5" />
                  <stop offset="50%" stopColor="#ffb3c1" />
                  <stop offset="100%" stopColor="#ff85a1" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="50%" stopColor="#be123c" />
                  <stop offset="100%" stopColor="#881337" />
                </>
              )}
            </linearGradient>
            
            <radialGradient id="cakeShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.7)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Ambient Shadow */}
          <ellipse cx="80" cy="130" rx="55" ry="14" fill="url(#cakeShadow)" />

          {/* Sponge Cake Base Block */}
          <path
            d="M 25,75 
               C 25,55 50,50 80,50 
               C 110,50 135,55 135,75 
               L 135,110 
               C 135,122 110,128 80,128 
               C 50,128 25,122 25,110 Z"
            fill="url(#cakeSpongeGrad)"
            stroke="#110502"
            strokeWidth="3.5"
            className="transition-colors duration-500"
          />

          {/* Strawberry Dripping Frosting Cover */}
          <path
            d="M 25,75 
               C 25,55 50,50 80,50 
               C 110,50 135,55 135,75 
               C 135,88 125,92 115,86 
               C 105,80 95,95 80,88 
               C 68,82 58,94 48,88 
               C 38,82 25,90 25,75 Z"
            fill="url(#frostingGrad)"
            stroke="#4c0519"
            strokeWidth="1.5"
            className="transition-colors duration-500"
          />

          {/* Cream Swirl Dollop */}
          <path
            d="M 65,46 
               C 65,36 72,30 80,30 
               C 88,30 95,36 95,46 
               C 88,49 72,49 65,46 Z"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          {/* Glossy Red Cherry */}
          <g>
            <circle cx="80" cy="26" r="8" fill="#e11d48" />
            <circle cx="77" cy="23" r="2.5" fill="#ffffff" opacity="0.4" /> {/* Reflection */}
            <path d="M 80,20 Q 86,10 94,14" fill="none" stroke="#270c01" strokeWidth="1.8" />
          </g>

          {/* Chocolate Sprinkles */}
          {bakeProgress > 50 && (
            <g fill="#1e0c06" opacity="0.8">
              <rect x="42" y="65" width="2" height="6" transform="rotate(25 42 65)" />
              <rect x="115" y="74" width="2" height="6" transform="rotate(-40 115 74)" />
              <rect x="74" y="62" width="2" height="6" transform="rotate(15 74 62)" />
              <rect x="58" y="74" width="2" height="6" transform="rotate(75 58 74)" />
              <rect x="96" y="68" width="2" height="6" transform="rotate(-15 96 68)" />
            </g>
          )}
        </svg>
      </div>
    );
  }

  if (type === 'cookie') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 140 140" className="w-full h-full drop-shadow-[0_8px_14px_rgba(0,0,0,0.5)] transition-all duration-500">
          <defs>
            <radialGradient id="cookieGrad" cx="50%" cy="50%" r="50%">
              {bakeProgress < 25 ? (
                <>
                  <stop offset="0%" stopColor="#faf0d0" />
                  <stop offset="80%" stopColor="#ebd6aa" />
                  <stop offset="100%" stopColor="#d1b886" />
                </>
              ) : bakeProgress < 65 ? (
                <>
                  <stop offset="0%" stopColor="#fcd34d" />
                  <stop offset="70%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#92400e" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="60%" stopColor="#92400e" />
                  <stop offset="90%" stopColor="#451a03" />
                  <stop offset="100%" stopColor="#250d00" />
                </>
              )}
            </radialGradient>

            <radialGradient id="cookieShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.65)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Floor Shadow */}
          <ellipse cx="70" cy="115" rx="48" ry="12" fill="url(#cookieShadow)" />

          {/* Cookie body with realistic irregular edges */}
          <path
            d="M 32,70 
               C 28,52 42,32 70,30 
               C 98,28 112,48 110,70 
               C 108,92 92,112 70,110 
               C 44,108 36,88 32,70 Z"
            fill="url(#cookieGrad)"
            stroke="#5c2e0b"
            strokeWidth="3.5"
            className="transition-colors duration-500"
          />

          {/* Melted chocolate chunks with glossy shine */}
          <g fill={bakeProgress < 50 ? '#542d13' : '#1e0b00'} className="transition-all duration-500">
            {/* Chip 1 */}
            <path d="M 48,54 C 45,46 58,44 54,58 C 48,60 44,58 48,54 Z" stroke="#100500" strokeWidth="0.5" />
            {/* Chip 2 */}
            <path d="M 85,50 C 82,42 95,40 92,54 C 86,56 82,54 85,50 Z" stroke="#100500" strokeWidth="0.5" />
            {/* Chip 3 */}
            <path d="M 68,82 C 62,76 75,72 74,86 C 68,88 64,86 68,82 Z" stroke="#100500" strokeWidth="0.5" />
            {/* Chip 4 */}
            <path d="M 52,70 C 48,65 58,60 58,74 C 52,78 48,74 52,70 Z" stroke="#100500" strokeWidth="0.5" />
            {/* Chip 5 */}
            <path d="M 80,72 C 75,68 85,62 84,76 C 78,80 75,76 80,72 Z" stroke="#100500" strokeWidth="0.5" />
          </g>

          {/* Cracks / Crevices on cookie surface */}
          {bakeProgress > 45 && (
            <g stroke="#451a03" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" fill="none">
              <path d="M 42,42 Q 52,48 58,38" />
              <path d="M 84,86 Q 74,90 68,98" />
              <path d="M 98,64 Q 102,74 95,80" />
            </g>
          )}
        </svg>
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 160 140" className="w-full h-full drop-shadow-[0_12px_18px_rgba(0,0,0,0.6)] transition-all duration-500">
          <defs>
            {/* Flaky golden pie crust */}
            <linearGradient id="pieCrustGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              {bakeProgress < 25 ? (
                <>
                  <stop offset="0%" stopColor="#fdf7e2" />
                  <stop offset="100%" stopColor="#ecdca7" />
                </>
              ) : bakeProgress < 65 ? (
                <>
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#b45309" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="70%" stopColor="#78350f" />
                  <stop offset="100%" stopColor="#451a03" />
                </>
              )}
            </linearGradient>

            <linearGradient id="appleFillingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              {bakeProgress < 50 ? (
                <>
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#c2410c" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="60%" stopColor="#9a3412" />
                  <stop offset="100%" stopColor="#450a0a" />
                </>
              )}
            </linearGradient>

            <radialGradient id="pieShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.75)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Shadow */}
          <ellipse cx="80" cy="115" rx="60" ry="14" fill="url(#pieShadow)" />

          {/* Aluminum metallic base plate pan */}
          <ellipse cx="80" cy="92" rx="64" ry="26" fill="linear-gradient(#cbd5e1, #64748b)" stroke="#475569" strokeWidth="2.5" />

          {/* Flaky main dome crust */}
          <ellipse
            cx="80"
            cy="82"
            rx="58"
            ry="22"
            fill="url(#pieCrustGrad)"
            stroke="#5c2e0b"
            strokeWidth="3"
            className="transition-colors duration-500"
          />

          {/* Crimped/wavy crust edge highlights */}
          <path
            d="M 22,82 
               C 22,68 35,66 48,68 
               C 60,70 72,68 84,68 
               C 96,66 112,68 138,82"
            fill="none"
            stroke="#78350f"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Pie venting slits bubbling with warm Apple/Cinnamon filling */}
          <g fill="url(#appleFillingGrad)" stroke="#450a0a" strokeWidth="1" className="transition-all duration-500">
            {/* Vent Left */}
            <path d="M 60,74 L 70,72 L 64,82 Z" />
            {/* Vent Center */}
            <path d="M 80,64 L 88,62 L 84,72 Z" />
            {/* Vent Right */}
            <path d="M 98,74 L 90,72 L 94,82 Z" />
          </g>
        </svg>
      </div>
    );
  }

  if (type === 'dough') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.4)] transition-all duration-500">
          <defs>
            <radialGradient id="doughBodyGrad" cx="50%" cy="40%" r="50%">
              {bakeProgress < 25 ? (
                <>
                  <stop offset="0%" stopColor="#fafaf5" />
                  <stop offset="70%" stopColor="#f5f0e1" />
                  <stop offset="100%" stopColor="#e8dfc5" />
                </>
              ) : bakeProgress < 65 ? (
                <>
                  <stop offset="0%" stopColor="#f7ecd3" />
                  <stop offset="60%" stopColor="#e5cca1" />
                  <stop offset="100%" stopColor="#ccaa78" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#f3dca3" />
                  <stop offset="50%" stopColor="#d99f59" />
                  <stop offset="90%" stopColor="#b47128" />
                  <stop offset="100%" stopColor="#7c4511" />
                </>
              )}
            </radialGradient>
            <radialGradient id="doughShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Floor Shadow */}
          <ellipse cx="80" cy="100" rx="55" ry="12" fill="url(#doughShadow)" />

          {/* Kneaded raw dough ball rising */}
          <path
            d="M 35,70 
               C 30,45 50,25 80,25 
               C 110,25 130,45 125,70 
               C 120,88 105,98 80,98 
               C 55,98 40,88 35,70 Z"
            fill="url(#doughBodyGrad)"
            stroke="#2e1d0c"
            strokeWidth="2"
            className="transition-all duration-500"
          />

          {/* Soft flour folds and textures */}
          <path
            d="M 50,60 Q 65,48 80,50 Q 95,52 110,60"
            fill="none"
            stroke={bakeProgress < 50 ? "#e2d7be" : "#ca935a"}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="opacity-60"
          />
          <path
            d="M 60,75 Q 80,68 100,75"
            fill="none"
            stroke={bakeProgress < 50 ? "#e2d7be" : "#ca935a"}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="opacity-60"
          />
        </svg>
      </div>
    );
  }

  if (type === 'hamburger') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 160 140" className="w-full h-full drop-shadow-[0_12px_20px_rgba(0,0,0,0.65)] transition-all duration-500">
          <defs>
            {/* Bun toasted colors */}
            <linearGradient id="bunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              {bakeProgress < 25 ? (
                <>
                  <stop offset="0%" stopColor="#fdf7e2" />
                  <stop offset="100%" stopColor="#eedca5" />
                </>
              ) : bakeProgress < 65 ? (
                <>
                  <stop offset="0%" stopColor="#fcd34d" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="70%" stopColor="#9a3412" />
                  <stop offset="100%" stopColor="#451a03" />
                </>
              )}
            </linearGradient>

            {/* Meat Patty */}
            <linearGradient id="pattyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              {bakeProgress < 50 ? (
                <>
                  <stop offset="0%" stopColor="#854d0e" />
                  <stop offset="100%" stopColor="#451a03" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#451a03" />
                  <stop offset="100%" stopColor="#1e0700" />
                </>
              )}
            </linearGradient>

            {/* Cheddar Cheese */}
            <linearGradient id="burgerCheeseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              {bakeProgress < 40 ? (
                <>
                  <stop offset="0%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#eab308" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </>
              )}
            </linearGradient>

            <radialGradient id="burgerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.7)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Floor Shadow */}
          <ellipse cx="80" cy="120" rx="60" ry="12" fill="url(#burgerShadow)" />

          {/* 1. Bottom Bun */}
          <path
            d="M 35,95 C 35,110 50,112 80,112 C 110,112 125,110 125,95 Z"
            fill="url(#bunGrad)"
            stroke="#271000"
            strokeWidth="2.5"
            className="transition-colors duration-500"
          />

          {/* 2. Juicy Patty */}
          <path
            d="M 28,82 C 28,94 40,96 80,96 C 120,96 132,94 132,82 C 132,74 120,74 80,74 C 40,74 28,74 28,82 Z"
            fill="url(#pattyGrad)"
            stroke="#100500"
            strokeWidth="2.5"
            className="transition-colors duration-500"
          />

          {/* Patty Grill Marks */}
          {bakeProgress > 45 && (
            <g stroke="#1a0a02" strokeWidth="1.5" opacity="0.6">
              <line x1="45" y1="78" x2="52" y2="92" />
              <line x1="65" y1="78" x2="72" y2="92" />
              <line x1="85" y1="78" x2="92" y2="92" />
              <line x1="105" y1="78" x2="112" y2="92" />
            </g>
          )}

          {/* 3. Melted Cheese */}
          {bakeProgress < 40 ? (
            <path
              d="M 32,76 L 128,76 L 122,83 L 100,81 L 80,86 L 60,81 L 38,83 Z"
              fill="url(#burgerCheeseGrad)"
              stroke="#b45309"
              strokeWidth="1"
            />
          ) : (
            <path
              d="M 30,76 L 130,76 
                 C 130,76 125,88 120,86 
                 C 115,84 110,95 100,92 
                 C 90,89 82,97 74,90 
                 C 66,83 58,95 50,88 
                 C 42,81 35,88 30,76 Z"
              fill="url(#burgerCheeseGrad)"
              stroke="#b45309"
              strokeWidth="1.5"
              className="transition-all duration-500"
            />
          )}

          {/* 4. Fresh Tomatoes */}
          <path
            d="M 34,70 C 34,76 45,76 80,76 C 115,76 126,76 126,70 Z"
            fill="#dc2626"
            stroke="#991b1b"
            strokeWidth="1.5"
          />

          {/* 5. Lettuce folds */}
          <path
            d="M 26,64 C 26,64 34,72 45,68 C 56,64 64,74 80,68 C 96,62 108,72 118,68 C 128,64 134,64 134,64 L 128,58 L 32,58 Z"
            fill="#22c55e"
            stroke="#15803d"
            strokeWidth="2"
          />

          {/* 6. Top Bun with Sesame */}
          <path
            d="M 30,56 C 25,28 55,18 80,18 C 105,18 135,28 130,56 Z"
            fill="url(#bunGrad)"
            stroke="#271000"
            strokeWidth="2.5"
            className="transition-all duration-500"
          />

          {/* Sesame seeds */}
          <g fill="#fef08a" opacity="0.9" className="transition-all duration-500">
            <ellipse cx="55" cy="36" rx="2" ry="1" transform="rotate(20 55 36)" />
            <ellipse cx="70" cy="28" rx="2" ry="1" transform="rotate(-30 70 28)" />
            <ellipse cx="80" cy="38" rx="2" ry="1" transform="rotate(10 80 38)" />
            <ellipse cx="95" cy="30" rx="2" ry="1" transform="rotate(45 95 30)" />
            <ellipse cx="105" cy="40" rx="2" ry="1" transform="rotate(-15 105 40)" />
            <ellipse cx="65" cy="44" rx="2" ry="1" transform="rotate(-5 65 44)" />
            <ellipse cx="88" cy="46" rx="2" ry="1" transform="rotate(25 88 46)" />
          </g>
        </svg>
      </div>
    );
  }

  return null;
};

export const BakingItem: React.FC<BakingItemProps> = (props) => {
  const { addedIngredients = [], bakeProgress = 0 } = props;

  const positions = [
    { top: '48%', left: '42%' },
    { top: '55%', left: '55%' },
    { top: '62%', left: '30%' },
    { top: '42%', left: '60%' },
    { top: '68%', left: '48%' },
    { top: '50%', left: '25%' },
    { top: '38%', left: '45%' },
    { top: '58%', left: '68%' },
    { top: '70%', left: '35%' },
    { top: '40%', left: '30%' },
  ];

  // Calculate roasting/baking filter parameters based on progress (0 - 100)
  const brightnessVal = 1 - (bakeProgress / 100) * 0.45; // toasted/darkened look (1.0 -> 0.55)
  const sepiaVal = (bakeProgress / 100) * 0.65; // warm golden/baked hue (0.0 -> 0.65)
  const contrastVal = 1 + (bakeProgress / 100) * 0.3; // extra contrast (1.0 -> 1.3)
  const scaleVal = 1.15 - (bakeProgress / 100) * 0.2; // sink/melt into the crust (1.15 -> 0.95)
  const rotateOffset = (bakeProgress / 100) * 15; // slight thermal movement rotation

  return (
    <div className="relative w-full h-full">
      <BakingItemBase {...props} />
      
      {addedIngredients && addedIngredients.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {addedIngredients.map((emoji, index) => {
            const pos = positions[index % positions.length];
            const baseRotation = (index * 35) % 360;
            return (
              <div
                key={index}
                className="absolute text-2xl select-none transition-all duration-500 ease-out"
                style={{
                  top: pos.top,
                  left: pos.left,
                  transform: `translate(-50%, -50%) rotate(${baseRotation + rotateOffset}deg) scale(${scaleVal})`,
                  filter: `drop-shadow(0 ${4 + (bakeProgress/100)*4}px ${6 + (bakeProgress/100)*4}px rgba(0,0,0,${0.6 + (bakeProgress/100)*0.3})) sepia(${sepiaVal}) brightness(${brightnessVal}) contrast(${contrastVal})`,
                  opacity: 0.9 + (bakeProgress / 100) * 0.1, // slightly merges physically
                  animationDelay: `${index * 0.15}s`,
                }}
              >
                {emoji}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
