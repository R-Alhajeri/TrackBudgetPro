import { Currency } from '@/types/budget';

export const defaultCurrencies: Currency[] = [
  // Major Global Currencies
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    rate: 1.0, // Base currency
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    rate: 0.91, // Example rate
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    rate: 0.78, // Example rate
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    rate: 149.5, // Example rate
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    rate: 1.36, // Example rate
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    rate: 1.52, // Example rate
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'Fr',
    rate: 0.89, // Example rate
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    rate: 7.23, // Example rate
  },
  {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    rate: 7.81, // Example rate
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    rate: 1.34, // Example rate
  },
  
  // Middle Eastern & North African Currencies
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    rate: 3.67, // Example rate
  },
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: '﷼',
    rate: 3.75, // Example rate
  },
  {
    code: 'QAR',
    name: 'Qatari Riyal',
    symbol: 'ر.ق',
    rate: 3.64, // Example rate
  },
  {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    symbol: 'د.ك',
    rate: 0.31, // Example rate
  },
  {
    code: 'BHD',
    name: 'Bahraini Dinar',
    symbol: 'د.ب',
    rate: 0.38, // Example rate
  },
  {
    code: 'OMR',
    name: 'Omani Rial',
    symbol: 'ر.ع',
    rate: 0.38, // Example rate
  },
  {
    code: 'EGP',
    name: 'Egyptian Pound',
    symbol: 'ج.م',
    rate: 30.90, // Example rate
  },
  {
    code: 'JOD',
    name: 'Jordanian Dinar',
    symbol: 'د.ا',
    rate: 0.71, // Example rate
  },
  {
    code: 'LBP',
    name: 'Lebanese Pound',
    symbol: 'ل.ل',
    rate: 15000, // Example rate
  },
  {
    code: 'MAD',
    name: 'Moroccan Dirham',
    symbol: 'د.م.',
    rate: 9.95, // Example rate
  },
  {
    code: 'TND',
    name: 'Tunisian Dinar',
    symbol: 'د.ت',
    rate: 3.12, // Example rate
  },
  {
    code: 'DZD',
    name: 'Algerian Dinar',
    symbol: 'د.ج',
    rate: 134.5, // Example rate
  },
  {
    code: 'IQD',
    name: 'Iraqi Dinar',
    symbol: 'ع.د',
    rate: 1310, // Example rate
  },
  {
    code: 'ILS',
    name: 'Israeli New Shekel',
    symbol: '₪',
    rate: 3.65, // Example rate
  },
  
  // Asian Currencies
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    rate: 83.5, // Example rate
  },
  {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    rate: 15600, // Example rate
  },
  {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    rate: 4.65, // Example rate
  },
  {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    rate: 56.5, // Example rate
  },
  {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    rate: 35.2, // Example rate
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    rate: 1350, // Example rate
  },
  {
    code: 'VND',
    name: 'Vietnamese Dong',
    symbol: '₫',
    rate: 24800, // Example rate
  },
  {
    code: 'PKR',
    name: 'Pakistani Rupee',
    symbol: '₨',
    rate: 278, // Example rate
  },
  {
    code: 'BDT',
    name: 'Bangladeshi Taka',
    symbol: '৳',
    rate: 110, // Example rate
  },
  
  // European Currencies
  {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    rate: 10.42, // Example rate
  },
  {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    rate: 10.65, // Example rate
  },
  {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    rate: 6.8, // Example rate
  },
  {
    code: 'PLN',
    name: 'Polish Złoty',
    symbol: 'zł',
    rate: 3.95, // Example rate
  },
  {
    code: 'CZK',
    name: 'Czech Koruna',
    symbol: 'Kč',
    rate: 22.8, // Example rate
  },
  {
    code: 'HUF',
    name: 'Hungarian Forint',
    symbol: 'Ft',
    rate: 355, // Example rate
  },
  {
    code: 'RON',
    name: 'Romanian Leu',
    symbol: 'lei',
    rate: 4.55, // Example rate
  },
  {
    code: 'BGN',
    name: 'Bulgarian Lev',
    symbol: 'лв',
    rate: 1.78, // Example rate
  },
  {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    rate: 32.5, // Example rate
  },
  {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: '₽',
    rate: 92, // Example rate
  },
  
  // American Currencies
  {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    rate: 16.75, // Example rate
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    rate: 5.05, // Example rate
  },
  {
    code: 'ARS',
    name: 'Argentine Peso',
    symbol: '$',
    rate: 870, // Example rate
  },
  {
    code: 'CLP',
    name: 'Chilean Peso',
    symbol: '$',
    rate: 950, // Example rate
  },
  {
    code: 'COP',
    name: 'Colombian Peso',
    symbol: '$',
    rate: 3900, // Example rate
  },
  {
    code: 'PEN',
    name: 'Peruvian Sol',
    symbol: 'S/',
    rate: 3.7, // Example rate
  },
  
  // African Currencies
  {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    rate: 18.5, // Example rate
  },
  {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    rate: 1550, // Example rate
  },
  {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    rate: 130, // Example rate
  },
  {
    code: 'GHS',
    name: 'Ghanaian Cedi',
    symbol: '₵',
    rate: 15.5, // Example rate
  },
  {
    code: 'UGX',
    name: 'Ugandan Shilling',
    symbol: 'USh',
    rate: 3800, // Example rate
  },
  {
    code: 'XOF',
    name: 'West African CFA Franc',
    symbol: 'CFA',
    rate: 600, // Example rate
  },
  
  // Oceania Currencies
  {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    rate: 1.64, // Example rate
  },
  {
    code: 'FJD',
    name: 'Fijian Dollar',
    symbol: 'FJ$',
    rate: 2.25, // Example rate
  },
  
  // Cryptocurrencies
  {
    code: 'BTC',
    name: 'Bitcoin',
    symbol: '₿',
    rate: 0.000016, // Example rate
  },
  {
    code: 'ETH',
    name: 'Ethereum',
    symbol: 'Ξ',
    rate: 0.00033, // Example rate
  },
  {
    code: 'XRP',
    name: 'Ripple',
    symbol: 'XRP',
    rate: 0.55, // Example rate
  },
  {
    code: 'LTC',
    name: 'Litecoin',
    symbol: 'Ł',
    rate: 0.0075, // Example rate
  },
  {
    code: 'ADA',
    name: 'Cardano',
    symbol: '₳',
    rate: 0.35, // Example rate
  },
  {
    code: 'DOT',
    name: 'Polkadot',
    symbol: 'DOT',
    rate: 0.15, // Example rate
  },
  {
    code: 'DOGE',
    name: 'Dogecoin',
    symbol: 'Ð',
    rate: 7.5, // Example rate
  },
  {
    code: 'SOL',
    name: 'Solana',
    symbol: 'SOL',
    rate: 0.01, // Example rate
  },
  
  // Additional Global Currencies
  {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    rate: 10.42, // Example rate
  },
  {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    rate: 6.8, // Example rate
  },
  {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    rate: 10.65, // Example rate
  },
  
  // Additional Asian Currencies
  {
    code: 'TWD',
    name: 'Taiwan Dollar',
    symbol: 'NT$',
    rate: 31.8, // Example rate
  },
  {
    code: 'MOP',
    name: 'Macanese Pataca',
    symbol: 'MOP$',
    rate: 8.05, // Example rate
  },
  {
    code: 'MMK',
    name: 'Myanmar Kyat',
    symbol: 'K',
    rate: 2100, // Example rate
  },
  {
    code: 'LAK',
    name: 'Lao Kip',
    symbol: '₭',
    rate: 20500, // Example rate
  },
  {
    code: 'KHR',
    name: 'Cambodian Riel',
    symbol: '៛',
    rate: 4100, // Example rate
  },
  {
    code: 'NPR',
    name: 'Nepalese Rupee',
    symbol: 'रू',
    rate: 133, // Example rate
  },
  {
    code: 'LKR',
    name: 'Sri Lankan Rupee',
    symbol: 'රු',
    rate: 310, // Example rate
  },
  
  // Additional Middle Eastern Currencies
  {
    code: 'IRR',
    name: 'Iranian Rial',
    symbol: '﷼',
    rate: 42000, // Example rate
  },
  {
    code: 'SYP',
    name: 'Syrian Pound',
    symbol: '£S',
    rate: 13000, // Example rate
  },
  {
    code: 'YER',
    name: 'Yemeni Rial',
    symbol: '﷼',
    rate: 250, // Example rate
  },
  
  // Additional African Currencies
  {
    code: 'TZS',
    name: 'Tanzanian Shilling',
    symbol: 'TSh',
    rate: 2550, // Example rate
  },
  {
    code: 'ETB',
    name: 'Ethiopian Birr',
    symbol: 'Br',
    rate: 56, // Example rate
  },
  {
    code: 'ZMW',
    name: 'Zambian Kwacha',
    symbol: 'ZK',
    rate: 26, // Example rate
  },
  {
    code: 'RWF',
    name: 'Rwandan Franc',
    symbol: 'FRw',
    rate: 1250, // Example rate
  },
  {
    code: 'MUR',
    name: 'Mauritian Rupee',
    symbol: '₨',
    rate: 45, // Example rate
  },
  {
    code: 'MWK',
    name: 'Malawian Kwacha',
    symbol: 'MK',
    rate: 1680, // Example rate
  },
  
  // Additional European Currencies
  {
    code: 'ISK',
    name: 'Icelandic Króna',
    symbol: 'kr',
    rate: 138, // Example rate
  },
  {
    code: 'HRK',
    name: 'Croatian Kuna',
    symbol: 'kn',
    rate: 7.5, // Example rate
  },
  {
    code: 'RSD',
    name: 'Serbian Dinar',
    symbol: 'дин.',
    rate: 106, // Example rate
  },
  {
    code: 'ALL',
    name: 'Albanian Lek',
    symbol: 'L',
    rate: 95, // Example rate
  },
  {
    code: 'MKD',
    name: 'Macedonian Denar',
    symbol: 'ден',
    rate: 56, // Example rate
  },
  {
    code: 'MDL',
    name: 'Moldovan Leu',
    symbol: 'L',
    rate: 17.8, // Example rate
  },
  {
    code: 'UAH',
    name: 'Ukrainian Hryvnia',
    symbol: '₴',
    rate: 39, // Example rate
  },
  {
    code: 'GEL',
    name: 'Georgian Lari',
    symbol: '₾',
    rate: 2.7, // Example rate
  },
  {
    code: 'AMD',
    name: 'Armenian Dram',
    symbol: '֏',
    rate: 390, // Example rate
  },
  {
    code: 'AZN',
    name: 'Azerbaijani Manat',
    symbol: '₼',
    rate: 1.7, // Example rate
  },
  
  // Additional American Currencies
  {
    code: 'UYU',
    name: 'Uruguayan Peso',
    symbol: '$U',
    rate: 39, // Example rate
  },
  {
    code: 'PYG',
    name: 'Paraguayan Guaraní',
    symbol: '₲',
    rate: 7400, // Example rate
  },
  {
    code: 'BOB',
    name: 'Bolivian Boliviano',
    symbol: 'Bs.',
    rate: 6.9, // Example rate
  },
  {
    code: 'VES',
    name: 'Venezuelan Bolívar',
    symbol: 'Bs.S',
    rate: 36.5, // Example rate
  },
  {
    code: 'CRC',
    name: 'Costa Rican Colón',
    symbol: '₡',
    rate: 520, // Example rate
  },
  {
    code: 'NIO',
    name: 'Nicaraguan Córdoba',
    symbol: 'C$',
    rate: 36.5, // Example rate
  },
  {
    code: 'HNL',
    name: 'Honduran Lempira',
    symbol: 'L',
    rate: 24.7, // Example rate
  },
  {
    code: 'GTQ',
    name: 'Guatemalan Quetzal',
    symbol: 'Q',
    rate: 7.8, // Example rate
  },
  {
    code: 'DOP',
    name: 'Dominican Peso',
    symbol: 'RD$',
    rate: 58.5, // Example rate
  },
  {
    code: 'JMD',
    name: 'Jamaican Dollar',
    symbol: 'J$',
    rate: 155, // Example rate
  },
  {
    code: 'TTD',
    name: 'Trinidad and Tobago Dollar',
    symbol: 'TT$',
    rate: 6.8, // Example rate
  },
  {
    code: 'BBD',
    name: 'Barbadian Dollar',
    symbol: 'Bds$',
    rate: 2, // Example rate
  },
  {
    code: 'BSD',
    name: 'Bahamian Dollar',
    symbol: 'B$',
    rate: 1, // Example rate
  },
  
  // Additional Pacific/Oceania Currencies
  {
    code: 'PGK',
    name: 'Papua New Guinean Kina',
    symbol: 'K',
    rate: 3.7, // Example rate
  },
  {
    code: 'SBD',
    name: 'Solomon Islands Dollar',
    symbol: 'SI$',
    rate: 8.4, // Example rate
  },
  {
    code: 'VUV',
    name: 'Vanuatu Vatu',
    symbol: 'VT',
    rate: 120, // Example rate
  },
  {
    code: 'WST',
    name: 'Samoan Tala',
    symbol: 'WS$',
    rate: 2.75, // Example rate
  },
  {
    code: 'TOP',
    name: 'Tongan Paʻanga',
    symbol: 'T$',
    rate: 2.4, // Example rate
  }
];