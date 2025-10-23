"use client";

import { Howl } from "howler";
import { useEffect, useRef } from "react";

interface AudioSyncProps {
	isPlaying: boolean;
	stage: "detecting" | "greeting" | "complete";
	lineIndex: number;
	charIndex: number;
}

export default function AudioSync({
	isPlaying,
	stage,
	lineIndex,
	charIndex,
}: AudioSyncProps) {
	const welcomeSoundRef = useRef<Howl | null>(null);

	useEffect(() => {
		// Initialize welcome sound only once
		if (!welcomeSoundRef.current) {
			welcomeSoundRef.current = new Howl({
				src: ["/audio/welcome.mp3"],
				volume: 0.8,
				preload: true,
			});
		}

		return () => {
			// Cleanup sound on unmount
			if (welcomeSoundRef.current) {
				welcomeSoundRef.current.unload();
				welcomeSoundRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (!isPlaying) return;

		// Only play welcome sound when greeting starts
		if (stage === "greeting" && lineIndex === 0 && charIndex === 0) {
			welcomeSoundRef.current?.play();
		}
	}, [isPlaying, stage, lineIndex, charIndex]);

	return null;
}
