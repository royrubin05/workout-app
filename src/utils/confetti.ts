import confetti from 'canvas-confetti';

export const triggerConfetti = () => {
    // Pick a random variation between 0 and 9
    const variation = Math.floor(Math.random() * 10);

    const defaults = { origin: { y: 0.7 } };

    switch (variation) {
        case 0: // Basic Spread
            confetti({ ...defaults, spread: 26, startVelocity: 55 });
            confetti({ ...defaults, spread: 60 });
            break;

        case 1: // Randomized Direction
            confetti({
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#bb0000', '#ffffff']
            });
            confetti({
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#bb0000', '#ffffff']
            });
            break;

        case 2: // Fireworks
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 20 * (timeLeft / duration);

                confetti({
                    startVelocity: 30,
                    spread: 360,
                    ticks: 60,
                    zIndex: 0,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                });
                confetti({
                    startVelocity: 30,
                    spread: 360,
                    ticks: 60,
                    zIndex: 0,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                });
            }, 250);

            // Stop fireworks after short burst for UX reasons
            setTimeout(() => clearInterval(interval), 1000);
            break;

        case 3: // Snow
            const durationSnow = 2 * 1000;
            const endSnow = Date.now() + durationSnow;

            (function frame() {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#ffffff', '#a8d5ff']
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#ffffff', '#a8d5ff']
                });

                if (Date.now() < endSnow) {
                    requestAnimationFrame(frame);
                }
            }());
            break;

        case 4: // School Pride (Side Cannons)
            const endPride = Date.now() + (1 * 1000);
            (function frame() {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#6366f1', '#a855f7'] // Indigo/Purple
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#6366f1', '#a855f7']
                });

                if (Date.now() < endPride) {
                    requestAnimationFrame(frame);
                }
            }());
            break;

        case 5: // Stars
            const defaultsStar = {
                spread: 360,
                ticks: 50,
                gravity: 0,
                decay: 0.94,
                startVelocity: 30,
                shapes: ['star'],
                colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8']
            };

            confetti({
                ...defaultsStar,
                particleCount: 40,
                scalar: 1.2,
                shapes: ['star']
            });

            confetti({
                ...defaultsStar,
                particleCount: 10,
                scalar: 0.75,
                shapes: ['circle']
            });
            break;

        case 6: // Center Burst
            confetti({
                origin: { y: 0.5, x: 0.5 },
                spread: 120,
                startVelocity: 45,
                particleCount: 100
            });
            break;

        case 7: // Emoji Rain (Dumbbells)
            const scalar = 3;
            const dumbbell = confetti.shapeFromText({ text: '💪', scalar });

            confetti({
                shapes: [dumbbell],
                scalar,
                particleCount: 15,
                spread: 100,
                origin: { y: 0.5 }
            });
            break;

        case 8: // Emoji Rain (Fire)
            const scalarFire = 3;
            const fire = confetti.shapeFromText({ text: '🔥', scalar: scalarFire });

            confetti({
                shapes: [fire],
                scalar: scalarFire,
                particleCount: 15,
                spread: 100,
                origin: { y: 0.5 }
            });
            break;

        case 9: // The "Real" Confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#22c55e', '#3b82f6', '#eab308', '#ef4444'] // App theme colors
            });
            break;
    }
};
