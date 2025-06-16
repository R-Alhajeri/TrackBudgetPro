import { useCallback } from "react";
import useBudgetStore from "../store/budget-store";

export default function useCurrencyConverter() {
  const { currencies, baseCurrency } = useBudgetStore();

  const convert = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string) => {
      if (fromCurrency === toCurrency) return amount;

      const fromCurrencyInfo = currencies.find((c) => c.code === fromCurrency);
      const toCurrencyInfo = currencies.find((c) => c.code === toCurrency);

      if (!fromCurrencyInfo || !toCurrencyInfo) {
        console.error(`Currency not found: ${fromCurrency} or ${toCurrency}`);
        return amount;
      }

      if (!fromCurrencyInfo?.rate || !toCurrencyInfo?.rate) {
        console.error(
          `Currency rate not found: ${fromCurrency} or ${toCurrency}`
        );
        return amount;
      }

      // Convert to base currency first (USD in our case)
      const amountInBaseCurrency = amount / fromCurrencyInfo.rate;

      // Then convert to target currency
      return amountInBaseCurrency * toCurrencyInfo.rate;
    },
    [currencies]
  );

  const formatCurrency = useCallback(
    (amount: number, currencyCode: string = baseCurrency) => {
      const currencyInfo = currencies.find((c) => c.code === currencyCode);

      if (!currencyInfo) {
        return `$${amount.toFixed(2)}`;
      }

      return `${currencyInfo.symbol}${amount.toFixed(2)}`;
    },
    [currencies, baseCurrency]
  );

  return {
    convert,
    formatCurrency,
    currencies,
    baseCurrency,
  };
}
