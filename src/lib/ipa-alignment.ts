export type PhonemeStatus = 'correct' | 'missed' | 'replaced';

export interface PhonemeMark {
  symbol: string;
  spoken?: string;
  status: PhonemeStatus;
}

export interface WordPhonemeDiagnostic {
  word: string;
  spoken?: string;
  ipa: string;
  status: 'correct' | 'missed' | 'replaced' | 'unknown';
  phonemes: PhonemeMark[];
}

// General American broad IPA for the built-in Shadow Lab corpus.
const IPA: Record<string, string[]> = {
  a: ['ə'], alex: ['æ', 'l', 'ɪ', 'k', 's'], afternoon: ['ˌæf', 'tɚ', 'ˈnuːn'], and: ['ən', 'd'], are: ['ɑɹ'],
  as: ['æ', 'z'], assumptions: ['ə', 'ˈsʌm', 'p', 'ʃən', 'z'], at: ['æ', 't'], been: ['b', 'ɪ', 'n'], becomes: ['bɪ', 'ˈkʌm', 'z'],
  but: ['b', 'ʌ', 't'], changed: ['tʃ', 'eɪn', 'dʒ', 'd'], clarity: ['ˈklɛɹ', 'ə', 'ti'], coffee: ['ˈkɔ', 'fi'], comes: ['k', 'ʌm', 'z'],
  completely: ['kəm', 'ˈpliːt', 'li'], constant: ['ˈkɑn', 'stənt'], convinced: ['kən', 'ˈvɪn', 's', 't'], culture: ['ˈkʌl', 'tʃɚ'],
  certainty: ['ˈsɝ', 'tən', 'ti'], delayed: ['dɪ', 'ˈleɪ', 'd'], depends: ['dɪ', 'ˈpɛn', 'd', 'z'], design: ['dɪ', 'ˈzaɪn'],
  documentation: ['ˌdɑk', 'jə', 'mən', 'ˈteɪ', 'ʃən'], emerges: ['ɪ', 'ˈmɝ', 'dʒ', 'ɪz'], entire: ['ɪn', 'ˈtaɪɚ'], evidence: ['ˈɛv', 'ə', 'dən', 's'],
  failure: ['ˈfeɪl', 'jɚ'], familiar: ['fə', 'ˈmɪl', 'jɚ'], family: ['ˈfæm', 'ə', 'li'], finally: ['ˈfaɪ', 'nəl', 'i'], first: ['f', 'ɝ', 's', 't'],
  flight: ['f', 'l', 'aɪ', 't'], for: ['fɚ'], free: ['f', 'ɹ', 'iː'], from: ['fɹ', 'ʌm'], going: ['ˈɡoʊ', 'ɪŋ'], had: ['h', 'æ', 'd'], hi: ['h', 'aɪ'],
  i: ['aɪ'], "i'd": ['aɪ', 'd'], "i'm": ['aɪ', 'm'], "i've": ['aɪ', 'v'], innovation: ['ˌɪn', 'ə', 'ˈveɪ', 'ʃən'], in: ['ɪ', 'n'], is: ['ɪ', 'z'],
  it: ['ɪ', 't'], "it's": ['ɪ', 't', 's'], languages: ['ˈlæŋ', 'ɡwɪ', 'dʒɪz'], learning: ['ˈlɝ', 'nɪŋ'], less: ['l', 'ɛ', 's'],
  like: ['l', 'aɪ', 'k'], love: ['l', 'ʌ', 'v'], meetings: ['ˈmiː', 'tɪŋ', 'z'], milk: ['m', 'ɪ', 'l', 'k'], mind: ['m', 'aɪ', 'n', 'd'],
  mistakes: ['mɪ', 'ˈsteɪ', 'k', 's'], moment: ['ˈmoʊ', 'mənt'], more: ['mɔɹ'], my: ['m', 'aɪ'], on: ['ɑ', 'n'],
  our: ['aʊɚ'], personal: ['ˈpɝ', 'sə', 'nəl'], please: ['p', 'l', 'iː', 'z'], process: ['ˈpɹɑ', 'sɛs'], project: ['ˈpɹɑ', 'dʒɛk', 't'],
  question: ['ˈkwɛs', 'tʃən'], rarely: ['ˈɹɛɹ', 'li'], ready: ['ˈɹɛ', 'di'], rearrange: ['ˌɹiː', 'ə', 'ˈɹeɪn', 'dʒ'],
  remote: ['ɹɪ', 'ˈmoʊt'], results: ['ɹɪ', 'ˈzʌl', 't', 's'], small: ['s', 'm', 'ɔ', 'l'], so: ['s', 'oʊ'], strong: ['s', 'tɹ', 'ɔŋ'],
  sustainable: ['sə', 'ˈsteɪ', 'nə', 'bəl'], than: ['ð', 'æ', 'n'], the: ['ð', 'ə'], this: ['ð', 'ɪ', 's'], thoughtful: ['ˈθɔt', 'fəl'],
  three: ['θ', 'ɹ', 'iː'], to: ['t', 'ə'], treat: ['tɹ', 'iː', 't'], trust: ['tɹ', 'ʌ', 's', 't'], useful: ['ˈjuːs', 'fəl'],
  visit: ['ˈvɪ', 'zɪt'], was: ['w', 'əz'], "wasn't": ['ˈwʌ', 'zən', 't'], we: ['w', 'iː'], weekend: ['ˈwiːk', 'ɛnd'],
  when: ['w', 'ɛ', 'n'], willing: ['ˈwɪl', 'ɪŋ'], with: ['w', 'ɪ', 'ð'], work: ['w', 'ɝ', 'k'], working: ['ˈwɝ', 'kɪŋ'],
  years: ['j', 'ɪɹ', 'z'], you: ['j', 'uː'], your: ['j', 'ʊɹ'],
};

const clean = (word: string) => word.toLowerCase().replace(/[^a-z']/g, '');

export function lookupIpa(word: string) {
  return IPA[clean(word)] ?? null;
}

function alignPhonemes(expected: string[], actual: string[]): PhonemeMark[] {
  const dp = Array.from({ length: expected.length + 1 }, () => Array(actual.length + 1).fill(0));
  for (let i = 0; i <= expected.length; i++) dp[i][0] = i;
  for (let j = 0; j <= actual.length; j++) dp[0][j] = j;
  for (let i = 1; i <= expected.length; i++) for (let j = 1; j <= actual.length; j++) {
    dp[i][j] = expected[i - 1] === actual[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  }
  const marks: PhonemeMark[] = [];
  let i = expected.length; let j = actual.length;
  while (i > 0) {
    if (j > 0 && expected[i - 1] === actual[j - 1]) { marks.unshift({ symbol: expected[i - 1], spoken: actual[j - 1], status: 'correct' }); i--; j--; }
    else if (j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) { marks.unshift({ symbol: expected[i - 1], spoken: actual[j - 1], status: 'replaced' }); i--; j--; }
    else if (dp[i][j] === dp[i - 1][j] + 1) { marks.unshift({ symbol: expected[i - 1], status: 'missed' }); i--; }
    else j--;
  }
  return marks;
}

export function diagnoseWordPhonemes(compared: Array<{ word: string; spoken?: string; status: 'correct' | 'missed' | 'replaced' }>): WordPhonemeDiagnostic[] {
  return compared.map(item => {
    const expected = lookupIpa(item.word);
    if (!expected) return { ...item, ipa: '待查', status: 'unknown', phonemes: [] };
    const actual = item.spoken ? lookupIpa(item.spoken) : null;
    const phonemes = item.status === 'correct'
      ? expected.map(symbol => ({ symbol, spoken: symbol, status: 'correct' as const }))
      : item.status === 'missed' || !actual
        ? expected.map(symbol => ({ symbol, status: 'missed' as const }))
        : alignPhonemes(expected, actual);
    return { ...item, ipa: `/${expected.join('')}/`, status: item.status, phonemes };
  });
}
