import { describe, expect, it } from "vitest";
import { applySavedSearchFiltersState } from "../../app/utils/applySavedSearchFilters";

describe("applySavedSearchFiltersState", () => {
  it("does not restore unsupported filter keys from saved searches", () => {
    const filters: Record<string, unknown> = {};
    const enabledFilters: Record<string, boolean> = {};

    const effective = applySavedSearchFiltersState(
      {
        filters: {
          sector: { Agriculture: true },
          time: "last10",
          phases: { planning: true },
        },
        enabledFilters: {
          sector: true,
          time: true,
          phases: true,
        },
      },
      {
        filters,
        enabledFilters,
        setSearchQuery: () => {},
      }
    );

    expect(effective).toEqual({ sector: { Agriculture: true } });
    expect(enabledFilters.time).toBeUndefined();
    expect(enabledFilters.phases).toBeUndefined();
  });
});
