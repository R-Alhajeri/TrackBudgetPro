import { trpcClient } from "@/lib/trpc";
import useAuthStore from "@/store/auth-store";
import { Budget, Category, Transaction } from "@/types/budget";

export async function fetchBudget(
  year: number,
  month: number
): Promise<Budget | null> {
  try {
    return await trpcClient.budget.get.query({ year, month });
  } catch {
    return null;
  }
}

export async function setBudget(
  year: number,
  month: number,
  income: number,
  categories: Record<string, number>
) {
  return await trpcClient.budget.set.mutate({
    year,
    month,
    income,
    categories,
  });
}

export async function deleteBudget(year: number, month: number) {
  return await trpcClient.budget.delete.mutate({ year, month });
}

export async function fetchCategories() {
  return await trpcClient.category.list.query();
}

export async function createCategory(
  name: string,
  color: string,
  icon: string
) {
  return await trpcClient.category.create.mutate({ name, color, icon });
}

export async function updateCategory(
  id: string,
  name: string,
  color: string,
  icon: string
) {
  return await trpcClient.category.update.mutate({ id, name, color, icon });
}

export async function deleteCategory(id: string) {
  return await trpcClient.category.delete.mutate({ id });
}

export async function fetchTransactions(year: number, month: number) {
  return await trpcClient.transaction.list.query({ year, month });
}

export async function createTransaction(
  input: Omit<Transaction, "id">,
  year: number,
  month: number
) {
  return await trpcClient.transaction.create.mutate({ ...input, year, month });
}

export async function updateTransaction(input: Transaction) {
  return await trpcClient.transaction.update.mutate(input);
}

export async function deleteTransaction(id: string) {
  return await trpcClient.transaction.delete.mutate({ id });
}
