// ===== ★ グローバル変数定義 ★ =====
let isDarkMode = false;
let ctx = null;
let particles = [];
let animationFrameId = null;

// ★ 追加: カーソルパーティクル用のグローバル変数
let cursorCtx = null;
let cursorParticles = [];
let mouse = { x: null, y: null };
let cursorAnimationId = null;
// ★ 追加: 波紋パーティクル用の配列
let rippleParticles = [];
// ★ 追加: パステルカラーの色相リスト
const pastelHues = [0, 30, 60, 100, 150, 180, 210, 240, 270, 300, 330];


// ★ パーティクルの色の定義 (グローバルスコープ)
const particleColors = {
    light: {
        particle: 'rgba(156, 163, 175, 0.5)', // gray-500, 50%
        line: '156, 163, 175' // RGB (strokeStyle用)
    },
    dark: {
        particle: 'rgba(107, 114, 128, 0.4)', // gray-400, 40%
        line: '107, 114, 128' // RGB (strokeStyle用)
    }
};

// ===== ★ パーティクル色を動的に更新する関数 (グローバルスコープ) ★ =====
const updateParticleColors = (dark) => {
    const newColor = dark ? particleColors.dark.particle : particleColors.light.particle;
    // 既存のパーティクルの色を更新
    for (let i = 0; i < particles.length; i++) {
        if (particles[i]) {
            particles[i].color = newColor;
        }
    }
};

// ===== ★ テーマを適用する関数 (グローバルスコープ) ★ =====
const applyTheme = (dark) => {
    const htmlEl = document.documentElement;

    if (dark) {
        htmlEl.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        htmlEl.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
    
    // グローバル変数を更新
    isDarkMode = dark;
    
    // パーティクル色を更新
    updateParticleColors(dark);
};

// ===== ★ DOMContentLoaded イベントリスナー ★ =====
document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. ダークモード初期化 =====
    const themeToggles = document.querySelectorAll('.theme-toggle');
    
    // 1.1. localStorage から設定を読み込む
    const savedTheme = localStorage.getItem('theme');
    // 1.2. OSの優先設定をチェック
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // 1.3. 初期モードの決定 (localStorage > OS設定 > デフォルト(ライト))
    let initialDarkMode = false;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        initialDarkMode = true;
    }

    // 1.4. 初期ロード時にテーマを適用 (グローバル変数 isDarkMode も設定される)
    applyTheme(initialDarkMode);

    // 1.5. トグルボタンのイベントリスナー
    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            // 現在のモード (isDarkMode) の逆を適用
            applyTheme(!isDarkMode);
        });
    });

    // ===== 2. ハンバーガーメニューのロジック =====
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuLinks = document.querySelectorAll('.menu-link');

    if (menuBtn && mobileMenu) {
        const toggleMenu = () => {
            menuBtn.classList.toggle('open');
            mobileMenu.classList.toggle('open');
            document.body.classList.toggle('overflow-hidden');
            document.body.classList.toggle('menu-open-blur');
        };

        menuBtn.addEventListener('click', toggleMenu);

        menuLinks.forEach(link => {
            link.addEventListener('click', toggleMenu);
        });
    } else {
        console.warn("モバイルメニューの要素が見つかりませんでした。 ('#menu-btn' または '#mobile-menu')");
    }


    // ===== 3. スクロールアニメーション (Intersection Observer) =====
    const sections = document.querySelectorAll('.fade-in-up, .fade-in-right');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    
                    if (entry.target.classList.contains('gallery-item') && entry.target.style.transitionDelay) {
                        entry.target.style.transitionDelay = '0s';
                    }

                    observer.unobserve(entry.target);
                }
            });
        }, { 
            threshold: 0.1, 
            rootMargin: '0px 0px -50px 0px' 
        });

        sections.forEach(section => {
            observer.observe(section);
        });
    } else {
        sections.forEach(section => {
            section.classList.add('is-visible');
        });
    }

    // ===== 4. スクロールでヘダーの背景を変更 =====
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ===== 5. Active Nav Link on Scroll =====
    const sectionsForNav = document.querySelectorAll('main > section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileNavLinks = document.querySelectorAll('#mobile-menu .menu-link');

    const makeLinksActive = (id) => {
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
        mobileNavLinks.forEach(link => {
            // ★ ダークモードを考慮 (JSでのクラス操作は避けるためCSS側で .dark .menu-link.text-gray-800 を上書き)
            link.classList.toggle('text-blue-500', link.getAttribute('href') === `#${id}`);
            link.classList.toggle('text-gray-800', link.getAttribute('href') !== `#${id}`);
        });
    };

    if ('IntersectionObserver' in window) {
        const navObserver = new IntersectionObserver((entries) => {
            const heroEntry = entries.find(entry => entry.target.id === 'hero');
            
            if (heroEntry && heroEntry.isIntersecting && heroEntry.intersectionRatio >= 0.5) {
                navLinks.forEach(link => link.classList.remove('active'));
                mobileNavLinks.forEach(link => {
                    link.classList.remove('text-blue-500');
                    link.classList.add('text-gray-800');
                });
            } else {
                const intersectingEntries = entries
                    .filter(entry => entry.isIntersecting && entry.target.id !== 'hero');
                
                if (intersectingEntries.length > 0) {
                    const topEntry = intersectingEntries.reduce((prev, current) => {
                        return (prev.boundingClientRect.top < current.boundingClientRect.top) ? prev : current;
                    });
                    makeLinksActive(topEntry.target.id);
                }
            }
        }, { 
            threshold: [0.1, 0.5, 0.9], 
            rootMargin: '-50% 0px -50% 0px'
        });

        sectionsForNav.forEach(section => {
            navObserver.observe(section);
        });

        const heroSection = document.getElementById('hero');
        if (heroSection) {
            navObserver.observe(heroSection);
        }
    }

    // ===== 6. History タイムライン描画アニメーション =====
    const historySection = document.getElementById('history');
    const historyLine = document.querySelector('.history-line'); // Desktop
    const historyLineMobile = document.querySelector('.history-line-mobile'); // Mobile
    
    if (historySection && (historyLine || historyLineMobile)) {
        const historyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (historyLine) historyLine.classList.add('animate-draw');
                    if (historyLineMobile) historyLineMobile.classList.add('animate-draw');
                    historyObserver.unobserve(historySection);
                }
            });
        }, { 
            threshold: 0.3, 
            rootMargin: '0px 0px -100px 0px' 
        });
        historyObserver.observe(historySection);
    }

    // ===== 7. パーティクル背景のロジック =====
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        ctx = canvas.getContext('2d'); // グローバル ctx を設定

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles(); 
        };

        class Particle {
            constructor(x, y, dx, dy, radius, color) {
                this.x = x;
                this.y = y;
                this.dx = dx;
                this.dy = dy;
                this.radius = radius;
                this.color = color;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
            }

            update() {
                if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
                    this.dx = -this.dx;
                }
                if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
                    this.dy = -this.dy;
                }
                this.x += this.dx;
                this.y += this.dy;
                this.draw();
            }
        }

        const initParticles = () => {
            particles = []; // グローバル particles をリセット
            
            let particleCount = Math.floor(canvas.width / 30); 
            if (particleCount < 40) particleCount = 40; 
            if (particleCount > 100) particleCount = 100;

            // ★ 初期色を現在のモード (isDarkMode) から決定
            const initialColor = isDarkMode ? particleColors.dark.particle : particleColors.light.particle;

            for (let i = 0; i < particleCount; i++) {
                let radius = Math.random() * 3.5 + 1;
                let x = Math.random() * (canvas.width - radius * 2) + radius;
                let y = Math.random() * (canvas.height - radius * 2) + radius;
                let dx = (Math.random() - 0.5) * 0.8;
                let dy = (Math.random() - 0.5) * 0.8; // Y軸の移動速度
                
                particles.push(new Particle(x, y, dx, dy, radius, initialColor)); // ★ 色を適用
            }
        };

        // パーティクル同士を線で結ぶ
        const connectParticles = () => {
            let maxDistance = 100;
            
            // ★ 線の色も現在のモード (isDarkMode) から決定
            const currentLineColor = isDarkMode ? particleColors.dark.line : particleColors.light.line;

            for (let a = 0; a < particles.length; a++) {
                for (let b = a + 1; b < particles.length; b++) {
                    let dx = particles[a].x - particles[b].x;
                    let dy = particles[a].y - particles[b].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < maxDistance) {
                        ctx.strokeStyle = `rgba(${currentLineColor}, ${1 - distance / maxDistance})`; // ★ 変更
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        // アニメーションループ
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
            }
            connectParticles(); // ★ 毎フレーム isDarkMode をチェックして線の色を描画
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas(); // 初期化
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animate(); // アニメーションループを開始

    } else {
        console.warn("パーティクルキャンバス '#particle-canvas' が見つかりませんでした。");
    }

    // ===== 8. ライトボックス (モーダル) のロジック =====
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCloseBtn = document.getElementById('lightbox-close');
    const galleryItems = document.querySelectorAll('.gallery-scroller-item');

    if (lightbox && lightboxImage && lightboxCloseBtn && galleryItems.length > 0) {
        
        const openLightbox = (imgSrc) => {
            lightboxImage.src = imgSrc;
            lightbox.classList.add('show');
            document.body.classList.add('lightbox-open');
        };

        const closeLightbox = () => {
            lightbox.classList.remove('show');
            document.body.classList.remove('lightbox-open');
            setTimeout(() => {
                lightboxImage.src = '';
            }, 300); 
        };

        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                if (img && img.src) {
                    let highResSrc = img.src;
                    if (highResSrc.includes('pbs.twimg.com')) {
                        highResSrc = highResSrc.replace(/&name=[^&]+/, '') + '&name=orig';
                    }
                    openLightbox(highResSrc);
                }
            });
        });

        lightboxCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            closeLightbox();
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightboxImage) {
                return;
            }
            closeLightbox();
        });

    } else {
        console.warn("ライトボックスの関連要素が見つかりませんでした。");
    }

    // ===== ★ 追加: 9. カーソルパーティクルのロジック =====
    const cursorCanvas = document.getElementById('cursor-particle-canvas');
    if (cursorCanvas) {
        cursorCtx = cursorCanvas.getContext('2d'); // グローバル cursorCtx を設定
        cursorParticles = []; // グローバル配列
        rippleParticles = []; // ★ 波紋配列を初期化
        mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 }; // 初期位置
        let prevMouse = { x: mouse.x, y: mouse.y }; // ★ マウスの前の位置を追跡
        let frameCount = 0; // ★ 密度調整用のフレームカウンター

        const resizeCursorCanvas = () => {
            cursorCanvas.width = window.innerWidth;
            cursorCanvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCursorCanvas);
        resizeCursorCanvas(); // 初期化

        // マウス位置の更新
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        // スマホやタブレット用のタッチ操作
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        }, { passive: true });
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        }, { passive: true });

        // ★ 追加: クリック（タップ）で波紋を生成
        window.addEventListener('click', (e) => {
            createRipple(e.clientX, e.clientY);
        });


        class CursorParticle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                // 広がる速度
                this.vx = (Math.random() - 0.5) * 3.5; // 少し抑えめ
                this.vy = (Math.random() - 0.5) * 3.5; // 少し抑えめ
                // 重力（少し下に落ちるように）
                this.gravity = 0.06;
                this.radius = Math.random() * 3 + 2; // サイズ
                this.life = 50 + Math.random() * 30; // 寿命
                this.maxLife = this.life;
                // ★ 形状を追加
                this.shape = ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)];
                // ★ パステルカラーの色相
                this.hue = pastelHues[Math.floor(Math.random() * pastelHues.length)];
                // ★ 回転用
                this.angle = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.08;
            }

            update() {
                this.life--;
                // 重力を速度に加算
                this.vy += this.gravity;
                // 回転
                this.angle += this.rotationSpeed;
                // 位置を更新
                this.x += this.vx;
                this.y += this.vy;
            }

            draw() {
                if (this.life <= 0) return;
                
                // 寿命に応じて透明度とサイズを変更
                const opacity = Math.max(0, this.life / this.maxLife);
                const radius = Math.max(0, this.radius * (this.life / this.maxLife));
                
                cursorCtx.save();
                // 色相(hue)を使い、透明度(opacity)でフェードアウトさせる
                // ★ 彩度 80%, 輝度 85% に変更（淡いパステル）
                cursorCtx.fillStyle = `hsla(${this.hue}, 80%, 85%, ${opacity})`;
                
                // 回転と移動
                cursorCtx.translate(this.x, this.y);
                cursorCtx.rotate(this.angle);
                
                cursorCtx.beginPath();

                // ★ 形状によって描画を分岐
                switch (this.shape) {
                    case 'circle':
                        cursorCtx.arc(0, 0, radius, 0, Math.PI * 2, false);
                        break;
                    case 'square':
                        cursorCtx.rect(-radius, -radius, radius * 2, radius * 2);
                        break;
                    case 'triangle':
                        cursorCtx.moveTo(0, -radius);
                        cursorCtx.lineTo(radius * 0.866, radius * 0.5);
                        cursorCtx.lineTo(-radius * 0.866, radius * 0.5);
                        cursorCtx.closePath();
                        break;
                }
                
                cursorCtx.fill();
                cursorCtx.restore();
            }
        }

        // ★ 追加: 波紋パーティクルクラス
        class RippleParticle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.radius = 1;
                this.maxRadius = 40 + Math.random() * 30; // 波紋の最大サイズ
                this.life = 1; // 寿命（透明度として使う）
                this.hue = pastelHues[Math.floor(Math.random() * pastelHues.length)];
            }

            update() {
                // 半径を徐々に大きく、スピードは遅く
                this.radius += (this.maxRadius - this.radius) * 0.04;
                // 寿命を減らす
                this.life -= 0.015;
            }

            draw() {
                if (this.life <= 0) return;
                
                cursorCtx.beginPath();
                cursorCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
                // ★ 淡いパステルの線
                cursorCtx.strokeStyle = `hsla(${this.hue}, 80%, 85%, ${this.life})`;
                cursorCtx.lineWidth = 2;
                cursorCtx.stroke();
            }
        }

        // ★ 追加: 波紋生成関数
        const createRipple = (x, y) => {
            // 一度に3つの波紋を生成
            for (let i = 0; i < 3; i++) {
                rippleParticles.push(new RippleParticle(x, y));
            }
        };

        const createCursorParticles = () => {
            // ★ 1フレームに1回だけ生成（密度下げ）
            if (mouse.x !== null && frameCount % 1 === 0) { 
                cursorParticles.push(new CursorParticle(mouse.x, mouse.y));
            }
        };

        const animateCursorParticles = () => {
            // キャンバスをクリア
            cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

            frameCount++; // ★ フレームカウンターを増やす

            // ★ マウスが動いているかチェック
            const mouseMoved = mouse.x !== prevMouse.x || mouse.y !== prevMouse.y;

            // パーティクルを生成 (マウスが動いている時のみ)
            if (mouse.x !== null && mouseMoved) { // マウスが一度でも動いてから生成開始
                createCursorParticles();
            }

            // カーソルパーティクルを更新・描画
            for (let i = cursorParticles.length - 1; i >= 0; i--) {
                const p = cursorParticles[i];
                p.update();
                p.draw();

                // 寿命が尽きたら削除
                if (p.life <= 0) {
                    cursorParticles.splice(i, 1);
                }
            }
            
            // ★ 波紋パーティクルを更新・描画
            for (let i = rippleParticles.length - 1; i >= 0; i--) {
                const r = rippleParticles[i];
                r.update();
                r.draw();
                // 寿命が尽きたら削除
                if (r.life <= 0) {
                    rippleParticles.splice(i, 1);
                }
            }

            // 配列が大きくなりすぎないように制限
            if (cursorParticles.length > 200) { // 制限を 200 に
                cursorParticles.splice(0, cursorParticles.length - 200);
            }

            // ★ 最後にマウス位置を更新
            prevMouse.x = mouse.x;
            prevMouse.y = mouse.y;

            cursorAnimationId = requestAnimationFrame(animateCursorParticles);
        };

        // 既存のアニメーションIDがあればキャンセル（念のため）
        if (cursorAnimationId) {
            cancelAnimationFrame(cursorAnimationId);
        }
        animateCursorParticles(); // アニメーション開始

    } else {
        console.warn("カーソルパーティクルキャンバス '#cursor-particle-canvas' が見つかりませんでした。");
    }


}); // === DOMContentLoaded 終了 ===
