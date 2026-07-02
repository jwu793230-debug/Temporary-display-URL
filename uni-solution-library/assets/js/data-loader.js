(function () {
  const DATA_FILES = {
    site: "data/site.json",
    solutions: "data/solutions.json",
    platforms: "data/platforms.json",
    domains: "data/domains.json",
    systems: "data/systems.json",
    documents: "data/documents.json",
    media: "data/media.json",
    tags: "data/tags.json",
    relations: "data/relations.json"
  };

  async function loadJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Cannot load ${path}: ${response.status}`);
    }
    return response.json();
  }

  async function loadLibraryData() {
    const entries = await Promise.all(
      Object.entries(DATA_FILES).map(async ([key, path]) => [key, await loadJson(path)])
    );
    const data = Object.fromEntries(entries);
    data.maps = {
      solutions: new Map(data.solutions.map((item) => [item.id, item])),
      platforms: new Map(data.platforms.map((item) => [item.id, item])),
      systems: new Map(data.systems.map((item) => [item.id, item])),
      documents: new Map(data.documents.map((item) => [item.id, item])),
      media: new Map(data.media.map((item) => [item.id, item])),
      domains: new Map(data.domains.map((item) => [item.id, item]))
    };
    return data;
  }

  window.UniLibraryData = {
    loadLibraryData
  };
})();
