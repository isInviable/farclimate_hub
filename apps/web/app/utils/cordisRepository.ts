import { useSupabaseClient } from "~/composables/useSupabaseClient";
import type { CordisProjectDetail } from "~/types/cordis";

// Core table fetchers (mirror of legacy /api/tables.* endpoints)

const getSupabaseClient = () => useSupabaseClient();

export async function fetchProjectsTable() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects_cordis")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchEntitiesTable() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("entities_cordis")
    .select("*")
    .order("legal_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchProductsTable() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products_cordis")
    .select("*")
    .order("details_published_year", { ascending: false })
    .order("title", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchProjectEntitiesTable() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("project_entities")
    .select(
      `
      project_id,
      entity_id,
      type,
      entity_order,
      total_cost,
      ec_contribution,
      net_ec_contribution,
      sme,
      terminated
    `
    )
    .order("project_id", { ascending: true })
    .order("entity_order", { ascending: true, nullsFirst: false });

  if (error) throw error;

  return (
    data?.map((row: any) => ({
      projectId: row.project_id as string,
      entityId: row.entity_id as string,
      type: row.type as string | null,
      entityOrder: row.entity_order as number | null,
      totalCost: row.total_cost as number | null,
      ecContribution: row.ec_contribution as number | null,
      netEcContribution: row.net_ec_contribution as number | null,
      sme: row.sme as number | null,
      terminated: row.terminated as number | null,
    })) ?? []
  );
}

export async function fetchProjectRisksTable() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("project_risks")
    .select("project_id,risk_id")
    .order("project_id", { ascending: true })
    .order("risk_id", { ascending: true });

  if (error) throw error;
  return (
    data?.map((row: any) => ({
      projectId: row.project_id as string,
      riskId: row.risk_id as number,
    })) ?? []
  );
}

export async function fetchProjectThemesTable() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("project_themes")
    .select("project_id,theme_id")
    .order("project_id", { ascending: true })
    .order("theme_id", { ascending: true });

  if (error) throw error;
  return (
    data?.map((row: any) => ({
      projectId: row.project_id as string,
      themeId: row.theme_id as number,
    })) ?? []
  );
}

export async function fetchAuxClimateRisks() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("aux_climate_risks")
    .select("id, name")
    .order("id", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchAuxThemes() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("aux_themes")
    .select("id, name")
    .order("id", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchAuxEntityTypes() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("aux_entity_types")
    .select("id, name")
    .order("id", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchAuxProductTypes() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("aux_product_types")
    .select("id, name")
    .order("id", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// Higher-level helpers mirroring legacy /api endpoints

export async function fetchTablesOverview() {
  const [
    projects,
    entities,
    products,
    projectEntities,
    projectRisks,
    projectThemes,
    auxClimateRisks,
    auxThemes,
    auxEntityTypes,
    auxProductTypes,
  ] = await Promise.all([
    fetchProjectsTable(),
    fetchEntitiesTable(),
    fetchProductsTable(),
    fetchProjectEntitiesTable(),
    fetchProjectRisksTable(),
    fetchProjectThemesTable(),
    fetchAuxClimateRisks(),
    fetchAuxThemes(),
    fetchAuxEntityTypes(),
    fetchAuxProductTypes(),
  ]);

  return {
    projects,
    entities,
    products,
    projectEntities,
    projectRisks,
    projectThemes,
    auxClimateRisks,
    auxThemes,
    auxEntityTypes,
    auxProductTypes,
  };
}

export async function fetchTagSummary() {
  const supabase = getSupabaseClient();
  const [risks, themes, projectRisks, projectThemes, projects] = await Promise.all([
    fetchAuxClimateRisks(),
    fetchAuxThemes(),
    fetchProjectRisksTable(),
    fetchProjectThemesTable(),
    supabase
      .from("projects_cordis")
      .select("id,total_cost,ec_max_contribution")
      .then(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
  ]);

  const projectsById = new Map(
    (projects as any[]).map((p) => [
      (p as any).id,
      {
        id: (p as any).id as string,
        totalCost: (p as any).total_cost as number | null,
        ecMaxContribution: (p as any).ec_max_contribution as number | null,
      },
    ]),
  );

  const buildSummary = (
    tags: Array<{ id: number; name: string }>,
    linkRows: Array<{ projectId: string; [key: string]: any }>,
    linkKey: string,
  ) => {
    const projectIdsByTag = new Map<number, Set<string>>();

    for (const row of linkRows) {
      const tagId = row[linkKey] as number;
      const projectId = row.projectId as string;
      if (!projectIdsByTag.has(tagId)) {
        projectIdsByTag.set(tagId, new Set());
      }
      projectIdsByTag.get(tagId)!.add(projectId);
    }

    return tags.map((tag) => {
      const projectIds = projectIdsByTag.get(tag.id) ?? new Set<string>();
      let totalCost = 0;
      let ecMaxContribution = 0;

      for (const projectId of projectIds) {
        const project = projectsById.get(projectId);
        if (!project) continue;
        if (project.totalCost != null) totalCost += project.totalCost;
        if (project.ecMaxContribution != null) ecMaxContribution += project.ecMaxContribution;
      }

      return {
        id: tag.id,
        name: tag.name,
        projectCount: projectIds.size,
        totalCost,
        ecMaxContribution,
      };
    });
  };

  const riskSummary = buildSummary(
    risks as Array<{ id: number; name: string }>,
    projectRisks as Array<{ projectId: string; riskId: number }>,
    "riskId",
  ).sort((a, b) => a.name.localeCompare(b.name));

  const themeSummary = buildSummary(
    themes as Array<{ id: number; name: string }>,
    projectThemes as Array<{ projectId: string; themeId: number }>,
    "themeId",
  ).sort((a, b) => a.name.localeCompare(b.name));

  return {
    risks: riskSummary,
    themes: themeSummary,
  };
}

export async function fetchProjectsByRisk(riskId: number) {
  const supabase = getSupabaseClient();
  // Get project ids for this risk
  const { data: links, error: linkError } = await supabase
    .from("project_risks")
    .select("project_id")
    .eq("risk_id", riskId);

  if (linkError) throw linkError;

  const projectIds = Array.from(new Set((links ?? []).map((row) => row.project_id as string)));

  if (projectIds.length === 0) {
    return { riskId, projects: [] };
  }

  const { data, error } = await supabase
    .from("projects_cordis")
    .select(
      `
      id,
      acronym,
      title,
      teaser,
      start_date,
      end_date,
      total_cost,
      ec_max_contribution,
      risks,
      themes
    `
    )
    .in("id", projectIds)
    .order("start_date", { ascending: false });

  if (error) throw error;

  const rows =
    (data ?? []).map((row: any) => ({
      id: row.id as string,
      acronym: row.acronym as string | null,
      title: row.title as string | null,
      teaser: row.teaser as string | null,
      startDate: row.start_date as string | null,
      endDate: row.end_date as string | null,
      totalCost: row.total_cost as number | null,
      ecMaxContribution: row.ec_max_contribution as number | null,
      risks: row.risks as string | null,
      themes: row.themes as string | null,
    })) ?? [];

  return {
    riskId,
    projects: rows,
  };
}

export async function fetchProjectEntities(projectId: string) {
  const supabase = getSupabaseClient();
  const { data: links, error: linkError } = await supabase
    .from("project_entities")
    .select(
      `
      entity_id,
      type,
      entity_order,
      total_cost,
      ec_contribution,
      net_ec_contribution,
      sme,
      terminated
    `
    )
    .eq("project_id", projectId)
    .order("entity_order", { ascending: true, nullsFirst: false });

  if (linkError) throw linkError;

  const entityIds = Array.from(new Set((links ?? []).map((row) => row.entity_id as string)));

  if (entityIds.length === 0) {
    return { projectId, entities: [] };
  }

  const { data: entities, error: entitiesError } = await supabase
    .from("entities_cordis")
    .select(
      `
      id,
      legal_name,
      short_name,
      address_country,
      aux_entity_types(name)
    `
    )
    .in("id", entityIds);

  if (entitiesError) throw entitiesError;

  const entityById = new Map((entities ?? []).map((e: any) => [e.id as string, e]));

  const rows = (links ?? []).map((link: any) => {
    const entity = entityById.get(link.entity_id as string) ?? {};
    return {
      id: link.entity_id as string,
      type: link.type as string | null,
      entityOrder: link.entity_order as number | null,
      totalCost: link.total_cost as number | null,
      ecContribution: link.ec_contribution as number | null,
      netEcContribution: link.net_ec_contribution as number | null,
      sme: link.sme as number | null,
      terminated: link.terminated as number | null,
      legalName: (entity as any).legal_name ?? null,
      shortName: (entity as any).short_name ?? null,
      addressCountry: (entity as any).address_country ?? null,
      organizationActivityType: (entity as any).aux_entity_types?.name ?? null,
    };
  });

  return {
    projectId,
    entities: rows,
  };
}

export async function fetchProjectProducts(projectId: string) {
  const supabase = getSupabaseClient();

  const { data: links, error: linksError } = await supabase
    .from("product_projects")
    .select("product_id")
    .eq("project_id", projectId);

  if (linksError) throw linksError;

  const productIds = Array.from(
    new Set((links ?? []).map((row) => row.product_id as string)),
  );

  if (productIds.length === 0) {
    return { projectId, products: [] };
  }

  const { data, error } = await supabase
    .from("products_cordis")
    .select(
      `
      product_id,
      title,
      details_authors,
      details_journal_number,
      details_journal_title,
      details_published_pages,
      details_published_year,
      details_publisher,
      type_code,
      type_title,
      product_type_id,
      product_type_name,
      sub_type_code,
      sub_type_title,
      doi,
      issn
    `,
    )
    .in("product_id", productIds)
    .order("details_published_year", { ascending: false })
    .order("title", { ascending: true });

  if (error) throw error;

  const rows =
    (data ?? []).map((row: any) => ({
      id: row.product_id as string,
      projectId,
      title: row.title as string | null,
      detailsAuthors: row.details_authors as string | null,
      detailsJournalNumber: row.details_journal_number as string | null,
      detailsJournalTitle: row.details_journal_title as string | null,
      detailsPublishedPages: row.details_published_pages as string | null,
      detailsPublishedYear: row.details_published_year as string | null,
      detailsPublisher: row.details_publisher as string | null,
      typeCode: row.type_code as string | null,
      typeTitle: row.type_title as string | null,
      productTypeId: row.product_type_id as number | null,
      productTypeName: row.product_type_name as string | null,
      subTypeCode: row.sub_type_code as string | null,
      subTypeTitle: row.sub_type_title as string | null,
      doi: row.doi as string | null,
      issn: row.issn as string | null,
    })) ?? [];

  return {
    projectId,
    products: rows,
  };
}

export async function fetchEntityDetail(id: string) {
  const supabase = getSupabaseClient();
  const { data: entityRow, error: entityError } = await supabase
    .from("entities_cordis")
    .select(
      `
      id,
      vat_number,
      legal_name,
      short_name,
      address_street,
      address_city,
      address_postal_code,
      address_country,
      address_url,
      address_geolocation,
      aux_entity_types(name),
      related_region_name,
      related_region_nuts_code,
      related_region_iso_code,
      related_nuts_code_nuts_code
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (entityError) throw entityError;
  if (!entityRow) {
    const error = new Error(`Entity ${id} not found`);
    (error as any).statusCode = 404;
    throw error;
  }

  const entity = {
    id: entityRow.id as string,
    vatNumber: entityRow.vat_number as string | null,
    legalName: entityRow.legal_name as string | null,
    shortName: entityRow.short_name as string | null,
    addressStreet: entityRow.address_street as string | null,
    addressCity: entityRow.address_city as string | null,
    addressPostalCode: entityRow.address_postal_code as string | null,
    addressCountry: entityRow.address_country as string | null,
    addressUrl: entityRow.address_url as string | null,
    addressGeolocation: entityRow.address_geolocation as string | null,
    organizationActivityType: (entityRow as any).aux_entity_types?.name as string | null,
    relatedRegionName: entityRow.related_region_name as string | null,
    relatedRegionNutsCode: entityRow.related_region_nuts_code as string | null,
    relatedRegionIsoCode: entityRow.related_region_iso_code as string | null,
    relatedNutsCodeNutsCode: entityRow.related_nuts_code_nuts_code as string | null,
  };

  const { data: links, error: linksError } = await supabase
    .from("project_entities")
    .select(
      `
      project_id,
      type,
      entity_order,
      total_cost,
      ec_contribution,
      net_ec_contribution,
      sme,
      terminated
    `
    )
    .eq("entity_id", id)
    .order("project_id", { ascending: false });

  if (linksError) throw linksError;

  const projectIds = Array.from(new Set((links ?? []).map((row) => row.project_id as string)));

  let projects: any[] = [];
  if (projectIds.length > 0) {
    const { data: projectRows, error: projectsError } = await supabase
      .from("projects_cordis")
      .select(
        `
        id,
        acronym,
        title,
        start_date,
        end_date,
        total_cost,
        ec_max_contribution
      `
      )
      .in("id", projectIds)
      .order("start_date", { ascending: false });

    if (projectsError) throw projectsError;
    projects = projectRows ?? [];
  }

  const projectById = new Map(
    (projects ?? []).map((p: any) => [p.id as string, p]),
  );

  const detailedProjects = (links ?? []).map((link: any) => {
    const project = projectById.get(link.project_id as string) ?? {};
    return {
      projectId: link.project_id as string,
      type: link.type as string | null,
      entityOrder: link.entity_order as number | null,
      totalCost: link.total_cost as number | null,
      ecContribution: link.ec_contribution as number | null,
      netEcContribution: link.net_ec_contribution as number | null,
      sme: link.sme as number | null,
      terminated: link.terminated as number | null,
      title: (project as any).title ?? null,
      acronym: (project as any).acronym ?? null,
      startDate: (project as any).start_date ?? null,
      endDate: (project as any).end_date ?? null,
      projectTotalCost: (project as any).total_cost ?? null,
      projectEcMaxContribution: (project as any).ec_max_contribution ?? null,
    };
  });

  return {
    entity,
    projects: detailedProjects,
    projectCount: detailedProjects.length,
  };
}

export async function fetchProjectDetail(id: string): Promise<CordisProjectDetail> {
  const supabase = getSupabaseClient();
  const { data: projectRow, error: projectError } = await supabase
    .from("projects_cordis")
    .select(
      `
      id,
      cordis_id,
      acronym,
      title,
      teaser,
      keywords,
      total_cost,
      ec_max_contribution,
      start_date,
      end_date,
      duration
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (projectError) throw projectError;
  if (!projectRow) {
    const error = new Error(`Project ${id} not found`);
    (error as any).statusCode = 404;
    throw error;
  }

  const project = {
    id: projectRow.id,
    cordisId: projectRow.cordis_id ?? null,
    acronym: projectRow.acronym ?? "",
    title: projectRow.title ?? "",
    teaser: projectRow.teaser ?? "",
    keywords: projectRow.keywords ?? "",
    totalCost: projectRow.total_cost ?? null,
    ecMaxContribution: projectRow.ec_max_contribution ?? null,
    startDate: projectRow.start_date ?? null,
    endDate: projectRow.end_date ?? null,
    duration: projectRow.duration ?? null,
  };

  const [riskRows, themeRows, entitiesResult, productsResult] = await Promise.all([
    supabase
      .from("project_risks")
      .select(
        `
        risk_id,
        aux_climate_risks!inner (
          id,
          name
        )
      `
      )
      .eq("project_id", id),
    supabase
      .from("project_themes")
      .select(
        `
        theme_id,
        aux_themes!inner (
          id,
          name
        )
      `
      )
      .eq("project_id", id),
    fetchProjectEntities(id),
    fetchProjectProducts(id),
  ]);

  if (riskRows.error) throw riskRows.error;
  if (themeRows.error) throw themeRows.error;

  const risks =
    (riskRows.data ?? []).map((row: any) => row.aux_climate_risks).filter(Boolean) ??
    [];

  const themes =
    (themeRows.data ?? []).map((row: any) => row.aux_themes).filter(Boolean) ?? [];

  return {
    project,
    risks,
    themes,
    entities: (entitiesResult as any).entities ?? [],
    products: (productsResult as any).products ?? [],
  };
}


