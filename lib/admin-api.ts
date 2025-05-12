import { trpcClient } from "@/lib/trpc";

export async function fetchUserList() {
  return await trpcClient.admin.userList.query();
}

export async function fetchBudgetStats() {
  return await trpcClient.admin.budgetStats.query();
}

export async function fetchCategoryStats() {
  return await trpcClient.admin.categoryStats.query();
}

export async function fetchTransactionStats() {
  return await trpcClient.admin.transactionStats.query();
}

export async function fetchReceiptStats() {
  return await trpcClient.admin.receiptStats.query();
}
