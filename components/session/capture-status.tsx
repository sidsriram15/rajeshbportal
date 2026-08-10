"use client";

import { AlertTriangle, Mic, MicOff, MonitorSpeaker, VolumeX } from "lucide-react";
import { Tooltip } from "@/components/ui/primitives";
import { Waveform } from "@/components/session/waveform";
import type { CaptureState } from "@/lib/types";
import { cn } from "@/lib/utils";

const micCopy: Record<CaptureState["mic"], { label: string; detail: string; ok: boolean }> = {
  idle: { label: "Mic", detail: "Not started", ok: false },
  connected: { label: "Mic", detail: "Microphone connected", ok: true },
  denied: { label: "Mic blocked", detail: "Chrome blocked microphone access", ok: false },
  unavailable: { label: "No mic", detail: "No microphone was found", ok: false },
  lost: { label: "Mic lost", detail: "The microphone disconnected mid-class", ok: false },
};

const sharedCopy: Record<CaptureState["shared"], { label: string; detail: string; ok: boolean }> = {
  idle: { label: "Shared audio", detail: "Not started", ok: false },
  connected: { label: "Shared audio", detail: "Capturing audio from the shared source", ok: true },
  no_audio_track: {
    label: "No shared audio",
    detail: "You shared a screen without its audio — the student is not being transcribed",
    ok: false,
  },
  cancelled: { label: "No shared audio", detail: "Screen sharing was cancelled", ok: false },
  unavailable: {
    label: "Unsupported",
    detail: "This browser cannot capture shared audio",
    ok: false,
  },
  lost: { label: "Shared audio lost", detail: "The shared audio stopped mid-class", ok: false },
};

/** The three-row truth about what is actually being captured. Never optimistic. */
export function CaptureStatus({ capture }: { capture: CaptureState }) {
  const mic = micCopy[capture.mic];
  const shared = sharedCopy[capture.shared];
  const transcribing = capture.transcription === "active";

  return (
    <div className="flex items-center gap-1.5">
      <Tooltip label={mic.detail}>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded border px-2 py-1 text-2xs",
            mic.ok ? "border-line bg-canvas text-muted" : "border-danger/30 bg-danger/[0.07] text-danger"
          )}
        >
          {mic.ok ? <Mic className="size-3" /> : <MicOff className="size-3" />}
          <span className="hidden sm:inline">{mic.label}</span>
        </span>
      </Tooltip>

      <Tooltip label={shared.detail}>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded border px-2 py-1 text-2xs",
            shared.ok
              ? "border-line bg-canvas text-muted"
              : "border-question/30 bg-question/[0.07] text-question"
          )}
        >
          {shared.ok ? <MonitorSpeaker className="size-3" /> : <VolumeX className="size-3" />}
          <span className="hidden sm:inline">{shared.label}</span>
        </span>
      </Tooltip>

      <Tooltip
        label={
          capture.transcription === "error"
            ? "Transcription failed — retrying"
            : capture.transcription === "reconnecting"
              ? "Reconnecting to transcription"
              : transcribing
                ? "Transcribing"
                : "Transcription idle"
        }
      >
        <span
          className={cn(
            "hidden items-center gap-2 rounded border px-2 py-1 md:flex",
            capture.transcription === "error"
              ? "border-danger/30 bg-danger/[0.07]"
              : "border-line bg-canvas"
          )}
        >
          {capture.transcription === "error" ? (
            <AlertTriangle className="size-3 text-danger" />
          ) : (
            <Waveform active={transcribing} bars={10} />
          )}
          <span
            className={cn(
              "text-2xs",
              capture.transcription === "error" ? "text-danger" : "text-muted"
            )}
          >
            {capture.transcription === "error"
              ? "Error"
              : capture.transcription === "reconnecting"
                ? "Reconnecting"
                : transcribing
                  ? "Transcribing"
                  : "Idle"}
          </span>
        </span>
      </Tooltip>
    </div>
  );
}
