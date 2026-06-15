#!/usr/bin/env node
/**
 * One-off merge of i18n keys for public-app hardcoded strings pass.
 * Run: node scripts/i18n-merge-locales.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, "../i18n/locales");

const additions = {
  en: {
    common: {
      share: "Share",
      cancel: "Cancel",
      requestFailed: "Request failed",
    },
    auth: {
      signIn: "Sign in",
      logOut: "Log out",
      backToHome: "← Back to home",
      tabs: { signIn: "Sign in", signUp: "Sign up" },
      headings: {
        checkEmail: "Check your email",
        signIn: "Sign in",
        welcome: "Welcome",
      },
      subtitle: {
        otpSent: "We sent a 6-digit code to {email}",
        password: "Sign in with your email and password.",
        demo:
          "In demo mode your browsing isn't saved. Sign in or create an account to save your work.",
      },
      fields: {
        email: "Email",
        password: "Password",
        name: "Your name",
        emailPlaceholder: "your@email.com",
        passwordPlaceholder: "Enter your password",
        namePlaceholder: "How should we call you?",
      },
      actions: {
        signIn: "Sign in",
        createAccount: "Create account",
        continue: "Continue",
        signInWithCode: "← Sign in with email code instead",
        signInWithPassword: "Sign in with password instead",
      },
      otp: {
        verifying: "Verifying…",
        changeEmail: "← Change email",
        resendCode: "Resend code",
        resendIn: "Resend in {seconds}s",
      },
      errors: {
        rateLimit:
          "Too many requests. Please wait a moment before trying again.",
        expired: "The code has expired. Please request a new one.",
        invalidOtp: "Invalid code. Please check and try again.",
        unexpected: "An unexpected error occurred. Please try again.",
        invalidCredentials: "Invalid email or password.",
      },
      validation: {
        emailRequired: "Please enter your email address.",
        emailInvalid: "Please enter a valid email address.",
        nameRequired: "Please enter your name.",
        emailPasswordRequired: "Please enter both email and password.",
      },
    },
    skills: {
      readTime: "{minutes} min. read",
      index: {
        heroTitle: "Learn the skills to adapt and thrive in a changing climate",
        heroSubtitle:
          "Here you can explore practical skills to face climate challenges. Filter what interests you from the menu on the left, and discover on the right a collection of tools, courses, and real cases ready to inspire your next steps",
        sortMoreViews: "More views",
        sortRelevance: "Relevance",
      },
      sidebar: { allTrainings: "All trainings", filterBy: "Filter by" },
      empty: {
        title: "No skills found",
        description: "Try adjusting your filters or check back later.",
      },
      detail: { back: "Back to skills", externalLinks: "External links" },
      errors: { notFound: "Skill not found" },
    },
    projects: {
      unnamed: "Unnamed Project",
      header: {
        projectMenu: "Project menu",
        project: "Project",
        signInToUse: "Sign in to use projects",
        shareBoard: "Share board",
        copied: "Copied",
        copy: "Copy",
        explorer: "Explorer",
        editedAgo: "edited {time} ago",
        pinnedCount: "{count} pinned",
        shareError: "Could not create share link",
        publicLinkHint: "Public board link — anyone with the link can view.",
        copyLinkPlaceholder: "Click Copy to create link",
        shareSignInRequired: "Sign in to share this board.",
        projectsDashboard: "Projects Dashboard",
        signInToManageProjects: "Sign in to create and manage projects",
        createNewProject: "Create New Project",
        newProjectDefault: "New Project",
        editedJustNow: "just now",
        editedMinutesAgo: "edited {count}m ago",
        editedHoursAgo: "edited {count}h ago",
        editedDaysAgo: "edited {count}d ago",
        editedMonthsAgo: "edited {count}mo ago",
        editedYearsAgo: "edited {count}y ago",
      },
      dashboard: {
        cardDescription:
          "Each project card opens your workspace in the explorer. Use Go to explorer at the bottom of a card (or click anywhere on the card) to browse case studies.",
        signInToCreateProjects: "Sign in to create projects",
        signInToManageHeading: "Sign in to manage projects",
        signInToManageBody:
          "Projects are saved to your account. Sign in to create and manage projects across devices.",
        emptyFirstHeading: "No projects yet",
        emptyFirstBody:
          "Create your first project to start organizing your climate adaptation research and pinned items.",
        createFirstProject: "Create your first project",
        createNewProjectButton: "Create new project",
        enterProjectName: "Enter project name…",
        cancel: "Cancel",
        createProject: "Create project",
        renameProject: "Rename project",
        deleteProject: "Delete project",
        confirmDeleteTitle: "Delete project?",
        metaTitle: "Projects",
        metaDescription: "Manage your explorer projects and pinboards.",
        eyebrow: "Projects",
        title: "Your projects",
        subtitle: "Create and switch between projects to organize pins and saved searches.",
        emptyTitle: "No projects yet",
        emptyDescription: "Create a project to start pinning and saving searches.",
        createButton: "Create project",
        modalCreateTitle: "Create project",
        modalEditTitle: "Edit project",
        nameLabel: "Project name",
        namePlaceholder: "My adaptation project",
        promptName: "Enter a name for the new project:",
        confirmDelete: "Delete this project? Pins and saved searches will be removed.",
      },
      stats: {
        overview: "Overview",
        title: "Project statistics",
        totalProjects: "Total projects",
        totalPins: "Total pins",
        savedSearches: "Saved searches",
        notAvailable: "N/A",
      },
      card: {
        goToExplorer: "Go to explorer",
        goToExplorerCurrent: "Go to explorer (current project)",
      },
      errors: {
        load: "Failed to load projects",
        create: "Failed to create project",
        update: "Failed to update project",
        delete: "Failed to delete project",
        notAuthenticated: "Not authenticated",
      },
    },
    publicBoard: {
      actions: {
        viewOnly: "View only",
        cloneToProjects: "Clone to my projects",
        addComment: "Add comment",
        download: "Download",
      },
      comments: {
        title: "Comments",
        empty: "No comments yet.",
        placeholder: "Write a comment...",
        submit: "Add comment",
      },
      errors: { load: "Failed to load public board" },
    },
    boardActions: {
      videoSummary: "Create video summary",
      moreActions: "More actions...",
      chatWithSelection: "Chat with selection",
      topInsightsSelection: "Top insights (selection)",
      videoSummaryModal: "Video summary",
    },
    header: {
      brandTitle: "FARCLIMATE Transformation Hub",
      brandTitleLine1: "FARCLIMATE",
      brandTitleLine2: "Transformation Hub",
      solutions: "Solutions",
      stories: "Stories",
      skills: "Skills",
      connectedAction: "Connected Action",
      about: "About",
      home: "Home",
      network: "Network",
      pinsBoard: "PinBoard",
    },
    listActions: {
      selectedLabel: "selected",
      chatWithSelection: "Chat with selection",
      mindmap: "Mind map",
    },
    search: {
      corpusPlaceholder: "Search corpus…",
      clearAll: "Clear All",
      applyFilters: "Apply Filters",
      allFiltersActive: "All filters are active",
      removeFiltersHint: "Remove filters above to make them available again",
    },
    filters: {
      sector: "Sector",
      climateImpacts: "Climate impacts",
      climateHazards: "Climate Hazards",
      adaptationApproaches: "Adaptation approaches",
      biogeographicalRegion: "Biogeographical region",
      searchFilter: "Search",
      empty: {
        sector: "No sector data yet. Run a search to load facets.",
        hazards: "No climate impact data yet. Run a search to load facets.",
        bioregion: "No biogeographical region data yet. Run a search to load facets.",
        adaptationApproaches:
          "No adaptation approach data yet. Run a search to load facets.",
      },
      status: {
        none: "No filter applied",
        itemsSelected: "{count} items selected",
        optionsSelected: "{count} options selected",
        applied: "Filter applied",
      },
      toggleAria: "{action} {title} filter",
      toggleEnable: "Enable",
      toggleDisable: "Disable",
      visualization: {
        placeholder: "Visualization not available for this filter.",
      },
      showAll: "Show all",
    },
    explorer: {
      meta: {
        title: "Climate Adaptation Explorer",
        description: "Search and explore climate adaptation case studies.",
      },
    },
    viewModes: {
      compare: "Compare",
      analyse: "Analyse",
      byBioRegions: "By bioRegions",
      cardView: "Cards",
      tabsAria: "View mode",
      mindmap: "Mind map",
      mapEmptyTitle: "No locations to display",
      mapEmptyDescription: "Search results don't contain geographic data",
      downloadPng: "Download PNG",
      umapEmpty: "No results to map",
      instagramUnknownTitle: "Unknown Title",
      instagramClimateShaper: "Climate Shaper",
    },
    article: {
      errors: { notFound: "Article not found" },
    },
    summary: {
      empty: { economic: "No economic data available" },
    },
    pins: {
      errors: {
        load: "Failed to load pins",
        create: "Failed to create pin",
        update: "Failed to update pin",
        delete: "Failed to delete pin",
        reorder: "Failed to reorder pins",
        loadSavedSearches: "Failed to load saved searches",
        saveSearch: "Failed to save search",
        deleteSavedSearch: "Failed to delete search",
      },
      share: { linkCopied: "Link copied to clipboard" },
      exports: { signInRequired: "Sign in to generate a download." },
    },
  },
  es: {
    common: {
      share: "Compartir",
      cancel: "Cancelar",
      requestFailed: "La solicitud falló",
    },
    auth: {
      signIn: "Iniciar sesión",
      logOut: "Cerrar sesión",
      backToHome: "← Volver al inicio",
      tabs: { signIn: "Iniciar sesión", signUp: "Registrarse" },
      headings: {
        checkEmail: "Revisa tu correo",
        signIn: "Iniciar sesión",
        welcome: "Bienvenido",
      },
      subtitle: {
        otpSent: "Enviamos un código de 6 dígitos a {email}",
        password: "Inicia sesión con tu correo y contraseña.",
        demo:
          "En modo demo tu navegación no se guarda. Inicia sesión o crea una cuenta para guardar tu trabajo.",
      },
      fields: {
        email: "Correo electrónico",
        password: "Contraseña",
        name: "Tu nombre",
        emailPlaceholder: "tu@email.com",
        passwordPlaceholder: "Introduce tu contraseña",
        namePlaceholder: "¿Cómo debemos llamarte?",
      },
      actions: {
        signIn: "Iniciar sesión",
        createAccount: "Crear cuenta",
        continue: "Continuar",
        signInWithCode: "← Iniciar sesión con código por correo",
        signInWithPassword: "Iniciar sesión con contraseña",
      },
      otp: {
        verifying: "Verificando…",
        changeEmail: "← Cambiar correo",
        resendCode: "Reenviar código",
        resendIn: "Reenviar en {seconds}s",
      },
      errors: {
        rateLimit:
          "Demasiadas solicitudes. Espera un momento antes de intentarlo de nuevo.",
        expired: "El código ha caducado. Solicita uno nuevo.",
        invalidOtp: "Código no válido. Compruébalo e inténtalo de nuevo.",
        unexpected: "Ocurrió un error inesperado. Inténtalo de nuevo.",
        invalidCredentials: "Correo o contraseña no válidos.",
      },
      validation: {
        emailRequired: "Introduce tu dirección de correo.",
        emailInvalid: "Introduce un correo válido.",
        nameRequired: "Introduce tu nombre.",
        emailPasswordRequired: "Introduce correo y contraseña.",
      },
    },
    skills: {
      readTime: "{minutes} min. de lectura",
      index: {
        heroTitle:
          "Aprende las habilidades para adaptarte y prosperar en un clima cambiante",
        heroSubtitle:
          "Aquí puedes explorar habilidades prácticas para afrontar los retos climáticos. Filtra lo que te interese en el menú de la izquierda y descubre a la derecha herramientas, cursos y casos reales listos para inspirar tus próximos pasos",
        sortMoreViews: "Más vistas",
        sortRelevance: "Relevancia",
      },
      sidebar: { allTrainings: "Todas las formaciones", filterBy: "Filtrar por" },
      empty: {
        title: "No se encontraron habilidades",
        description: "Prueba a ajustar los filtros o vuelve más tarde.",
      },
      detail: {
        back: "Volver a habilidades",
        externalLinks: "Enlaces externos",
      },
      errors: { notFound: "Habilidad no encontrada" },
    },
    projects: {
      unnamed: "Proyecto sin nombre",
      header: {
        projectMenu: "Menú del proyecto",
        project: "Proyecto",
        signInToUse: "Inicia sesión para usar proyectos",
        shareBoard: "Compartir tablero",
        copied: "Copiado",
        copy: "Copiar",
        explorer: "Explorador",
        editedAgo: "editado hace {time}",
        pinnedCount: "{count} fijados",
        shareError: "No se pudo crear el enlace para compartir",
      },
      dashboard: {
        metaTitle: "Proyectos",
        metaDescription:
          "Gestiona tus proyectos del explorador y tableros de marcadores.",
        eyebrow: "Proyectos",
        title: "Tus proyectos",
        subtitle:
          "Crea y cambia entre proyectos para organizar marcadores y búsquedas guardadas.",
        emptyTitle: "Aún no hay proyectos",
        emptyDescription:
          "Crea un proyecto para empezar a fijar contenido y guardar búsquedas.",
        createButton: "Crear proyecto",
        modalCreateTitle: "Crear proyecto",
        modalEditTitle: "Editar proyecto",
        nameLabel: "Nombre del proyecto",
        namePlaceholder: "Mi proyecto de adaptación",
        promptName: "Introduce un nombre para el nuevo proyecto:",
        confirmDelete:
          "¿Eliminar este proyecto? Se eliminarán los marcadores y búsquedas guardadas.",
      },
      stats: {
        overview: "Resumen",
        title: "Estadísticas del proyecto",
        totalProjects: "Proyectos totales",
        totalPins: "Marcadores totales",
        savedSearches: "Búsquedas guardadas",
        notAvailable: "N/D",
      },
      card: {
        goToExplorer: "Ir al explorador",
        goToExplorerCurrent: "Ir al explorador (proyecto actual)",
      },
      errors: {
        load: "No se pudieron cargar los proyectos",
        create: "No se pudo crear el proyecto",
        update: "No se pudo actualizar el proyecto",
        delete: "No se pudo eliminar el proyecto",
        notAuthenticated: "No autenticado",
      },
    },
    publicBoard: {
      actions: {
        viewOnly: "Solo lectura",
        cloneToProjects: "Clonar en mis proyectos",
        addComment: "Añadir comentario",
        download: "Descargar",
      },
      comments: {
        title: "Comentarios",
        empty: "Aún no hay comentarios.",
        placeholder: "Escribe un comentario...",
        submit: "Añadir comentario",
      },
      errors: { load: "No se pudo cargar el tablero público" },
    },
    boardActions: {
      videoSummary: "Crear resumen en vídeo",
      moreActions: "Más acciones...",
      chatWithSelection: "Chat con la selección",
      topInsightsSelection: "Ideas clave (selección)",
      videoSummaryModal: "Resumen en vídeo",
    },
    header: {
      brandTitle: "FARCLIMATE Transformation Hub",
      brandTitleLine1: "FARCLIMATE",
      brandTitleLine2: "Transformation Hub",
      solutions: "Soluciones",
      stories: "Historias",
      skills: "Habilidades",
      connectedAction: "Acción Conectada",
      about: "Acerca de",
      home: "Inicio",
      network: "Red",
      pinsBoard: "Tablero de Marcadores",
    },
    listActions: {
      selectedLabel: "seleccionados",
      chatWithSelection: "Chat con la selección",
      mindmap: "Mapa mental",
    },
    search: {
      corpusPlaceholder: "Buscar en el corpus…",
      clearAll: "Borrar todo",
      applyFilters: "Aplicar filtros",
      allFiltersActive: "Todos los filtros están activos",
      removeFiltersHint:
        "Elimina filtros arriba para volver a hacerlos disponibles",
    },
    filters: {
      sector: "Sector",
      climateImpacts: "Impactos climáticos",
      climateHazards: "Peligros climáticos",
      adaptationApproaches: "Enfoques de adaptación",
      biogeographicalRegion: "Región biogeográfica",
      searchFilter: "Búsqueda",
      empty: {
        sector:
          "Aún no hay datos de sector. Ejecuta una búsqueda para cargar facetas.",
        hazards:
          "Aún no hay datos de impactos climáticos. Ejecuta una búsqueda para cargar facetas.",
        bioregion:
          "Aún no hay datos de región biogeográfica. Ejecuta una búsqueda para cargar facetas.",
        adaptationApproaches:
          "Aún no hay datos de enfoques de adaptación. Ejecuta una búsqueda para cargar facetas.",
      },
      status: {
        none: "Sin filtro aplicado",
        itemsSelected: "{count} elementos seleccionados",
        optionsSelected: "{count} opciones seleccionadas",
        applied: "Filtro aplicado",
      },
      toggleAria: "{action} filtro {title}",
      toggleEnable: "Activar",
      toggleDisable: "Desactivar",
      visualization: {
        placeholder: "Visualización no disponible para este filtro.",
      },
      showAll: "Mostrar todo",
    },
    explorer: {
      meta: {
        title: "Explorador de Adaptación Climática",
        description:
          "Busca y explora estudios de caso de adaptación climática.",
      },
    },
    viewModes: {
      compare: "Comparar",
      analyse: "Analizar",
      byBioRegions: "Por biorregiones",
      cardView: "Tarjetas",
      tabsAria: "Modo de vista",
      mindmap: "Mapa mental",
      mapEmptyTitle: "No hay ubicaciones que mostrar",
      mapEmptyDescription:
        "Los resultados de búsqueda no contienen datos geográficos",
      downloadPng: "Descargar PNG",
      umapEmpty: "No hay resultados para el mapa",
      instagramUnknownTitle: "Título desconocido",
      instagramClimateShaper: "Climate Shaper",
    },
    article: {
      errors: { notFound: "Artículo no encontrado" },
    },
    summary: {
      empty: { economic: "No hay datos económicos disponibles" },
    },
    pins: {
      errors: {
        load: "No se pudieron cargar los marcadores",
        create: "No se pudo crear el marcador",
        update: "No se pudo actualizar el marcador",
        delete: "No se pudo eliminar el marcador",
        reorder: "No se pudo reordenar los marcadores",
        loadSavedSearches: "No se pudieron cargar las búsquedas guardadas",
        saveSearch: "No se pudo guardar la búsqueda",
        deleteSavedSearch: "No se pudo eliminar la búsqueda",
      },
      share: { linkCopied: "Enlace copiado al portapapeles" },
      exports: {
        signInRequired: "Inicia sesión para generar una descarga.",
      },
    },
  },
  it: {
    common: {
      share: "Condividi",
      cancel: "Annulla",
      requestFailed: "Richiesta non riuscita",
    },
    auth: {
      signIn: "Accedi",
      logOut: "Esci",
      backToHome: "← Torna alla home",
      tabs: { signIn: "Accedi", signUp: "Registrati" },
      headings: {
        checkEmail: "Controlla la tua email",
        signIn: "Accedi",
        welcome: "Benvenuto",
      },
      subtitle: {
        otpSent: "Abbiamo inviato un codice a 6 cifre a {email}",
        password: "Accedi con email e password.",
        demo:
          "In modalità demo la navigazione non viene salvata. Accedi o crea un account per salvare il tuo lavoro.",
      },
      fields: {
        email: "Email",
        password: "Password",
        name: "Il tuo nome",
        emailPlaceholder: "tua@email.com",
        passwordPlaceholder: "Inserisci la password",
        namePlaceholder: "Come possiamo chiamarti?",
      },
      actions: {
        signIn: "Accedi",
        createAccount: "Crea account",
        continue: "Continua",
        signInWithCode: "← Accedi con codice via email",
        signInWithPassword: "Accedi con password",
      },
      otp: {
        verifying: "Verifica in corso…",
        changeEmail: "← Cambia email",
        resendCode: "Invia di nuovo il codice",
        resendIn: "Invia di nuovo tra {seconds}s",
      },
      errors: {
        rateLimit:
          "Troppe richieste. Attendi un momento prima di riprovare.",
        expired: "Il codice è scaduto. Richiedine uno nuovo.",
        invalidOtp: "Codice non valido. Controlla e riprova.",
        unexpected: "Si è verificato un errore imprevisto. Riprova.",
        invalidCredentials: "Email o password non validi.",
      },
      validation: {
        emailRequired: "Inserisci il tuo indirizzo email.",
        emailInvalid: "Inserisci un indirizzo email valido.",
        nameRequired: "Inserisci il tuo nome.",
        emailPasswordRequired: "Inserisci email e password.",
      },
    },
    skills: {
      readTime: "{minutes} min. di lettura",
      index: {
        heroTitle:
          "Impara le competenze per adattarti e prosperare in un clima che cambia",
        heroSubtitle:
          "Qui puoi esplorare competenze pratiche per affrontare le sfide climatiche. Filtra ciò che ti interessa dal menu a sinistra e scopri a destra strumenti, corsi e casi reali pronti a ispirare i tuoi prossimi passi",
        sortMoreViews: "Più visualizzazioni",
        sortRelevance: "Rilevanza",
      },
      sidebar: {
        allTrainings: "Tutte le formazioni",
        filterBy: "Filtra per",
      },
      empty: {
        title: "Nessuna competenza trovata",
        description: "Prova a modificare i filtri o torna più tardi.",
      },
      detail: {
        back: "Torna alle competenze",
        externalLinks: "Link esterni",
      },
      errors: { notFound: "Competenza non trovata" },
    },
    projects: {
      unnamed: "Progetto senza nome",
      header: {
        projectMenu: "Menu progetto",
        project: "Progetto",
        signInToUse: "Accedi per usare i progetti",
        shareBoard: "Condividi bacheca",
        copied: "Copiato",
        copy: "Copia",
        explorer: "Explorer",
        editedAgo: "modificato {time} fa",
        pinnedCount: "{count} elementi fissati",
        shareError: "Impossibile creare il link di condivisione",
      },
      dashboard: {
        metaTitle: "Progetti",
        metaDescription:
          "Gestisci i tuoi progetti explorer e le bacheche.",
        eyebrow: "Progetti",
        title: "I tuoi progetti",
        subtitle:
          "Crea e passa tra progetti per organizzare pin e ricerche salvate.",
        emptyTitle: "Nessun progetto ancora",
        emptyDescription:
          "Crea un progetto per iniziare a fissare contenuti e salvare ricerche.",
        createButton: "Crea progetto",
        modalCreateTitle: "Crea progetto",
        modalEditTitle: "Modifica progetto",
        nameLabel: "Nome del progetto",
        namePlaceholder: "Il mio progetto di adattamento",
        promptName: "Inserisci un nome per il nuovo progetto:",
        confirmDelete:
          "Eliminare questo progetto? Pin e ricerche salvate verranno rimossi.",
      },
      stats: {
        overview: "Panoramica",
        title: "Statistiche del progetto",
        totalProjects: "Progetti totali",
        totalPins: "Pin totali",
        savedSearches: "Ricerche salvate",
        notAvailable: "N/D",
      },
      card: {
        goToExplorer: "Vai all'explorer",
        goToExplorerCurrent: "Vai all'explorer (progetto corrente)",
      },
      errors: {
        load: "Impossibile caricare i progetti",
        create: "Impossibile creare il progetto",
        update: "Impossibile aggiornare il progetto",
        delete: "Impossibile eliminare il progetto",
        notAuthenticated: "Non autenticato",
      },
    },
    publicBoard: {
      actions: {
        viewOnly: "Sola lettura",
        cloneToProjects: "Clona nei miei progetti",
        addComment: "Aggiungi commento",
        download: "Scarica",
      },
      comments: {
        title: "Commenti",
        empty: "Nessun commento ancora.",
        placeholder: "Scrivi un commento...",
        submit: "Aggiungi commento",
      },
      errors: { load: "Impossibile caricare la bacheca pubblica" },
    },
    boardActions: {
      videoSummary: "Crea riepilogo video",
      moreActions: "Altre azioni...",
      chatWithSelection: "Chat con la selezione",
      topInsightsSelection: "Insight principali (selezione)",
      videoSummaryModal: "Riepilogo video",
    },
    header: {
      brandTitle: "FARCLIMATE Transformation Hub",
      brandTitleLine1: "FARCLIMATE",
      brandTitleLine2: "Transformation Hub",
      solutions: "Soluzioni",
      stories: "Storie",
      skills: "Competenze",
      connectedAction: "Azione Connessa",
      about: "Informazioni",
      home: "Home",
      network: "Rete",
      pinsBoard: "Bacheca Pin",
    },
    listActions: {
      selectedLabel: "selezionati",
      chatWithSelection: "Chat con la selezione",
      mindmap: "Mappa mentale",
    },
    search: {
      corpusPlaceholder: "Cerca nel corpus…",
      clearAll: "Cancella tutto",
      applyFilters: "Applica filtri",
      allFiltersActive: "Tutti i filtri sono attivi",
      removeFiltersHint:
        "Rimuovi i filtri sopra per renderli di nuovo disponibili",
    },
    filters: {
      sector: "Settore",
      climateImpacts: "Impatti climatici",
      climateHazards: "Pericoli climatici",
      adaptationApproaches: "Approcci di adattamento",
      biogeographicalRegion: "Regione biogeografica",
      searchFilter: "Ricerca",
      empty: {
        sector:
          "Nessun dato sul settore. Esegui una ricerca per caricare le facet.",
        hazards:
          "Nessun dato sugli impatti climatici. Esegui una ricerca per caricare le facet.",
        bioregion:
          "Nessun dato sulla regione biogeografica. Esegui una ricerca per caricare le facet.",
        adaptationApproaches:
          "Nessun dato sugli approcci di adattamento. Esegui una ricerca per caricare le facet.",
      },
      status: {
        none: "Nessun filtro applicato",
        itemsSelected: "{count} elementi selezionati",
        optionsSelected: "{count} opzioni selezionate",
        applied: "Filtro applicato",
      },
      toggleAria: "{action} filtro {title}",
      toggleEnable: "Attiva",
      toggleDisable: "Disattiva",
      visualization: {
        placeholder: "Visualizzazione non disponibile per questo filtro.",
      },
      showAll: "Mostra tutto",
    },
    explorer: {
      meta: {
        title: "Explorer di Adattamento Climatico",
        description:
          "Cerca ed esplora casi di studio sull'adattamento climatico.",
      },
    },
    viewModes: {
      compare: "Confronta",
      analyse: "Analizza",
      byBioRegions: "Per biorregioni",
      cardView: "Schede",
      tabsAria: "Modalità di visualizzazione",
      mindmap: "Mappa mentale",
      mapEmptyTitle: "Nessuna posizione da mostrare",
      mapEmptyDescription:
        "I risultati di ricerca non contengono dati geografici",
      downloadPng: "Scarica PNG",
      umapEmpty: "Nessun risultato da mappare",
      instagramUnknownTitle: "Titolo sconosciuto",
      instagramClimateShaper: "Climate Shaper",
    },
    article: {
      errors: { notFound: "Articolo non trovato" },
    },
    summary: {
      empty: { economic: "Nessun dato economico disponibile" },
    },
    pins: {
      errors: {
        load: "Impossibile caricare i pin",
        create: "Impossibile creare il pin",
        update: "Impossibile aggiornare il pin",
        delete: "Impossibile eliminare il pin",
        reorder: "Impossibile riordinare i pin",
        loadSavedSearches: "Impossibile caricare le ricerche salvate",
        saveSearch: "Impossibile salvare la ricerca",
        deleteSavedSearch: "Impossibile eliminare la ricerca",
      },
      share: { linkCopied: "Link copiato negli appunti" },
      exports: {
        signInRequired: "Accedi per generare un download.",
      },
    },
  },
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object"
    ) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

for (const locale of ["en", "es", "it"]) {
  const path = join(localesDir, `${locale}.json`);
  const data = JSON.parse(readFileSync(path, "utf8"));
  deepMerge(data, additions[locale]);
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
  console.log(`Updated ${locale}.json`);
}
