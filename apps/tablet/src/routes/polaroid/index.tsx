import { createFileRoute } from "@tanstack/react-router";
import Polaroid from "../../components/polaroid/Polaroid";

export const Route = createFileRoute("/polaroid/")({
	component: Polaroid,
});
