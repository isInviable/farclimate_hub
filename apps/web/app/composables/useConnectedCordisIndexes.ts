import type { ConnectedCordisIndexes } from "~/types/connectedCordis";
import { buildConnectedCordisIndexes } from "~/utils/buildConnectedCordisIndexes";
import { useConnectedCordisData } from "~/composables/useConnectedCordisData";
import { useConnectedGeo } from "~/composables/useConnectedGeo";

export function useConnectedCordisIndexes() {
  const cordis = useConnectedCordisData();
  const geo = useConnectedGeo();

  const indexesState = useState<ConnectedCordisIndexes | null>("connected-cordis-indexes", () => null);

  function buildIndexes(): ConnectedCordisIndexes | null {
    if (
      cordis.pending.value ||
      geo.pending.value ||
      !cordis.projects.value ||
      !cordis.entities.value ||
      !geo.nutsNameById.value ||
      !geo.validNuts3Ids.value
    ) {
      return null;
    }

    return buildConnectedCordisIndexes({
      projects: cordis.projects.value,
      entities: cordis.entities.value,
      projectEntities: cordis.projectEntities.value,
      projectRisks: cordis.projectRisks.value ?? [],
      projectThemes: cordis.projectThemes.value ?? [],
      risks: cordis.risks.value ?? [],
      themes: cordis.themes.value ?? [],
      entityTypes: cordis.entityTypes.value ?? [],
      nutsNameById: geo.nutsNameById.value,
      validNuts3Ids: geo.validNuts3Ids.value,
    });
  }

  watch(
    [
      cordis.pending,
      geo.pending,
      cordis.projects,
      cordis.entities,
      cordis.projectEntities,
      cordis.projectRisks,
      cordis.projectThemes,
      cordis.risks,
      cordis.themes,
      geo.nutsNameById,
      geo.validNuts3Ids,
    ],
    () => {
      if (cordis.pending.value || geo.pending.value) {
        indexesState.value = null;
        return;
      }
      const built = buildIndexes();
      if (built) indexesState.value = built;
    },
    { immediate: true }
  );

  const indexes = computed(() => indexesState.value);
  const ready = computed(() => !cordis.pending.value && !geo.pending.value && indexes.value !== null);

  const error = computed(() => cordis.error.value || geo.error.value);

  return {
    ...cordis,
    indexes,
    ready,
    error,
    geo,
  };
}
