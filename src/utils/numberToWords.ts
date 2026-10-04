export function numberToWords(num: number, currencyCode: string = 'INR'): string {
  if (isNaN(num) || num === 0) return 'Zero';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
  }

  function convertThreeDigits(n: number): string {
    let str = '';
    if (Math.floor(n / 100) > 0) {
      str += a[Math.floor(n / 100)] + ' Hundred';
      if (n % 100 !== 0) str += ' ';
    }
    str += convertTwoDigits(n % 100);
    return str;
  }

  let words = '';

  if (currencyCode === 'INR') {
    // Indian numbering format (Crore, Lakh, Thousand, Hundred)
    const crore = Math.floor(integerPart / 10000000);
    const lakh = Math.floor((integerPart % 10000000) / 100000);
    const thousand = Math.floor((integerPart % 100000) / 1000);
    const remainder = integerPart % 1000;

    if (crore > 0) words += convertThreeDigits(crore) + ' Crore ';
    if (lakh > 0) words += convertThreeDigits(lakh) + ' Lakh ';
    if (thousand > 0) words += convertThreeDigits(thousand) + ' Thousand ';
    if (remainder > 0) words += convertThreeDigits(remainder);
  } else {
    // International standard format (Billion, Million, Thousand)
    const billion = Math.floor(integerPart / 1000000000);
    const million = Math.floor((integerPart % 1000000000) / 1000000);
    const thousand = Math.floor((integerPart % 1000000) / 1000);
    const remainder = integerPart % 1000;

    if (billion > 0) words += convertThreeDigits(billion) + ' Billion ';
    if (million > 0) words += convertThreeDigits(million) + ' Million ';
    if (thousand > 0) words += convertThreeDigits(thousand) + ' Thousand ';
    if (remainder > 0) words += convertThreeDigits(remainder);
  }

  words = words.trim();

  let currencySuffix = 'Only';
  if (currencyCode === 'INR') {
    currencySuffix = 'Rupees Only';
  } else if (currencyCode === 'USD') {
    currencySuffix = 'Dollars Only';
  } else if (currencyCode === 'EUR') {
    currencySuffix = 'Euros Only';
  } else if (currencyCode === 'GBP') {
    currencySuffix = 'Pounds Only';
  }

  if (decimalPart > 0) {
    const paiseWord = currencyCode === 'INR' ? 'Paise' : 'Cents';
    return `${words} and ${convertTwoDigits(decimalPart)} ${paiseWord} ${currencySuffix}`;
  }

  return `${words} ${currencySuffix}`.trim();
}

export function formatCurrencyNumber(amount: number): string {
  if (isNaN(amount)) return '0';
  // Formats 33000 to "33,000"
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);
}
