import { PropsWithChildren } from "react";
import { LaunchVideo } from "@/components/launch-video";
import { useAppOpening } from "@/stores/app-opening";

export function LaunchIntro({ children }: PropsWithChildren) {
  const finished = useAppOpening((state) => state.finished);
  return finished ? children : <LaunchVideo />;
}
