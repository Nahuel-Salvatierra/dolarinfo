export function formatIntegerWithDots(digits: string): string {
  if (digits === "") {
    return ""
  }
  const withoutLeadingZeros = digits.replace(/^0+(?=\d)/, "") || "0"
  return withoutLeadingZeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export function normalizeSalaryInputDisplay(raw: string): string {
  const s = raw.replace(/\s/g, "")
  if (s === "") {
    return ""
  }
  if (s === ",") {
    return ","
  }

  const lastComma = s.lastIndexOf(",")
  const intSegment = lastComma >= 0 ? s.slice(0, lastComma) : s
  const decSegment =
    lastComma >= 0 ? s.slice(lastComma + 1).replace(/[^\d]/g, "") : ""

  const intDigits = intSegment.replace(/\./g, "").replace(/[^\d]/g, "")

  if (lastComma >= 0 && decSegment === "") {
    if (intDigits === "") {
      return ","
    }
    const intPair = intDigits.replace(/^0+(?=\d)/, "") || "0"
    return `${formatIntegerWithDots(intPair)},`
  }

  if (lastComma >= 0 && decSegment.length > 0) {
    const intPair = intDigits === "" ? "0" : intDigits.replace(/^0+(?=\d)/, "") || "0"
    return `${formatIntegerWithDots(intPair)},${decSegment.slice(0, 6)}`
  }

  if (intDigits === "") {
    return ""
  }
  const intPair = intDigits.replace(/^0+(?=\d)/, "") || "0"
  return formatIntegerWithDots(intPair)
}

export function parseSalaryInputToNumber(value: string): number | null {
  const t = value.trim().replace(/\s/g, "")
  if (t === "" || t === ",") {
    return null
  }

  const lastComma = t.lastIndexOf(",")
  let intPart: string
  let decPart: string

  if (lastComma >= 0) {
    intPart = t.slice(0, lastComma).replace(/\./g, "")
    decPart = t.slice(lastComma + 1).replace(/[^\d]/g, "")
  } else {
    intPart = t.replace(/\./g, "")
    decPart = ""
  }

  const intDigits = intPart.replace(/[^\d]/g, "")
  if (intDigits === "" && decPart === "") {
    return null
  }

  const core = decPart !== "" ? `${intDigits || "0"}.${decPart}` : intDigits || "0"
  const n = Number(core)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function formatNumberToSalaryInput(n: number | null): string {
  if (n === null) {
    return ""
  }
  if (!Number.isFinite(n) || n < 0) {
    return ""
  }

  let str = n.toString()
  if (str.includes("e") || str.includes("E")) {
    str = n.toFixed(10).replace(/\.?0+$/, "")
  }

  const dotIdx = str.indexOf(".")
  const intRaw = dotIdx >= 0 ? str.slice(0, dotIdx) : str
  const decRaw = dotIdx >= 0 ? str.slice(dotIdx + 1) : ""

  const intDigits = intRaw.replace(/\D/g, "") || "0"
  const intTrimmed = intDigits.replace(/^0+(?=\d)/, "") || "0"
  const intFmt = formatIntegerWithDots(intTrimmed)

  if (decRaw === "") {
    return n === 0 ? "0" : intFmt
  }

  return `${intFmt},${decRaw.replace(/[^\d]/g, "").slice(0, 6)}`
}
