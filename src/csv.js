export function compareCsv(results) {
  const rows = [
    ["rank", "url", "verdict", "conversion", "fit", "trust", "friction"],
    ...results.map((item, index) => [
      index + 1,
      item.url,
      item.result.verdict,
      item.result.scores.conversion,
      item.result.scores.fit,
      item.result.scores.trust,
      item.result.scores.friction
    ])
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}
