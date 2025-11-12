import { AnimatePresence } from "motion/react";
import { useEffect, useState, useRef } from "react";
import OrbitGreeting from "@/components/greeting/GreetingAnimation";
import RobotFace from "@/components/robot/RobotFace";
import Background from "@/components/ui/Background";
import { OrbitMain } from "./components/OrbitMain";
import AIImageEditor from "./components/ImageEditor/Editor";
import { useSessionStore } from "./lib/sessionStore";
import { Toaster } from "sonner";

const IDLE_TIMEOUT = 120000; // 2 minutes
const USER_AWAY_TIMEOUT = 3000; // 3 seconds after user_passed

export default function Home() {
	const [isDisappearing, setIsDisappearing] = useState(false);
	const [isFromIdleTimeout, setIsFromIdleTimeout] = useState(false);
	const userAwayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Session state: isTablet + photo booth mode + AI editing + user presence
	const connectWs = useSessionStore((s) => s.connectWs);
	const isTablet = useSessionStore((s) => s.isTablet);
	const photoBoothActive = useSessionStore((s) => s.photoBoothActive);
	const showMainAppFromStore = useSessionStore((s) => s.showMainApp);
	const isRetakeRequested = useSessionStore((s) => s.isRetakeRequested);
	const aiEditActive = useSessionStore((s) => s.aiEditActive);
	const showGreeting = useSessionStore((s) => s.showGreeting);
	const showRobotFace = useSessionStore((s) => s.showRobotFace);
	const userPresent = useSessionStore((s) => s.userPresent);
	const lastActivityTime = useSessionStore((s) => s.lastActivityTime);
	const setShowGreeting = useSessionStore((s) => s.setShowGreeting);
	const setShowMainApp = useSessionStore((s) => s.setShowMainApp);
	const setShowRobotFace = useSessionStore((s) => s.setShowRobotFace);
	const setUserPresent = useSessionStore((s) => s.setUserPresent);
	const updateActivity = useSessionStore((s) => s.updateActivity);

	useEffect(() => {
		connectWs();
	}, [connectWs]);

	// Handle greeting animation completion
	const handleGreetingComplete = () => {
		console.log("[App] Greeting animation completed");
		setShowGreeting(false);
		setShowMainApp(true);
		setShowRobotFace(false);
		updateActivity(); // Ensure activity timer is reset
	};

	// Handle user_passed event - schedule RobotFace after delay
	useEffect(() => {
		if (showGreeting && !userPresent) {
			// User moved away while greeting is playing
			if (userAwayTimerRef.current) {
				clearTimeout(userAwayTimerRef.current);
			}
			userAwayTimerRef.current = setTimeout(() => {
				console.log(
					"[App] User away timeout - will show RobotFace after greeting",
				);
			}, USER_AWAY_TIMEOUT);
		}

		// Reset idle timeout flag when greeting starts (from WebSocket event)
		if (showGreeting && isFromIdleTimeout) {
			setIsFromIdleTimeout(false);
		}

		return () => {
			if (userAwayTimerRef.current) {
				clearTimeout(userAwayTimerRef.current);
			}
		};
	}, [showGreeting, userPresent, isFromIdleTimeout]);

	// Handle user_arrived event during greeting
	useEffect(() => {
		if (showGreeting && userPresent) {
			console.log(
				"[App] User arrived during greeting - will transition to OrbitMain after completion",
			);
			if (userAwayTimerRef.current) {
				clearTimeout(userAwayTimerRef.current);
			}
		}
	}, [showGreeting, userPresent]);

	// Idle timeout - show RobotFace after 2 minutes of inactivity
	useEffect(() => {
		if (!isTablet) return;

		const checkIdle = () => {
			const now = Date.now();
			const timeSinceActivity = now - lastActivityTime;

			if (
				timeSinceActivity >= IDLE_TIMEOUT &&
				(showMainAppFromStore || showGreeting)
			) {
				console.log("[App] Idle timeout reached - showing RobotFace");
				setShowMainApp(false);
				setShowGreeting(false);
				setShowRobotFace(true);
				setUserPresent(false);
				setIsFromIdleTimeout(true);
			}
		};

		// Check every 10 seconds
		idleTimerRef.current = setInterval(checkIdle, 10000);

		return () => {
			if (idleTimerRef.current) {
				clearInterval(idleTimerRef.current);
			}
		};
	}, [
		isTablet,
		lastActivityTime,
		showMainAppFromStore,
		showGreeting,
		setShowMainApp,
		setShowGreeting,
		setShowRobotFace,
		setUserPresent,
	]);

	// Track user interactions to update activity time
	useEffect(() => {
		if (!isTablet) return;

		const handleInteraction = () => {
			updateActivity();
		};

		window.addEventListener("click", handleInteraction);
		window.addEventListener("touchstart", handleInteraction);
		window.addEventListener("keydown", handleInteraction);

		return () => {
			window.removeEventListener("click", handleInteraction);
			window.removeEventListener("touchstart", handleInteraction);
			window.removeEventListener("keydown", handleInteraction);
		};
	}, [isTablet, updateActivity]);

	const handleClick = () => {
		console.log(
			"[App] RobotFace clicked, isDisappearing:",
			isDisappearing,
			"isFromIdleTimeout:",
			isFromIdleTimeout,
		);

		if (!isDisappearing) {
			// If coming from idle timeout, transition immediately without animation
			if (isFromIdleTimeout) {
				console.log(
					"[App] Transitioning from idle timeout - immediate transition to greeting",
				);
				setShowGreeting(true);
				setShowRobotFace(false);
				setIsFromIdleTimeout(false);
				setIsDisappearing(false);
			} else {
				// Normal flow - play disappearing animation first
				console.log("[App] Normal transition - playing disappearing animation");
				setIsDisappearing(true);
				setTimeout(() => {
					setShowGreeting(true);
					setShowRobotFace(false);
					setIsDisappearing(false);
				}, 2000);
			}
		}
	};

  // For non-tablet (phone) mode - original behavior
  if (!isTablet) {
    return (
      <div
        className="relative flex h-screen w-full items-center justify-center overflow-hidden text-foreground"
      >
        <Background />
        <div className="relative z-20 h-full w-full">
          {!(showGreeting || showMainAppFromStore) && (
            <button
              type="button"
              className="h-full w-full cursor-pointer border-0 bg-transparent p-0"
              onClick={handleClick}
              onKeyDown={(e) => e.key === "Enter" && handleClick()}
            >
              <RobotFace
                isDisappearing={isDisappearing}
                skipExitAnimation={isFromIdleTimeout}
              />
            </button>
          )}
          <AnimatePresence mode="wait">
            {showGreeting && (
              <OrbitGreeting onComplete={handleGreetingComplete} />
            )}
          </AnimatePresence>
          {!showGreeting && showMainAppFromStore && <OrbitMain />}
        </div>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

	// Tablet mode - handle all state transitions with priority order
	return (
		<main className="relative flex h-screen w-full items-center justify-center overflow-hidden text-foreground">
			<Background />
			<div className="relative z-20 h-full w-full">
				<AnimatePresence mode="wait">
					{/* Priority 1: AI Image Editor */}
					{aiEditActive && (
						<div
							key="ai-editor"
							className="h-full w-full flex items-center justify-center"
						>
							<AIImageEditor />
						</div>
					)}

					{/* Priority 2: Photo booth mode */}
					{!aiEditActive && (photoBoothActive || isRetakeRequested) && (
						<RobotFace
							key="photobooth"
							isPhotoBooth
							isRetake={isRetakeRequested}
						/>
					)}

					{/* Priority 3: Greeting animation - clickable to skip */}
					{!aiEditActive &&
						!photoBoothActive &&
						!isRetakeRequested &&
						showGreeting && (
							<button
								key="greeting"
								type="button"
								className="h-full w-full cursor-pointer border-0 bg-transparent p-0"
								onClick={handleGreetingComplete}
							>
								<OrbitGreeting onComplete={handleGreetingComplete} />
							</button>
						)}

					{/* Priority 4: Main app */}
					{!aiEditActive &&
						!photoBoothActive &&
						!isRetakeRequested &&
						!showGreeting &&
						showMainAppFromStore && (
							<OrbitMain key="main" skipWelcomeAudio />
						)}

					{/* Priority 5: Robot face (idle state) - clickable to start greeting */}
					{!aiEditActive &&
						!photoBoothActive &&
						!isRetakeRequested &&
						!showGreeting &&
						!showMainAppFromStore &&
						showRobotFace && (
							<button
								key="robot"
								type="button"
								className="h-full w-full cursor-pointer border-0 bg-transparent p-0"
								onClick={handleClick}
							>
								<RobotFace
									isDisappearing={isDisappearing}
									skipExitAnimation={isFromIdleTimeout}
								/>
							</button>
						)}
				</AnimatePresence>
			</div>
			<Toaster position="top-center" richColors />
		</main>
	);
}
