export interface Country {
  code: string;
  name: string;
  callingCode: string;
  flag: string;
}

export const countries: Country[] = [
  { code: "AF", name: "Afghanistan", callingCode: "+93", flag: "\u{1F1E6}\u{1F1EB}" },
  { code: "AL", name: "Albania", callingCode: "+355", flag: "\u{1F1E6}\u{1F1F1}" },
  { code: "DZ", name: "Algeria", callingCode: "+213", flag: "\u{1F1E9}\u{1F1FF}" },
  { code: "AR", name: "Argentina", callingCode: "+54", flag: "\u{1F1E6}\u{1F1F7}" },
  { code: "AU", name: "Australia", callingCode: "+61", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "AT", name: "Austria", callingCode: "+43", flag: "\u{1F1E6}\u{1F1F9}" },
  { code: "BD", name: "Bangladesh", callingCode: "+880", flag: "\u{1F1E7}\u{1F1E9}" },
  { code: "BE", name: "Belgium", callingCode: "+32", flag: "\u{1F1E7}\u{1F1EA}" },
  { code: "BR", name: "Brazil", callingCode: "+55", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "BG", name: "Bulgaria", callingCode: "+359", flag: "\u{1F1E7}\u{1F1EC}" },
  { code: "KH", name: "Cambodia", callingCode: "+855", flag: "\u{1F1F0}\u{1F1ED}" },
  { code: "CM", name: "Cameroon", callingCode: "+237", flag: "\u{1F1E8}\u{1F1F2}" },
  { code: "CA", name: "Canada", callingCode: "+1", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "CL", name: "Chile", callingCode: "+56", flag: "\u{1F1E8}\u{1F1F1}" },
  { code: "CN", name: "China", callingCode: "+86", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "CO", name: "Colombia", callingCode: "+57", flag: "\u{1F1E8}\u{1F1F4}" },
  { code: "HR", name: "Croatia", callingCode: "+385", flag: "\u{1F1ED}\u{1F1F7}" },
  { code: "CZ", name: "Czech Republic", callingCode: "+420", flag: "\u{1F1E8}\u{1F1FF}" },
  { code: "DK", name: "Denmark", callingCode: "+45", flag: "\u{1F1E9}\u{1F1F0}" },
  { code: "EG", name: "Egypt", callingCode: "+20", flag: "\u{1F1EA}\u{1F1EC}" },
  { code: "EE", name: "Estonia", callingCode: "+372", flag: "\u{1F1EA}\u{1F1EA}" },
  { code: "FI", name: "Finland", callingCode: "+358", flag: "\u{1F1EB}\u{1F1EE}" },
  { code: "FR", name: "France", callingCode: "+33", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "DE", name: "Germany", callingCode: "+49", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "GR", name: "Greece", callingCode: "+30", flag: "\u{1F1EC}\u{1F1F7}" },
  { code: "HK", name: "Hong Kong", callingCode: "+852", flag: "\u{1F1ED}\u{1F1F0}" },
  { code: "HU", name: "Hungary", callingCode: "+36", flag: "\u{1F1ED}\u{1F1FA}" },
  { code: "IN", name: "India", callingCode: "+91", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "ID", name: "Indonesia", callingCode: "+62", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "IR", name: "Iran", callingCode: "+98", flag: "\u{1F1EE}\u{1F1F7}" },
  { code: "IQ", name: "Iraq", callingCode: "+964", flag: "\u{1F1EE}\u{1F1F6}" },
  { code: "IE", name: "Ireland", callingCode: "+353", flag: "\u{1F1EE}\u{1F1EA}" },
  { code: "IL", name: "Israel", callingCode: "+972", flag: "\u{1F1EE}\u{1F1F1}" },
  { code: "IT", name: "Italy", callingCode: "+39", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "JP", name: "Japan", callingCode: "+81", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "JO", name: "Jordan", callingCode: "+962", flag: "\u{1F1EF}\u{1F1F4}" },
  { code: "KE", name: "Kenya", callingCode: "+254", flag: "\u{1F1F0}\u{1F1EA}" },
  { code: "KW", name: "Kuwait", callingCode: "+965", flag: "\u{1F1F0}\u{1F1FC}" },
  { code: "LV", name: "Latvia", callingCode: "+371", flag: "\u{1F1F1}\u{1F1FB}" },
  { code: "LT", name: "Lithuania", callingCode: "+370", flag: "\u{1F1F1}\u{1F1F9}" },
  { code: "MY", name: "Malaysia", callingCode: "+60", flag: "\u{1F1F2}\u{1F1FE}" },
  { code: "MX", name: "Mexico", callingCode: "+52", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "MA", name: "Morocco", callingCode: "+212", flag: "\u{1F1F2}\u{1F1E6}" },
  { code: "NL", name: "Netherlands", callingCode: "+31", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "NZ", name: "New Zealand", callingCode: "+64", flag: "\u{1F1F3}\u{1F1FF}" },
  { code: "NG", name: "Nigeria", callingCode: "+234", flag: "\u{1F1F3}\u{1F1EC}" },
  { code: "NO", name: "Norway", callingCode: "+47", flag: "\u{1F1F3}\u{1F1F4}" },
  { code: "PK", name: "Pakistan", callingCode: "+92", flag: "\u{1F1F5}\u{1F1F0}" },
  { code: "PE", name: "Peru", callingCode: "+51", flag: "\u{1F1F5}\u{1F1EA}" },
  { code: "PH", name: "Philippines", callingCode: "+63", flag: "\u{1F1F5}\u{1F1ED}" },
  { code: "PL", name: "Poland", callingCode: "+48", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "PT", name: "Portugal", callingCode: "+351", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "QA", name: "Qatar", callingCode: "+974", flag: "\u{1F1F6}\u{1F1E6}" },
  { code: "RO", name: "Romania", callingCode: "+40", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "RU", name: "Russia", callingCode: "+7", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "SA", name: "Saudi Arabia", callingCode: "+966", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "SG", name: "Singapore", callingCode: "+65", flag: "\u{1F1F8}\u{1F1EC}" },
  { code: "SK", name: "Slovakia", callingCode: "+421", flag: "\u{1F1F8}\u{1F1F0}" },
  { code: "SI", name: "Slovenia", callingCode: "+386", flag: "\u{1F1F8}\u{1F1EE}" },
  { code: "ZA", name: "South Africa", callingCode: "+27", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "KR", name: "South Korea", callingCode: "+82", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "ES", name: "Spain", callingCode: "+34", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "SE", name: "Sweden", callingCode: "+46", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "CH", name: "Switzerland", callingCode: "+41", flag: "\u{1F1E8}\u{1F1ED}" },
  { code: "TW", name: "Taiwan", callingCode: "+886", flag: "\u{1F1F9}\u{1F1FC}" },
  { code: "TH", name: "Thailand", callingCode: "+66", flag: "\u{1F1F9}\u{1F1ED}" },
  { code: "TR", name: "Turkey", callingCode: "+90", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "UA", name: "Ukraine", callingCode: "+380", flag: "\u{1F1FA}\u{1F1E6}" },
  { code: "AE", name: "United Arab Emirates", callingCode: "+971", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "GB", name: "United Kingdom", callingCode: "+44", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "US", name: "United States", callingCode: "+1", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "VN", name: "Vietnam", callingCode: "+84", flag: "\u{1F1FB}\u{1F1F3}" },
];

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((country) => country.code === code.toUpperCase());
}

export function getCountryByCallingCode(callingCode: string): Country | undefined {
  const normalized = callingCode.startsWith("+") ? callingCode : `+${callingCode}`;
  return countries.find((country) => country.callingCode === normalized);
}
