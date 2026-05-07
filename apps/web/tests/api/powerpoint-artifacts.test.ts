import { describe, expect, it } from "vitest"
import {
  powerPointArtifactMetadata,
  powerPointArtifactObjectPath,
  safePowerPointFilename,
} from "../../app/composables/usePowerPointArtifacts"

describe("PowerPoint artifact helpers", () => {
  it("builds owner-scoped PowerPoint object paths", () => {
    expect(
      powerPointArtifactObjectPath({
        ownerUserId: "user-1",
        projectId: "project-1",
        artifactId: "artifact-1",
        title: "Climate: deck / draft",
      })
    ).toBe("user-1/project-1/artifact-1/Climate- deck - draft.pptx")
  })

  it("sanitizes download filenames", () => {
    expect(safePowerPointFilename('A/B:C*"Deck"')).toBe("A-B-C--Deck-")
  })

  it("stores reviewed presentation structure in metadata", () => {
    const presentation = {
      title: "Briefing",
      slides: [{ type: "cover" as const, title: "Briefing" }],
    }
    const metadata = powerPointArtifactMetadata({
      presentation,
      sourcePinIds: ["pin-1", "pin-2"],
      metadata: { model: "test-model" },
    })

    expect(metadata).toMatchObject({
      presentation,
      sourceCount: 2,
      model: "test-model",
    })
    expect(typeof metadata.generatedAt).toBe("string")
  })
})
