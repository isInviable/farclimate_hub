import { describe, expect, it } from "vitest"
import {
  normalizePodcastScriptComments,
  stripPodcastScriptDirections,
} from "../../app/utils/podcastScript"

describe("podcast script production notes", () => {
  it("converts parenthetical stage directions into comment lines", () => {
    const script = [
      "(Intro music fades in)",
      "Welcome to today's adaptation briefing.",
      "[Segment 2: Urban heat]",
      "Cities are warming faster than surrounding areas.",
    ].join("\n")

    expect(normalizePodcastScriptComments(script)).toBe(
      [
        "# Intro music fades in",
        "Welcome to today's adaptation briefing.",
        "# Segment 2: Urban heat",
        "Cities are warming faster than surrounding areas.",
      ].join("\n")
    )
  })

  it("strips comment lines and inline production notes for TTS", () => {
    const script = [
      "# Intro music fades in",
      "Welcome to today's adaptation briefing.",
      "# Segment 2: Urban heat",
      "Cities are warming faster than surrounding areas (pause).",
      "That matters for public health planning.",
    ].join("\n")

    expect(stripPodcastScriptDirections(script)).toBe(
      [
        "Welcome to today's adaptation briefing.",
        "Cities are warming faster than surrounding areas.",
        "That matters for public health planning.",
      ].join("\n")
    )
  })

  it("keeps spoken parentheticals that are not production notes", () => {
    const script = "Adaptation finance (for example, green bonds) can unlock local projects."
    expect(stripPodcastScriptDirections(script)).toBe(script)
  })
})
