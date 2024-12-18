export class AudioManager {
    private static instance: AudioManager;
    private backgroundMusic: HTMLAudioElement | null = null;
    private revolutionSound: HTMLAudioElement | null = null;
    private isMuted: boolean = false;
    private volume: number = 0.03;
    private isPlaying: boolean = false;

    private constructor() {
        this.initBackgroundMusic();
        this.initRevolutionSound();
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    private initBackgroundMusic() {
        try {
            this.backgroundMusic = new Audio();
            this.backgroundMusic.src = '/assets/sound-design/music/jazz_loop_119bpm.wav';
            if (this.backgroundMusic) {
                this.backgroundMusic.loop = true;
                this.backgroundMusic.volume = this.volume;
                this.backgroundMusic.load();
                
                document.addEventListener('click', () => {
                    if (!this.isPlaying) {
                        this.playBackgroundMusic();
                    }
                }, { once: true });
                
                this.backgroundMusic.onended = () => {
                    this.isPlaying = false;
                };

                this.backgroundMusic.onpause = () => {
                    this.isPlaying = false;
                };

                this.backgroundMusic.onplay = () => {
                    this.isPlaying = true;
                };

                this.backgroundMusic.onerror = (e) => {
                    console.error('Erreur de chargement audio:', e);
                    this.isPlaying = false;
                };
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'audio:', error);
        }
    }

    private initRevolutionSound() {
        try {
            console.log("Initialisation du son de révolution...");
            this.revolutionSound = new Audio();
            this.revolutionSound.src = '/assets/sound-design/effects/revolution normale.wav';
            if (this.revolutionSound) {
                this.revolutionSound.volume = this.volume;
                this.revolutionSound.load();
                
                // Ajouter des événements pour suivre l'état du chargement
                this.revolutionSound.onloadeddata = () => {
                    console.log("Son de révolution chargé avec succès");
                };
                this.revolutionSound.onerror = (e) => {
                    console.error("Erreur de chargement du son de révolution:", e);
                };
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du son de révolution:', error);
        }
    }

    public playBackgroundMusic() {
        if (!this.backgroundMusic || this.isMuted || this.isPlaying) return;

        try {
            const playPromise = this.backgroundMusic.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        this.isPlaying = true;
                    })
                    .catch(error => {
                        this.isPlaying = false;
                        if (error.name !== 'NotAllowedError') {
                            console.error('Erreur lors de la lecture de la musique:', error);
                        }
                    });
            }
        } catch (error) {
            this.isPlaying = false;
            console.error('Erreur lors de la lecture de la musique:', error);
        }
    }

    public playRevolutionSound() {
        console.log("Tentative de lecture du son de révolution...");
        console.log("État du son:", {
            exists: !!this.revolutionSound,
            isMuted: this.isMuted,
            volume: this.volume
        });

        if (!this.revolutionSound || this.isMuted) {
            console.log("Son non joué car:", !this.revolutionSound ? "non initialisé" : "muté");
            return;
        }

        try {
            // Réinitialiser le son pour pouvoir le rejouer
            this.revolutionSound.currentTime = 0;
            const playPromise = this.revolutionSound.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log("Son de révolution joué avec succès");
                    })
                    .catch(error => {
                        console.error('Erreur lors de la lecture du son de révolution:', error);
                    });
            }
        } catch (error) {
            console.error('Erreur lors de la lecture du son de révolution:', error);
        }
    }

    public stopBackgroundMusic() {
        if (!this.backgroundMusic || !this.isPlaying) return;

        try {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.isPlaying = false;
        } catch (error) {
            console.error('Erreur lors de l\'arrêt de la musique:', error);
        }
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (!this.backgroundMusic) return;

        try {
            if (this.isMuted) {
                if (this.isPlaying) {
                    this.backgroundMusic.pause();
                    this.isPlaying = false;
                }
            } else if (!this.isPlaying) {
                this.playBackgroundMusic();
            }
        } catch (error) {
            console.error('Erreur lors du changement de mute:', error);
        }
    }

    public setVolume(value: number) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.volume;
        }
        if (this.revolutionSound) {
            this.revolutionSound.volume = this.volume;
        }
    }

    public getVolume(): number {
        return this.volume;
    }

    public isMusicMuted(): boolean {
        return this.isMuted;
    }
}
