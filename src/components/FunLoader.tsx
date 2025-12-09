import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_MESSAGES = [
    "Training the unicorns... 🦄",
    "Cats are warming up... 🐈",
    "Finding heavy things... 🏋️‍♂️",
    "Consulting the fitness oracles... 🔮",
    "Spotting you... 👀",
    "Chalking up... ☁️",
    "Hydrating pixels... 💧"
];

const ANIMALS = ['🦄', '🐈', '🦒', '🦖', '🦍', '🦘'];

export const FunLoader: React.FC<{ visible: boolean }> = ({ visible }) => {
    const [message, setMessage] = useState(LOADING_MESSAGES[0]);
    const [animalIndex, setAnimalIndex] = useState(0);

    useEffect(() => {
        if (!visible) return;

        // Cycle messages
        const msgInterval = setInterval(() => {
            setMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
        }, 2000);

        // Cycle animals
        const animalInterval = setInterval(() => {
            setAnimalIndex(prev => (prev + 1) % ANIMALS.length);
        }, 800);

        return () => {
            clearInterval(msgInterval);
            clearInterval(animalInterval);
        };
    }, [visible]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md"
                >
                    <div className="relative w-full h-64 flex items-center justify-center overflow-hidden">
                        {/* Animated Animal */}
                        <motion.div
                            key={animalIndex}
                            initial={{ x: -100, y: 20, rotate: -10, scale: 0.8 }}
                            animate={{
                                x: [-50, 50, -50],
                                y: [0, -50, 0],
                                rotate: [-10, 10, -10],
                                scale: 1.5
                            }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            className="text-9xl absolute"
                        >
                            {ANIMALS[animalIndex]}
                        </motion.div>

                        {/* Additional background floaters */}
                        <motion.div
                            animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute top-10 right-10 text-4xl"
                        >
                            ✨
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, 20, 0], opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                            className="absolute bottom-10 left-10 text-4xl"
                        >
                            ⚡️
                        </motion.div>
                    </div>

                    <motion.p
                        key={message}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 mt-8 text-center px-4"
                    >
                        {message}
                    </motion.p>

                    <div className="mt-8 flex gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
