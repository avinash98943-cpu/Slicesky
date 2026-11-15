// Landmark illustrations for popular cities (inline SVG, no external images).
// Matched on the city/country the API returns, so ambiguous names never show the wrong landmark.
const CityArt = (() => {
  const BG = "rgba(10,18,34,.9)";
  const ART = {
    mumbai: ["Gateway of India", `
      <path d="M50 76V34H110V76H90V52A10 10 0 0 0 70 52V76Z"/>
      <path d="M66 34A14 14 0 0 1 94 34Z"/><rect x="78" y="14" width="4" height="8"/>
      <rect x="45" y="28" width="10" height="10"/><circle cx="50" cy="27" r="5"/>
      <rect x="105" y="28" width="10" height="10"/><circle cx="110" cy="27" r="5"/>`],
    delhi: ["India Gate", `
      <path d="M48 76V30H112V76H96V52A16 16 0 0 0 64 52V76Z"/>
      <rect x="44" y="24" width="72" height="6"/><rect x="68" y="16" width="24" height="8"/>`],
    bengaluru: ["Vidhana Soudha", `
      <rect x="18" y="52" width="124" height="24"/><rect x="36" y="42" width="88" height="10"/>
      <path d="M64 42A16 16 0 0 1 96 42Z"/><rect x="78" y="14" width="4" height="12"/><circle cx="80" cy="13" r="3"/>
      <rect x="20" y="44" width="12" height="8"/><rect x="128" y="44" width="12" height="8"/>`],
    chennai: ["Kapaleeshwarar Temple", `
      <rect x="56" y="66" width="48" height="10"/><rect x="62" y="58" width="36" height="8"/>
      <rect x="67" y="50" width="26" height="8"/><rect x="71" y="42" width="18" height="8"/>
      <rect x="74" y="34" width="12" height="8"/><rect x="77" y="27" width="6" height="7"/><circle cx="80" cy="23" r="3.5"/>
      <rect x="26" y="62" width="24" height="14"/><rect x="110" y="62" width="24" height="14"/>`],
    kolkata: ["Howrah Bridge", `
      <rect x="8" y="58" width="144" height="5"/>
      <g fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round">
        <path d="M26 58L52 22L80 34L108 22L134 58"/><path d="M52 22V58M108 22V58M80 34V58M66 28V58M94 28V58"/></g>
      <rect x="0" y="68" width="160" height="2" opacity=".6"/>`],
    hyderabad: ["Charminar", `
      <path d="M50 76V38H110V76H96V58A16 16 0 0 0 64 58V76Z"/>
      <rect x="66" y="30" width="28" height="8"/><path d="M72 30A8 8 0 0 1 88 30Z"/>
      <rect x="42" y="22" width="8" height="54"/><circle cx="46" cy="20" r="5"/>
      <rect x="110" y="22" width="8" height="54"/><circle cx="114" cy="20" r="5"/>`],
    london: ["Big Ben", `
      <rect x="68" y="30" width="24" height="46"/><rect x="65" y="22" width="30" height="10"/>
      <path d="M65 22L80 2L95 22Z"/>
      <circle cx="80" cy="46" r="8.5" fill="${BG}"/><path d="M80 40V46L84 48" stroke="currentColor" stroke-width="1.6" fill="none"/>
      <rect x="14" y="60" width="52" height="16"/><rect x="94" y="60" width="52" height="16"/>
      <path d="M22 60V52L26 48L30 52V60M50 60V52L54 48L58 52V60M104 60V52L108 48L112 52V60"/>`],
    "new york": ["Statue of Liberty", `
      <rect x="58" y="70" width="44" height="6"/><rect x="66" y="58" width="28" height="12"/>
      <path d="M70 58L74 32H86L90 58Z"/><circle cx="80" cy="27" r="6"/>
      <path d="M71 23L65 17M75 21L73 13M80 20V11M85 21L87 13M89 23L95 17" stroke="currentColor" stroke-width="2.2" fill="none"/>
      <path d="M88 36L98 12" stroke="currentColor" stroke-width="4" fill="none"/><circle cx="99" cy="9" r="3.5"/>`],
  };
  const KEYS = [
    ["mumbai", "india", "mumbai"], ["delhi", "india", "delhi"], ["new delhi", "india", "delhi"],
    ["bengaluru", "india", "bengaluru"], ["bangalore", "india", "bengaluru"], ["chennai", "india", "chennai"],
    ["kolkata", "india", "kolkata"], ["calcutta", "india", "kolkata"], ["hyderabad", "india", "hyderabad"],
    ["london", "united kingdom", "london"], ["city of london", "united kingdom", "london"], ["new york", "united states", "new york"],
  ];
  const GENERIC = `<rect x="14" y="44" width="16" height="32"/><rect x="34" y="30" width="20" height="46"/><rect x="58" y="16" width="22" height="60"/>
    <rect x="84" y="36" width="18" height="40"/><rect x="106" y="24" width="20" height="52"/><rect x="130" y="48" width="16" height="28"/>`;

  function keyFor(location) {
    const n = (location.name || "").toLowerCase(), c = (location.country || "").toLowerCase();
    const hit = KEYS.find(([name, country]) => n === name && c.includes(country));
    return hit ? hit[2] : null;
  }
  function html(location) {
    const key = keyFor(location);
    const [label, body] = key ? ART[key] : ["", GENERIC];
    return `<div class="banner" role="img" aria-label="${label || location.name}">
      <svg viewBox="0 0 160 80" fill="currentColor" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${body}<rect x="0" y="76" width="160" height="4"/></svg>
      ${label ? `<span>📍 ${label}</span>` : ""}</div>`;
  }
  return { html, keyFor };
})();
