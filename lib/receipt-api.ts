import { trpcClient } from "@/lib/trpc";
// import { Receipt } from "@/backend/trpc/routes/receipt/route"; // Don't import backend types directly

export async function fetchReceipts() {
  return await trpcClient.receipt.main.list.query();
}

export async function getReceipt(id: string) {
  return await trpcClient.receipt.main.get.query({ id });
}

export async function uploadReceipt(imageUrl: string, data: any) {
  return await trpcClient.receipt.main.upload.mutate({ imageUrl, data });
}

export async function deleteReceipt(id: string) {
  return await trpcClient.receipt.main.delete.mutate({ id });
}
