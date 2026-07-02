(function () {
  function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, "");
  }

  function textOf(record) {
    const values = [
      record.number,
      record.title,
      record.subtitle,
      record.summary,
      record.overview,
      record.value,
      record.industry,
      record.domainName,
      record.type,
      record.status,
      ...(record.tags || []),
      ...(record.components || []),
      ...(record.functions || []),
      ...(record.highlights || [])
    ];
    return normalize(values.filter(Boolean).join(" "));
  }

  function matchesQuery(record, query) {
    const q = normalize(query);
    if (!q) return true;
    return textOf(record).includes(q);
  }

  function matchesPermission(record, permission) {
    if (!permission) return true;
    return record.permission === permission;
  }

  function matchesType(record, type) {
    if (!type) return true;
    return record._kind === type || record.type === type || record.industry === type || record.domainId === type;
  }

  function filterRecords(records, filters) {
    return records.filter((record) => (
      matchesQuery(record, filters.query) &&
      matchesPermission(record, filters.permission) &&
      matchesType(record, filters.type)
    ));
  }

  window.UniLibrarySearch = {
    normalize,
    filterRecords,
    matchesQuery
  };
})();
