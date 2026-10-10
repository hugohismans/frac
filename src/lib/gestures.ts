import type { Attachment } from 'svelte/attachments';
import { FEEL } from './settings';
import type { Direction } from './game2048/engine';

export interface GestureHandlers {
	onswipe?: (dir: Direction) => void;
	/** Tap court. target = élément le plus proche portant data-gesture-target, ou null. */
	ontap?: (target: HTMLElement | null) => void;
	onlongpress?: (target: HTMLElement) => void;
	/** Fin d'un appui long (doigt levé ou geste annulé). */
	onrelease?: () => void;
}

/**
 * Swipe, tap et appui long sur une même zone, avec les pointer events.
 * Le swipe se déclenche dès que le doigt a parcouru assez de distance, sans attendre qu'il se lève.
 */
export function gestures(handlers: GestureHandlers): Attachment<HTMLElement> {
	return (node) => {
		let pointerId: number | null = null;
		let startX = 0;
		let startY = 0;
		let target: HTMLElement | null = null;
		let swiped = false;
		let moved = false;
		let longPressed = false;
		let timer: ReturnType<typeof setTimeout> | undefined;

		const clearTimer = () => {
			if (timer !== undefined) clearTimeout(timer);
			timer = undefined;
		};

		const reset = () => {
			clearTimer();
			if (longPressed) handlers.onrelease?.();
			pointerId = null;
			target = null;
			longPressed = false;
		};

		const down = (e: PointerEvent) => {
			if (pointerId !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
			pointerId = e.pointerId;
			startX = e.clientX;
			startY = e.clientY;
			swiped = false;
			moved = false;
			longPressed = false;
			target = (e.target as Element | null)?.closest<HTMLElement>('[data-gesture-target]') ?? null;
			try {
				node.setPointerCapture(e.pointerId);
			} catch {
				// Certains navigateurs refusent la capture : les gestes marchent quand même.
			}
			if (target && handlers.onlongpress) {
				const t = target;
				timer = setTimeout(() => {
					timer = undefined;
					if (!moved && !swiped) {
						longPressed = true;
						handlers.onlongpress?.(t);
					}
				}, FEEL.LONG_PRESS_MS);
			}
		};

		const moveHandler = (e: PointerEvent) => {
			if (e.pointerId !== pointerId) return;
			const dx = e.clientX - startX;
			const dy = e.clientY - startY;
			const dist = Math.hypot(dx, dy);
			if (dist > FEEL.TAP_MAX_MOVE_PX) {
				moved = true;
				clearTimer();
			}
			if (!swiped && !longPressed && dist >= FEEL.SWIPE_MIN_PX) {
				swiped = true;
				const dir: Direction =
					Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
				handlers.onswipe?.(dir);
			}
		};

		const up = (e: PointerEvent) => {
			if (e.pointerId !== pointerId) return;
			if (!swiped && !moved && !longPressed) handlers.ontap?.(target);
			reset();
		};

		const cancel = (e: PointerEvent) => {
			if (e.pointerId !== pointerId) return;
			reset();
		};

		const noMenu = (e: Event) => e.preventDefault();

		node.addEventListener('pointerdown', down);
		node.addEventListener('pointermove', moveHandler);
		node.addEventListener('pointerup', up);
		node.addEventListener('pointercancel', cancel);
		node.addEventListener('lostpointercapture', cancel);
		node.addEventListener('contextmenu', noMenu);

		return () => {
			clearTimer();
			node.removeEventListener('pointerdown', down);
			node.removeEventListener('pointermove', moveHandler);
			node.removeEventListener('pointerup', up);
			node.removeEventListener('pointercancel', cancel);
			node.removeEventListener('lostpointercapture', cancel);
			node.removeEventListener('contextmenu', noMenu);
		};
	};
}
