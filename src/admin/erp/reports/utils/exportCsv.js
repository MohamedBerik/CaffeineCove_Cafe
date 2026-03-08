export function exportToCsv(filename, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }

  const headers = Object.keys(rows[0]);

  const escapeValue = (value) => {
    if (value === null || value === undefined) return '""';

    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  const csvContent = [
    headers.map(escapeValue).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeValue(row[header])).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
