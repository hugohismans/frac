/**
 * Installation de l'application (PWA) : bouton « Installer » sur Android et ordinateur,
 * conseil « Sur l'écran d'accueil » sur iPhone et iPad, et état « jouable hors ligne ».
 */

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class Install {
	/** Le navigateur propose l'installation (Chrome, Edge, Samsung Internet). */
	canPrompt = $state(false);
	/** iPhone ou iPad dans Safari, pas encore installé. */
	iosHint = $state(false);
	/** Déjà lancé depuis l'écran d'accueil. */
	standalone = $state(false);
	/** Le service worker a tout mis en cache. */
	offlineReady = $state(false);

	private deferred: BeforeInstallPromptEvent | null = null;
	private started = false;

	start(): void {
		if (this.started || typeof window === 'undefined') return;
		this.started = true;

		this.standalone =
			window.matchMedia?.('(display-mode: standalone)').matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true;

		const ua = navigator.userAgent;
		const ios =
			/iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
		this.iosHint = ios && !this.standalone;

		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			this.deferred = e as BeforeInstallPromptEvent;
			this.canPrompt = !this.standalone;
		});
		window.addEventListener('appinstalled', () => {
			this.canPrompt = false;
			this.deferred = null;
		});

		navigator.serviceWorker?.ready.then(() => (this.offlineReady = true)).catch(() => {});
	}

	async prompt(): Promise<void> {
		if (!this.deferred) return;
		await this.deferred.prompt();
		await this.deferred.userChoice.catch(() => null);
		this.deferred = null;
		this.canPrompt = false;
	}
}

export const install = new Install();
